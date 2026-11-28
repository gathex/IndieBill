"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import {
  catalogItemSchema,
  type CatalogItemInput,
} from "@/lib/catalog";

export type { CatalogItemInput };

function normalizeInput(input: CatalogItemInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    rate: Number(input.rate) || 0,
    unit: input.unit?.trim() || null,
    hsnSac: input.hsnSac?.trim() || null,
    defaultTaxRate:
      input.defaultTaxRate !== undefined && input.defaultTaxRate !== null && !isNaN(Number(input.defaultTaxRate))
        ? Number(input.defaultTaxRate)
        : null,
    isActive: input.isActive ?? true,
  };
}

export async function createCatalogItem(input: CatalogItemInput) {
  const userId = await requireUserId();
  const validated = catalogItemSchema.parse(input);
  const data = normalizeInput(validated);

  const item = await prisma.catalogItem.create({
    data: {
      userId,
      ...data,
    },
  });

  revalidatePath("/catalog");
  revalidatePath("/invoices/new");
  revalidatePath("/quotations/new");
  return item;
}

export async function updateCatalogItem(id: string, input: Partial<CatalogItemInput>) {
  const userId = await requireUserId();
  const existing = await prisma.catalogItem.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Catalog item not found.");

  const partialSchema = catalogItemSchema.partial();
  const validated = partialSchema.parse(input);

  const data: Record<string, unknown> = {};
  if (validated.name !== undefined) data.name = validated.name.trim();
  if (validated.description !== undefined)
    data.description = validated.description?.trim() || null;
  if (validated.rate !== undefined) data.rate = Number(validated.rate) || 0;
  if (validated.unit !== undefined) data.unit = validated.unit?.trim() || null;
  if (validated.hsnSac !== undefined) data.hsnSac = validated.hsnSac?.trim() || null;
  if (validated.defaultTaxRate !== undefined) {
    data.defaultTaxRate =
      validated.defaultTaxRate !== null && !isNaN(Number(validated.defaultTaxRate))
        ? Number(validated.defaultTaxRate)
        : null;
  }
  if (validated.isActive !== undefined) data.isActive = validated.isActive;

  const item = await prisma.catalogItem.update({
    where: { id },
    data,
  });

  revalidatePath("/catalog");
  revalidatePath("/invoices/new");
  revalidatePath("/quotations/new");
  return item;
}

export async function deleteCatalogItem(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.catalogItem.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Catalog item not found.");

  await prisma.catalogItem.delete({
    where: { id },
  });

  revalidatePath("/catalog");
  revalidatePath("/invoices/new");
  revalidatePath("/quotations/new");
  return { success: true };
}

export async function toggleCatalogItemActive(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.catalogItem.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Catalog item not found.");

  const item = await prisma.catalogItem.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  revalidatePath("/catalog");
  return item;
}
