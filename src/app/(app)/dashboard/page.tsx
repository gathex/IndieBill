import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserInvoices, effectiveStatus } from "@/lib/invoices";
import { getInvoiceBalance } from "@/lib/payments";
import { getUserQuotations, effectiveQuotationStatus } from "@/lib/quotations";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getUserSettings } from "@/lib/users";
import { getUserFinancialReport } from "@/lib/expenses";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { QuotationStatusBadge } from "@/components/quotation-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [invoices, quotations, settings, financials] = await Promise.all([
    getUserInvoices(userId),
    getUserQuotations(userId),
    getUserSettings(userId),
    getUserFinancialReport(userId, 6),
  ]);
  const money = (amount: number) =>
    formatCurrency(amount, settings.currency, settings.locale);

  let outstanding = 0;
  let outstandingCount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;

  for (const invoice of invoices) {
    const status = effectiveStatus(invoice.status, invoice.dueDate);
    const balance = getInvoiceBalance(invoice.total, invoice.payments);

    if (status === "PAID" || status === "DRAFT") continue;
    outstanding += balance;
    outstandingCount += 1;
    if (status === "OVERDUE") {
      overdueCount += 1;
      overdueAmount += balance;
    }
  }

  const recentInvoices = invoices.slice(0, 5);
  const maxFinancialValue = Math.max(
    ...financials.monthlyBreakdown.flatMap((m) => [m.income, m.expenses]),
    100
  );

  return (
    <div className="space-y-8">
      {/* Welcome header & quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Welcome back, {settings.displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Here&apos;s an overview of your invoices, payments, and net profitability.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/invoices/new">
            <Button>New invoice</Button>
          </Link>
          <Link href="/payments">
            <Button variant="outline">Payments</Button>
          </Link>
          <Link href="/expenses">
            <Button variant="outline">Expenses</Button>
          </Link>
          <Link href="/quotations/new">
            <Button variant="outline">New quotation</Button>
          </Link>
          <Link href="/clients/new">
            <Button variant="outline">Add client</Button>
          </Link>
        </div>
      </div>

      {/* Primary Financial & Operational Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Net Profit */}
        <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-400 animate-page-in [animation-delay:0ms]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Net Profit
              </CardTitle>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${financials.netProfit >= 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                  }`}
              >
                {financials.netProfit >= 0 ? "+" : ""}
                {financials.profitMarginPercent}% margin
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold tracking-tight ${financials.netProfit >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
                }`}
            >
              {money(financials.netProfit)}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {financials.thisMonthNetProfit >= 0 ? "+" : ""}
              {money(financials.thisMonthNetProfit)} net this month
            </p>
          </CardContent>
        </Card>

        {/* Total Received Income */}
        <Card className="animate-page-in [animation-delay:40ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total Received Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {money(financials.totalIncome)}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {money(financials.thisMonthIncome)} collected this month
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="animate-page-in [animation-delay:80ms]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total Expenses
              </CardTitle>
              <Link
                href="/expenses"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View details →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {money(financials.totalExpenses)}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {money(financials.thisMonthExpenses)} spent this month
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Invoices */}
        <Card className="animate-page-in [animation-delay:120ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Outstanding Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {money(outstanding)}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {outstandingCount} open invoice(s)
            </p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="animate-page-in [animation-delay:160ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {money(overdueAmount)}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {overdueCount} overdue invoice(s)
            </p>
          </CardContent>
        </Card>

        {/* Drafts */}
        <Card className="animate-page-in [animation-delay:200ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {invoices.filter((invoice) => invoice.status === "DRAFT").length}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Awaiting send
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses: 6-Month Comparison Breakdown */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Income vs Expenses
            </CardTitle>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Monthly cash flow and net profit performance over the last 6 months
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-rose-500" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Expenses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Net Profit</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Visual Bar Breakdown */}
          <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-52 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            {financials.monthlyBreakdown.map((m, idx) => {
              const incomeHeightPercent = Math.max(
                4,
                Math.round((m.income / maxFinancialValue) * 100)
              );
              const expenseHeightPercent = Math.max(
                4,
                Math.round((m.expenses / maxFinancialValue) * 100)
              );

              return (
                <div
                  key={m.monthKey}
                  className="flex flex-col items-center justify-end h-full gap-2 group"
                >
                  {/* Bars container */}
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-40">
                    {/* Income Bar */}
                    <div className="flex flex-col items-center flex-1 max-w-[28px] h-full justify-end">
                      <div
                        className="w-full rounded-t-sm bg-emerald-500 dark:bg-emerald-400/90 transition-all group-hover:brightness-110 animate-bar-grow origin-bottom"
                        style={{
                          height: `${incomeHeightPercent}%`,
                          animationDelay: `${idx * 40}ms`,
                        }}
                        title={`Income: ${money(m.income)}`}
                      />
                    </div>
                    {/* Expense Bar */}
                    <div className="flex flex-col items-center flex-1 max-w-[28px] h-full justify-end">
                      <div
                        className="w-full rounded-t-sm bg-rose-500 dark:bg-rose-400/90 transition-all group-hover:brightness-110 animate-bar-grow origin-bottom"
                        style={{
                          height: `${expenseHeightPercent}%`,
                          animationDelay: `${idx * 40 + 20}ms`,
                        }}
                        title={`Expenses: ${money(m.expenses)}`}
                      />
                    </div>
                  </div>

                  {/* Month Label */}
                  <div className="text-center">
                    <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {m.shortLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Metric Strip under the chart */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
            {financials.monthlyBreakdown.map((m) => (
              <div
                key={m.monthKey}
                className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-center"
              >
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {m.monthLabel}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>In:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {money(m.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Out:</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    {money(m.expenses)}
                  </span>
                </div>
                <div className="mt-1 pt-1 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-[11px] font-semibold">
                  <span>Net:</span>
                  <span
                    className={
                      m.netProfit >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {m.netProfit >= 0 ? "+" : ""}
                    {money(m.netProfit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Recent invoices</CardTitle>
          <Link href="/invoices">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No invoices yet.{" "}
              <Link href="/invoices/new" className="font-medium text-zinc-900 dark:text-zinc-100 underline-offset-4 hover:underline">
                Create your first invoice
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
                      <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                          {invoice.number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">{invoice.client?.name ?? "—"}</td>
                      <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{formatDate(invoice.issueDate, undefined, settings.locale)}</td>
                      <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{formatDate(invoice.dueDate, undefined, settings.locale)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
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
            <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No quotations yet.{" "}
              <Link href="/quotations/new" className="font-medium text-zinc-900 dark:text-zinc-100 underline-offset-4 hover:underline">
                Create your first quotation
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
                      <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                        <Link href={`/quotations/${quotation.id}`} className="hover:underline">
                          {quotation.number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">{quotation.client?.name ?? "—"}</td>
                      <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{formatDate(quotation.issueDate, undefined, settings.locale)}</td>
                      <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{formatDate(quotation.validUntil, undefined, settings.locale)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
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
