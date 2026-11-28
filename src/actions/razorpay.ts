"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getRazorpayClient } from "@/lib/razorpay";
import { getInvoiceBalance } from "@/lib/payments";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("You must be signed in.");
  }
  return userId;
}

export async function createRazorpayPaymentLink(invoiceId: string): Promise<string> {
  const userId = await requireUserId();

  const { client: razorpay, error: configError } = getRazorpayClient();
  if (!razorpay || configError) {
    throw new Error(
      configError || "Razorpay is not configured. Missing API keys in environment.",
    );
  }

  // Enforce ownership
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: {
      client: true,
      payments: true,
      user: { select: { currency: true } },
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found or access denied.");
  }

  const balanceDue = getInvoiceBalance(invoice.total, invoice.payments);
  if (balanceDue <= 0) {
    throw new Error("This invoice is already paid in full.");
  }

  // Calculate amount in paise (1 INR = 100 paise)
  const amountInPaise = Math.round(balanceDue * 100);

  const currency = invoice.user?.currency?.toUpperCase() || "INR";

  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: amountInPaise,
      currency,
      accept_partial: false,
      description: `Invoice ${invoice.number}`,
      customer: {
        name: invoice.client.name,
        email: invoice.client.email,
        ...(invoice.client.phone ? { contact: invoice.client.phone } : {}),
      },
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: false,
      notes: {
        invoiceId: invoice.id,
        userId,
      },
    });

    const shortUrl = paymentLink.short_url;
    const linkId = paymentLink.id;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        razorpayPaymentLinkId: linkId,
        razorpayPaymentLinkUrl: shortUrl,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath(`/invoices/${invoiceId}/preview`);

    return shortUrl;
  } catch (err) {
    console.error("[Razorpay] Failed to create payment link:", err);
    throw new Error(
      err instanceof Error
        ? err.message
        : "Failed to create Razorpay payment link.",
    );
  }
}
