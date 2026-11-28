import { prisma } from "./db";
import { getInvoiceBalance } from "./payments";
import { getUserSettings } from "./users";
import { getInvoiceShareUrl } from "./share";
import { sendReminderEmail, ReminderType } from "./email";
import { renderInvoicePdf } from "./pdf";
import { computeInvoiceTotals } from "./invoices";
import { getStateDisplayName } from "./gst";
import { generatePaymentQr } from "./qr";
import type { InvoicePdfData } from "@/components/invoice-document";

interface ReminderInvoicePayload {
  id: string;
  number: string;
  status: string;
  issueDate: Date | string;
  dueDate?: Date | string | null;
  subtotal: number;
  discountPercent: number;
  taxRate: number;
  tax: number;
  gstEnabled: boolean;
  taxType: string;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
  notes?: string | null;
  paymentLink?: string | null;
  razorpayPaymentLinkUrl?: string | null;
  client: {
    name: string;
    email: string;
    company?: string | null;
    gstin?: string | null;
    state?: string | null;
  };
  items?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    hsnSac?: string | null;
  }>;
}

type UserSettingsPayload = Awaited<ReturnType<typeof getUserSettings>>;

/**
 * Builds the PDF buffer for an invoice reminder attachment.
 */
async function buildInvoicePdfAttachment(
  invoice: ReminderInvoicePayload,
  settings: UserSettingsPayload,
  balance: number,
): Promise<{ filename: string; content: Buffer } | undefined> {
  try {
    const discount = computeInvoiceTotals({
      subtotal: invoice.subtotal,
      discountPercent: invoice.discountPercent,
      taxRate: invoice.taxRate,
    }).discount;

    const qr = await generatePaymentQr({
      invoiceNumber: invoice.number,
      amount: balance > 0 ? balance : invoice.total,
      currency: settings.currency,
      locale: settings.locale,
      businessName: settings.businessName,
      dueDate: invoice.dueDate,
      paymentLink: invoice.razorpayPaymentLinkUrl || invoice.paymentLink,
      qrName: settings.qrName,
      qrVpa: settings.qrVpa,
      qrUpiId: settings.qrUpiId,
      qrAccountNumber: settings.qrAccountNumber,
    });

    const pdfData: InvoicePdfData = {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      issueDate: new Date(invoice.issueDate),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
      subtotal: invoice.subtotal,
      discount,
      tax: invoice.tax,
      taxRate: invoice.taxRate,
      gstEnabled: invoice.gstEnabled,
      taxType: invoice.taxType,
      cgstAmount: invoice.cgstAmount,
      sgstAmount: invoice.sgstAmount,
      igstAmount: invoice.igstAmount,
      businessGstin: settings.gstin,
      businessState: settings.state,
      clientGstin: invoice.client.gstin ?? null,
      clientState: invoice.client.state ?? null,
      placeOfSupply:
        getStateDisplayName(invoice.client.state) || invoice.client.state || null,
      total: invoice.total,
      notes: invoice.notes ?? null,
      paymentLink: invoice.paymentLink ?? null,
      razorpayPaymentLinkUrl: invoice.razorpayPaymentLinkUrl ?? null,
      clientName: invoice.client.name,
      clientEmail: invoice.client.email,
      clientCompany: invoice.client.company ?? null,
      items: (invoice.items || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        hsnSac: item.hsnSac,
      })),
    };

    const pdfBuffer = await renderInvoicePdf({
      invoice: pdfData,
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      businessGstin: settings.gstin,
      currency: settings.currency,
      locale: settings.locale,
      logoDataUrl: settings.logoDataUrl,
      qrDataUrl: qr.dataUrl,
      qrLabel: qr.label,
    });

    return {
      filename: `invoice-${invoice.number}.pdf`,
      content: pdfBuffer,
    };
  } catch (err) {
    console.error(`[Reminders] Failed to generate PDF for invoice ${invoice.number}:`, err);
    return undefined;
  }
}

/**
 * Sends a manual payment reminder for a specific invoice.
 */
export async function sendManualReminder(invoiceId: string, userId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: {
      client: true,
      payments: true,
      items: true,
      user: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found or unauthorized.");
  }

  const balance = getInvoiceBalance(invoice.total, invoice.payments);
  if (balance <= 0) {
    throw new Error("This invoice is already paid in full.");
  }

  const recipientEmail = invoice.client.email?.trim();
  if (!recipientEmail) {
    throw new Error("The client does not have an email address configured.");
  }

  const settings = await getUserSettings(invoice.userId);
  const shareUrl = await getInvoiceShareUrl(invoice.id);
  const pdf = await buildInvoicePdfAttachment(invoice, settings, balance);

  try {
    const result = await sendReminderEmail({
      to: recipientEmail,
      businessName: settings.businessName,
      invoiceNumber: invoice.number,
      clientName: invoice.client.name,
      balanceDue: balance,
      total: invoice.total,
      currency: settings.currency,
      locale: settings.locale,
      dueDate: invoice.dueDate,
      paymentLink: invoice.razorpayPaymentLinkUrl || invoice.paymentLink,
      shareUrl,
      type: "MANUAL",
      pdf,
    });

    await prisma.paymentReminderLog.create({
      data: {
        userId: invoice.userId,
        invoiceId: invoice.id,
        type: "MANUAL",
        channel: "EMAIL",
        recipientEmail,
        status: "SENT",
      },
    });

    return { success: true, skipped: Boolean("skipped" in result && result.skipped) };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await prisma.paymentReminderLog.create({
      data: {
        userId: invoice.userId,
        invoiceId: invoice.id,
        type: "MANUAL",
        channel: "EMAIL",
        recipientEmail,
        status: "FAILED",
        errorMessage: errorMsg,
      },
    });
    throw err;
  }
}

