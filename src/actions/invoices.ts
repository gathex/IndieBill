"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { computeInvoiceTotals, createInvoiceNumber, round2 } from "@/lib/invoices";
import { derivePaymentStatus, getInvoiceBalance } from "@/lib/payments";
import { sendInvoiceEmail } from "@/lib/email";
import { createPaymentLink } from "@/lib/stripe";
import { renderInvoicePdf } from "@/lib/pdf";
import { getUserSettings } from "@/lib/users";
import type { InvoicePdfData } from "@/components/invoice-document";

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Select a client."),
  status: z.enum(["DRAFT", "SENT", "PAID"]),
  issueDate: z.string().min(1),
  dueDate: z.string().nullable(),
  notes: z.string().nullable(),
  discountPercent: z.number().min(0).max(100),
  taxRate: z.number().min(0).max(100),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Every item needs a description."),
        quantity: z.number().positive(),
        rate: z.number().min(0),
      }),
    )
    .min(1, "Add at least one line item."),
});

export type InvoiceItemInput = z.infer<typeof invoiceSchema>["items"][number];
export type InvoiceInput = z.infer<typeof invoiceSchema>;

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

function revalidateInvoices() {
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/payments");
  revalidatePath("/clients");
}

function calculateTotals(input: InvoiceInput) {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  return computeInvoiceTotals({
    subtotal,
    discountPercent: input.discountPercent,
    taxRate: input.taxRate,
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
    })),
  };
}

export async function createInvoice(input: InvoiceInput) {
  const userId = await requireUserId();
  const data = invoiceSchema.parse(input);

  const client = await prisma.client.findFirst({ where: { id: data.clientId, userId } });
  if (!client) throw new Error("Client not found.");

  const totals = calculateTotals(data);

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
          total: totals.total,
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: round2(item.quantity * item.rate),
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

  const existing = await prisma.invoice.findFirst({
    where: { id, userId },
    include: { payments: true },
  });
  if (!existing) throw new Error("Invoice not found.");

  const client = await prisma.client.findFirst({ where: { id: data.clientId, userId } });
  if (!client) throw new Error("Client not found.");

  const totals = calculateTotals(data);
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
      total: totals.total,
      notes: data.notes,
      items: {
        deleteMany: {},
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: round2(item.quantity * item.rate),
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
  const status = z
    .enum(["DRAFT", "SENT", "PAID"])
    .parse(String(formData.get("status") ?? "SENT"));
  const userId = await requireUserId();
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: { payments: true },
  });
  if (!invoice) throw new Error("Invoice not found.");

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
    include: { client: true, user: true },
  });
  if (!invoice) throw new Error("Invoice not found.");

  const settings = await getUserSettings(userId);

  let skipped = false;
  try {
    const pdfData = await buildPdfData(id, userId);
    const pdf = await renderInvoicePdf({
      invoice: pdfData,
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      currency: settings.currency,
    });

    const result = await sendInvoiceEmail({
      to: invoice.client.email,
      businessName: settings.businessName,
      invoiceNumber: invoice.number,
      clientName: invoice.client.name,
      amount: invoice.total,
      currency: settings.currency,
      dueDate: invoice.dueDate,
      paymentLink: invoice.paymentLink,
      pdf: { filename: `invoice-${invoice.number}.pdf`, content: pdf },
    });
    skipped = "skipped" in result;
  } catch {
    redirect(`/invoices/${id}?notice=email-failed`);
  }

  if (!skipped && invoice.status === "DRAFT") {
    await prisma.invoice.update({ where: { id }, data: { status: "SENT" } });
  }

  revalidateInvoices();
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}?notice=${skipped ? "email-skipped" : "email-sent"}`);
}

export async function createPaymentLinkForInvoice(invoiceId: string) {
  const userId = await requireUserId();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { payments: true },
  });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.paymentLink) return invoice.paymentLink;

  const balance = getInvoiceBalance(invoice.total, invoice.payments);
  if (balance <= 0) throw new Error("Invoice is already paid.");

  const settings = await getUserSettings(userId);
  const paymentLink = await createPaymentLink({
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    amount: balance,
    currency: settings.currency,
  });
  if (paymentLink) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paymentLink },
    });
  }

  revalidatePath(`/invoices/${invoice.id}`);
  return paymentLink;
}
