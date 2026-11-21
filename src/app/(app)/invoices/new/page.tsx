import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserClients } from "@/lib/clients";
import { getUserSettings } from "@/lib/users";
import { getUserCatalogItems } from "@/lib/catalog";
import { InvoiceFormClient } from "@/components/invoice-form";

export default async function NewInvoicePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [clients, settings, catalogItems] = await Promise.all([
    getUserClients(userId),
    getUserSettings(userId),
    getUserCatalogItems(userId, { activeOnly: true }),
  ]);
  if (clients.length === 0) redirect("/clients/new?next=/invoices/new");

  const serializedCatalogItems = catalogItems.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    rate: item.rate,
    unit: item.unit,
    hsnSac: item.hsnSac,
    defaultTaxRate: item.defaultTaxRate,
    isActive: item.isActive,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">New invoice</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Fill in the details below. Totals are calculated automatically.
        </p>
      </div>
      <InvoiceFormClient
        clients={clients}
        currency={settings.currency}
        locale={settings.locale}
        businessState={settings.state}
        businessGstin={settings.gstin}
        catalogItems={serializedCatalogItems}
      />
    </div>
  );
}
