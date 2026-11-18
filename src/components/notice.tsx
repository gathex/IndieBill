const messages: Record<string, string> = {
  "invoice-deleted": "Invoice deleted.",
  "email-sent": "Invoice email sent with PDF attached.",
  "email-skipped":
    "Email delivery is not configured yet, so no email was sent. Add RESEND_API_KEY to enable it.",
  "email-failed": "The invoice email failed to send. Check your email settings and try again.",
  "quotation-deleted": "Quotation deleted.",
  "quotation-email-sent": "Quotation email sent with PDF attached.",
  "quotation-email-skipped":
    "Email delivery is not configured yet, so no email was sent. Add RESEND_API_KEY to enable it.",
  "quotation-email-failed": "The quotation email failed to send. Check your email settings and try again.",
};

export function Notice({ notice }: { notice?: string }) {
  const message = notice ? messages[notice] : undefined;
  if (!message) return null;

  const isError = notice === "email-failed" || notice === "quotation-email-failed";
  return (
    <div
      role="status"
      className={
        isError
          ? "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          : "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      }
    >
      {message}
    </div>
  );
}
