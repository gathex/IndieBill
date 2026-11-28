import { cache } from "react";
import { prisma } from "./db";

export const getUserSettings = cache(async function getUserSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      businessName: true,
      businessAddress: true,
      currency: true,
      country: true,
      language: true,
      logoDataUrl: true,
      qrName: true,
      qrVpa: true,
      qrUpiId: true,
      qrAccountNumber: true,
      gstin: true,
      state: true,
      remindersEnabled: true,
      remindBeforeDays: true,
      remindOnDueDate: true,
      remindAfterDays: true,
    },
  });

  const currency = user?.currency ?? "USD";
  const country = user?.country ?? "US";
  const language = user?.language ?? "en";

  return {
    displayName: user?.name ?? user?.email ?? "There",
    email: user?.email ?? "",
    businessName: user?.businessName ?? user?.name ?? user?.email ?? "My Business",
    businessAddress: user?.businessAddress ?? null,
    currency,
    country,
    language,
    logoDataUrl: user?.logoDataUrl ?? null,
    qrName: user?.qrName ?? null,
    qrVpa: user?.qrVpa ?? null,
    qrUpiId: user?.qrUpiId ?? null,
    qrAccountNumber: user?.qrAccountNumber ?? null,
    gstin: user?.gstin ?? null,
    state: user?.state ?? null,
    remindersEnabled: user?.remindersEnabled ?? true,
    remindBeforeDays: user?.remindBeforeDays ?? 3,
    remindOnDueDate: user?.remindOnDueDate ?? true,
    remindAfterDays: user?.remindAfterDays ?? "3,7,14",
    locale: `${language}-${country}`,
  };
});
