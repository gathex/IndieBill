import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserClients } from "@/lib/clients";
import { getUserSettings } from "@/lib/users";
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
  const [clients, settings] = await Promise.all([
    getUserClients(userId),
    getUserSettings(userId),
  ]);
  if (clients.length === 0) redirect("/clients/new?next=/quotations/new");
  const defaultClientId = clients.some((client) => client.id === clientId) ? clientId : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">New quotation</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Fill in the details below. Totals are calculated automatically.
        </p>
      </div>
      <QuotationFormClient
        clients={clients}
        currency={settings.currency}
        defaultClientId={defaultClientId}
      />
    </div>
  );
}
