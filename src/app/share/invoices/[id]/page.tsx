import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { effectiveStatus, computeInvoiceTotals } from "@/lib/invoices";
import { getInvoiceBalance } from "@/lib/payments";
import { formatCurrency } from "@/lib/utils";
import { generatePaymentQr } from "@/lib/qr";
import { getUserSettings } from "@/lib/users";
import { getStateDisplayName } from "@/lib/gst";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { InvoiceSheet } from "@/components/invoice-sheet";
import { InvoicePdfDownload } from "@/components/invoice-pdf-download";
import type { InvoicePdfData } from "@/components/invoice-document";
import { PrintButton } from "@/components/print-button";
import { CopyShareButton } from "@/components/copy-share-button";
import { CopyUpiIdButton } from "@/components/copy-upi-button";
import { BrandLogo } from "@/components/BrandLogo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!invoice) return { title: "Invoice Not Found" };
  const business =
    invoice.user?.businessName || invoice.user?.name || "IndieBill";
  return {
    title: `Invoice ${invoice.number} · ${business}`,
    description: `View and pay Invoice ${invoice.number} from ${business}`,
  };
}

export default async function PublicInvoiceSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
      payments: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  const settings = await getUserSettings(invoice.userId);
  const balance = getInvoiceBalance(invoice.total, invoice.payments);
  const status = effectiveStatus(invoice.status, invoice.dueDate);

  const qr = await generatePaymentQr({
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
  });

  const discount = computeInvoiceTotals({
    subtotal: invoice.subtotal,
    discountPercent: invoice.discountPercent,
    taxRate: invoice.taxRate,
  }).discount;

  const pdfData: InvoicePdfData = {
    id: invoice.id,
    number: invoice.number,
    status,
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
    placeOfSupply:
      getStateDisplayName(invoice.client.state) ||
      invoice.client.state ||
      null,
    total: invoice.total,
    notes: invoice.notes,
    paymentLink: invoice.razorpayPaymentLinkUrl || invoice.paymentLink,
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

  const formattedBalance = formatCurrency(
    balance > 0 ? balance : invoice.total,
    settings.currency,
    settings.locale,
  );
  const upiAddress = settings.qrUpiId || settings.qrVpa;

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
                Invoice {invoice.number}
              </span>
              <InvoiceStatusBadge status={status} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {invoice.razorpayPaymentLinkUrl && balance > 0 ? (
              <a
                href={invoice.razorpayPaymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-1.5 text-xs sm:text-sm shadow-sm transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" />
                </svg>
                <span>Pay Now ({formattedBalance})</span>
              </a>
            ) : null}

            <CopyShareButton label="Copy Link" />
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
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Unified "Pay Invoice" Section or Paid in Full confirmation */}
        {balance > 0 ? (
          <section className="print-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Pay Invoice {invoice.number}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Choose your preferred payment method below to settle this balance.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 border border-zinc-200/70 dark:border-zinc-700/60">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Balance Due:</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {formattedBalance}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-5 relative">
              {/* Option 1: Inbuilt UPI QR */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr.dataUrl}
                  alt="UPI QR Code"
                  className="w-28 h-28 shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white p-1 shadow-2xs"
                />
                <div className="space-y-1.5 text-center sm:text-left min-w-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Instant UPI
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Scan with any UPI app
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Open Google Pay, PhonePe, Paytm, or BHIM and scan this code to pay.
                  </p>
                  {upiAddress ? (
                    <div className="pt-1 flex justify-center sm:justify-start">
                      <CopyUpiIdButton upiId={upiAddress} />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Center "or" badge (desktop vertical divider, mobile horizontal divider) */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <span className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shadow-xs">
                  or
                </span>
              </div>
              <div className="flex md:hidden items-center my-1">
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
                <span className="mx-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">or</span>
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
              </div>

              {/* Option 2: Razorpay Online Payment */}
              <div className="flex flex-col justify-between rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Cards · Netbanking · UPI
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                    Pay Online via Razorpay
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Fast and secure checkout supporting all Indian credit/debit cards, Netbanking, and UPI.
                  </p>
                </div>

                {invoice.razorpayPaymentLinkUrl ? (
                  <a
                    href={invoice.razorpayPaymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 text-sm shadow-sm transition-all active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" />
                    </svg>
                    Pay {formattedBalance} Online →
                  </a>
                ) : (
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-3 text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
                    Online payment link is not generated yet. Please scan the UPI QR code on the left.
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <div className="print-hidden rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Paid in Full
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Thank you! This invoice has been settled in full.
                </p>
              </div>
            </div>
            <InvoiceStatusBadge status="PAID" />
          </div>
        )}

        {/* Centered A4 Document Preview */}
        <div className="w-full flex justify-center overflow-x-auto py-8 px-4 bg-zinc-200 dark:bg-zinc-900 rounded-xl print:bg-white print:p-0 print:m-0 print:block print:overflow-visible print:rounded-none">
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
            paymentUrl={invoice.razorpayPaymentLinkUrl || undefined}
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
          · Invoicing & Billing for Freelancers
        </p>
      </footer>
    </div>
  );
}
