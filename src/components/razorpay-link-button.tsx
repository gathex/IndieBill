"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRazorpayPaymentLink } from "@/actions/razorpay";

interface RazorpayLinkButtonProps {
  invoiceId: string;
  initialUrl?: string | null;
  balanceDue?: number;
}

export function RazorpayLinkButton({
  invoiceId,
  initialUrl,
  balanceDue,
}: RazorpayLinkButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(initialUrl ?? null);
  const [copied, setCopied] = useState(false);

  // If already paid, do not offer generation
  if (balanceDue !== undefined && balanceDue <= 0) {
    return (
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
        This invoice is paid in full. No payment link required.
      </div>
    );
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const url = await createRazorpayPaymentLink(invoiceId);
      if (url) {
        setLink(url);
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create Razorpay link.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback failed
    }
  }

  return (
    <div className="space-y-2">
      {link ? (
        <div className="space-y-2">
          {/* Single-line URL container */}
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 shadow-2xs">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs font-mono min-w-0 flex-1 text-blue-700 dark:text-blue-300 hover:underline"
              title={link}
            >
              {link}
            </a>
          </div>

          {/* Action row with uniform buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 shadow-2xs transition-colors cursor-pointer flex-1"
            >
              {copied ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                    Copied!
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span className="truncate">Copy Link</span>
                </>
              )}
            </button>

            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 shadow-2xs transition-colors flex-1"
            >
              <span className="truncate">Open Link</span>
              <svg
                className="w-3 h-3 text-zinc-400 dark:text-zinc-400 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="inline-flex h-8 items-center justify-center shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Regenerate payment link"
            >
              {loading ? (
                <svg
                  className="animate-spin h-3.5 w-3.5 text-zinc-400"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              ) : (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Generating Razorpay Link…</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 2L3 14h9l-1.5 8L21 10h-9l1.5-8z" />
              </svg>
              <span>Generate Razorpay Link</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg p-2">
          {error}
        </p>
      )}
    </div>
  );
}
