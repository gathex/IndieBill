"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RazorpayLinkButton } from "@/components/razorpay-link-button";
import { ShareInvoiceButton } from "@/components/share-invoice-button";
import { CopyUpiIdButton } from "@/components/copy-upi-button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoicePaymentShareCardProps {
  invoiceId: string;
  invoiceNumber: string;
  total: number;
  balance: number;
  currency: string;
  locale: string;
  businessName: string;
  dueDate?: Date | string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  shareUrl: string;
  razorpayPaymentLinkUrl?: string | null;
  qrDataUrl: string;
  qrLabel: string;
  upiAddress?: string | null;
  mailtoUrl?: string;
}

export function InvoicePaymentShareCard({
  invoiceId,
  invoiceNumber,
  total,
  balance,
  currency,
  locale,
  businessName,
  dueDate,
  clientName,
  clientPhone,
  clientEmail,
  shareUrl,
  razorpayPaymentLinkUrl,
  qrDataUrl,
  qrLabel,
  upiAddress,
  mailtoUrl,
}: InvoicePaymentShareCardProps) {
  const formattedBalance = formatCurrency(
    balance > 0 ? balance : total,
    currency,
    locale,
  );
  const isPaid = balance <= 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>Payment & Share</span>
        </CardTitle>
        {isPaid ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            ✓ Paid in Full
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Due: {formattedBalance}
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Payment Options Section (shown when unpaid or partial) */}
        {!isPaid ? (
          <div className="flex flex-col gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
            {/* Inbuilt UPI QR Code (Full Width Horizontal) */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 p-3.5 flex items-center gap-3.5">
              <div className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={qrLabel}
                  className="w-24 h-24 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white p-1.5 shadow-2xs"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
                    <svg
                      className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    <span>Inbuilt UPI QR</span>
                  </span>
                  <span className="shrink-0 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 text-[10px] font-medium leading-none">
                    Instant
                  </span>
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  Scan with GPay, PhonePe, Paytm, or BHIM
                </p>

                {upiAddress ? (
                  <div className="pt-0.5">
                    <CopyUpiIdButton upiId={upiAddress} />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Razorpay Online Link (Full Width) */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
                  <svg
                    className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" />
                  </svg>
                  <span>Razorpay Online Link</span>
                </span>
                <span className="shrink-0 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 text-[10px] font-medium leading-none">
                  Cards · UPI
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                Credit/Debit cards, Netbanking, or UPI
              </p>

              <RazorpayLinkButton
                invoiceId={invoiceId}
                initialUrl={razorpayPaymentLinkUrl}
                balanceDue={balance}
              />
            </div>
          </div>
        ) : null}

        {/* Share Actions Section */}
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Share with Client
            </span>
          </div>
          <ShareInvoiceButton
            url={shareUrl}
            title={`Invoice ${invoiceNumber}`}
            documentType="invoice"
            documentNumber={invoiceNumber}
            businessName={businessName}
            clientName={clientName}
            clientEmail={clientEmail}
            recipientPhone={clientPhone}
            amountDue={formattedBalance}
            dueDate={formatDate(dueDate, undefined, locale)}
            paymentUrl={razorpayPaymentLinkUrl}
            mailtoUrl={mailtoUrl}
            layout="grid"
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}
