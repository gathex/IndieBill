import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import {
  getQuotationById,
  effectiveQuotationStatus,
  computeQuotationTotals,
} from "@/lib/quotations";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getUserSettings } from "@/lib/users";
import { getStateDisplayName } from "@/lib/gst";
import { QuotationStatusBadge } from "@/components/quotation-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  setQuotationStatus,
  deleteQuotation,
  sendQuotationEmailAction,
} from "@/actions/quotations";
import { QuotationPdfDownload } from "@/components/quotation-pdf-download";
import type { QuotationPdfData } from "@/components/quotation-document";
import { ConvertQuotationButton } from "@/components/convert-quotation-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Notice } from "@/components/notice";

export default async function QuotationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const quotation = await getQuotationById(id, userId);
  if (!quotation) notFound();

  const settings = await getUserSettings(userId);
  const money = (amount: number) =>
    formatCurrency(amount, settings.currency, settings.locale);
  const status = effectiveQuotationStatus(quotation.status, quotation.validUntil);
  const discount = computeQuotationTotals({
    subtotal: quotation.subtotal,
    discountPercent: quotation.discountPercent,
    taxRate: quotation.taxRate,
  }).discount;

  const pdfData: QuotationPdfData = {
    id: quotation.id,
    number: quotation.number,
    status: quotation.status,
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

  const showHsn = Boolean(quotation.gstEnabled || quotation.items.some((i) => i.hsnSac));

  return (
    <div className="space-y-6">
      <Notice notice={notice} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/quotations" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50">
            ← All quotations
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Quotation {quotation.number}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <QuotationStatusBadge status={status} />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Issued {formatDate(quotation.issueDate, undefined, settings.locale)} · Valid until{" "}
              {formatDate(quotation.validUntil, undefined, settings.locale)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/quotations/${quotation.id}/preview`}>
            <Button variant="outline">Preview A4</Button>
          </Link>
          {quotation.status !== "CONVERTED" ? (
            <Link href={`/quotations/${quotation.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          ) : null}
          <form action={deleteQuotation}>
            <input type="hidden" name="id" value={quotation.id} />
            <ConfirmSubmitButton
              type="submit"
              variant="danger"
              size="sm"
              confirmMessage="Delete this quotation? This cannot be undone."
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
                    {quotation.items.map((item) => (
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
                      <td className="py-2 text-right text-sm text-zinc-800 dark:text-zinc-200">{money(quotation.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={showHsn ? 4 : 3} className="py-1 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                        Discount ({quotation.discountPercent}%)
                      </td>
                      <td className="py-1 text-right text-sm text-zinc-800 dark:text-zinc-200">-{money(discount)}</td>
                    </tr>
                    {quotation.gstEnabled && quotation.taxType === "INTRA_STATE" ? (
                      <>
                        <tr>
                          <td colSpan={showHsn ? 4 : 3} className="py-1 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                            CGST ({(quotation.taxRate) / 2}%)
                          </td>
                          <td className="py-1 text-right text-sm text-zinc-800 dark:text-zinc-200">
                            {money(quotation.cgstAmount)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={showHsn ? 4 : 3} className="py-1 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                            SGST ({(quotation.taxRate) / 2}%)
                          </td>
                          <td className="py-1 text-right text-sm text-zinc-800 dark:text-zinc-200">
                            {money(quotation.sgstAmount)}
                          </td>
                        </tr>
                      </>
                    ) : quotation.gstEnabled && quotation.taxType === "INTER_STATE" ? (
                      <tr>
                        <td colSpan={showHsn ? 4 : 3} className="py-1 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                          IGST ({quotation.taxRate}%)
                        </td>
                        <td className="py-1 text-right text-sm text-zinc-800 dark:text-zinc-200">
                          {money(quotation.igstAmount)}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={showHsn ? 4 : 3} className="py-1 pr-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                          Tax ({quotation.taxRate}%)
                        </td>
                        <td className="py-1 text-right text-sm text-zinc-800 dark:text-zinc-200">{money(quotation.tax)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={showHsn ? 4 : 3} className="py-3 pr-4 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Total
                      </td>
                      <td className="py-3 text-right text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {money(quotation.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prepared for</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-700 dark:text-zinc-300">
              <Link href={`/clients/${quotation.client.id}`} className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
                {quotation.client.name}
              </Link>
              {quotation.client.company ? <p>{quotation.client.company}</p> : null}
              <p>{quotation.client.email}</p>
              {quotation.client.phone ? <p>{quotation.client.phone}</p> : null}
              {quotation.client.gstin ? <p className="font-medium">GSTIN: {quotation.client.gstin}</p> : null}
              {quotation.client.state ? <p>Place of Supply: {getStateDisplayName(quotation.client.state)}</p> : null}
            </CardContent>
          </Card>

          {quotation.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {quotation.notes}
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
              {status === "DRAFT" ? (
                <form action={setQuotationStatus}>
                  <input type="hidden" name="id" value={quotation.id} />
                  <input type="hidden" name="status" value="SENT" />
                  <Button type="submit" className="w-full">Mark as sent</Button>
                </form>
              ) : null}
              {status === "SENT" ? (
                <>
                  <form action={setQuotationStatus}>
                    <input type="hidden" name="id" value={quotation.id} />
                    <input type="hidden" name="status" value="ACCEPTED" />
                    <Button type="submit" className="w-full">Mark as accepted</Button>
                  </form>
                  <form action={setQuotationStatus}>
                    <input type="hidden" name="id" value={quotation.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <Button type="submit" variant="outline" className="w-full">
                      Mark as rejected
                    </Button>
                  </form>
                </>
              ) : null}
              <form action={sendQuotationEmailAction}>
                <input type="hidden" name="id" value={quotation.id} />
                <Button type="submit" variant="outline" className="w-full">
                  Send quotation email
                </Button>
              </form>
              <QuotationPdfDownload
                quotation={pdfData}
                businessName={settings.businessName}
                businessAddress={settings.businessAddress}
                businessGstin={settings.gstin}
                currency={settings.currency}
                locale={settings.locale}
                logoDataUrl={settings.logoDataUrl}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Convert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quotation.status === "CONVERTED" && quotation.convertedInvoiceId ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Converted to invoice{" "}
                  <Link
                    href={`/invoices/${quotation.convertedInvoiceId}`}
                    className="font-medium text-zinc-900 dark:text-zinc-100 underline"
                  >
                    View invoice
                  </Link>
                  .
                </p>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Create a draft invoice from this quotation&apos;s items and totals.
                </p>
              )}
              <ConvertQuotationButton
                quotationId={quotation.id}
                convertedInvoiceId={quotation.convertedInvoiceId}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
