import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ClientFormClient } from "@/components/client-form";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }
  const client = await prisma.client.findFirst({ where: { id, userId } });
  if (!client) {
    notFound();
  }
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Edit client</h1>
      <ClientFormClient
        client={{
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company,
          phone: client.phone,
          notes: client.notes,
          gstin: client.gstin,
          state: client.state,
        }}
      />
    </div>
  );
}
