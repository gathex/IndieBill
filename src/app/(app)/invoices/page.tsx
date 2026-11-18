import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserInvoices, effectiveStatus } from "@/lib/invoices";
import { getInvoiceBalance } from "@/lib/payments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getUserSettings } from "@/lib/users";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  setInvoiceStatus,
  deleteInvoice,
  sendInvoiceEmailAction,
} from "@/actions/invoices";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Notice } from "@/components/notice";

const statusFilters = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
];

function filterHref(status: string | undefined, q: string, value: string) {
  const params = new URLSearchParams();
  if (value !== "ALL") params.set("status", value);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/invoices?${query}` : "/invoices";
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; notice?: string }>;
}) {
  const { status, q = "", notice } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [invoices, settings] = await Promise.all([
    getUserInvoices(userId),
    getUserSettings(userId),
  ]);
  const money = (amount: number) =>
    formatCurrency(amount, settings.currency, settings.locale);

  const query = q.trim().toLowerCase();
  const filtered = invoices.filter((invoice) => {
    const statusMatches =
      !status ||
      status === "ALL" ||
      effectiveStatus(invoice.status, invoice.dueDate) === status;
    const queryMatches =
      !query ||
      invoice.number.toLowerCase().includes(query) ||
      invoice.client.name.toLowerCase().includes(query) ||
      invoice.client.email.toLowerCase().includes(query) ||
      invoice.items.some((item) => item.description.toLowerCase().includes(query));
    return statusMatches && queryMatches;
  });

  return (
    <div className="space-y-6">
      <Notice notice={notice} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Invoices</h1>
        <Link href="/invoices/new">
          <Button>New invoice</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Link key={filter.value} href={filterHref(status, q, filter.value)}>
                  <Badge
                    variant={status === filter.value || (!status && filter.value === "ALL") ? "default" : "secondary"}
                    className="cursor-pointer rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {filter.label}
                  </Badge>
                </Link>
              ))}
            </div>
            <form className="w-full max-w-xs" action="/invoices" method="get">
              {status && status !== "ALL" ? (
                <input type="hidden" name="status" value={status} />
              ) : null}
              <Input name="q" defaultValue={q} placeholder="Search invoices…" />
            </form>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No invoices found.{" "}
              <Link href="/invoices/new" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
                Create an invoice
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
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((invoice) => {
                    const invoiceStatus = effectiveStatus(invoice.status, invoice.dueDate);
                    const balance = getInvoiceBalance(invoice.total, invoice.payments);
                    return (
                      <tr key={invoice.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium text-zinc-900">
                          <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                            {invoice.number}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-zinc-700">
                          <Link href={`/clients/${invoice.client.id}`} className="hover:underline">
                            {invoice.client.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-zinc-600">{formatDate(invoice.issueDate, undefined, settings.locale)}</td>
                        <td className="py-3 pr-4 text-zinc-600">{formatDate(invoice.dueDate, undefined, settings.locale)}</td>
                        <td className="py-3 pr-4 text-right font-medium text-zinc-900">
                          {money(invoice.total)}
                          {balance > 0 && balance < invoice.total ? (
                            <span className="mt-0.5 block text-xs font-normal text-amber-700">
                              {money(balance)} due
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">
                          <InvoiceStatusBadge status={invoiceStatus} />
                        </td>
                        <td className="py-3">
                          <div className="flex justify-end gap-1">
                            <Link href={`/invoices/${invoice.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                            <Link href={`/invoices/${invoice.id}/preview`}>
                              <Button variant="ghost" size="sm">Preview</Button>
                            </Link>
                            <Link href={`/invoices/${invoice.id}/edit`}>
                              <Button variant="ghost" size="sm">Edit</Button>
                            </Link>
                            {invoiceStatus !== "PAID" ? (
                              <form action={setInvoiceStatus}>
                                <input type="hidden" name="id" value={invoice.id} />
                                <input type="hidden" name="status" value="SENT" />
                                <Button variant="outline" size="sm" type="submit">Send</Button>
                              </form>
                            ) : null}
                            {invoiceStatus !== "DRAFT" && invoiceStatus !== "PAID" ? (
                              <form action={setInvoiceStatus}>
                                <input type="hidden" name="id" value={invoice.id} />
                                <input type="hidden" name="status" value="PAID" />
                                <Button variant="outline" size="sm" type="submit">Paid</Button>
                              </form>
                            ) : null}
                            <form action={sendInvoiceEmailAction}>
                              <input type="hidden" name="id" value={invoice.id} />
                              <Button variant="outline" size="sm" type="submit">Email</Button>
                            </form>
                            <form action={deleteInvoice}>
                              <input type="hidden" name="id" value={invoice.id} />
                              <ConfirmSubmitButton
                                type="submit"
                                variant="danger"
                                size="sm"
                                confirmMessage={`Delete invoice ${invoice.number}?`}
                              >
                                Delete
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
