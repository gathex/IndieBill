import { prisma } from "./db";

export async function getUserSettings(userId: string) {
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
    locale: `${language}-${country}`,
  };
}
