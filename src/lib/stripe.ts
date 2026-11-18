import Stripe from "stripe";

interface CreatePaymentLinkParams {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
}

export async function createPaymentLink(
  params: CreatePaymentLinkParams,
): Promise<string | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    // Stripe not configured — no payment link can be created in MVP.
    return null;
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-10-28.endive",
  });

  const currency = (params.currency ?? "usd").toLowerCase();
  const price = await stripe.prices.create({
    unit_amount: Math.round(params.amount * 100),
    currency,
    metadata: {
      invoiceId: params.invoiceId,
      invoiceNumber: params.invoiceNumber,
    },
  });

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId: params.invoiceId,
      invoiceNumber: params.invoiceNumber,
    },
  });

  return paymentLink.url;
}
