import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getInvoiceById } from "@/lib/invoices";
import { getUserClients } from "@/lib/clients";
import { getUserSettings } from "@/lib/users";
import { InvoiceFormClient, type InvoiceFormInvoice } from "@/components/invoice-form";

export default async function InvoiceEditPage({
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

  const invoice = await getInvoiceById(id, userId);
  if (!invoice) {
    notFound();
  }

  const [clients, settings] = await Promise.all([
    getUserClients(userId),
    getUserSettings(userId),
  ]);

  const formInvoice: InvoiceFormInvoice = {
    id: invoice.id,
    clientId: invoice.clientId,
    status: invoice.status,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : "",
    notes: invoice.notes ?? "",
    discountPercent: invoice.discountPercent,
    taxRate: invoice.taxRate,
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    })),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Edit invoice {invoice.number}
      </h1>
      <InvoiceFormClient
        clients={clients}
        invoice={formInvoice}
        currency={settings.currency}
        locale={settings.locale}
      />
    </div>
  );
}
