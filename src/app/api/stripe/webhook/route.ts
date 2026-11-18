import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { recordStripePayment } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-10-28.endive" });
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId;
    if (invoiceId) {
      const amount =
        typeof session.amount_total === "number" && session.amount_total > 0
          ? session.amount_total / 100
          : undefined;
      await recordStripePayment({
        invoiceId,
        amount,
        reference: session.id,
      });
      revalidatePath("/dashboard");
      revalidatePath("/invoices");
      revalidatePath("/payments");
      revalidatePath(`/invoices/${invoiceId}`);
    }
  }

  return NextResponse.json({ received: true });
}
