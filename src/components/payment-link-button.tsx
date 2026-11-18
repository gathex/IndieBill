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
        className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create payment link"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {link ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-600">Payment link created:</p>
          <div className="flex items-start gap-2">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-zinc-900 underline"
            >
              {link}
            </a>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(link).catch(() => undefined);
              }}
              className="text-xs font-medium text-zinc-600 underline"
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
        className="text-xs text-zinc-500 underline"
      >
        Refresh
      </button>
    </div>
  );
}
