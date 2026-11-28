"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { computeInvoiceTotals, createInvoiceNumber, round2 } from "@/lib/invoices";
import { computeGstTotals, getStateDisplayName } from "@/lib/gst";
import { derivePaymentStatus, getInvoiceBalance } from "@/lib/payments";
import { sendInvoiceEmail } from "@/lib/email";
import { renderInvoicePdf } from "@/lib/pdf";
import { generatePaymentQr } from "@/lib/qr";
import { getUserSettings } from "@/lib/users";
import { getInvoiceShareUrl } from "@/lib/share";
import type { InvoicePdfData } from "@/components/invoice-document";

const invoiceSchema = z
  .object({
    clientId: z.string().min(1, "Select a client."),
    status: z.enum(["DRAFT", "SENT", "PAID"]),
    issueDate: z.string().min(1),
    dueDate: z.string().nullable(),
    notes: z.string().nullable(),
    discountPercent: z.number().min(0).max(100),
    taxRate: z.number().min(0).max(100),
    gstEnabled: z.boolean().optional().default(false),
    items: z
      .array(
        z.object({
          description: z.string().min(1, "Every item needs a description."),
          quantity: z.number().positive(),
          rate: z.number().min(0),
          hsnSac: z.string().max(20).optional().nullable(),
        }),
      )
      .min(1, "Add at least one line item."),
  })
  .superRefine((data, ctx) => {
    if (data.status === "SENT") {
      const trimmed = data.dueDate?.trim() ?? "";
      if (!trimmed || Number.isNaN(new Date(trimmed).getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueDate"],
          message: "Please add a due date before marking this invoice as Sent.",
        });
      }
    }
  });

export type InvoiceItemInput = z.infer<typeof invoiceSchema>["items"][number];
export type InvoiceInput = z.infer<typeof invoiceSchema>;

function revalidateInvoices() {
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/payments");
  revalidatePath("/clients");
}

function calculateInvoiceTotals(
  input: InvoiceInput,
  businessState?: string | null,
  clientState?: string | null,
) {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  return computeGstTotals({
    subtotal,
    discountPercent: input.discountPercent,
    taxRate: input.taxRate,
    gstEnabled: input.gstEnabled,
    businessState,
    clientState,
  });
}

async function buildPdfData(invoiceId: string, userId: string): Promise<InvoicePdfData> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { client: true, items: true, user: true },
  });
  if (!invoice) throw new Error("Invoice not found.");

  const totals = computeInvoiceTotals({
    subtotal: invoice.subtotal,
    discountPercent: invoice.discountPercent,
    taxRate: invoice.taxRate,
  });

  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    subtotal: invoice.subtotal,
    discount: totals.discount,
    tax: invoice.tax,
    taxRate: invoice.taxRate,
    gstEnabled: invoice.gstEnabled,
    taxType: invoice.taxType,
    cgstAmount: invoice.cgstAmount,
    sgstAmount: invoice.sgstAmount,
    igstAmount: invoice.igstAmount,
    businessGstin: invoice.user?.gstin ?? null,
    businessState: invoice.user?.state ?? null,
    clientGstin: invoice.client?.gstin ?? null,
    clientState: invoice.client?.state ?? null,
    placeOfSupply: getStateDisplayName(invoice.client?.state) || invoice.client?.state || null,
    total: invoice.total,
    notes: invoice.notes,
    clientName: invoice.client.name,
    clientEmail: invoice.client.email,
    clientCompany: invoice.client.company,
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
      hsnSac: item.hsnSac,
    })),
  };
}

export async function createInvoice(input: InvoiceInput) {
  const userId = await requireUserId();
  const data = invoiceSchema.parse(input);

  const [client, user] = await Promise.all([
    prisma.client.findFirst({ where: { id: data.clientId, userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { state: true, gstin: true },
    }),
  ]);
  if (!client) throw new Error("Client not found.");

  const totals = calculateInvoiceTotals(data, user?.state, client.state);

  let invoice;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const number = await createInvoiceNumber(userId);
    try {
      invoice = await prisma.invoice.create({
        data: {
          userId,
          clientId: client.id,
          number,
          status: data.status,
          issueDate: new Date(`${data.issueDate}T00:00:00`),
          dueDate: data.dueDate ? new Date(`${data.dueDate}T00:00:00`) : null,
          subtotal: totals.subtotal,
          discountPercent: data.discountPercent,
          taxRate: data.taxRate,
          tax: totals.tax,
          gstEnabled: totals.gstEnabled,
          taxType: totals.taxType,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          igstAmount: totals.igstAmount,
          total: totals.total,
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: round2(item.quantity * item.rate),
              hsnSac: item.hsnSac?.trim() || null,
            })),
          },
        },
      });
      break;
    } catch (error) {
      const isNumberCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";
      if (!isNumberCollision || attempt === 4) throw error;
    }
  }

  revalidateInvoices();
  revalidatePath(`/invoices/${invoice!.id}`);
  return invoice!;
}

