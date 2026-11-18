import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getQuotationById } from "@/lib/quotations";
import { getUserClients } from "@/lib/clients";
import { getUserSettings } from "@/lib/users";
import {
  QuotationFormClient,
  type QuotationFormQuotation,
} from "@/components/quotation-form";

export default async function QuotationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const quotation = await getQuotationById(id, userId);
  if (!quotation) {
    notFound();
  }

  const [clients, settings] = await Promise.all([
    getUserClients(userId),
    getUserSettings(userId),
  ]);

  const formQuotation: QuotationFormQuotation = {
    id: quotation.id,
    clientId: quotation.clientId,
    status: quotation.status,
    issueDate: quotation.issueDate.toISOString(),
    validUntil: quotation.validUntil ? quotation.validUntil.toISOString() : "",
    notes: quotation.notes ?? "",
    discountPercent: quotation.discountPercent,
    taxRate: quotation.taxRate,
    items: quotation.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    })),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Edit quotation {quotation.number}
      </h1>
      <QuotationFormClient
        clients={clients}
        quotation={formQuotation}
        currency={settings.currency}
        locale={settings.locale}
      />
    </div>
  );
}
