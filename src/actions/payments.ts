"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { round2 } from "@/lib/invoices";
import {
  PAYMENT_METHODS,
  derivePaymentStatus,
  getInvoiceBalance,
} from "@/lib/payments";

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string().min(1),
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
});

function revalidatePaymentViews(invoiceId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/payments");
  revalidatePath("/clients");
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function recordPayment(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) redirect("/payments?notice=payment-invalid");

  const parsed = paymentSchema.safeParse({
    invoiceId,
    amount: Number(formData.get("amount")),
    paymentDate: String(formData.get("paymentDate") ?? ""),
    method: String(formData.get("method") ?? "MANUAL"),
    reference: String(formData.get("reference") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) {
    redirect(`/invoices/${invoiceId}?notice=payment-invalid`);
  }

  const userId = await requireUserId();
  const data = parsed.data;
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { payments: true },
  });
  if (!invoice) redirect("/invoices?notice=payment-error");

  const balance = getInvoiceBalance(invoice.total, invoice.payments);
  if (balance <= 0) {
    redirect(`/invoices/${invoiceId}?notice=payment-already-paid`);
  }
  if (data.amount > balance + 0.009) {
    redirect(`/invoices/${invoiceId}?notice=payment-exceeds`);
  }

  try {
    await prisma.payment.create({
      data: {
        userId,
        invoiceId,
        amount: round2(data.amount),
        paymentDate: new Date(`${data.paymentDate}T12:00:00`),
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      },
    });
  } catch (error) {
    const isDuplicate =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";
    if (isDuplicate) {
      redirect(`/invoices/${invoiceId}?notice=payment-duplicate`);
    }
    throw error;
  }

  const paymentStatus = derivePaymentStatus(invoice.total, [
    ...invoice.payments,
    { amount: round2(data.amount) },
  ]);
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: paymentStatus === "PAID" ? "PAID" : "PARTIAL",
    },
  });

  revalidatePaymentViews(invoiceId);
  redirect(`/invoices/${invoiceId}?notice=payment-recorded`);
}

export async function deletePayment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/payments?notice=payment-error");

  const userId = await requireUserId();
  const payment = await prisma.payment.findFirst({ where: { id, userId } });
  if (!payment) redirect("/payments?notice=payment-error");

  const invoiceId = payment.invoiceId;
  await prisma.payment.delete({ where: { id } });

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { payments: true },
  });
  if (!invoice) redirect("/payments?notice=payment-error");

  const paymentStatus = derivePaymentStatus(invoice.total, invoice.payments);
  const nextStatus =
    paymentStatus === "PAID"
      ? "PAID"
      : paymentStatus === "PARTIAL"
        ? "PARTIAL"
        : "SENT";

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: nextStatus },
  });

  revalidatePaymentViews(invoiceId);
  redirect(`/payments?notice=payment-deleted`);
}
