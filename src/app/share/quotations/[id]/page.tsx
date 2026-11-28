import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { effectiveQuotationStatus, computeQuotationTotals } from "@/lib/quotations";
import { getUserSettings } from "@/lib/users";
import { getStateDisplayName } from "@/lib/gst";
import { QuotationStatusBadge } from "@/components/quotation-status-badge";
import { QuotationSheet } from "@/components/quotation-sheet";
import { QuotationPdfDownload } from "@/components/quotation-pdf-download";
import type { QuotationPdfData } from "@/components/quotation-document";
import { PrintButton } from "@/components/print-button";
import { CopyShareButton } from "@/components/copy-share-button";
import { BrandLogo } from "@/components/BrandLogo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!quotation) return { title: "Quotation Not Found" };
  const business =
    quotation.user?.businessName || quotation.user?.name || "IndieBill";
  return {
    title: `Quotation ${quotation.number} · ${business}`,
    description: `View Quotation ${quotation.number} from ${business}`,
  };
}

export default async function PublicQuotationSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
    },
  });

  if (!quotation) {
    notFound();
  }

  const settings = await getUserSettings(quotation.userId);
  const status = effectiveQuotationStatus(quotation.status, quotation.validUntil);

  const discount = computeQuotationTotals({
    subtotal: quotation.subtotal,
    discountPercent: quotation.discountPercent,
    taxRate: quotation.taxRate,
  }).discount;

  const pdfData: QuotationPdfData = {
    id: quotation.id,
    number: quotation.number,
    status,
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
    placeOfSupply:
      getStateDisplayName(quotation.client.state) ||
      quotation.client.state ||
      null,
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
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
      {/* Top Floating App Bar (Print-hidden) */}
      <header className="print-hidden sticky top-0 z-40 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <BrandLogo variant="full" size={26} />
            </Link>
            <div className="hidden sm:block h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                Quotation {quotation.number}
              </span>
              <QuotationStatusBadge status={status} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CopyShareButton label="Copy Link" />
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
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Centered A4 Document Preview */}
        <div className="w-full flex justify-center overflow-x-auto py-8 px-4 bg-zinc-200 dark:bg-zinc-900 rounded-xl print:bg-white print:p-0 print:m-0 print:block print:overflow-visible print:rounded-none">
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
      </main>

      {/* Public Footer */}
      <footer className="print-hidden py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <p>
          Powered by{" "}
          <Link href="/" className="font-semibold text-zinc-700 dark:text-zinc-300 hover:underline">
            IndieBill
          </Link>{" "}
          · Proposals & Billing for Freelancers
        </p>
      </footer>
    </div>
  );
}
