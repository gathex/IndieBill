import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserClients } from "@/lib/clients";
import { getUserSettings } from "@/lib/users";
import { InvoiceFormClient } from "@/components/invoice-form";

export default async function NewInvoicePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [clients, settings] = await Promise.all([
    getUserClients(userId),
    getUserSettings(userId),
  ]);
  if (clients.length === 0) redirect("/clients/new?next=/invoices/new");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">New invoice</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Fill in the details below. Totals are calculated automatically.
        </p>
      </div>
      <InvoiceFormClient clients={clients} currency={settings.currency} />
    </div>
  );
}
