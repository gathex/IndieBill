import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { createInvoiceNumber, round2 } from "./invoices";
import { computeGstTotals, getStateDisplayName } from "./gst";
import { generatePaymentQr } from "./qr";
import { getUserSettings } from "./users";
import { renderInvoicePdf } from "./pdf";
import { sendInvoiceEmail, isEmailConfigured } from "./email";
import type { InvoicePdfData } from "@/components/invoice-document";

export const RECURRING_FREQUENCIES = [
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const RECURRING_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED"] as const;
export type RecurringStatus = (typeof RECURRING_STATUSES)[number];

/**
 * Calculates the next run date based on the current run date and frequency.
 */
export function calculateNextRunDate(
  currentRunDate: Date | string,
  frequency: string,
): Date {
  const date = new Date(currentRunDate);

  switch (frequency) {
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY": {
      const day = date.getDate();
      date.setMonth(date.getMonth() + 1);
      // Handle month-end overflow (e.g. Jan 31 -> Feb 28/29)
      if (date.getDate() < day) {
        date.setDate(0);
      }
      break;
    }
    case "QUARTERLY": {
      const day = date.getDate();
      date.setMonth(date.getMonth() + 3);
      if (date.getDate() < day) {
        date.setDate(0);
      }
      break;
    }
    case "YEARLY": {
      const day = date.getDate();
      date.setFullYear(date.getFullYear() + 1);
      if (date.getDate() < day) {
        date.setDate(0);
      }
      break;
    }
    default:
      date.setMonth(date.getMonth() + 1);
      break;
  }

  return date;
}

