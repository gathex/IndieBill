"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavbarProfile, type NavbarUser } from "@/components/navbar-profile";
import { logoutUser } from "@/actions/auth";
import { cn } from "@/lib/utils";

interface AppNavbarProps {
  user?: NavbarUser | null;
}

export function AppNavbar({ user }: AppNavbarProps) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<"billing" | "finance" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close menus on route change (useRef avoids react-hooks/set-state-in-effect)
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setOpenDropdown(null);
      setMobileOpen(false);
    }
  }, [pathname]);

  // Close on outside click and Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isBillingActive =
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/quotations") ||
    pathname.startsWith("/recurring");
  const isFinanceActive =
    pathname.startsWith("/payments") || pathname.startsWith("/expenses");
  const isClientsActive = pathname.startsWith("/clients");
  const isCatalogActive = pathname.startsWith("/catalog");
  const isDashboardActive = pathname === "/dashboard";

  const toggleDropdown = (menu: "billing" | "finance") => {
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md print:hidden">
      <div
        ref={navRef}
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6"
      >
        {/* Left: Brand Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90 shrink-0"
        >
          <BrandLogo size={28} />
        </Link>

        {/* Center: Desktop Navigation (Max 5 Top-Level Items) */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {/* 1. Dashboard */}
          <Link
            href="/dashboard"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isDashboardActive
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
            )}
          >
            Dashboard
          </Link>

          {/* 2. Billing Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("billing")}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600",
                isBillingActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
              )}
              aria-expanded={openDropdown === "billing"}
            >
              <span>Billing</span>
              <svg
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-150",
                  openDropdown === "billing" && "rotate-180"
                )}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {openDropdown === "billing" && (
              <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-xl shadow-zinc-950/5 dark:shadow-black/50 z-50 animate-dropdown-in">
                <Link
                  href="/invoices"
                  onClick={() => setOpenDropdown(null)}
                  className={cn(
                    "flex flex-col rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname.startsWith("/invoices")
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <span className="font-medium">Invoices</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Manage & send invoices
                  </span>
                </Link>
                <Link
                  href="/quotations"
                  onClick={() => setOpenDropdown(null)}
                  className={cn(
                    "flex flex-col rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname.startsWith("/quotations")
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <span className="font-medium">Quotations</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Estimates & client proposals
                  </span>
                </Link>
                <Link
                  href="/recurring"
                  onClick={() => setOpenDropdown(null)}
                  className={cn(
                    "flex flex-col rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname.startsWith("/recurring")
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <span className="font-medium">Recurring</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Subscriptions & retainers
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* 3. Finance Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("finance")}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600",
                isFinanceActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
              )}
              aria-expanded={openDropdown === "finance"}
            >
              <span>Finance</span>
              <svg
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-150",
                  openDropdown === "finance" && "rotate-180"
                )}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {openDropdown === "finance" && (
              <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-xl shadow-zinc-950/5 dark:shadow-black/50 z-50 animate-dropdown-in">
                <Link
                  href="/payments"
                  onClick={() => setOpenDropdown(null)}
                  className={cn(
                    "flex flex-col rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname.startsWith("/payments")
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <span className="font-medium">Payments</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Track incoming client payments
                  </span>
                </Link>
                <Link
                  href="/expenses"
                  onClick={() => setOpenDropdown(null)}
                  className={cn(
                    "flex flex-col rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname.startsWith("/expenses")
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <span className="font-medium">Expenses</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Log costs & monitor profit
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* 4. Clients */}
          <Link
            href="/clients"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isClientsActive
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
            )}
          >
            Clients
          </Link>

          {/* 5. Catalog */}
          <Link
            href="/catalog"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isCatalogActive
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
            )}
          >
            Catalog
          </Link>
        </nav>

        {/* Right: Controls (Theme Toggle + User Avatar + Mobile Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <NavbarProfile user={user} />

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (md:hidden) */}
      {mobileOpen && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isDashboardActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
              )}
            >
              Dashboard
            </Link>

            {/* Billing Group */}
            <div className="pt-2">
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Billing
              </span>
              <div className="mt-1 space-y-1 pl-2">
                <Link
                  href="/invoices"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/invoices")
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                  )}
                >
                  Invoices
                </Link>
                <Link
                  href="/quotations"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/quotations")
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                  )}
                >
                  Quotations
                </Link>
                <Link
                  href="/recurring"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/recurring")
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                  )}
                >
                  Recurring
                </Link>
              </div>
            </div>

            {/* Finance Group */}
            <div className="pt-2">
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Finance
              </span>
              <div className="mt-1 space-y-1 pl-2">
                <Link
                  href="/payments"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/payments")
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                  )}
                >
                  Payments
                </Link>
                <Link
                  href="/expenses"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/expenses")
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                  )}
                >
                  Expenses
                </Link>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/clients"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isClientsActive
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                )}
              >
                Clients
              </Link>
              <Link
                href="/catalog"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isCatalogActive
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                )}
              >
                Catalog
              </Link>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg
                className="h-4 w-4 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Settings</span>
            </Link>
            <form action={logoutUser} className="mt-1">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

export default AppNavbar;
