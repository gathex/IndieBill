import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserSettings } from "@/lib/users";
import { getUserCatalogItems } from "@/lib/catalog";
import { CatalogManager } from "@/components/catalog-manager";

export default async function CatalogPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [items, settings] = await Promise.all([
    getUserCatalogItems(userId),
    getUserSettings(userId),
  ]);

  const serializedItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    rate: item.rate,
    unit: item.unit,
    hsnSac: item.hsnSac,
    defaultTaxRate: item.defaultTaxRate,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <CatalogManager
      initialItems={serializedItems}
      currency={settings.currency}
      locale={settings.locale}
    />
  );
}