export async function getUserRecurringInvoices(userId: string) {
  return prisma.recurringInvoice.findMany({
    where: { userId },
    include: {
      client: true,
      items: true,
      generatedInvoices: {
        select: { id: true, number: true, total: true, status: true, issueDate: true },
        orderBy: { issueDate: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecurringInvoiceById(id: string, userId: string) {
  return prisma.recurringInvoice.findFirst({
    where: { id, userId },
    include: {
      client: true,
      items: true,
      generatedInvoices: {
        orderBy: { issueDate: "desc" },
      },
    },
  });
}

/**
 * Generates an actual Invoice from a RecurringInvoice schedule.
 * Applies GST logic, duplicate-free numbering, creates line items,
 * sets dueDate, optionally emails PDF, updates lastGeneratedAt, and advances nextRunDate.
 */
export async function generateInvoiceFromRecurring(recurringId: string) {
  const recurring = await prisma.recurringInvoice.findUnique({
    where: { id: recurringId },
    include: {
      items: true,
      client: true,
      user: true,
    },
  });

  if (!recurring) {
    throw new Error(`Recurring invoice schedule ${recurringId} not found.`);
  }

  if (recurring.items.length === 0) {
    throw new Error(`Recurring invoice ${recurringId} has no line items.`);
  }

  // 1. Compute totals using GST logic
  const subtotal = recurring.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0,
  );
  const gstResult = computeGstTotals({
    subtotal,
    discountPercent: recurring.discount,
    taxRate: recurring.taxRate,
    gstEnabled: recurring.gstEnabled,
    businessState: recurring.user.state,
    clientState: recurring.client.state,
  });

  // 2. Set dates
  const issueDate = new Date();
  const dueDate = new Date(
    issueDate.getTime() + recurring.dueInDays * 24 * 60 * 60 * 1000,
  );

  // 3. Create invoice with collision retry loop
  let invoice;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const number = await createInvoiceNumber(recurring.userId);
    try {
      invoice = await prisma.invoice.create({
        data: {
          userId: recurring.userId,
          clientId: recurring.clientId,
          recurringInvoiceId: recurring.id,
          number,
          status: "DRAFT",
          issueDate,
          dueDate,
          subtotal: gstResult.subtotal,
          discountPercent: recurring.discount,
          taxRate: recurring.taxRate,
          tax: gstResult.tax,
          gstEnabled: recurring.gstEnabled,
          taxType: gstResult.taxType,
          cgstAmount: gstResult.cgstAmount,
          sgstAmount: gstResult.sgstAmount,
          igstAmount: gstResult.igstAmount,
          total: gstResult.total,
          notes: recurring.notes,
          items: {
            create: recurring.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: round2(item.quantity * item.rate),
              hsnSac: item.hsnSac,
            })),
          },
        },
        include: {
          client: true,
          items: true,
          user: true,
        },
      });
      break;
    } catch (error) {
      const isNumberCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";
      if (!isNumberCollision || attempt === 4) {
        throw error;
      }
    }
  }

  if (!invoice) {
    throw new Error("Failed to create invoice from recurring schedule.");
  }

  // 4. Auto-send email if configured and Mailtrap SMTP credentials available
  if (recurring.autoSendEmail && isEmailConfigured()) {
    try {
      const settings = await getUserSettings(recurring.userId);
      const qr = await generatePaymentQr({
        invoiceNumber: invoice.number,
        amount: invoice.total,
        currency: settings.currency,
        locale: settings.locale,
        businessName: settings.businessName,
        dueDate: invoice.dueDate,
        qrName: settings.qrName,
        qrVpa: settings.qrVpa,
        qrUpiId: settings.qrUpiId,
        qrAccountNumber: settings.qrAccountNumber,
      });

      const pdfData: InvoicePdfData = {
        id: invoice.id,
        number: invoice.number,
        status: "SENT",
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: invoice.subtotal,
        discount: gstResult.discount,
        tax: invoice.tax,
        taxRate: invoice.taxRate,
        gstEnabled: invoice.gstEnabled,
        taxType: invoice.taxType,
        cgstAmount: invoice.cgstAmount,
        sgstAmount: invoice.sgstAmount,
        igstAmount: invoice.igstAmount,
        businessGstin: recurring.user?.gstin ?? null,
        businessState: recurring.user?.state ?? null,
        clientGstin: recurring.client?.gstin ?? null,
        clientState: recurring.client?.state ?? null,
        placeOfSupply:
          getStateDisplayName(recurring.client?.state) ||
          recurring.client?.state ||
          null,
        total: invoice.total,
        notes: invoice.notes,
        clientName: recurring.client.name,
        clientEmail: recurring.client.email,
        clientCompany: recurring.client.company,
        items: invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          hsnSac: item.hsnSac,
        })),
      };

      const pdf = await renderInvoicePdf({
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

      const sendResult = await sendInvoiceEmail({
        to: recurring.client.email,
        businessName: settings.businessName,
        invoiceNumber: invoice.number,
        clientName: recurring.client.name,
        amount: invoice.total,
        currency: settings.currency,
        locale: settings.locale,
        dueDate: invoice.dueDate,
        pdf: { filename: `invoice-${invoice.number}.pdf`, content: pdf },
      });

      if (!("skipped" in sendResult)) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "SENT" },
        });
        invoice.status = "SENT";
      }
    } catch (emailError) {
      console.error(
        `[Recurring] Auto-send email failed for invoice ${invoice.number}:`,
        emailError,
      );
    }
  }

  // 5. Advance schedule & determine completion
  const nextRun = calculateNextRunDate(
    recurring.nextRunDate,
    recurring.frequency,
  );
  const isCompleted = Boolean(
    recurring.endDate && nextRun.getTime() > new Date(recurring.endDate).getTime(),
  );

  const updatedSchedule = await prisma.recurringInvoice.update({
    where: { id: recurring.id },
    data: {
      lastGeneratedAt: new Date(),
      nextRunDate: nextRun,
      status: isCompleted ? "COMPLETED" : recurring.status,
    },
  });

  return {
    invoice,
    schedule: updatedSchedule,
    nextRunDate: nextRun,
  };
}

/**
 * Processes all ACTIVE schedules where nextRunDate <= now.
 */
export async function processDueRecurringInvoices(): Promise<{
  processed: number;
  invoices: Array<{ id: string; number: string; recurringId: string }>;
  errors: Array<{ recurringId: string; error: string }>;
}> {
  const now = new Date();
  const dueSchedules = await prisma.recurringInvoice.findMany({
    where: {
      status: "ACTIVE",
      nextRunDate: { lte: now },
    },
    select: { id: true, title: true },
  });

  const invoices: Array<{ id: string; number: string; recurringId: string }> = [];
  const errors: Array<{ recurringId: string; error: string }> = [];

  for (const schedule of dueSchedules) {
    try {
      const res = await generateInvoiceFromRecurring(schedule.id);
      invoices.push({
        id: res.invoice.id,
        number: res.invoice.number,
        recurringId: schedule.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[Recurring] Failed processing schedule ${schedule.id} (${schedule.title}):`,
        message,
      );
      errors.push({
        recurringId: schedule.id,
        error: message,
      });
    }
  }

  return {
    processed: invoices.length,
    invoices,
    errors,
  };
}