export async function updateInvoice(id: string, input: InvoiceInput) {
  const userId = await requireUserId();
  const data = invoiceSchema.parse(input);

  const [existing, client, user] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, userId },
      include: { payments: true },
    }),
    prisma.client.findFirst({ where: { id: data.clientId, userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { state: true, gstin: true },
    }),
  ]);
  if (!existing) throw new Error("Invoice not found.");
  if (!client) throw new Error("Client not found.");

  const totals = calculateInvoiceTotals(data, user?.state, client.state);
  const paymentStatus = derivePaymentStatus(totals.total, existing.payments);
  const nextStatus =
    paymentStatus === "PAID"
      ? "PAID"
      : paymentStatus === "PARTIAL"
        ? "PARTIAL"
        : data.status;

  await prisma.invoice.update({
    where: { id },
    data: {
      clientId: client.id,
      status: nextStatus,
      issueDate: new Date(`${data.issueDate}T00:00:00`),
      dueDate: data.dueDate ? new Date(`${data.dueDate}T00:00:00`) : null,
      subtotal: totals.subtotal,
      discountPercent: data.discountPercent,
      taxRate: data.taxRate,
      tax: totals.tax,
      gstEnabled: totals.gstEnabled,
      taxType: totals.taxType,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      igstAmount: totals.igstAmount,
      total: totals.total,
      notes: data.notes,
      items: {
        deleteMany: {},
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: round2(item.quantity * item.rate),
          hsnSac: item.hsnSac?.trim() || null,
        })),
      },
    },
  });

  revalidateInvoices();
  revalidatePath(`/invoices/${id}`);
  return { id };
}

export async function setInvoiceStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  const status = z
    .enum(["DRAFT", "SENT", "PAID"])
    .parse(String(formData.get("status") ?? "SENT"));
  const userId = await requireUserId();
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: { payments: true },
  });
  if (!invoice) throw new Error("Invoice not found.");

  if (status === "SENT" && (!invoice.dueDate || Number.isNaN(invoice.dueDate.getTime()))) {
    const target =
      returnTo === "list"
        ? "/invoices?notice=due-date-required"
        : `/invoices/${id}?notice=due-date-required`;
    redirect(target);
  }

  if (status === "PAID") {
    const balance = getInvoiceBalance(invoice.total, invoice.payments);
    if (balance > 0) {
      await prisma.payment.create({
        data: {
          userId,
          invoiceId: id,
          amount: balance,
          method: "MANUAL",
          notes: "Recorded when the invoice was marked as paid.",
        },
      });
    }
  }

  const derived = derivePaymentStatus(invoice.total, invoice.payments);
  const nextStatus =
    status === "PAID" ? "PAID" : derived === "PARTIAL" ? "PARTIAL" : status;

  await prisma.invoice.update({ where: { id }, data: { status: nextStatus } });
  revalidateInvoices();
  revalidatePath("/payments");
  revalidatePath(`/invoices/${id}`);
}

export async function deleteInvoice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const userId = await requireUserId();
  const invoice = await prisma.invoice.findFirst({ where: { id, userId } });
  if (!invoice) throw new Error("Invoice not found.");

  await prisma.invoice.delete({ where: { id } });
  revalidateInvoices();
  revalidatePath(`/invoices/${id}`);
  redirect("/invoices?notice=invoice-deleted");
}

export async function sendInvoiceEmailAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const userId = await requireUserId();
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: { client: true, user: true, payments: true },
  });
  if (!invoice) throw new Error("Invoice not found.");

  if (!invoice.client.email?.trim()) {
    redirect(`/invoices/${id}?notice=client-missing-email`);
  }

  const settings = await getUserSettings(userId);
  const balance = getInvoiceBalance(invoice.total, invoice.payments);
  const shareUrl = await getInvoiceShareUrl(invoice.id);
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

  let skipped = false;
  try {
    const pdfData = await buildPdfData(id, userId);
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

    const result = await sendInvoiceEmail({
      to: invoice.client.email,
      businessName: settings.businessName,
      invoiceNumber: invoice.number,
      clientName: invoice.client.name,
      amount: balance > 0 ? balance : invoice.total,
      currency: settings.currency,
      locale: settings.locale,
      dueDate: invoice.dueDate,
      paymentLink: invoice.razorpayPaymentLinkUrl || invoice.paymentLink,
      shareUrl,
      pdf: { filename: `invoice-${invoice.number}.pdf`, content: pdf },
    });
    skipped = "skipped" in result;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof err.digest === "string" &&
      err.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("[Email] Failed to send invoice email:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to send invoice email.";
    revalidatePath(`/invoices/${id}`);
    redirect(`/invoices/${id}?notice=email-failed&error=${encodeURIComponent(errorMessage)}`);
  }

  if (!skipped && invoice.status === "DRAFT") {
    await prisma.invoice.update({ where: { id }, data: { status: "SENT" } });
  }

  revalidateInvoices();
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}?notice=${skipped ? "email-skipped" : "email-sent"}`);
}


