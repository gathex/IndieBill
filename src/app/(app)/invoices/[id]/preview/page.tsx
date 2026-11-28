import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  computeInvoiceTotals,
  effectiveStatus,
  getInvoiceById,
} from "@/lib/invoices";
import { generatePaymentQr } from "@/lib/qr";
import { getInvoiceShareUrl } from "@/lib/share";
import { getInvoiceBalance } from "@/lib/payments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getUserSettings } from "@/lib/users";
import { getStateDisplayName } from "@/lib/gst";
import { InvoiceSheet } from "@/components/invoice-sheet";
import { InvoicePdfDownload } from "@/components/invoice-pdf-download";
import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import type { InvoicePdfData } from "@/components/invoice-document";
import { ShareInvoiceButton } from "@/components/share-invoice-button";

export default async function InvoicePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const invoice = await getInvoiceById(id, userId);
  if (!invoice) notFound();

  const settings = await getUserSettings(userId);
  const balance = getInvoiceBalance(invoice.total, invoice.payments);
  const [shareUrl, qr] = await Promise.all([
    getInvoiceShareUrl(invoice.id),
    generatePaymentQr({
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
    }),
  ]);
  const discount = computeInvoiceTotals({
    subtotal: invoice.subtotal,
    discountPercent: invoice.discountPercent,
    taxRate: invoice.taxRate,
  }).discount;

  const pdfData: InvoicePdfData = {
    id: invoice.id,
    number: invoice.number,
    status: effectiveStatus(invoice.status, invoice.dueDate),
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    subtotal: invoice.subtotal,
    discount,
    tax: invoice.tax,
    taxRate: invoice.taxRate,
    gstEnabled: invoice.gstEnabled,
    taxType: invoice.taxType,
    cgstAmount: invoice.cgstAmount,
    sgstAmount: invoice.sgstAmount,
    igstAmount: invoice.igstAmount,
    businessGstin: settings.gstin,
    businessState: settings.state,
    clientGstin: invoice.client.gstin,
    clientState: invoice.client.state,
    placeOfSupply: getStateDisplayName(invoice.client.state) || invoice.client.state || null,
    total: invoice.total,
    notes: invoice.notes,
    paymentLink: invoice.paymentLink,
    razorpayPaymentLinkUrl: invoice.razorpayPaymentLinkUrl,
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

  return (
    <div className="space-y-6">
      <div className="print-hidden flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/invoices/${invoice.id}`}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            ← Back to invoice
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Preview · Invoice {invoice.number}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Full A4 sheet · use Print / Save as PDF for the best result.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {invoice.razorpayPaymentLinkUrl && balance > 0 ? (
            <a
              href={invoice.razorpayPaymentLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 text-sm shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" />
              </svg>
              Pay Now
            </a>
          ) : null}
          <Link href={`/invoices/${invoice.id}`}>
            <Button variant="ghost">Details</Button>
          </Link>
          <ShareInvoiceButton
            compact
            layout="row"
            url={shareUrl}
            title={`Invoice ${invoice.number}`}
            documentType="invoice"
            documentNumber={invoice.number}
            businessName={settings.businessName}
            clientName={invoice.client.name}
            clientEmail={invoice.client.email}
            recipientPhone={invoice.client.phone}
            amountDue={formatCurrency(
              balance > 0 ? balance : invoice.total,
              settings.currency,
              settings.locale,
            )}
            dueDate={formatDate(invoice.dueDate, undefined, settings.locale)}
            paymentUrl={invoice.razorpayPaymentLinkUrl}
          />
          <PrintButton />
          <InvoicePdfDownload
            invoice={pdfData}
            businessName={settings.businessName}
            businessAddress={settings.businessAddress}
            businessGstin={settings.gstin}
            currency={settings.currency}
            locale={settings.locale}
            logoDataUrl={settings.logoDataUrl}
            qrDataUrl={qr.dataUrl}
            qrLabel={qr.label}
          />
        </div>
      </div>

      <div className="w-full flex justify-center overflow-x-auto py-8 px-4 bg-zinc-200 dark:bg-zinc-800 rounded-xl print:bg-white print:p-0 print:m-0 print:block print:overflow-visible print:rounded-none">
        <InvoiceSheet
          invoice={pdfData}
          businessName={settings.businessName}
          businessAddress={settings.businessAddress}
          businessGstin={settings.gstin}
          currency={settings.currency}
          locale={settings.locale}
          logoDataUrl={settings.logoDataUrl}
          qrDataUrl={qr.dataUrl}
          qrLabel={qr.label}
        />
      </div>
    </div>
  );
}
