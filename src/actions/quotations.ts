"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { createInvoiceNumber } from "@/lib/invoices";
import {
  computeQuotationTotals,
  createQuotationNumber,
  round2,
} from "@/lib/quotations";
import { computeGstTotals, getStateDisplayName } from "@/lib/gst";
import { sendQuotationEmail } from "@/lib/email";
import { renderQuotationPdf } from "@/lib/pdf";
import { getUserSettings } from "@/lib/users";
import { getQuotationShareUrl } from "@/lib/share";
import type { QuotationPdfData } from "@/components/quotation-document";

const quotationSchema = z.object({
  clientId: z.string().min(1, "Select a client."),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]),
  issueDate: z.string().min(1),
  validUntil: z.string().nullable(),
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
});

export type QuotationItemInput = z.infer<typeof quotationSchema>["items"][number];
export type QuotationInput = z.infer<typeof quotationSchema>;

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

function revalidateQuotations() {
  revalidatePath("/dashboard");
  revalidatePath("/quotations");
  revalidatePath("/clients");
}

function calculateQuotationTotals(
  input: QuotationInput,
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

async function buildPdfData(
  quotationId: string,
  userId: string,
): Promise<QuotationPdfData> {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, userId },
    include: { client: true, items: true, user: true },
  });
  if (!quotation) throw new Error("Quotation not found.");

  return {
    id: quotation.id,
    number: quotation.number,
    status: quotation.status,
    issueDate: quotation.issueDate,
    validUntil: quotation.validUntil,
    subtotal: quotation.subtotal,
    discount: computeQuotationTotals({
      subtotal: quotation.subtotal,
      discountPercent: quotation.discountPercent,
      taxRate: quotation.taxRate,
    }).discount,
    tax: quotation.tax,
    taxRate: quotation.taxRate,
    gstEnabled: quotation.gstEnabled,
    taxType: quotation.taxType,
    cgstAmount: quotation.cgstAmount,
    sgstAmount: quotation.sgstAmount,
    igstAmount: quotation.igstAmount,
    businessGstin: quotation.user?.gstin ?? null,
    businessState: quotation.user?.state ?? null,
    clientGstin: quotation.client?.gstin ?? null,
    clientState: quotation.client?.state ?? null,
    placeOfSupply: getStateDisplayName(quotation.client?.state) || quotation.client?.state || null,
    total: quotation.total,
    notes: quotation.notes,
    clientName: quotation.client.name,
    clientEmail: quotation.client.email,
    clientCompany: quotation.client.company,
    items: quotation.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
      hsnSac: item.hsnSac,
    })),
  };
}

