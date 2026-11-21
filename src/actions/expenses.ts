"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { expenseSchema, ExpenseInput } from "@/lib/expenses";

function getUserId(session: { user?: { id?: string } } | null) {
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function createExpenseAction(data: ExpenseInput) {
  const session = await auth();
  const userId = getUserId(session);

  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(", ") || "Validation failed"
    );
  }

  const expense = await prisma.expense.create({
    data: {
      userId,
      title: parsed.data.title.trim(),
      category: parsed.data.category.trim(),
      amount: Number(parsed.data.amount) || 0,
      date: new Date(parsed.data.date),
      vendor: parsed.data.vendor?.trim() || null,
      paymentMethod: parsed.data.paymentMethod?.trim() || null,
      taxAmount: Number(parsed.data.taxAmount) || 0,
      notes: parsed.data.notes?.trim() || null,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return expense;
}

export async function updateExpenseAction(
  id: string,
  data: Partial<ExpenseInput>
) {
  const session = await auth();
  const userId = getUserId(session);

  const existing = await prisma.expense.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Expense not found");
  }

  const partialSchema = expenseSchema.partial();
  const parsed = partialSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(", ") || "Validation failed"
    );
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title.trim();
  if (parsed.data.category !== undefined)
    updateData.category = parsed.data.category.trim();
  if (parsed.data.amount !== undefined)
    updateData.amount = Number(parsed.data.amount) || 0;
  if (parsed.data.date !== undefined) updateData.date = new Date(parsed.data.date);
  if (parsed.data.vendor !== undefined)
    updateData.vendor = parsed.data.vendor?.trim() || null;
  if (parsed.data.paymentMethod !== undefined)
    updateData.paymentMethod = parsed.data.paymentMethod?.trim() || null;
  if (parsed.data.taxAmount !== undefined)
    updateData.taxAmount = Number(parsed.data.taxAmount) || 0;
  if (parsed.data.notes !== undefined)
    updateData.notes = parsed.data.notes?.trim() || null;

  const updated = await prisma.expense.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteExpenseAction(id: string) {
  const session = await auth();
  const userId = getUserId(session);

  const existing = await prisma.expense.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Expense not found");
  }

  await prisma.expense.delete({
    where: { id },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}
