import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getUserExpenses, expenseSchema } from "@/lib/expenses";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const month = searchParams.get("month") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  try {
    const report = await getUserExpenses(session.user.id, {
      search,
      category,
      month,
      startDate,
      endDate,
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
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

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
