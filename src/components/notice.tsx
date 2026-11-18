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
  "payment-recorded": "Payment recorded. The invoice balance has been updated.",
  "payment-deleted": "Payment deleted. The invoice balance has been recalculated.",
  "payment-invalid": "The payment details were invalid. Check the amount and date and try again.",
  "payment-exceeds": "The payment amount cannot be greater than the outstanding balance.",
  "payment-already-paid": "This invoice is already paid in full.",
  "payment-error": "Payment not found or you do not have access to it.",
  "payment-duplicate": "A payment with that reference already exists for this invoice.",
};

export function Notice({ notice }: { notice?: string }) {
  const message = notice ? messages[notice] : undefined;
  if (!message) return null;

  const isError =
    notice === "email-failed" ||
    notice === "quotation-email-failed" ||
    notice === "payment-invalid" ||
    notice === "payment-exceeds" ||
    notice === "payment-already-paid" ||
    notice === "payment-error" ||
    notice === "payment-duplicate";
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
