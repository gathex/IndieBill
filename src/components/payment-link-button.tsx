"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPaymentLinkForInvoice } from "@/actions/invoices";

export function CreatePaymentLinkButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const url = await createPaymentLinkForInvoice(invoiceId);
      if (url) {
        setLink(url);
      } else {
        setError("Payment links are not configured yet (missing Stripe API key).");
      }
    } catch {
      setError("Failed to create payment link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create payment link"}
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      {link ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Payment link created:</p>
          <div className="flex items-start gap-2">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-zinc-900 dark:text-zinc-100 underline"
            >
              {link}
            </a>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(link).catch(() => undefined);
              }}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 underline"
            >
              Copy
            </button>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => {
          router.refresh();
        }}
        className="text-xs text-zinc-500 dark:text-zinc-400 underline"
      >
        Refresh
      </button>
    </div>
  );
}
