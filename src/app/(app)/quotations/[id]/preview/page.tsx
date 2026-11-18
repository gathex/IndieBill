import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  computeQuotationTotals,
  effectiveQuotationStatus,
  getQuotationById,
} from "@/lib/quotations";
import { getUserSettings } from "@/lib/users";
import { QuotationSheet } from "@/components/quotation-sheet";
import { QuotationPdfDownload } from "@/components/quotation-pdf-download";
import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import type { QuotationPdfData } from "@/components/quotation-document";

export default async function QuotationPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const quotation = await getQuotationById(id, userId);
  if (!quotation) notFound();

  const settings = await getUserSettings(userId);
  const discount = computeQuotationTotals({
    subtotal: quotation.subtotal,
    discountPercent: quotation.discountPercent,
    taxRate: quotation.taxRate,
  }).discount;

  const pdfData: QuotationPdfData = {
    id: quotation.id,
    number: quotation.number,
    status: effectiveQuotationStatus(quotation.status, quotation.validUntil),
    issueDate: quotation.issueDate,
    validUntil: quotation.validUntil,
    subtotal: quotation.subtotal,
    discount,
    tax: quotation.tax,
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
    })),
  };

  return (
    <div className="space-y-6">
      <div className="print-hidden flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/quotations/${quotation.id}`}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            ← Back to quotation
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Preview · Quotation {quotation.number}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Full A4 sheet · use Print / Save as PDF for the best result.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/quotations/${quotation.id}`}>
            <Button variant="ghost">Details</Button>
          </Link>
          <PrintButton />
          <QuotationPdfDownload
            quotation={pdfData}
            businessName={settings.businessName}
            businessAddress={settings.businessAddress}
            currency={settings.currency}
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-zinc-200 p-4 print:bg-white print:p-0">
        <QuotationSheet
          quotation={pdfData}
          businessName={settings.businessName}
          businessAddress={settings.businessAddress}
          currency={settings.currency}
        />
      </div>
    </div>
  );
}
