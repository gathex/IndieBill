"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateUserPlan, toggleUserSuspension } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  businessName: string | null;
  plan: string;
  isSuspended: boolean;
  invoicesCount: number;
  clientsCount: number;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  proUsers: number;
  totalInvoices: number;
  totalQuotations: number;
}

type FilterOption = "ALL" | "FREE" | "PRO" | "SUSPENDED";

interface ToastState {
  type: "success" | "error";
  message: string;
}

export function AdminDashboard({
  currentAdminId,
  stats,
  initialUsers,
}: {
  currentAdminId: string;
  stats: AdminStats;
  initialUsers: AdminUserRow[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
  };

  const handlePlanChange = async (user: AdminUserRow) => {
    const nextPlan: "FREE" | "PRO" = user.plan === "PRO" ? "FREE" : "PRO";
    setPendingUserId(user.id);
    setToast(null);

    try {
      const res = await updateUserPlan(user.id, nextPlan);
      if (!res.ok) {
        showToast({ type: "error", message: res.error ?? "Failed to update plan." });
        return;
      }

      setUsers((prev) =>
        prev.map((row) => (row.id === user.id ? { ...row, plan: nextPlan } : row)),
      );
      showToast({
        type: "success",
        message: res.message ?? `Updated ${user.email} to ${nextPlan}.`,
      });
      router.refresh();
    } catch {
      showToast({ type: "error", message: "Unexpected error updating user plan." });
    } finally {
      setPendingUserId(null);
    }
  };

  const handleToggleSuspension = async (user: AdminUserRow) => {
    if (user.id === currentAdminId) {
      showToast({
        type: "error",
        message: "You cannot suspend your own admin account.",
      });
      return;
    }

    setPendingUserId(user.id);
    setToast(null);

    try {
      const res = await toggleUserSuspension(user.id);
      if (!res.ok) {
        showToast({
          type: "error",
          message: res.error ?? "Failed to update suspension status.",
        });
        return;
      }

      const nextSuspended = res.isSuspended ?? !user.isSuspended;
      setUsers((prev) =>
        prev.map((row) =>
          row.id === user.id ? { ...row, isSuspended: nextSuspended } : row,
        ),
      );
      showToast({
        type: "success",
        message:
          res.message ??
          `${user.email} has been ${nextSuspended ? "suspended" : "activated"}.`,
      });
      router.refresh();
    } catch {
      showToast({
        type: "error",
        message: "Unexpected error updating user status.",
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const counts = useMemo(() => {
    let free = 0;
    let pro = 0;
    let suspended = 0;
    for (const u of users) {
      if (u.plan === "PRO") pro += 1;
      else free += 1;
      if (u.isSuspended) suspended += 1;
    }
    return {
      ALL: users.length,
      FREE: free,
      PRO: pro,
      SUSPENDED: suspended,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (filter === "FREE" && user.plan !== "FREE") return false;
      if (filter === "PRO" && user.plan !== "PRO") return false;
      if (filter === "SUSPENDED" && !user.isSuspended) return false;

      if (!q) return true;
      return (
        (user.name ?? "").toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.businessName ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, filter]);

  const liveProCount = counts.PRO;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Admin Console
            </h1>
            <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Platform Control
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage IndieBill user plans, account access, and platform-wide activity.
          </p>
        </div>
      </div>

      {/* Inline Toast / Feedback Banner */}
      {toast && (
        <div
          role="status"
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm transition-all",
            toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300",
          )}
        >
          <div className="flex items-center gap-2.5 font-medium">
            {toast.type === "error" ? (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Top KPI Strip (4 Compact Cards) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {stats.totalUsers}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {counts.SUSPENDED} suspended account(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 dark:border-l-amber-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Pro Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {liveProCount}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {stats.totalUsers > 0
                ? `${Math.round((liveProCount / stats.totalUsers) * 100)}% conversion`
                : "0% conversion"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Invoices Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {stats.totalInvoices}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Across all workspaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Quotations Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {stats.totalQuotations}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Estimates & proposals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table Card */}
      <Card>
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Registered Users
              </CardTitle>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Search accounts, upgrade plans, or toggle access status.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Filter Tabs */}
              <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-1">
                {(
                  [
                    { key: "ALL", label: "All" },
                    { key: "FREE", label: "Free" },
                    { key: "PRO", label: "Pro" },
                    { key: "SUSPENDED", label: "Suspended" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                      filter === tab.key
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200",
                    )}
                  >
                    {tab.label} ({counts[tab.key]})
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="w-full sm:w-64">
                <Input
                  type="search"
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search users by name or email"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-4 py-3.5">Plan</th>
                  <th className="px-4 py-3.5 text-right">Invoices</th>
                  <th className="px-4 py-3.5 text-right">Clients</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      No users match your current search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === currentAdminId;
                    const isPending = pendingUserId === user.id;
                    const isPro = user.plan === "PRO";
                    const initial = (user.name?.[0] || user.email[0] || "U").toUpperCase();
                    const joinedLabel = new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(user.createdAt));

                    return (
                      <tr
                        key={user.id}
                        className={cn(
                          "transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40",
                          user.isSuspended && "bg-rose-50/30 dark:bg-rose-950/10",
                        )}
                      >
                        {/* User (Name + Email) */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                  {user.name || user.businessName || "Unnamed User"}
                                </span>
                                {isSelf && (
                                  <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Plan Badge */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {isPro ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-700/60 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              PRO
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              FREE
                            </span>
                          )}
                        </td>

                        {/* Invoices Count */}
                        <td className="px-4 py-4 text-right font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {user.invoicesCount}
                        </td>

                        {/* Clients Count */}
                        <td className="px-4 py-4 text-right font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {user.clientsCount}
                        </td>

                        {/* Joined Date */}
                        <td className="px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {joinedLabel}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {user.isSuspended ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant={isPro ? "outline" : "default"}
                              disabled={isPending}
                              onClick={() => handlePlanChange(user)}
                              className="cursor-pointer"
                            >
                              {isPending
                                ? "Updating..."
                                : isPro
                                  ? "Downgrade to Free"
                                  : "Upgrade to Pro"}
                            </Button>

                            <Button
                              size="sm"
                              variant={user.isSuspended ? "secondary" : "danger"}
                              disabled={isPending || isSelf}
                              title={
                                isSelf
                                  ? "You cannot suspend your own admin account"
                                  : user.isSuspended
                                    ? "Reactivate user account"
                                    : "Suspend user account"
                              }
                              onClick={() => handleToggleSuspension(user)}
                              className="cursor-pointer"
                            >
                              {user.isSuspended ? "Activate" : "Suspend"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
