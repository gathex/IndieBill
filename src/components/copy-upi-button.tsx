"use client";

import { useState } from "react";

export function CopyUpiIdButton({
  upiId,
  className,
}: {
  upiId: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(upiId);
      } else {
        const ta = document.createElement("textarea");
        ta.value = upiId;
        ta.style.position = "fixed";
        ta.style.left = "-999999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs shadow-2xs ${className || ""}`}
    >
      <span
        className="truncate font-mono text-xs text-zinc-700 dark:text-zinc-300 min-w-0"
        title={upiId}
      >
        {upiId}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
        title="Click to copy UPI ID"
      >
        {copied ? "Copied! ✓" : "Copy"}
      </button>
    </div>
  );
}
