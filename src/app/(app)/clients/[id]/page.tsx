import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { effectiveStatus } from "@/lib/invoices";
import { effectiveQuotationStatus } from "@/lib/quotations";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { QuotationStatusBadge } from "@/components/quotation-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: {
      invoices: { orderBy: { issueDate: "desc" } },
      quotations: { orderBy: { issueDate: "desc" } },
    },
  });
  if (!client) notFound();

  const totalBilled = client.invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const outstanding = client.invoices
    .filter((invoice) => effectiveStatus(invoice.status, invoice.dueDate) !== "PAID")
    .reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/clients" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← All clients
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            {client.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {client.email}
            {client.company ? ` · ${client.company}` : ""}
            {client.phone ? ` · ${client.phone}` : ""}
          </p>
        </div>
        <Link href={`/clients/${client.id}/edit`}>
          <Button variant="outline">Edit client</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total billed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-zinc-900">
            {formatCurrency(totalBilled)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-zinc-900">
            {formatCurrency(outstanding)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-zinc-900">
            {client.invoices.length}
          </CardContent>
        </Card>
      </div>

      {client.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-zinc-700">
            {client.notes}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {client.invoices.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              No invoices for this client yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-2 pr-4 font-medium">Number</th>
                    <th className="py-2 pr-4 font-medium">Issued</th>
                    <th className="py-2 pr-4 font-medium">Due</th>
                    <th className="py-2 pr-4 font-medium text-right">Total</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {client.invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-900">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                          {invoice.number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-zinc-600">{formatDate(invoice.issueDate)}</td>
                      <td className="py-3 pr-4 text-zinc-600">{formatDate(invoice.dueDate)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-zinc-900">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="py-3">
                        <InvoiceStatusBadge
                          status={effectiveStatus(invoice.status, invoice.dueDate)}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Quotations</CardTitle>
          <Link href={`/quotations/new?clientId=${client.id}`}>
            <Button variant="ghost" size="sm">New quotation</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {client.quotations.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              No quotations for this client yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-2 pr-4 font-medium">Number</th>
                    <th className="py-2 pr-4 font-medium">Issued</th>
                    <th className="py-2 pr-4 font-medium">Valid until</th>
                    <th className="py-2 pr-4 font-medium text-right">Total</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {client.quotations.map((quotation) => (
                    <tr key={quotation.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-900">
                        <Link href={`/quotations/${quotation.id}`} className="hover:underline">
                          {quotation.number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-zinc-600">{formatDate(quotation.issueDate)}</td>
                      <td className="py-3 pr-4 text-zinc-600">{formatDate(quotation.validUntil)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-zinc-900">
                        {formatCurrency(quotation.total)}
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
