"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  isValidCountryCode,
  isValidCurrencyCode,
  isValidLanguageCode,
} from "@/lib/locale-data";

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
  currency: z.string().refine(isValidCurrencyCode, "Unsupported currency"),
  country: z.string().refine(isValidCountryCode, "Unsupported country"),
  language: z.string().refine(isValidLanguageCode, "Unsupported language"),
  logoDataUrl: logoDataUrlSchema.nullable(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export async function updateSettings(input: SettingsInput) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const data = settingsSchema.parse(input);
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name.trim() || null,
      businessName: data.businessName.trim() || null,
      businessAddress: data.businessAddress.trim() || null,
      currency: data.currency,
      country: data.country,
      language: data.language,
      logoDataUrl: data.logoDataUrl,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/quotations");
  revalidatePath("/payments");
  revalidatePath("/clients");
}
