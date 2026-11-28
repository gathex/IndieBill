export interface BuildMailtoUrlParams {
  to?: string | null;
  clientName?: string | null;
  businessName: string;
  documentType: "invoice" | "quotation";
  documentNumber: string;
  amountDue?: string | null;
  dueDate?: string | null;
  shareUrl: string;
  paymentUrl?: string | null;
}

export function buildMailtoUrl(params: BuildMailtoUrlParams): string {
  const {
    to,
    clientName,
    businessName,
    documentType,
    documentNumber,
    amountDue,
    dueDate,
    shareUrl,
    paymentUrl,
  } = params;

  const docLabel = documentType === "quotation" ? "Quotation" : "Invoice";
  const subject = `${docLabel} ${documentNumber} from ${businessName || "IndieBill"}`;

  const greeting = clientName?.trim() ? `Hi ${clientName.trim()},` : `Hi,`;
  const intro =
    documentType === "quotation"
      ? `Please find our quotation from ${businessName || "us"} below.`
      : `Please find your invoice from ${businessName || "us"} below.`;

  const lines = [
    greeting,
    "",
    intro,
    "",
    `${docLabel} Number: ${documentNumber}`,
    amountDue
      ? `${documentType === "quotation" ? "Estimated Total" : "Amount Due"}: ${amountDue}`
      : null,
    dueDate
      ? `${documentType === "quotation" ? "Valid Until" : "Due Date"}: ${dueDate}`
      : null,
    "",
    `View online & download PDF:`,
    shareUrl,
    paymentUrl ? "" : null,
    paymentUrl ? "Pay online securely (UPI / Cards / Netbanking):" : null,
    paymentUrl || null,
    "",
    `Thanks,`,
    businessName || "IndieBill",
  ].filter((line) => line !== null);

  const body = lines.join("\r\n");
  const recipient = to?.trim() ? encodeURIComponent(to.trim()) : "";

  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