/**
 * Processes automated reminders across all eligible invoices.
 * Enforces business settings, duplicate-per-day prevention, and logs results.
 */
export async function processAutomatedReminders() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Find all unpaid invoices where reminders are active
  const candidateInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "OVERDUE", "PARTIAL", "DRAFT"] },
      remindersPaused: false,
      dueDate: { not: null },
      user: {
        remindersEnabled: true,
      },
    },
    include: {
      client: true,
      payments: true,
      items: true,
      user: true,
    },
  });

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const details: Array<{ invoiceNumber: string; type: string; status: string; reason?: string }> = [];

  for (const invoice of candidateInvoices) {
    processed++;

    const recipientEmail = invoice.client.email?.trim();
    if (!recipientEmail) {
      skipped++;
      details.push({
        invoiceNumber: invoice.number,
        type: "NONE",
        status: "SKIPPED",
        reason: "Missing client email",
      });
      continue;
    }

    const balance = getInvoiceBalance(invoice.total, invoice.payments);
    if (balance <= 0) {
      skipped++;
      details.push({
        invoiceNumber: invoice.number,
        type: "NONE",
        status: "SKIPPED",
        reason: "Invoice paid in full",
      });
      continue;
    }

    if (!invoice.dueDate) {
      skipped++;
      continue;
    }

    // Calculate days difference (due date minus today)
    const dueDate = new Date(invoice.dueDate);
    const dueMidnight = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
    const todayMidnight = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.round((dueMidnight.getTime() - todayMidnight.getTime()) / msPerDay);

    let type: ReminderType | null = null;

    if (daysDiff > 0 && daysDiff === invoice.user.remindBeforeDays && invoice.user.remindBeforeDays > 0) {
      type = "BEFORE_DUE";
    } else if (daysDiff === 0 && invoice.user.remindOnDueDate) {
      type = "ON_DUE";
    } else if (daysDiff < 0) {
      const overdueDays = Math.abs(daysDiff);
      const afterDays = (invoice.user.remindAfterDays || "3,7,14")
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

      if (afterDays.includes(overdueDays)) {
        type = "OVERDUE";
      }
    }

    if (!type) {
      skipped++;
      continue;
    }

    // Check duplicate prevention: has this reminder type already been sent today?
    const existingLog = await prisma.paymentReminderLog.findFirst({
      where: {
        invoiceId: invoice.id,
        type,
        sentAt: { gte: todayStart, lte: todayEnd },
        status: "SENT",
      },
    });

    if (existingLog) {
      skipped++;
      details.push({
        invoiceNumber: invoice.number,
        type,
        status: "SKIPPED",
        reason: "Already sent today",
      });
      continue;
    }

    const settings = await getUserSettings(invoice.userId);
    const shareUrl = await getInvoiceShareUrl(invoice.id);
    const pdf = await buildInvoicePdfAttachment(invoice, settings, balance);

    try {
      const result = await sendReminderEmail({
        to: recipientEmail,
        businessName: settings.businessName,
        invoiceNumber: invoice.number,
        clientName: invoice.client.name,
        balanceDue: balance,
        total: invoice.total,
        currency: settings.currency,
        locale: settings.locale,
        dueDate: invoice.dueDate,
        paymentLink: invoice.razorpayPaymentLinkUrl || invoice.paymentLink,
        shareUrl,
        type,
        pdf,
      });

      await prisma.paymentReminderLog.create({
        data: {
          userId: invoice.userId,
          invoiceId: invoice.id,
          type,
          channel: "EMAIL",
          recipientEmail,
          status: "SENT",
        },
      });

      sent++;
      details.push({
        invoiceNumber: invoice.number,
        type,
        status: Boolean("skipped" in result && result.skipped) ? "SKIPPED_NO_KEY" : "SENT",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await prisma.paymentReminderLog.create({
        data: {
          userId: invoice.userId,
          invoiceId: invoice.id,
          type,
          channel: "EMAIL",
          recipientEmail,
          status: "FAILED",
          errorMessage: errorMsg,
        },
      });
      failed++;
      details.push({
        invoiceNumber: invoice.number,
        type,
        status: "FAILED",
        reason: errorMsg,
      });
    }
  }

  return {
    processed,
    sent,
    skipped,
    failed,
    details,
  };
}

/**
 * Returns the payment reminder logs for a specific invoice.
 */
export async function getInvoiceReminderLogs(invoiceId: string, userId: string) {
  return prisma.paymentReminderLog.findMany({
    where: { invoiceId, userId },
    orderBy: { sentAt: "desc" },
    take: 20,
  });
}
