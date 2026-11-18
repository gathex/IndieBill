import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserInvoices, effectiveStatus } from "@/lib/invoices";
import { getInvoiceBalance, sumPayments } from "@/lib/payments";
import { getUserQuotations, effectiveQuotationStatus } from "@/lib/quotations";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getUserSettings } from "@/lib/users";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { QuotationStatusBadge } from "@/components/quotation-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [invoices, quotations, settings] = await Promise.all([
    getUserInvoices(userId),
    getUserQuotations(userId),
    getUserSettings(userId),
  ]);
  const money = (amount: number) => formatCurrency(amount, settings.currency);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let outstanding = 0;
  let outstandingCount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let paidThisMonth = 0;

  for (const invoice of invoices) {
    const status = effectiveStatus(invoice.status, invoice.dueDate);
    const balance = getInvoiceBalance(invoice.total, invoice.payments);
    paidThisMonth += sumPayments(
      invoice.payments.filter((payment) => payment.paymentDate >= monthStart),
    );

    if (status === "PAID" || status === "DRAFT") continue;
    outstanding += balance;
    outstandingCount += 1;
    if (status === "OVERDUE") {
      overdueCount += 1;
      overdueAmount += balance;
    }
  }

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Welcome back, {settings.displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Here&apos;s what&apos;s happening with your invoices.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/new">
            <Button>New invoice</Button>
          </Link>
          <Link href="/payments">
            <Button variant="outline">Payments</Button>
          </Link>
          <Link href="/quotations/new">
            <Button variant="outline">New quotation</Button>
          </Link>
          <Link href="/clients/new">
            <Button variant="outline">Add client</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{money(outstanding)}</div>
            <p className="mt-1 text-xs text-zinc-500">{outstandingCount} open invoice(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Received this month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{money(paidThisMonth)}</div>
            <p className="mt-1 text-xs text-zinc-500">Payments recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{money(overdueAmount)}</div>
            <p className="mt-1 text-xs text-zinc-500">{overdueCount} overdue invoice(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {invoices.filter((invoice) => invoice.status === "DRAFT").length}
            </div>
            <p className="mt-1 text-xs text-zinc-500">Awaiting send</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Recent invoices</CardTitle>
          <Link href="/invoices">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No invoices yet.{" "}
              <Link href="/invoices/new" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
                Create your first invoice
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-2 pr-4 font-medium">Number</th>
                    <th className="py-2 pr-4 font-medium">Client</th>
                    <th className="py-2 pr-4 font-medium">Issued</th>
                    <th className="py-2 pr-4 font-medium">Due</th>
                    <th className="py-2 pr-4 font-medium text-right">Total</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-900">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                          {invoice.number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-zinc-700">{invoice.client?.name ?? "—"}</td>
                      <td className="py-3 pr-4 text-zinc-600">{formatDate(invoice.issueDate)}</td>
                      <td className="py-3 pr-4 text-zinc-600">{formatDate(invoice.dueDate)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-zinc-900">
                        {money(invoice.total)}
                      </td>
                      <td className="py-3">
                        <InvoiceStatusBadge status={effectiveStatus(invoice.status, invoice.dueDate)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Recent quotations</CardTitle>
          <Link href="/quotations">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No quotations yet.{" "}
              <Link href="/quotations/new" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
                Create your first quotation
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-2 pr-4 font-medium">Number</th>
                    <th className="py-2 pr-4 font-medium">Client</th>
                    <th className="py-2 pr-4 font-medium">Issued</th>
                    <th className="py-2 pr-4 font-medium">Valid until</th>
                    <th className="py-2 pr-4 font-medium text-right">Total</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.slice(0, 5).map((quotation) => (
                    <tr key={quotation.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-900">
                        <Link href={`/quotations/${quotation.id}`} className="hover:underline">
                          {quotation.number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-zinc-700">{quotation.client?.name ?? "—"}</td>
                      <td className="py-3 pr-4 text-zinc-600">{formatDate(quotation.issueDate)}</td>
                      <td className="py-3 pr-4 text-zinc-600">{formatDate(quotation.validUntil)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-zinc-900">
                        {money(quotation.total)}
                      </td>
                      <td className="py-3">
                        <QuotationStatusBadge
                          status={effectiveQuotationStatus(quotation.status, quotation.validUntil)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
