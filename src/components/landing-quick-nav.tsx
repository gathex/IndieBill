"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LandingQuickNavProps {
  appHref: string;
  isLoggedIn?: boolean;
}

const NAV_JUMP_LINKS = [
  {
    label: "Features",
    href: "#features",
    sublabel: "Bento grid & speed-dial",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "How It Works",
    href: "#how-it-works",
    sublabel: "3 steps from quote to pay",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: "Pricing",
    href: "#pricing",
    sublabel: "Free in beta · 0% fees",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-5 0c0 2 2 2.5 3 3s3 1.5 3 3.5a3.5 3.5 0 0 1-6 0" />
      </svg>
    ),
  },
  {
    label: "Interactive Demo",
    href: "#demo",
    sublabel: "Test invoices & payments",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
];

export function LandingQuickNav({ appHref, isLoggedIn = false }: LandingQuickNavProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Show only after scrolling past hero section (~350px)
  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsOpen(false);
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const scrollToTop = () => {
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Subtle Mobile Backdrop when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-zinc-950/20 dark:bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 print:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Capsule */}
      <div
        ref={containerRef}
        className={cn(
          "fixed bottom-6 right-6 z-40 transition-all duration-300 ease-out print:hidden",
          isVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none",
        )}
      >
        {/* Quick Jump Upward Menu */}
        <div
          className={cn(
            "absolute bottom-full right-0 mb-3 w-60 origin-bottom-right rounded-2xl bg-white/95 dark:bg-zinc-900/95 p-2 shadow-2xl shadow-zinc-950/20 dark:shadow-black/70 border border-zinc-200/90 dark:border-zinc-800/90 backdrop-blur-md transition-all duration-200 ease-out",
            isOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 translate-y-2 pointer-events-none",
          )}
          role="menu"
          aria-orientation="vertical"
          aria-hidden={!isOpen}
        >
          <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
            <span>Quick Navigation</span>
            <span className="font-mono text-[9px] lowercase text-zinc-400">esc to close</span>
          </div>

          <div className="mt-1.5 flex flex-col gap-1">
            {/* Primary Action in Menu */}
            <Link
              href={appHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all text-xs font-semibold cursor-pointer shadow-sm"
              tabIndex={isOpen ? 0 : -1}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-[10px]">
                  ⚡
                </span>
                <span>{isLoggedIn ? "Go to Dashboard" : "Start Free Now"}</span>
              </div>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </Link>

            {/* Jump Links */}
            {NAV_JUMP_LINKS.map((link, idx) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                style={{
                  transitionDelay: isOpen ? `${idx * 30}ms` : "0ms",
                }}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-95 transition-all group"
                tabIndex={isOpen ? 0 : -1}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                    {link.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate leading-tight font-semibold">{link.label}</span>
                    <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-tight">
                      {link.sublabel}
                    </span>
                  </div>
                </div>
                <svg
                  className="h-3 w-3 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            ))}

            {/* Back to top */}
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-95 transition-all border-t border-zinc-100 dark:border-zinc-800/80 mt-1 cursor-pointer"
              tabIndex={isOpen ? 0 : -1}
            >
              <div className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
                <span>Back to Top</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">↑</span>
            </button>
          </div>
        </div>

        {/* Floating Capsule Bar */}
        <div className="flex items-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl shadow-zinc-950/25 dark:shadow-black/60 border border-zinc-800/50 dark:border-zinc-200/50 backdrop-blur-md transition-all">
          <Link
            href={appHref}
            className="flex items-center gap-1.5 pl-4 pr-3 py-2.5 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isLoggedIn ? "Dashboard" : "Start Free"}</span>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </Link>

          <div className="h-4 w-px bg-white/20 dark:bg-zinc-900/20" />

          {/* Quick Nav Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle quick navigation jump menu"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 hover:bg-white/10 dark:hover:bg-zinc-900/10 cursor-pointer",
              isOpen && "bg-white/15 dark:bg-zinc-900/15",
            )}
          >
            <svg
              className={cn(
                "h-4 w-4 transition-transform duration-200 ease-out",
                isOpen ? "rotate-45" : "rotate-0",
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
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
