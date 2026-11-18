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
    },
  });

  return {
    displayName: user?.name ?? user?.email ?? "There",
    businessName: user?.businessName ?? user?.name ?? user?.email ?? "My Business",
    businessAddress: user?.businessAddress ?? null,
    currency: user?.currency ?? "USD",
  };
}
