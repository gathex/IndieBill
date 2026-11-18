import { headers } from "next/headers";

export async function getRequestOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost:3000";
  const protocol =
    headersList.get("x-forwarded-proto") ??
    (host.includes("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${protocol}://${host}`;
}

export async function getInvoiceShareUrl(invoiceId: string): Promise<string> {
  return `${await getRequestOrigin()}/invoices/${invoiceId}`;
}
