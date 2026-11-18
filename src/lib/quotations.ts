import { prisma } from "./db";
import { computeInvoiceTotals, round2 } from "./invoices";

export const QUOTATION_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const EDITABLE_QUOTATION_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;

export { round2 };
export const computeQuotationTotals = computeInvoiceTotals;

export async function getUserQuotations(userId: string) {
  return prisma.quotation.findMany({
    where: { userId },
    include: { client: true, items: true },
    orderBy: { issueDate: "desc" },
  });
}

export async function getQuotationById(id: string, userId: string) {
  return prisma.quotation.findFirst({
    where: { id, userId },
    include: { client: true, items: true },
  });
}

export async function createQuotationNumber(userId: string): Promise<string> {
  const quotations = await prisma.quotation.findMany({
    where: { userId },
    select: { number: true },
  });
  const highest = quotations.reduce((max, quotation) => {
    const value = Number.parseInt(quotation.number.replace(/^QUO-/, ""), 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `QUO-${String(highest + 1).padStart(4, "0")}`;
}

export function effectiveQuotationStatus(
  status: string,
  validUntil: Date | string | null | undefined,
): QuotationStatus {
  if (status === "CONVERTED") return "CONVERTED";
  if (status === "ACCEPTED") return "ACCEPTED";
  if (status === "REJECTED") return "REJECTED";
  if (status === "DRAFT") return "DRAFT";
  const isExpired = validUntil != null && new Date(validUntil).getTime() < Date.now();
  if (status === "SENT" && isExpired) return "EXPIRED";
  if (status === "SENT") return "SENT";
  return "DRAFT";
}
