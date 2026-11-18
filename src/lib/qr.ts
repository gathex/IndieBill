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
}

export function buildPaymentQrText(input: PaymentQrInput): string {
  if (input.paymentLink) return input.paymentLink;

  return [
    "PAYMENT REQUEST",
    `Invoice: ${input.invoiceNumber}`,
    `Amount: ${formatCurrency(input.amount, input.currency, input.locale)}`,
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
    label: input.paymentLink ? "Scan to pay online" : "Scan for payment details",
  };
}
