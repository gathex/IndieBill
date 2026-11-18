import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { getUserSettings } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { deleteClient } from "@/actions/clients";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [clients, settings] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      include: { invoices: { select: { total: true, status: true, dueDate: true } } },
      orderBy: { name: "asc" },
    }),
    getUserSettings(userId),
  ]);
  const money = (amount: number) => formatCurrency(amount, settings.currency);

  const query = q.trim().toLowerCase();
  const filtered = clients.filter(
    (client) =>
      !query ||
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      (client.company ?? "").toLowerCase().includes(query),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Clients</h1>
        <Link href="/clients/new">
          <Button>Add client</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form action="/clients" method="get" className="w-full max-w-xs">
            <Input name="q" defaultValue={q} placeholder="Search clients…" />
          </form>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No clients found.{" "}
              <Link href="/clients/new" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
                Add a client
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Company</th>
                    <th className="py-2 pr-4 font-medium">Invoices</th>
                    <th className="py-2 pr-4 font-medium text-right">Total billed</th>
                    <th className="py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-900">
                        <Link href={`/clients/${client.id}`} className="hover:underline">
                          {client.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-zinc-600">{client.email}</td>
                      <td className="py-3 pr-4 text-zinc-600">{client.company ?? "—"}</td>
                      <td className="py-3 pr-4 text-zinc-600">{client.invoices.length}</td>
                      <td className="py-3 pr-4 text-right font-medium text-zinc-900">
                        {money(client.invoices.reduce((sum, inv) => sum + inv.total, 0))}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          <Link href={`/clients/${client.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Link href={`/clients/${client.id}/edit`}>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </Link>
                          <form action={deleteClient}>
                            <input type="hidden" name="id" value={client.id} />
                            <ConfirmSubmitButton
                              type="submit"
                              variant="danger"
                              size="sm"
                              confirmMessage={`Delete ${client.name}? Invoices must be deleted first.`}
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        </div>
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