export async function createQuotation(input: QuotationInput) {
  const userId = await requireUserId();
  const data = quotationSchema.parse(input);

  const [client, user] = await Promise.all([
    prisma.client.findFirst({ where: { id: data.clientId, userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { state: true, gstin: true },
    }),
  ]);
  if (!client) throw new Error("Client not found.");

  const totals = calculateQuotationTotals(data, user?.state, client.state);
  let quotation;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const number = await createQuotationNumber(userId);
    try {
      quotation = await prisma.quotation.create({
        data: {
          userId,
          clientId: client.id,
          number,
          status: data.status,
          issueDate: new Date(`${data.issueDate}T00:00:00`),
          validUntil: data.validUntil ? new Date(`${data.validUntil}T00:00:00`) : null,
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
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!isNumberCollision || attempt === 4) throw error;
    }
  }

  revalidateQuotations();
  revalidatePath(`/quotations/${quotation!.id}`);
  return quotation!;
}

export async function updateQuotation(id: string, input: QuotationInput) {
  const userId = await requireUserId();
  const data = quotationSchema.parse(input);

  const [existing, client, user] = await Promise.all([
    prisma.quotation.findFirst({ where: { id, userId } }),
    prisma.client.findFirst({ where: { id: data.clientId, userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { state: true, gstin: true },
    }),
  ]);
  if (!existing) throw new Error("Quotation not found.");
  if (!client) throw new Error("Client not found.");

  const totals = calculateQuotationTotals(data, user?.state, client.state);
  await prisma.quotation.update({
    where: { id },
    data: {
      clientId: client.id,
      status: existing.status === "CONVERTED" ? "CONVERTED" : data.status,
      issueDate: new Date(`${data.issueDate}T00:00:00`),
      validUntil: data.validUntil ? new Date(`${data.validUntil}T00:00:00`) : null,
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

  revalidateQuotations();
  revalidatePath(`/quotations/${id}`);
  return { id };
}

export async function setQuotationStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = z
    .enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"])
    .parse(String(formData.get("status") ?? "SENT"));
  const userId = await requireUserId();
  const quotation = await prisma.quotation.findFirst({ where: { id, userId } });
  if (!quotation) throw new Error("Quotation not found.");
  if (quotation.status === "CONVERTED") throw new Error("Converted quotations cannot be edited.");

  await prisma.quotation.update({ where: { id }, data: { status } });
  revalidateQuotations();
  revalidatePath(`/quotations/${id}`);
}

export async function deleteQuotation(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const userId = await requireUserId();
  const quotation = await prisma.quotation.findFirst({ where: { id, userId } });
  if (!quotation) throw new Error("Quotation not found.");

  await prisma.quotation.delete({ where: { id } });
  revalidateQuotations();
  revalidatePath(`/quotations/${id}`);
  redirect("/quotations?notice=quotation-deleted");
}

export async function sendQuotationEmailAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const userId = await requireUserId();
  const quotation = await prisma.quotation.findFirst({
    where: { id, userId },
    include: { client: true },
  });
  if (!quotation) throw new Error("Quotation not found.");

  if (!quotation.client.email?.trim()) {
    redirect(`/quotations/${id}?notice=client-missing-email`);
  }

  const settings = await getUserSettings(userId);
  const shareUrl = await getQuotationShareUrl(quotation.id);
  let skipped = false;
  try {
    const pdfData = await buildPdfData(id, userId);
    const pdf = await renderQuotationPdf({
      quotation: pdfData,
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      businessGstin: settings.gstin,
      currency: settings.currency,
      locale: settings.locale,
      logoDataUrl: settings.logoDataUrl,
    });
    const result = await sendQuotationEmail({
      to: quotation.client.email,
      businessName: settings.businessName,
      quotationNumber: quotation.number,
      clientName: quotation.client.name,
      amount: quotation.total,
      currency: settings.currency,
      locale: settings.locale,
      validUntil: quotation.validUntil,
      shareUrl,
      pdf: { filename: `quotation-${quotation.number}.pdf`, content: pdf },
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
    console.error("[Email] Failed to send quotation email:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to send quotation email.";
    revalidatePath(`/quotations/${id}`);
    redirect(`/quotations/${id}?notice=quotation-email-failed&error=${encodeURIComponent(errorMessage)}`);
  }

  if (!skipped && quotation.status === "DRAFT") {
    await prisma.quotation.update({ where: { id }, data: { status: "SENT" } });
  }

  revalidateQuotations();
  revalidatePath(`/quotations/${id}`);
  redirect(
    `/quotations/${id}?notice=${skipped ? "quotation-email-skipped" : "quotation-email-sent"}`,
  );
}

export async function convertQuotationToInvoice(quotationId: string): Promise<{ id: string }> {
  const userId = await requireUserId();
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, userId },
    include: { items: true },
  });
  if (!quotation) throw new Error("Quotation not found.");
  if (quotation.status === "CONVERTED" && quotation.convertedInvoiceId) {
    return { id: quotation.convertedInvoiceId };
  }

  let invoice;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const number = await createInvoiceNumber(userId);
    try {
      invoice = await prisma.invoice.create({
        data: {
          userId,
          clientId: quotation.clientId,
          number,
          status: "DRAFT",
          issueDate: new Date(),
          dueDate: quotation.validUntil,
          subtotal: quotation.subtotal,
          discountPercent: quotation.discountPercent,
          taxRate: quotation.taxRate,
          tax: quotation.tax,
          gstEnabled: quotation.gstEnabled,
          taxType: quotation.taxType,
          cgstAmount: quotation.cgstAmount,
          sgstAmount: quotation.sgstAmount,
          igstAmount: quotation.igstAmount,
          total: quotation.total,
          notes: quotation.notes,
          items: {
            create: quotation.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              hsnSac: item.hsnSac,
            })),
          },
        },
      });
      break;
    } catch (error) {
      const isNumberCollision =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!isNumberCollision || attempt === 4) throw error;
    }
  }

  await prisma.quotation.update({
    where: { id: quotation.id },
    data: { status: "CONVERTED", convertedInvoiceId: invoice!.id },
  });

  revalidateQuotations();
  revalidatePath("/invoices");
  revalidatePath(`/quotations/${quotation.id}`);
  revalidatePath(`/invoices/${invoice!.id}`);
  return { id: invoice!.id };
}
