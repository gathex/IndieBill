import { z } from "zod";
import { prisma } from "@/lib/db";

export const catalogItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  description: z.string().trim().max(2000).nullish(),
  rate: z.coerce.number().min(0, "Rate must be 0 or greater").default(0),
  unit: z.string().trim().max(40).nullish(),
  hsnSac: z.string().trim().max(40).nullish(),
  defaultTaxRate: z.coerce.number().min(0).max(100).nullish(),
  isActive: z.boolean().default(true),
});

export type CatalogItemInput = z.infer<typeof catalogItemSchema>;

export interface GetCatalogItemsOptions {
  search?: string;
  activeOnly?: boolean;
}

export async function getUserCatalogItems(
  userId: string,
  options: GetCatalogItemsOptions = {}
) {
  const { search, activeOnly } = options;

  const items = await prisma.catalogItem.findMany({
    where: {
      userId,
      ...(activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  if (!search || !search.trim()) {
    return items;
  }

  const needle = search.trim().toLowerCase();
  return items.filter((item) => {
    return (
      item.name.toLowerCase().includes(needle) ||
      (item.description && item.description.toLowerCase().includes(needle)) ||
      (item.unit && item.unit.toLowerCase().includes(needle)) ||
      (item.hsnSac && item.hsnSac.toLowerCase().includes(needle))
    );
  });
}

export async function getCatalogItemById(id: string, userId: string) {
  return prisma.catalogItem.findFirst({
    where: { id, userId },
  });
}
