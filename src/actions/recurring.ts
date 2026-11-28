"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  generateInvoiceFromRecurring,
  RECURRING_FREQUENCIES,
} from "@/lib/recurring";

const recurringItemSchema = z.object({
  description: z.string().min(1, "Every item needs a description."),
  quantity: z.number().positive("Quantity must be positive."),
  rate: z.number().min(0, "Rate must be 0 or higher."),
  unit: z.string().optional().nullable(),
  hsnSac: z.string().max(20).optional().nullable(),
});

const recurringSchema = z.object({
  clientId: z.string().min(1, "Select a client."),
  title: z.string().min(1, "Title is required."),
  frequency: z.enum(RECURRING_FREQUENCIES),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().optional().nullable(),
  dueInDays: z.number().int().min(0).default(15),
  autoSendEmail: z.boolean().default(false),
  currency: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  discount: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  gstEnabled: z.boolean().default(false),
  items: z.array(recurringItemSchema).min(1, "Add at least one line item."),
});

export type RecurringInvoiceInput = z.infer<typeof recurringSchema>;

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("You must be signed in.");
  }
  return userId;
}

function revalidateRecurring() {
  revalidatePath("/dashboard");
  revalidatePath("/recurring");
  revalidatePath("/invoices");
  revalidatePath("/clients");
}

export async function createRecurringInvoice(input: RecurringInvoiceInput) {
  const userId = await requireUserId();
  const data = recurringSchema.parse(input);

  // Validate client ownership
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, userId },
  });
  if (!client) {
    throw new Error("Client not found.");
  }

  const startDate = new Date(data.startDate);
  const nextRunDate = new Date(startDate);
  const endDate = data.endDate ? new Date(data.endDate) : null;

  const recurring = await prisma.recurringInvoice.create({
    data: {
      userId,
      clientId: client.id,
      title: data.title.trim(),
      frequency: data.frequency,
      startDate,
      nextRunDate,
      endDate,
      dueInDays: data.dueInDays,
      autoSendEmail: data.autoSendEmail,
      currency: data.currency?.trim() || null,
      notes: data.notes?.trim() || null,
      discount: data.discount,
      taxRate: data.taxRate,
      gstEnabled: data.gstEnabled,
      items: {
        create: data.items.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          rate: item.rate,
          unit: item.unit?.trim() || null,
          hsnSac: item.hsnSac?.trim() || null,
        })),
      },
    },
    include: {
      items: true,
      client: true,
    },
  });

  revalidateRecurring();
  return recurring;
}

export async function updateRecurringInvoice(
  id: string,
  input: RecurringInvoiceInput,
) {
  const userId = await requireUserId();
  const data = recurringSchema.parse(input);

  // Ownership check
  const existing = await prisma.recurringInvoice.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Recurring schedule not found.");
  }

  // Validate client ownership
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, userId },
  });
  if (!client) {
    throw new Error("Client not found.");
  }

  const startDate = new Date(data.startDate);
  const endDate = data.endDate ? new Date(data.endDate) : null;

  // Re-calculate nextRunDate if start date changed and is in the future
  let nextRunDate = existing.nextRunDate;
  if (existing.startDate.toISOString() !== startDate.toISOString()) {
    nextRunDate = startDate;
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Delete existing items
    await tx.recurringInvoiceItem.deleteMany({
      where: { recurringInvoiceId: id },
    });

    return tx.recurringInvoice.update({
      where: { id },
      data: {
        clientId: client.id,
        title: data.title.trim(),
        frequency: data.frequency,
        startDate,
        nextRunDate,
        endDate,
        dueInDays: data.dueInDays,
        autoSendEmail: data.autoSendEmail,
        currency: data.currency?.trim() || null,
        notes: data.notes?.trim() || null,
        discount: data.discount,
        taxRate: data.taxRate,
        gstEnabled: data.gstEnabled,
        items: {
          create: data.items.map((item) => ({
            description: item.description.trim(),
            quantity: item.quantity,
            rate: item.rate,
            unit: item.unit?.trim() || null,
            hsnSac: item.hsnSac?.trim() || null,
          })),
        },
      },
      include: {
        items: true,
        client: true,
      },
    });
  });

  revalidateRecurring();
  return updated;
}

export async function deleteRecurringInvoice(id: string) {
  const userId = await requireUserId();

  // Ownership check
  const existing = await prisma.recurringInvoice.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Recurring schedule not found.");
  }

  await prisma.recurringInvoice.delete({
    where: { id },
  });

  revalidateRecurring();
  return { success: true, id };
}

export async function toggleRecurringStatus(id: string) {
  const userId = await requireUserId();

  // Ownership check
  const existing = await prisma.recurringInvoice.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Recurring schedule not found.");
  }

  const newStatus = existing.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

  const updated = await prisma.recurringInvoice.update({
    where: { id },
    data: { status: newStatus },
  });

  revalidateRecurring();
  return { success: true, status: updated.status };
}

export async function generateRecurringNow(id: string) {
  const userId = await requireUserId();

  // Ownership check
  const existing = await prisma.recurringInvoice.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Recurring schedule not found.");
  }

  const result = await generateInvoiceFromRecurring(id);

  revalidateRecurring();
  return {
    success: true,
    invoiceId: result.invoice.id,
    invoiceNumber: result.invoice.number,
    nextRunDate: result.nextRunDate,
  };
}
