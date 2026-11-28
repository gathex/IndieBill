import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { recordRazorpayPayment } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Razorpay webhook secret is not configured on the server." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing x-razorpay-signature header." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.warn("[Razorpay Webhook] Invalid signature received.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment_link?: {
        entity?: {
          id?: string;
          amount?: number;
          notes?: Record<string, string>;
        };
      };
      payment?: {
        entity?: {
          id?: string;
          amount?: number;
          method?: string;
          notes?: Record<string, string>;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (event.event === "payment_link.paid") {
    const payload = event.payload || {};
    const paymentLinkEntity = payload.payment_link?.entity || {};
    const paymentEntity = payload.payment?.entity || {};

    const invoiceId =
      paymentLinkEntity.notes?.invoiceId ||
      paymentEntity.notes?.invoiceId;

    const reference = paymentEntity.id || paymentLinkEntity.id;

    if (invoiceId && reference) {
      const amount =
        typeof paymentEntity.amount === "number" && paymentEntity.amount > 0
          ? paymentEntity.amount / 100
          : undefined;

      const paymentMethod = paymentEntity.method
        ? `Paid online via Razorpay (${String(paymentEntity.method).toUpperCase()})`
        : "Paid online via Razorpay.";

      await recordRazorpayPayment({
        invoiceId,
        amount,
        reference,
        notes: paymentMethod,
      });

      revalidatePath("/dashboard");
      revalidatePath("/invoices");
      revalidatePath("/payments");
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath(`/invoices/${invoiceId}/preview`);
    }
  }

  return NextResponse.json({ received: true });
}
