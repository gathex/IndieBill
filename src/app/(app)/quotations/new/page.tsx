import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserClients } from "@/lib/clients";
import { getUserSettings } from "@/lib/users";
import { getUserCatalogItems } from "@/lib/catalog";
import { QuotationFormClient } from "@/components/quotation-form";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const { clientId } = await searchParams;
  const [clients, settings, catalogItems] = await Promise.all([
    getUserClients(userId),
    getUserSettings(userId),
    getUserCatalogItems(userId, { activeOnly: true }),
  ]);
  if (clients.length === 0) redirect("/clients/new?next=/quotations/new");
  const defaultClientId = clients.some((client) => client.id === clientId) ? clientId : undefined;

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
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">New quotation</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Fill in the details below. Totals are calculated automatically.
        </p>
      </div>
      <QuotationFormClient
        clients={clients}
        currency={settings.currency}
        locale={settings.locale}
        businessState={settings.state}
        businessGstin={settings.gstin}
        defaultClientId={defaultClientId}
        catalogItems={serializedCatalogItems}
      />
    </div>
  );
}
