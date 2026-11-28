import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getInvoiceById, effectiveStatus, computeInvoiceTotals } from "@/lib/invoices";
import {
  getInvoiceBalance,
  sumPayments,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generatePaymentQr } from "@/lib/qr";
import { getInvoiceShareUrl } from "@/lib/share";
import { buildMailtoUrl } from "@/lib/mailto";
import { getUserSettings } from "@/lib/users";
import { getStateDisplayName } from "@/lib/gst";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  setInvoiceStatus,
  deleteInvoice,
  sendInvoiceEmailAction,
} from "@/actions/invoices";
import { InvoicePdfDownload } from "@/components/invoice-pdf-download";
import type { InvoicePdfData } from "@/components/invoice-document";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Notice } from "@/components/notice";
import { PaymentForm } from "@/components/payment-form";
import { InvoicePaymentShareCard } from "@/components/invoice-payment-share-card";
import { InvoiceRemindersCard } from "@/components/invoice-reminders-card";
import { getInvoiceReminderLogs } from "@/lib/reminders";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const { id } = await params;
  const { notice, error } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const invoice = await getInvoiceById(id, userId);
  if (!invoice) notFound();

  const settings = await getUserSettings(userId);
  const money = (amount: number) =>
    formatCurrency(amount, settings.currency, settings.locale);
  const status = effectiveStatus(invoice.status, invoice.dueDate);
  const paid = sumPayments(invoice.payments);
  const balance = getInvoiceBalance(invoice.total, invoice.payments);
  const [shareUrl, qr, reminderLogs] = await Promise.all([
    getInvoiceShareUrl(invoice.id),
    generatePaymentQr({
      invoiceNumber: invoice.number,
      amount: balance > 0 ? balance : invoice.total,
      currency: settings.currency,
      locale: settings.locale,
      businessName: settings.businessName,
      dueDate: invoice.dueDate,
      paymentLink: invoice.paymentLink,
      qrName: settings.qrName,
      qrVpa: settings.qrVpa,
      qrUpiId: settings.qrUpiId,
      qrAccountNumber: settings.qrAccountNumber,
    }),
    getInvoiceReminderLogs(invoice.id, userId),
  ]);
  const mailtoUrl = buildMailtoUrl({
    to: invoice.client.email,
    clientName: invoice.client.name,
    businessName: settings.businessName,
    documentType: "invoice",
    documentNumber: invoice.number,
    amountDue: money(balance > 0 ? balance : invoice.total),
    dueDate: formatDate(invoice.dueDate, undefined, settings.locale),
    shareUrl,
    paymentUrl: balance > 0 ? invoice.razorpayPaymentLinkUrl : undefined,
  });
  const discount = computeInvoiceTotals({
    subtotal: invoice.subtotal,
    discountPercent: invoice.discountPercent,
    taxRate: invoice.taxRate,
  }).discount;

  const pdfData: InvoicePdfData = {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
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

  const showHsn = Boolean(invoice.gstEnabled || invoice.items.some((i) => i.hsnSac));

  return (
    <div className="space-y-6">
      <Notice notice={notice} errorMessage={error} mailtoUrl={mailtoUrl} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/invoices" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50">
            ← All invoices
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Invoice {invoice.number}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <InvoiceStatusBadge status={status} />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Issued {formatDate(invoice.issueDate, undefined, settings.locale)} · Due {formatDate(invoice.dueDate, undefined, settings.locale)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/invoices/${invoice.id}/preview`}>
            <Button variant="outline">Preview A4</Button>
          </Link>
          <Link href={`/invoices/${invoice.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <form action={deleteInvoice}>
            <input type="hidden" name="id" value={invoice.id} />
            <ConfirmSubmitButton
              type="submit"
              variant="danger"
              size="sm"
              confirmMessage="Delete this invoice? This cannot be undone."
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    {showHsn ? (
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        <th className="py-2 pr-4 font-medium">Description</th>
                        <th className="py-2 pr-4 font-medium">HSN/SAC</th>
                        <th className="py-2 pr-4 font-medium text-right">Qty</th>
                        <th className="py-2 pr-4 font-medium text-right">Rate</th>
                        <th className="py-2 pr-4 font-medium text-right">Amount</th>
                      </tr>
                    ) : (
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        <th className="py-2 pr-4 font-medium">Description</th>
                        <th className="py-2 pr-4 font-medium text-right">Qty</th>
                        <th className="py-2 pr-4 font-medium text-right">Rate</th>
                        <th className="py-2 pr-4 font-medium text-right">Amount</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-zinc-800 dark:text-zinc-200">{item.description}</td>
                        {showHsn ? (
                          <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{item.hsnSac || "-"}</td>
                        ) : null}
                        <td className="py-3 pr-4 text-right text-zinc-600 dark:text-zinc-400">{item.quantity}</td>
                        <td className="py-3 pr-4 text-right text-zinc-600 dark:text-zinc-400">{money(item.rate)}</td>
                        <td className="py-3 pr-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                          {money(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t">
                    <tr>
                      <td colSpan={showHsn ? 4 : 3} className="py-2 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                        Subtotal
                      </td>
                      <td className="py-2 text-right text-sm text-zinc-800 dark:text-zinc-200">{money(invoice.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={showHsn ? 4 : 3} className="py-1 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                        Discount ({invoice.discountPercent}%)
                      </td>
                      <td className="py-1 text-right text-sm text-zinc-800 dark:text-zinc-200">-{money(discount)}</td>
                    </tr>
                    {invoice.gstEnabled && invoice.taxType === "INTRA_STATE" ? (
                      <>
                        <tr>
                          <td colSpan={showHsn ? 4 : 3} className="py-1 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                            CGST ({(invoice.taxRate) / 2}%)
                          </td>
                          <td className="py-1 text-right text-sm text-zinc-800 dark:text-zinc-200">
                            {money(invoice.cgstAmount)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={showHsn ? 4 : 3} className="py-1 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                            SGST ({(invoice.taxRate) / 2}%)
                          </td>
                          <td className="py-1 text-right text-sm text-zinc-800 dark:text-zinc-200">
                            {money(invoice.sgstAmount)}
                          </td>
                        </tr>
                      </>
                    ) : invoice.gstEnabled && invoice.taxType === "INTER_STATE" ? (
                      <tr>
                        <td colSpan={showHsn ? 4 : 3} className="py-1 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                          IGST ({invoice.taxRate}%)
                        </td>
                        <td className="py-1 text-right text-sm text-zinc-800 dark:text-zinc-200">
                          {money(invoice.igstAmount)}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={showHsn ? 4 : 3} className="py-1 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                          Tax ({invoice.taxRate}%)
                        </td>
                        <td className="py-1 text-right text-sm text-zinc-800 dark:text-zinc-200">{money(invoice.tax)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={showHsn ? 4 : 3} className="py-3 pr-4 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Total
                      </td>
                      <td className="py-3 text-right text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {money(invoice.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billed to</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-700 dark:text-zinc-300">
              <Link href={`/clients/${invoice.client.id}`} className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
                {invoice.client.name}
              </Link>
              {invoice.client.company ? <p>{invoice.client.company}</p> : null}
              <p>{invoice.client.email}</p>
              {invoice.client.phone ? <p>{invoice.client.phone}</p> : null}
              {invoice.client.gstin ? <p className="font-medium">GSTIN: {invoice.client.gstin}</p> : null}
              {invoice.client.state ? <p>Place of Supply: {getStateDisplayName(invoice.client.state)}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Payments</CardTitle>
              <Link href="/payments">
                <Button variant="ghost" size="sm">All payments</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Total
                  </div>
                  <div className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">{money(invoice.total)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Received
                  </div>
                  <div className="mt-1 text-base font-semibold text-emerald-700 dark:text-emerald-400">{money(paid)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Balance
                  </div>
                  <div className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">{money(balance)}</div>
                </div>
              </div>

              {invoice.payments.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Payment history
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-lg border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
                    {invoice.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-4 p-3.5 text-sm bg-white dark:bg-zinc-900/40 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{money(payment.amount)}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {formatDate(payment.paymentDate, undefined, settings.locale)} ·{" "}
                            {PAYMENT_METHOD_LABELS[payment.method as PaymentMethod] ?? payment.method}
                            {payment.reference ? ` · Ref: ${payment.reference}` : ""}
                          </div>
                        </div>
                        {payment.notes ? (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate text-right">
                            {payment.notes}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No payments recorded yet.</p>
              )}

              {balance > 0 ? (
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                    Record payment
                  </h3>
                  <PaymentForm
                    invoiceId={invoice.id}
                    balance={balance}
                    currency={settings.currency}
                    locale={settings.locale}
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3.5 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>This invoice is paid in full. Thank you!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {balance > 0 ? (
            <InvoiceRemindersCard
              invoiceId={invoice.id}
              invoiceNumber={invoice.number}
              remindersPaused={invoice.remindersPaused}
              balanceDue={balance}
              dueDate={invoice.dueDate}
              clientEmail={invoice.client.email}
              clientPhone={invoice.client.phone}
              clientName={invoice.client.name}
              businessName={settings.businessName}
              currency={settings.currency}
              locale={settings.locale}
              shareUrl={shareUrl}
              paymentUrl={invoice.razorpayPaymentLinkUrl}
              reminderLogs={reminderLogs}
            />
          ) : null}

          {invoice.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {invoice.notes}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {status !== "PAID" ? (
                <form action={setInvoiceStatus}>
                  <input type="hidden" name="id" value={invoice.id} />
                  <input type="hidden" name="status" value="SENT" />
                  <Button type="submit" className="w-full">Mark as sent</Button>
                </form>
              ) : null}
              {status !== "DRAFT" && status !== "PAID" ? (
                <form action={setInvoiceStatus}>
                  <input type="hidden" name="id" value={invoice.id} />
                  <input type="hidden" name="status" value="PAID" />
                  <Button type="submit" variant="outline" className="w-full">Mark as paid</Button>
                </form>
              ) : null}
              <form action={sendInvoiceEmailAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <Button type="submit" variant="outline" className="w-full">
                  Send invoice email
                </Button>
              </form>
              <div className="flex justify-center -mt-1">
                <a
                  href={mailtoUrl}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors py-0.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>Open in Mail App (backup)</span>
                </a>
              </div>
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
            </CardContent>
          </Card>

          <InvoicePaymentShareCard
            invoiceId={invoice.id}
            invoiceNumber={invoice.number}
            total={invoice.total}
            balance={balance}
            currency={settings.currency}
            locale={settings.locale}
            businessName={settings.businessName}
            dueDate={invoice.dueDate}
            clientName={invoice.client.name}
            clientPhone={invoice.client.phone}
            clientEmail={invoice.client.email}
            shareUrl={shareUrl}
            razorpayPaymentLinkUrl={invoice.razorpayPaymentLinkUrl}
            qrDataUrl={qr.dataUrl}
            qrLabel={qr.label}
            upiAddress={settings.qrUpiId || settings.qrVpa}
            mailtoUrl={mailtoUrl}
          />
        </div>
      </div>
    </div>
  );
}
