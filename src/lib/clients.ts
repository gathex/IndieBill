import { prisma } from "./db";

export async function getUserClients(userId: string) {
  return prisma.client.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}
