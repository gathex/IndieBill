"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { isValidCurrencyCode } from "@/lib/locale-data";
import { isValidGstin } from "@/lib/gst";

const onboardingSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(1, "Business / Brand Name is required.")
      .max(120),
    phone: z.string().trim().max(40).optional().default(""),
    businessAddress: z.string().trim().max(500).optional().default(""),
    state: z.string().trim().max(100).optional().default(""),
    currency: z
      .string()
      .trim()
      .refine(isValidCurrencyCode, "Unsupported currency"),
    gstRegistered: z.boolean(),
    gstin: z.string().trim().max(15).optional().default(""),
    defaultGstRate: z.number().min(0).max(100).nullable().optional(),
    invoicePrefix: z.string().trim().max(20).optional().default("INV-"),
    qrUpiId: z.string().trim().max(120).optional().default(""),
    bankName: z.string().trim().max(120).optional().default(""),
    qrAccountNumber: z.string().trim().max(60).optional().default(""),
    bankIfsc: z.string().trim().max(20).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.gstRegistered && data.gstin && !isValidGstin(data.gstin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gstin"],
        message: "Enter a valid 15-character GSTIN (e.g. 27AAPFU0939F1ZV).",
      });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export async function completeOnboarding(
  input: OnboardingInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ||
        "Please check your onboarding details and try again.",
    };
  }

  const data = parsed.data;
  const prefix = data.invoicePrefix || "INV-";

  // Align country to IN automatically if INR or an Indian state was chosen
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { country: true, qrName: true },
  });

  const inferredCountry =
    data.currency === "INR" || Boolean(data.state)
      ? "IN"
      : existing?.country || "US";

  await prisma.user.update({
    where: { id: userId },
    data: {
      businessName: data.businessName,
      phone: data.phone || null,
      businessAddress: data.businessAddress || null,
      state: data.state || null,
      currency: data.currency,
      country: inferredCountry,
      gstin: data.gstRegistered && data.gstin ? data.gstin.toUpperCase() : null,
      defaultGstRate:
        data.gstRegistered && data.defaultGstRate != null
          ? data.defaultGstRate
          : null,
      invoicePrefix: prefix,
      qrUpiId: data.qrUpiId || null,
      qrName: existing?.qrName || data.businessName,
      bankName: data.bankName || null,
      qrAccountNumber: data.qrAccountNumber || null,
      bankIfsc: data.bankIfsc ? data.bankIfsc.toUpperCase() : null,
      onboardingCompleted: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/settings");
  revalidatePath("/invoices");
  revalidatePath("/quotations");

  return { ok: true };
}

export async function skipOnboarding(): Promise<{ ok: true }> {
  const userId = await requireUserId();

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { ok: true };
}
