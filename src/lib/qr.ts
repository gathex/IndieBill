import QRCode from "qrcode";
import { formatCurrency, formatDate } from "./utils";

interface PaymentQrInput {
  invoiceNumber: string;
  amount: number;
  currency: string;
  locale: string;
  businessName: string;
  dueDate?: Date | string | null;
  paymentLink?: string | null;
  qrName?: string | null;
  qrVpa?: string | null;
  qrUpiId?: string | null;
  qrAccountNumber?: string | null;
}

function getUpiAddress(input: PaymentQrInput) {
  return input.qrUpiId?.trim() || input.qrVpa?.trim() || "";
}

function getPayeeName(input: PaymentQrInput) {
  return input.qrName?.trim() || input.businessName;
}

export function buildPaymentQrText(input: PaymentQrInput): string {
  if (input.paymentLink) return input.paymentLink;

  const address = getUpiAddress(input);
  const name = getPayeeName(input);
  const accountNumber = input.qrAccountNumber?.trim();

  if (address) {
    const note = [
      `Invoice ${input.invoiceNumber}`,
      accountNumber ? `A/c ${accountNumber}` : "",
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 50);
    const params = new URLSearchParams({
      pa: address,
      pn: name.slice(0, 50),
      am: input.amount.toFixed(2),
      cu: input.currency,
      tn: note,
    });
    return `upi://pay?${params.toString()}`;
  }

  return [
    "PAYMENT REQUEST",
    `Invoice: ${input.invoiceNumber}`,
    `Amount: ${formatCurrency(input.amount, input.currency, input.locale)}`,
    `Name: ${name}`,
    input.qrVpa?.trim() ? `VPA: ${input.qrVpa.trim()}` : "",
    input.qrUpiId?.trim() ? `UPI ID: ${input.qrUpiId.trim()}` : "",
    accountNumber ? `Account number: ${accountNumber}` : "",
    `From: ${input.businessName}`,
    input.dueDate
      ? `Due: ${formatDate(input.dueDate, undefined, input.locale)}`
      : "",
    "Please use the payment details on this invoice.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generatePaymentQr(input: PaymentQrInput) {
  const text = buildPaymentQrText(input);
  const dataUrl = await QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#18181b", light: "#ffffff" },
  });

  return {
    dataUrl,
    text,
    label: input.paymentLink
      ? "Scan to pay online"
      : getUpiAddress(input)
        ? "Scan to pay with UPI"
        : "Scan for payment details",
  };
}
