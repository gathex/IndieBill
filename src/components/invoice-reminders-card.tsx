"use client";

import { useTransition } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buildMailtoUrl } from "@/lib/mailto";
import { sanitizeWhatsAppPhone } from "@/components/share-invoice-button";
import {
  toggleInvoiceReminders,
  sendInvoiceReminderNow,
} from "@/actions/reminders";

export interface ReminderLogItem {
  id: string;
  type: string;
  channel: string;
  recipientEmail: string;
  status: string;
  errorMessage?: string | null;
  sentAt: Date | string;
}

interface InvoiceRemindersCardProps {
  invoiceId: string;
  invoiceNumber: string;
  remindersPaused: boolean;
  balanceDue: number;
  dueDate?: Date | string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientName?: string | null;
  businessName: string;
  currency: string;
  locale: string;
  shareUrl: string;
  paymentUrl?: string | null;
  reminderLogs: ReminderLogItem[];
}

export function InvoiceRemindersCard({
  invoiceId,
  invoiceNumber,
  remindersPaused,
  balanceDue,
  dueDate,
  clientEmail,
  clientPhone,
  clientName,
  businessName,
  currency,
  locale,
  shareUrl,
  paymentUrl,
  reminderLogs,
}: InvoiceRemindersCardProps) {
  const [historyListRef] = useAutoAnimate<HTMLDivElement>();
  const [isSending, startSending] = useTransition();
  const [isToggling, startToggling] = useTransition();

  const formattedBalance = formatCurrency(balanceDue, currency, locale);
  const formattedDueDate = dueDate
    ? formatDate(dueDate, undefined, locale)
    : null;

  // Build mailto backup URL
  const mailtoUrl = buildMailtoUrl({
    to: clientEmail,
    clientName,
    businessName,
    documentType: "invoice",
    documentNumber: invoiceNumber,
    amountDue: formattedBalance,
    dueDate: formattedDueDate,
    shareUrl,
    paymentUrl,
  });

  // Build WhatsApp reminder URL
  const sanitizedPhone = sanitizeWhatsAppPhone(clientPhone);
  const whatsappText = `Hi ${clientName?.trim() || ""},\n\nThis is a friendly payment reminder regarding invoice ${invoiceNumber} from ${businessName || "us"}.\n\nOutstanding Balance: ${formattedBalance}${
    formattedDueDate ? `\nDue Date: ${formattedDueDate}` : ""
  }\n\nView invoice & download PDF:\n${shareUrl}${
    paymentUrl ? `\n\nPay online securely:\n${paymentUrl}` : ""
  }\n\nThank you!`;

  const whatsappHref = sanitizedPhone
    ? `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(whatsappText)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  function handleSendReminder() {
    startSending(async () => {
      await sendInvoiceReminderNow(invoiceId);
    });
  }

  function handleToggleReminders() {
    startToggling(async () => {
      await toggleInvoiceReminders(invoiceId);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Payment Reminders
          </CardTitle>
        </div>

        {/* Auto-reminders status indicator and toggle */}
        <div className="flex items-center gap-2">
          {remindersPaused ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              ⏸ Paused
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ✓ Active
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleReminders}
            disabled={isToggling}
            className="h-7 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {isToggling
              ? "Updating…"
              : remindersPaused
              ? "Resume auto"
              : "Pause auto"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Action Row */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Send Manual Reminder
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Emails a polite reminder with the invoice PDF, balance due, and payment link.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleSendReminder}
              disabled={isSending || !clientEmail}
              className="shrink-0 h-8 text-xs font-medium"
            >
              {isSending ? (
                <>
                  <svg
                    className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5"
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
                  <span>Sending…</span>
                </>
              ) : (
                <>
                  <svg
                    className="mr-1.5 h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Send Reminder Now</span>
                </>
              )}
            </Button>
          </div>

          {/* Backup Fallbacks */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-zinc-200/70 dark:border-zinc-800/80 pt-2.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              Zero-API Backups:
            </span>
            <a
              href={mailtoUrl}
              className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-2 transition-colors py-0.5"
            >
              <svg
                className="w-3.5 h-3.5 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>Open in Mail App</span>
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 underline underline-offset-2 transition-colors py-0.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.892-.449-1.611-.667-2.628-2.311-2.709-2.418-.081-.107-.655-.873-.655-1.666 0-.793.414-1.183.56-1.343.146-.16.321-.2.43-.2.109 0 .218.001.312.006.101.005.236-.038.368.28.138.334.475 1.157.517 1.242.043.085.071.186.013.3-.058.115-.087.187-.174.289-.087.102-.183.228-.261.306-.089.089-.182.186-.078.365.104.179.462.763.992 1.236.683.609 1.258.798 1.437.887.179.089.284.077.389-.044.105-.121.45-.526.57-.706.12-.18.241-.151.405-.09.164.061 1.042.491 1.22.58.179.089.298.133.342.208.044.075.044.436-.1 1.041z" />
              </svg>
              <span>WhatsApp Reminder</span>
            </a>
          </div>
        </div>

        {/* Reminder History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Reminder History
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {reminderLogs.length} logged
            </span>
          </div>

          <div
            ref={historyListRef}
            className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden"
          >
            {reminderLogs.length > 0 ? (
              reminderLogs.map((log) => {
                const typeLabels: Record<string, { label: string; badge: string }> = {
                  BEFORE_DUE: {
                    label: "Upcoming",
                    badge:
                      "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                  },
                  ON_DUE: {
                    label: "Due Today",
                    badge:
                      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                  },
                  OVERDUE: {
                    label: "Overdue",
                    badge:
                      "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800",
                  },
                  MANUAL: {
                    label: "Manual",
                    badge:
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
                  },
                };

                const typeInfo = typeLabels[log.type] || {
                  label: log.type,
                  badge: "bg-zinc-100 text-zinc-700 border-zinc-200",
                };

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 p-3 text-xs bg-white dark:bg-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${typeInfo.badge}`}
                      >
                        {typeInfo.label}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-400 truncate">
                        {log.recipientEmail}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                        {formatDate(
                          log.sentAt,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                          locale,
                        )}
                      </span>

                      {log.status === "SENT" ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Sent</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400"
                          title={log.errorMessage || "Delivery failed"}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          <span>Failed</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900/50">
                No payment reminder emails sent yet for this invoice.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
