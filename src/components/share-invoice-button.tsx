"use client";

import { useState } from "react";
import { buildMailtoUrl } from "@/lib/mailto";

export function sanitizeWhatsAppPhone(phone?: string | null): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }
  // Standard Indian 10-digit mobile number -> prefix 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
}

export interface ShareInvoiceButtonProps {
  url: string;
  title: string;
  text?: string;
  compact?: boolean;
  layout?: "grid" | "row";
  recipientPhone?: string | null;
  clientEmail?: string | null;
  clientName?: string | null;
  businessName?: string;
  documentType?: "invoice" | "quotation";
  documentNumber?: string;
  amountDue?: string;
  dueDate?: string | null;
  paymentUrl?: string | null;
  mailtoUrl?: string;
}

export function ShareInvoiceButton({
  url,
  title,
  text,
  layout = "grid",
  recipientPhone,
  clientEmail,
  clientName,
  businessName,
  documentType = "invoice",
  documentNumber,
  amountDue,
  dueDate,
  paymentUrl,
  mailtoUrl,
}: ShareInvoiceButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyLink() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
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
      setError(null);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Unable to copy. Please copy the link manually.");
    }
  }

  // Construct structured text for WhatsApp and fallback
  const docLabel = documentType === "quotation" ? "Quotation" : "Invoice";
  const numLabel = documentNumber ? `${docLabel} ${documentNumber}` : title;
  const fromLabel = businessName ? `from ${businessName}` : "";

  let shareBody = text;
  if (!shareBody) {
    const lines = [
      `Hi,`,
      ``,
      `Here is ${numLabel} ${fromLabel}.`.trim(),
      amountDue
        ? `${documentType === "quotation" ? "Estimated Total" : "Amount Due"}: ${amountDue}`
        : null,
      dueDate
        ? `${documentType === "quotation" ? "Valid Until" : "Due Date"}: ${dueDate}`
        : null,
      ``,
      `View & download PDF:`,
      url,
      paymentUrl
        ? `\nPay securely online (UPI / Cards / Netbanking):\n${paymentUrl}`
        : null,
      ``,
      `Thank you!`,
    ].filter((line) => line !== null);

    shareBody = lines.join("\n");
  }

  async function handleNativeShare() {
    const shareData = {
      title,
      text: shareBody,
      url,
    };
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

  const sanitizedPhone = sanitizeWhatsAppPhone(recipientPhone);
  const whatsappHref = sanitizedPhone
    ? `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(shareBody)}`
    : `https://wa.me/?text=${encodeURIComponent(shareBody)}`;

  // Use the dedicated buildMailtoUrl helper if mailtoUrl was not directly passed
  const effectiveMailtoUrl =
    mailtoUrl ||
    buildMailtoUrl({
      to: clientEmail,
      clientName: clientName ?? null,
      businessName: businessName || "IndieBill",
      documentType,
      documentNumber: documentNumber || title,
      amountDue,
      dueDate,
      shareUrl: url,
      paymentUrl,
    });

  const isRow = layout === "row";

  return (
    <div className="space-y-1.5">
      <div
        className={
          isRow
            ? "flex flex-wrap items-center gap-2"
            : "grid grid-cols-2 gap-2"
        }
      >
        {/* Button 1: Copy Link */}
        <button
          type="button"
          onClick={copyLink}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 shadow-2xs transition-colors cursor-pointer ${
            isRow ? "w-auto" : "w-full"
          }`}
          title="Copy public share link"
        >
          {copied ? (
            <>
              <svg
                className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
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
                className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-400 shrink-0"
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

        {/* Button 2: WhatsApp */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 px-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-2xs transition-colors ${
            isRow ? "w-auto" : "w-full"
          }`}
          title={
            sanitizedPhone
              ? `Send via WhatsApp to ${sanitizedPhone}`
              : "Share via WhatsApp"
          }
        >
          <svg className="h-3.5 w-3.5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.892-.449-1.611-.667-2.628-2.311-2.709-2.418-.081-.107-.655-.873-.655-1.666 0-.793.414-1.183.56-1.343.146-.16.321-.2.43-.2.109 0 .218.001.312.006.101.005.236-.038.368.28.138.334.475 1.157.517 1.242.043.085.071.186.013.3-.058.115-.087.187-.174.289-.087.102-.183.228-.261.306-.089.089-.182.186-.078.365.104.179.462.763.992 1.236.683.609 1.258.798 1.437.887.179.089.284.077.389-.044.105-.121.45-.526.57-.706.12-.18.241-.151.405-.09.164.061 1.042.491 1.22.58.179.089.298.133.342.208.044.075.044.436-.1 1.041z" />
          </svg>
          <span className="truncate">WhatsApp</span>
        </a>

        {/* Button 3: Mail App */}
        <a
          href={effectiveMailtoUrl}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 shadow-2xs transition-colors ${
            isRow ? "w-auto" : "w-full"
          }`}
          title="Open in your default Mail app"
        >
          <svg
            className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span className="truncate">Mail App</span>
        </a>

        {/* Button 4: Share */}
        <button
          type="button"
          onClick={handleNativeShare}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 shadow-2xs transition-colors cursor-pointer ${
            isRow ? "w-auto" : "w-full"
          }`}
          title="Share via device share menu"
        >
          <svg
            className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="truncate">Share</span>
        </button>
      </div>

      {copied && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Link copied to clipboard.
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
