import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavbarProfile } from "@/components/navbar-profile";
import { AdminDashboard, type AdminUserRow } from "@/components/admin-dashboard";

export const metadata = {
  title: "Admin Console",
};

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [users, totalInvoices, totalQuotations] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        plan: true,
        isSuspended: true,
        createdAt: true,
        _count: {
          select: {
            invoices: true,
            clients: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.count(),
    prisma.quotation.count(),
  ]);

  const serializedUsers: AdminUserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    businessName: user.businessName,
    plan: user.plan,
    isSuspended: user.isSuspended,
    invoicesCount: user._count.invoices,
    clientsCount: user._count.clients,
    createdAt: user.createdAt.toISOString(),
  }));

  const stats = {
    totalUsers: users.length,
    proUsers: users.filter((u) => u.plan === "PRO").length,
    totalInvoices,
    totalQuotations,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <BrandLogo size={28} />
            </Link>
            <span className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white dark:text-zinc-900">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span>← Back to App</span>
            </Link>
            <ThemeToggle />
            <NavbarProfile
              user={{
                id: admin.userId,
                name: admin.name,
                email: admin.email,
                image: admin.image,
              }}
              isAdmin={true}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <AdminDashboard
          currentAdminId={admin.userId}
          stats={stats}
          initialUsers={serializedUsers}
        />
      </main>
    </div>
  );
}
