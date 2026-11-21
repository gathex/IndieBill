import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { expenseSchema } from "@/lib/expenses";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const expense = await prisma.expense.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error(`GET /api/expenses/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const body = await request.json();
    const partialSchema = expenseSchema.partial();
    const parsed = partialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
    if (parsed.data.category !== undefined)
      data.category = parsed.data.category.trim();
    if (parsed.data.amount !== undefined)
      data.amount = Number(parsed.data.amount) || 0;
    if (parsed.data.date !== undefined) data.date = new Date(parsed.data.date);
    if (parsed.data.vendor !== undefined)
      data.vendor = parsed.data.vendor?.trim() || null;
    if (parsed.data.paymentMethod !== undefined)
      data.paymentMethod = parsed.data.paymentMethod?.trim() || null;
    if (parsed.data.taxAmount !== undefined)
      data.taxAmount = Number(parsed.data.taxAmount) || 0;
    if (parsed.data.notes !== undefined)
      data.notes = parsed.data.notes?.trim() || null;

    const updated = await prisma.expense.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/expenses/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error(`DELETE /api/expenses/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
