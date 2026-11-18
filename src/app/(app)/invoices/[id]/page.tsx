import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getInvoiceById, effectiveStatus, computeInvoiceTotals } from "@/lib/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getUserSettings } from "@/lib/users";
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
import { CreatePaymentLinkButton } from "@/components/payment-link-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Notice } from "@/components/notice";

export default async function InvoiceDetailPage({
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

  const invoice = await getInvoiceById(id, userId);
  if (!invoice) notFound();

  const settings = await getUserSettings(userId);
  const money = (amount: number) => formatCurrency(amount, settings.currency);
  const status = effectiveStatus(invoice.status, invoice.dueDate);
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
    })),
  };

  return (
    <div className="space-y-6">
      <Notice notice={notice} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/invoices" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← All invoices
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            Invoice {invoice.number}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <InvoiceStatusBadge status={status} />
            <span className="text-sm text-zinc-500">
              Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
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
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500">
                      <th className="py-2 pr-4 font-medium">Description</th>
                      <th className="py-2 pr-4 font-medium text-right">Qty</th>
                      <th className="py-2 pr-4 font-medium text-right">Rate</th>
                      <th className="py-2 pr-4 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-zinc-800">{item.description}</td>
                        <td className="py-3 pr-4 text-right text-zinc-600">{item.quantity}</td>
                        <td className="py-3 pr-4 text-right text-zinc-600">{money(item.rate)}</td>
                        <td className="py-3 pr-4 text-right font-medium text-zinc-900">
                          {money(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t">
                    <tr>
                      <td colSpan={3} className="py-2 pr-4 text-right text-sm text-zinc-600">
                        Subtotal
                      </td>
                      <td className="py-2 text-right text-sm text-zinc-800">{money(invoice.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-1 pr-4 text-right text-sm text-zinc-600">
                        Discount ({invoice.discountPercent}%)
                      </td>
                      <td className="py-1 text-right text-sm text-zinc-800">-{money(discount)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-1 pr-4 text-right text-sm text-zinc-600">
                        Tax ({invoice.taxRate}%)
                      </td>
                      <td className="py-1 text-right text-sm text-zinc-800">{money(invoice.tax)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-3 pr-4 text-right text-sm font-semibold text-zinc-900">
                        Total
                      </td>
                      <td className="py-3 text-right text-lg font-bold text-zinc-900">
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
            <CardContent className="text-sm text-zinc-700">
              <Link href={`/clients/${invoice.client.id}`} className="font-medium text-zinc-900 hover:underline">
                {invoice.client.name}
              </Link>
              {invoice.client.company ? <p>{invoice.client.company}</p> : null}
              <p>{invoice.client.email}</p>
              {invoice.client.phone ? <p>{invoice.client.phone}</p> : null}
            </CardContent>
          </Card>

          {invoice.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-zinc-700">
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
              <InvoicePdfDownload
                invoice={pdfData}
                businessName={settings.businessName}
                businessAddress={settings.businessAddress}
                currency={settings.currency}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.paymentLink ? (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-600">Share this link with your client:</p>
                  <a
                    href={invoice.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all text-sm text-zinc-900 underline"
                  >
                    {invoice.paymentLink}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  No payment link yet. Create one to let your client pay online.
                </p>
              )}
              <CreatePaymentLinkButton invoiceId={invoice.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
