import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppNavbar } from "@/components/app-navbar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppNavbar user={session?.user} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
