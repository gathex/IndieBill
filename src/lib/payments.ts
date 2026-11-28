import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { round2 } from "./invoices";

export const PAYMENT_METHODS = [
  "MANUAL",
  "BANK_TRANSFER",
  "CASH",
  "CHECK",
  "RAZORPAY",
  "OTHER",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  BANK_TRANSFER: "Bank transfer",
  CASH: "Cash",
  CHECK: "Check",
  RAZORPAY: "Online (Razorpay)",
  OTHER: "Other",
};

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

interface AmountLike {
  amount: number;
}

export function sumPayments(payments: Array<AmountLike>): number {
  return round2(payments.reduce((sum, payment) => sum + payment.amount, 0));
}

export function getInvoiceBalance(
  total: number,
  payments: Array<AmountLike>,
): number {
  return round2(Math.max(total - sumPayments(payments), 0));
}

export function derivePaymentStatus(
  total: number,
  payments: Array<AmountLike>,
): PaymentStatus {
  const paid = sumPayments(payments);
  if (total > 0 && paid >= total) return "PAID";
  if (paid > 0) return "PARTIAL";
  return "UNPAID";
}

export async function getUserPayments(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    include: { invoice: { include: { client: true } } },
    orderBy: { paymentDate: "desc" },
  });
}

export async function getInvoicePayments(invoiceId: string, userId: string) {
  return prisma.payment.findMany({
    where: { invoiceId, userId },
    orderBy: { paymentDate: "desc" },
  });
}



interface RecordRazorpayPaymentInput {
  invoiceId: string;
  amount?: number;
  reference: string;
  notes?: string;
}

/** Records a Razorpay payment idempotently and updates the invoice status. */
export async function recordRazorpayPayment({
  invoiceId,
  amount,
  reference,
  notes = "Paid online via Razorpay.",
}: RecordRazorpayPaymentInput) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) return null;

  if (invoice.payments.some((payment) => payment.reference === reference)) {
    return null;
  }

  const paid = sumPayments(invoice.payments);
  const balance = round2(Math.max(invoice.total - paid, 0));
  const requested = amount && amount > 0 ? round2(amount) : balance;
  const paymentAmount = round2(Math.min(requested, balance));

  if (paymentAmount <= 0) {
    if (invoice.status !== "PAID") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID" },
      });
    }
    return null;
  }

  try {
    const payment = await prisma.payment.create({
      data: {
        userId: invoice.userId,
        invoiceId: invoice.id,
        amount: paymentAmount,
        method: "RAZORPAY",
        reference,
        paymentDate: new Date(),
        notes,
      },
    });
    const newPaid = round2(paid + paymentAmount);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: newPaid >= invoice.total ? "PAID" : "PARTIAL" },
    });
    return payment;
  } catch (error) {
    const isDuplicate =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";
    if (isDuplicate) return null;
    throw error;
  }
}
