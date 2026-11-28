"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function getClientShortcutKey() {
  if (typeof window === "undefined") return "⌘K";
  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent)
    ? "⌘K"
    : "Ctrl+K";
}

function subscribeToNothing() {
  return () => {};
}

interface QuickActionItem {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  isPrimary?: boolean;
  icon: (props: { className?: string }) => React.JSX.Element;
  iconTone: string;
}

function InvoiceIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function QuotationIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="13" y2="13" />
    </svg>
  );
}

function ExpenseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <path d="m15 15 2-2 2 2" />
    </svg>
  );
}

function ClientIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

const ACTION_ITEMS: QuickActionItem[] = [
  {
    id: "new-invoice",
    label: "New Invoice",
    sublabel: "GST or standard bill",
    href: "/invoices/new",
    isPrimary: true,
    icon: InvoiceIcon,
    iconTone: "bg-orange-500 text-white shadow-sm shadow-orange-500/30",
  },
  {
    id: "new-quotation",
    label: "New Quotation",
    sublabel: "Estimate & convert to bill",
    href: "/quotations/new",
    icon: QuotationIcon,
    iconTone: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40",
  },
  {
    id: "log-expense",
    label: "Log Expense",
    sublabel: "Track business spend",
    href: "/expenses",
    icon: ExpenseIcon,
    iconTone: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
  },
  {
    id: "add-client",
    label: "Add Client",
    sublabel: "Client profile & GSTIN",
    href: "/clients",
    icon: ClientIcon,
    iconTone: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40",
  },
];

export function QuickActionFab() {
  const [isOpen, setIsOpen] = useState(false);
  const shortcutKey = useSyncExternalStore(
    subscribeToNothing,
    getClientShortcutKey,
    () => "⌘K",
  );
  const fabRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isFormRoute =
    pathname.endsWith("/new") ||
    pathname.endsWith("/edit") ||
    pathname.startsWith("/onboarding");

  // Close when pathname changes
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);

  // Keyboard shortcut: Cmd+K / Ctrl+K and Escape (active only when FAB is mounted)
  useEffect(() => {
    if (isFormRoute) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closeMenu();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && (event.key === "k" || event.key === "K")) {
        const target = event.target as HTMLElement | null;
        const isEditing =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable);

        if (!isEditing) {
          event.preventDefault();
          toggleMenu();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormRoute, isOpen, closeMenu, toggleMenu]);

  // Click outside to close
  useEffect(() => {
    if (isFormRoute || !isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFormRoute, isOpen, closeMenu]);

  if (isFormRoute) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop blur / dim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-zinc-950/25 dark:bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 print:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Floating Action Container */}
      <div
        ref={fabRef}
        className="fixed bottom-6 right-6 z-40 flex items-center print:hidden"
        role="region"
        aria-label="Quick Actions"
      >
        {/* Speed-Dial Menu (Opens Upward) */}
        <div
          className={cn(
            "absolute bottom-full right-0 mb-3 w-72 origin-bottom-right rounded-2xl bg-white/95 dark:bg-zinc-900/95 p-2 shadow-2xl shadow-zinc-950/20 dark:shadow-black/70 border border-zinc-200/90 dark:border-zinc-800/90 backdrop-blur-md transition-all duration-200 ease-out",
            isOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 translate-y-2 pointer-events-none",
          )}
          role="menu"
          aria-orientation="vertical"
          aria-hidden={!isOpen}
        >
          {/* Header row */}
          <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/80">
            <span>Quick Actions</span>
            <span className="font-mono text-[10px] lowercase text-zinc-400">esc to close</span>
          </div>

          {/* Action Links */}
          <div className="mt-1.5 flex flex-col gap-1">
            {ACTION_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={closeMenu}
                  role="menuitem"
                  tabIndex={isOpen ? 0 : -1}
                  style={{
                    transitionDelay: isOpen ? `${index * 30}ms` : "0ms",
                  }}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-xl p-2.5 transition-all duration-150 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-orange-400",
                    item.isPrimary
                      ? "bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 text-zinc-900 dark:text-zinc-100"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-105",
                        item.iconTone,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate leading-tight">
                          {item.label}
                        </span>
                        {item.isPrimary && (
                          <span className="rounded-full bg-orange-500/20 dark:bg-orange-400/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                            Fast
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">
                        {item.sublabel}
                      </p>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <span className="shrink-0 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                    <svg
                      className="h-4 w-4 transform transition-transform duration-150 group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Trigger Wrapper with Hover-Only Shortcut Pill */}
        <div className="relative group flex items-center">
          <div
            className={cn(
              "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 text-zinc-700 dark:text-zinc-200 text-xs font-medium shadow-md shadow-zinc-950/5 dark:shadow-black/30 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-sm transition-all duration-200 whitespace-nowrap absolute right-full mr-3 pointer-events-none opacity-0 translate-x-1",
              !isOpen &&
                "group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0",
            )}
            aria-hidden="true"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
            <span>Quick Create</span>
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {shortcutKey}
            </kbd>
          </div>

          {/* Main Trigger Button */}
          <button
            type="button"
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-label={isOpen ? "Close quick actions menu" : "Open quick actions menu"}
            className={cn(
              "relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl shadow-zinc-950/25 dark:shadow-black/60 border border-zinc-800/40 dark:border-zinc-200/40 hover:bg-zinc-800 dark:hover:bg-white active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 dark:focus-visible:ring-orange-400 dark:focus-visible:ring-offset-zinc-950 cursor-pointer",
              isOpen && "ring-4 ring-orange-500/20 dark:ring-orange-400/25",
            )}
          >
            {/* Smooth + to × icon rotation */}
            <svg
              className={cn(
                "h-6 w-6 transition-transform duration-200 ease-out transform",
                isOpen ? "rotate-45" : "rotate-0",
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
