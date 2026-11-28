import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { logoutUser } from "@/actions/auth";
import { AppNavbar } from "@/components/app-navbar";
import { QuickActionFab } from "@/components/quick-action-fab";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const userId = session?.user?.id;

  const dbUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, isSuspended: true },
      })
    : null;

  if (userId && !dbUser) {
    redirect("/login?session=expired");
  }

  if (dbUser?.isSuspended) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
        <header className="w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <BrandLogo size={30} />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-zinc-900 p-7 shadow-lg text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Account Suspended
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Your IndieBill account{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-200">
                ({dbUser.email})
              </span>{" "}
              has been suspended by an administrator. Workspace access is currently disabled.
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              If you believe this is a mistake, please contact support.
            </p>
            <form action={logoutUser} className="mt-6">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const isAdmin = isAdminEmail(dbUser?.email ?? session?.user?.email);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppNavbar user={session?.user} isAdmin={isAdmin} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-24">{children}</main>
      <QuickActionFab />
    </div>
  );
}
