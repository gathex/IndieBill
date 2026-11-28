const messages: Record<string, string> = {
  "invoice-deleted": "Invoice deleted.",
  "email-sent": "Invoice email sent with PDF attached.",
  "client-missing-email": "The client does not have an email address configured. Please edit the client and add an email before sending.",
  "email-skipped":
    "Email delivery is not configured yet, so no email was sent. Add MAILTRAP_API_TOKEN in .env to enable it.",
  "email-failed": "The invoice email failed to send. Check your email settings and try again.",
  "quotation-deleted": "Quotation deleted.",
  "quotation-email-sent": "Quotation email sent with PDF attached.",
  "quotation-email-skipped":
    "Email delivery is not configured yet, so no email was sent. Add MAILTRAP_API_TOKEN in .env to enable it.",
  "quotation-email-failed": "The quotation email failed to send. Check your email settings and try again.",
  "reminder-sent": "Payment reminder email sent to the client.",
  "reminder-skipped":
    "Email delivery is not configured yet, so no reminder was sent. Add MAILTRAP_API_TOKEN in .env to enable it.",
  "reminder-failed": "The payment reminder email failed to send. Check client email and email settings.",
  "payment-recorded": "Payment recorded. The invoice balance has been updated.",
  "payment-deleted": "Payment deleted. The invoice balance has been recalculated.",
  "payment-invalid": "The payment details were invalid. Check the amount and date and try again.",
  "payment-exceeds": "The payment amount cannot be greater than the outstanding balance.",
  "payment-already-paid": "This invoice is already paid in full.",
  "payment-error": "Payment not found or you do not have access to it.",
  "payment-duplicate": "A payment with that reference already exists for this invoice.",
};

export function Notice({
  notice,
  errorMessage,
  mailtoUrl,
}: {
  notice?: string;
  errorMessage?: string;
  mailtoUrl?: string;
}) {
  const message = notice ? messages[notice] : undefined;
  if (!message && !errorMessage) return null;

  const isError =
    notice === "email-failed" ||
    notice === "quotation-email-failed" ||
    notice === "reminder-failed" ||
    notice === "client-missing-email" ||
    notice === "payment-invalid" ||
    notice === "payment-exceeds" ||
    notice === "payment-already-paid" ||
    notice === "payment-error" ||
    notice === "payment-duplicate" ||
    Boolean(errorMessage);

  const isSkippedEmail =
    notice === "email-skipped" ||
    notice === "quotation-email-skipped" ||
    notice === "reminder-skipped";

  return (
    <div
      role="status"
      className={
        isError
          ? "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 flex flex-wrap items-center justify-between gap-3"
          : "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-3"
      }
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="font-medium">{message || "An error occurred."}</span>
        {errorMessage ? (
          <span className="text-xs text-red-700 dark:text-red-400 font-normal break-words">
            Reason: {errorMessage}
          </span>
        ) : null}
      </div>
      {(isSkippedEmail || isError) && mailtoUrl ? (
        <a
          href={mailtoUrl}
          className={
            isError
              ? "inline-flex items-center gap-1.5 font-semibold text-red-900 dark:text-red-100 hover:text-red-700 dark:hover:text-white underline underline-offset-2 shrink-0 transition-colors"
              : "inline-flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-100 hover:text-emerald-700 dark:hover:text-white underline underline-offset-2 shrink-0 transition-colors"
          }
        >
          <svg
            className={`w-4 h-4 ${isError ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span>Open in Mail App instead →</span>
        </a>
      ) : null}
    </div>
  );
}
