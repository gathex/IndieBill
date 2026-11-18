"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShareInvoiceButtonProps {
  url: string;
  title: string;
  text: string;
  compact?: boolean;
}

export function ShareInvoiceButton({
  url,
  title,
  text,
  compact = false,
}: ShareInvoiceButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setError(null);
    } catch {
      setError("Unable to copy. Copy the link manually instead.");
    }
  }

  async function share() {
    const shareData = { title, text, url };
    if ("share" in navigator && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        setError(null);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  const emailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;

  return (
    <div className="space-y-1">
      <div className={compact ? "flex flex-wrap gap-2" : "flex flex-wrap gap-2"}>
        <Button type="button" variant="outline" size={compact ? "sm" : "default"} onClick={share}>
          Share
        </Button>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "sm" : "default"}
          onClick={copyLink}
        >
          {copied ? "Copied" : "Copy link"}
        </Button>
        <a href={emailHref} className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900">
          Email
        </a>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900">
          WhatsApp
        </a>
      </div>
      {copied ? <p className="text-xs text-emerald-600">Link copied to clipboard.</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
