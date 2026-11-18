import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ClientFormClient } from "@/components/client-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Add client</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Add a client now, then use them on your invoices.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <ClientFormClient next={safeNext} />
        </CardContent>
      </Card>
    </div>
  );
}
