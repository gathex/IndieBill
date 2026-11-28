import { headers } from "next/headers";
export { buildMailtoUrl, type BuildMailtoUrlParams } from "./mailto";

export async function getRequestOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  try {
    const headersList = await headers();
    const host =
      headersList.get("x-forwarded-host") ??
      headersList.get("host");

    if (host) {
      const protocol =
        headersList.get("x-forwarded-proto") ??
        (host.includes("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https");

      return `${protocol}://${host}`;
    }
  } catch {
    // Fallback below when headers() is unavailable (e.g. background cron jobs)
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export async function getInvoiceShareUrl(invoiceId: string): Promise<string> {
  const origin = await getRequestOrigin();
  return `${origin}/share/invoices/${invoiceId}`;
}

export async function getQuotationShareUrl(quotationId: string): Promise<string> {
  const origin = await getRequestOrigin();
  return `${origin}/share/quotations/${quotationId}`;
}
