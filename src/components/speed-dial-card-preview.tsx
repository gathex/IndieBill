"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PREVIEW_ACTIONS = [
  {
    id: "invoice",
    label: "New Invoice",
    sublabel: "GST or standard bill",
    badge: "Fast",
    badgeTone: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    iconTone: "bg-orange-500 text-white",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: "quotation",
    label: "New Quotation",
    sublabel: "Estimate & 1-click convert",
    badge: "Quote",
    badgeTone: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    iconTone: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="13" y2="13" />
      </svg>
    ),
  },
  {
    id: "expense",
    label: "Log Expense",
    sublabel: "Track business spend",
    badge: "Spend",
    badgeTone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    iconTone: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    id: "client",
    label: "Add Client",
    sublabel: "Client profile & GSTIN",
    badge: "Client",
    badgeTone: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    iconTone: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
];

export function SpeedDialCardPreview() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const handleActionClick = (label: string) => {
    setActiveFeedback(`${label} triggered!`);
    setTimeout(() => {
      setActiveFeedback(null);
    }, 1400);
  };

  return (
    <div className="mt-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-zinc-950/60 p-3 select-none transition-all">
      {/* Interactive Trigger Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-95 transition-all text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer"
        aria-expanded={isExpanded}
        aria-label="Toggle Speed Dial interactive preview"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm shadow-orange-500/30">
            <svg
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200 ease-out",
                isExpanded ? "rotate-45" : "rotate-0",
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {isExpanded ? "Close speed-dial" : "Tap to try speed-dial"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">or</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            ⌘K
          </kbd>
        </div>
      </button>

      {/* Expandable Preview Actions */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-out overflow-hidden",
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none",
        )}
      >
        <div className="min-h-0 flex flex-col gap-1.5 pt-1">
          {PREVIEW_ACTIONS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleActionClick(item.label)}
              style={{
                transitionDelay: isExpanded ? `${index * 30}ms` : "0ms",
              }}
              className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-95 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105",
                    item.iconTone,
                  )}
                >
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1 py-0.2 text-[8px] font-bold uppercase tracking-wide",
                        item.badgeTone,
                      )}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate leading-tight">
                    {item.sublabel}
                  </p>
                </div>
              </div>

              <svg
                className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors shrink-0 group-hover:translate-x-0.5 duration-150"
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
            </button>
          ))}

          {activeFeedback ? (
            <p className="text-center text-[10px] font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in mt-0.5">
              ✓ {activeFeedback} (Zero-delay jump)
            </p>
          ) : (
            <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Tactile speed-dial accessible from every app page
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
