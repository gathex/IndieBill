import { redirect } from "next/navigation";

export default async function ShortInvoiceRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/share/invoices/${id}`);
}
