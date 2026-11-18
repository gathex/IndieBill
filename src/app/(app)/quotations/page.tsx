import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserQuotations, effectiveQuotationStatus } from "@/lib/quotations";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getUserSettings } from "@/lib/users";
import { QuotationStatusBadge } from "@/components/quotation-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  setQuotationStatus,
  deleteQuotation,
  sendQuotationEmailAction,
} from "@/actions/quotations";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Notice } from "@/components/notice";

const statusFilters = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CONVERTED", label: "Converted" },
];

function filterHref(status: string | undefined, q: string, value: string) {
  const params = new URLSearchParams();
  if (value !== "ALL") params.set("status", value);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/quotations?${query}` : "/quotations";
}

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; notice?: string }>;
}) {
  const { status, q = "", notice } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [quotations, settings] = await Promise.all([
    getUserQuotations(userId),
    getUserSettings(userId),
  ]);
  const money = (amount: number) =>
    formatCurrency(amount, settings.currency, settings.locale);

  const query = q.trim().toLowerCase();
  const filtered = quotations.filter((quotation) => {
    const statusMatches =
      !status ||
      status === "ALL" ||
      effectiveQuotationStatus(quotation.status, quotation.validUntil) === status;
    const queryMatches =
      !query ||
      quotation.number.toLowerCase().includes(query) ||
      quotation.client.name.toLowerCase().includes(query) ||
      quotation.client.email.toLowerCase().includes(query) ||
      quotation.items.some((item) => item.description.toLowerCase().includes(query));
    return statusMatches && queryMatches;
  });

  return (
    <div className="space-y-6">
      <Notice notice={notice} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Quotations</h1>
        <Link href="/quotations/new">
          <Button>New quotation</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Link key={filter.value} href={filterHref(status, q, filter.value)}>
                  <Badge
                    variant={
                      status === filter.value || (!status && filter.value === "ALL")
                        ? "default"
                        : "secondary"
                    }
                    className="cursor-pointer rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {filter.label}
                  </Badge>
                </Link>
              ))}
            </div>
            <form className="w-full max-w-xs" action="/quotations" method="get">
              {status && status !== "ALL" ? (
                <input type="hidden" name="status" value={status} />
              ) : null}
              <Input name="q" defaultValue={q} placeholder="Search quotations…" />
            </form>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No quotations found.{" "}
              <Link
                href="/quotations/new"
                className="font-medium text-zinc-900 underline-offset-4 hover:underline"
              >
                Create a quotation
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
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((quotation) => {
                    const quotationStatus = effectiveQuotationStatus(
                      quotation.status,
                      quotation.validUntil,
                    );
                    return (
                      <tr key={quotation.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium text-zinc-900">
                          <Link href={`/quotations/${quotation.id}`} className="hover:underline">
                            {quotation.number}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-zinc-700">
                          <Link href={`/clients/${quotation.client.id}`} className="hover:underline">
                            {quotation.client.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-zinc-600">{formatDate(quotation.issueDate, undefined, settings.locale)}</td>
                        <td className="py-3 pr-4 text-zinc-600">{formatDate(quotation.validUntil, undefined, settings.locale)}</td>
                        <td className="py-3 pr-4 text-right font-medium text-zinc-900">
                          {money(quotation.total)}
                        </td>
                        <td className="py-3 pr-4">
                          <QuotationStatusBadge status={quotationStatus} />
                        </td>
                        <td className="py-3">
                          <div className="flex justify-end gap-1">
                            <Link href={`/quotations/${quotation.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                            <Link href={`/quotations/${quotation.id}/preview`}>
                              <Button variant="ghost" size="sm">Preview</Button>
                            </Link>
                            {quotation.status !== "CONVERTED" ? (
                              <>
                                <Link href={`/quotations/${quotation.id}/edit`}>
                                  <Button variant="ghost" size="sm">Edit</Button>
                                </Link>
                                {quotation.status === "DRAFT" ? (
                                  <form action={setQuotationStatus}>
                                    <input type="hidden" name="id" value={quotation.id} />
                                    <input type="hidden" name="status" value="SENT" />
                                    <Button variant="outline" size="sm" type="submit">Send</Button>
                                  </form>
                                ) : null}
                                {quotationStatus === "SENT" ? (
                                  <form action={setQuotationStatus}>
                                    <input type="hidden" name="id" value={quotation.id} />
                                    <input type="hidden" name="status" value="ACCEPTED" />
                                    <Button variant="outline" size="sm" type="submit">Accept</Button>
                                  </form>
                                ) : null}
                              </>
                            ) : null}
                            <form action={sendQuotationEmailAction}>
                              <input type="hidden" name="id" value={quotation.id} />
                              <Button variant="outline" size="sm" type="submit">Email</Button>
                            </form>
                            <form action={deleteQuotation}>
                              <input type="hidden" name="id" value={quotation.id} />
                              <ConfirmSubmitButton
                                type="submit"
                                variant="danger"
                                size="sm"
                                confirmMessage={`Delete quotation ${quotation.number}?`}
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
