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
      phone: true,
      currency: true,
      country: true,
      language: true,
      logoDataUrl: true,
      qrName: true,
      qrVpa: true,
      qrUpiId: true,
      qrAccountNumber: true,
      bankName: true,
      bankIfsc: true,
      gstin: true,
      state: true,
      defaultGstRate: true,
      invoicePrefix: true,
      onboardingCompleted: true,
      remindersEnabled: true,
      remindBeforeDays: true,
      remindOnDueDate: true,
      remindAfterDays: true,
    },
  });

  const currency = user?.currency ?? "INR";
  const country = user?.country ?? "IN";
  const language = user?.language ?? "en";

  return {
    displayName: user?.name ?? user?.email ?? "There",
    email: user?.email ?? "",
    businessName: user?.businessName ?? user?.name ?? user?.email ?? "My Business",
    rawBusinessName: user?.businessName ?? "",
    hasBusinessName: Boolean(user?.businessName?.trim()),
    businessAddress: user?.businessAddress ?? null,
    phone: user?.phone ?? "",
    currency,
    country,
    language,
    logoDataUrl: user?.logoDataUrl ?? null,
    qrName: user?.qrName ?? null,
    qrVpa: user?.qrVpa ?? null,
    qrUpiId: user?.qrUpiId ?? null,
    qrAccountNumber: user?.qrAccountNumber ?? null,
    bankName: user?.bankName ?? null,
    bankIfsc: user?.bankIfsc ?? null,
    gstin: user?.gstin ?? null,
    state: user?.state ?? null,
    defaultGstRate: user?.defaultGstRate ?? null,
    invoicePrefix: user?.invoicePrefix ?? "INV-",
    onboardingCompleted: user?.onboardingCompleted ?? false,
    remindersEnabled: user?.remindersEnabled ?? true,
    remindBeforeDays: user?.remindBeforeDays ?? 3,
    remindOnDueDate: user?.remindOnDueDate ?? true,
    remindAfterDays: user?.remindAfterDays ?? "3,7,14",
    locale: `${language}-${country}`,
  };
});
