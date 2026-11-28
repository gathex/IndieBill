"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  isValidCountryCode,
  isValidCurrencyCode,
  isValidLanguageCode,
} from "@/lib/locale-data";
import { isValidGstin } from "@/lib/gst";

const logoDataUrlSchema = z
  .string()
  .max(1_500_000, "Logo is too large.")
  .refine(
    (value) =>
      /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=\s]+$/.test(value),
    "Logo must be a PNG or JPG image.",
  );

const settingsSchema = z.object({
  name: z.string().max(120),
  businessName: z.string().max(120),
  businessAddress: z.string().max(500),
  phone: z.string().max(40).optional(),
  currency: z.string().refine(isValidCurrencyCode, "Unsupported currency"),
  country: z.string().refine(isValidCountryCode, "Unsupported country"),
  language: z.string().refine(isValidLanguageCode, "Unsupported language"),
  logoDataUrl: logoDataUrlSchema.nullable(),
  qrName: z.string().max(120).optional(),
  qrVpa: z.string().max(120).optional(),
  qrUpiId: z.string().max(120).optional(),
  qrAccountNumber: z.string().max(60).optional(),
  bankName: z.string().max(120).optional(),
  bankIfsc: z.string().max(20).optional(),
  invoicePrefix: z.string().max(20).optional(),
  defaultGstRate: z.union([z.number().min(0).max(100), z.nan(), z.null()]).optional(),
  gstin: z
    .string()
    .max(15)
    .optional()
    .refine((val) => !val || !val.trim() || isValidGstin(val), {
      message: "GSTIN must be a valid 15-character Indian GST identification number.",
    }),
  state: z.string().max(100).optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export async function updateSettings(input: SettingsInput) {
  const userId = await requireUserId();

  const data = settingsSchema.parse(input);
  const parsedGstRate =
    typeof data.defaultGstRate === "number" && Number.isFinite(data.defaultGstRate)
      ? data.defaultGstRate
      : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name.trim() || null,
      businessName: data.businessName.trim() || null,
      businessAddress: data.businessAddress.trim() || null,
      phone: data.phone?.trim() || null,
      currency: data.currency,
      country: data.country,
      language: data.language,
      logoDataUrl: data.logoDataUrl,
      qrName: data.qrName?.trim() || null,
      qrVpa: data.qrVpa?.trim() || null,
      qrUpiId: data.qrUpiId?.trim() || null,
      qrAccountNumber: data.qrAccountNumber?.trim() || null,
      bankName: data.bankName?.trim() || null,
      bankIfsc: data.bankIfsc?.trim().toUpperCase() || null,
      invoicePrefix: data.invoicePrefix?.trim() || "INV-",
      defaultGstRate: parsedGstRate,
      gstin: data.gstin?.trim().toUpperCase() || null,
      state: data.state?.trim() || null,
      onboardingCompleted: true,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/quotations");
  revalidatePath("/payments");
  revalidatePath("/clients");
}
