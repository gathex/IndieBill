"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const settingsSchema = z.object({
  name: z.string().max(120),
  businessName: z.string().max(120),
  businessAddress: z.string().max(500),
  currency: z.enum(["USD", "EUR", "GBP", "INR", "CAD", "AUD"]),
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
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
}
