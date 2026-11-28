import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserSettings } from "@/lib/users";
import { getUserRecurringInvoices } from "@/lib/recurring";
import { getUserClients } from "@/lib/clients";
import { getUserCatalogItems } from "@/lib/catalog";
import {
  RecurringManager,
  type SerializedRecurringInvoice,
  type RecurringClient,
} from "@/components/recurring-manager";

export const metadata = {
  title: "Recurring Invoices",
};

export default async function RecurringPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [recurringData, clients, settings, catalogItems] = await Promise.all([
    getUserRecurringInvoices(userId),
    getUserClients(userId),
    getUserSettings(userId),
    getUserCatalogItems(userId),
  ]);

  const serializedSchedules: SerializedRecurringInvoice[] = recurringData.map(
    (schedule) => ({
      id: schedule.id,
      clientId: schedule.clientId,
      title: schedule.title,
      frequency: schedule.frequency as "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY",
      startDate: schedule.startDate.toISOString(),
      nextRunDate: schedule.nextRunDate.toISOString(),
      endDate: schedule.endDate ? schedule.endDate.toISOString() : null,
      dueInDays: schedule.dueInDays,
      autoSendEmail: schedule.autoSendEmail,
      status: schedule.status as "ACTIVE" | "PAUSED" | "COMPLETED",
      currency: schedule.currency,
      notes: schedule.notes,
      discount: schedule.discount,
      taxRate: schedule.taxRate,
      gstEnabled: schedule.gstEnabled,
      lastGeneratedAt: schedule.lastGeneratedAt
        ? schedule.lastGeneratedAt.toISOString()
        : null,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
      client: {
        id: schedule.client.id,
        name: schedule.client.name,
        email: schedule.client.email,
        company: schedule.client.company,
        gstin: schedule.client.gstin,
        state: schedule.client.state,
      },
      items: schedule.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        unit: item.unit,
        hsnSac: item.hsnSac,
      })),
      generatedInvoices: schedule.generatedInvoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        total: inv.total,
        status: inv.status,
        issueDate: inv.issueDate.toISOString(),
      })),
    }),
  );

  const serializedClients: RecurringClient[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    company: c.company,
    gstin: c.gstin,
    state: c.state,
  }));

  const serializedCatalogItems = catalogItems.map((item) => ({
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
    <RecurringManager
      initialSchedules={serializedSchedules}
      clients={serializedClients}
      catalogItems={serializedCatalogItems}
      currency={settings.currency}
      locale={settings.locale}
      businessState={settings.state}
      businessGstin={settings.gstin}
    />
  );
}
