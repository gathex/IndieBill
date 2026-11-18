import { prisma } from "./db";

export const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}

export function computeInvoiceTotals(input: {
  subtotal: number;
  discountPercent: number;
  taxRate: number;
}): InvoiceTotals {
  const subtotal = round2(input.subtotal);
  const discount = round2(subtotal * (input.discountPercent / 100));
  const taxable = round2(subtotal - discount);
  const tax = round2(taxable * (input.taxRate / 100));
  const total = round2(taxable + tax);
  return { subtotal, discount, taxable, tax, total };
}

export async function getUserInvoices(userId: string) {
  return prisma.invoice.findMany({
    where: { userId },
    include: { client: true, items: true },
    orderBy: { issueDate: "desc" },
  });
}

export async function getInvoiceById(id: string, userId: string) {
  return prisma.invoice.findFirst({
    where: { id, userId },
    include: { client: true, items: true },
  });
}

export async function createInvoiceNumber(userId: string): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    select: { number: true },
  });
  const highest = invoices.reduce((max, invoice) => {
    const value = Number.parseInt(invoice.number.replace(/^INV-/, ""), 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `INV-${String(highest + 1).padStart(4, "0")}`;
}

export function effectiveStatus(
  status: string,
  dueDate: Date | string | null | undefined,
): InvoiceStatus {
  if (status === "PAID") return "PAID";
  if (status === "DRAFT") return "DRAFT";
  const isOverdue =
    dueDate != null && new Date(dueDate).getTime() < Date.now();
  if (status === "SENT" && isOverdue) return "OVERDUE";
  if (status === "SENT") return "SENT";
  return "DRAFT";
}
