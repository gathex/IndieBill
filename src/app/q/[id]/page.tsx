import { redirect } from "next/navigation";

export default async function ShortQuotationRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/share/quotations/${id}`);
}
