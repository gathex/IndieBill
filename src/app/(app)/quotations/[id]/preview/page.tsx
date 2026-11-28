import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  computeQuotationTotals,
  effectiveQuotationStatus,
  getQuotationById,
} from "@/lib/quotations";
import { getUserSettings } from "@/lib/users";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStateDisplayName } from "@/lib/gst";
import { QuotationSheet } from "@/components/quotation-sheet";
import { QuotationPdfDownload } from "@/components/quotation-pdf-download";
import { PrintButton } from "@/components/print-button";
import { ShareInvoiceButton } from "@/components/share-invoice-button";
import { getQuotationShareUrl } from "@/lib/share";
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
  const shareUrl = await getQuotationShareUrl(quotation.id);
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
    taxRate: quotation.taxRate,
    gstEnabled: quotation.gstEnabled,
    taxType: quotation.taxType,
    cgstAmount: quotation.cgstAmount,
    sgstAmount: quotation.sgstAmount,
    igstAmount: quotation.igstAmount,
    businessGstin: settings.gstin,
    businessState: settings.state,
    clientGstin: quotation.client.gstin,
    clientState: quotation.client.state,
    placeOfSupply: getStateDisplayName(quotation.client.state) || quotation.client.state || null,
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

  return (
    <div className="space-y-6">
      <div className="print-hidden flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/quotations/${quotation.id}`}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            ← Back to quotation
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Preview · Quotation {quotation.number}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Full A4 sheet · use Print / Save as PDF for the best result.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/quotations/${quotation.id}`}>
            <Button variant="ghost">Details</Button>
          </Link>
          <ShareInvoiceButton
            compact
            layout="row"
            url={shareUrl}
            title={`Quotation ${quotation.number}`}
            documentType="quotation"
            documentNumber={quotation.number}
            businessName={settings.businessName}
            clientName={quotation.client.name}
            clientEmail={quotation.client.email}
            recipientPhone={quotation.client.phone}
            amountDue={formatCurrency(
              quotation.total,
              settings.currency,
              settings.locale,
            )}
            dueDate={formatDate(quotation.validUntil, undefined, settings.locale)}
          />
          <PrintButton />
          <QuotationPdfDownload
            quotation={pdfData}
            businessName={settings.businessName}
            businessAddress={settings.businessAddress}
            businessGstin={settings.gstin}
            currency={settings.currency}
            locale={settings.locale}
            logoDataUrl={settings.logoDataUrl}
          />
        </div>
      </div>

      <div className="w-full flex justify-center overflow-x-auto py-8 px-4 bg-zinc-200 dark:bg-zinc-800 rounded-xl print:bg-white print:p-0 print:m-0 print:block print:overflow-visible print:rounded-none">
        <QuotationSheet
          quotation={pdfData}
          businessName={settings.businessName}
          businessAddress={settings.businessAddress}
          businessGstin={settings.gstin}
          currency={settings.currency}
          locale={settings.locale}
          logoDataUrl={settings.logoDataUrl}
        />
      </div>
    </div>
  );
}
