import { z } from "zod";
import { prisma } from "@/lib/db";
import { round2 } from "@/lib/invoices";

export const EXPENSE_CATEGORIES = [
  "Software",
  "Hardware",
  "Travel",
  "Office",
  "Marketing",
  "Subcontractor",
  "Utilities",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_PAYMENT_METHODS = [
  "Card",
  "Bank Transfer",
  "UPI",
  "Cash",
  "Other",
] as const;

export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

export const expenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  category: z.string().trim().min(1, "Category is required."),
  amount: z.coerce.number().min(0, "Amount must be 0 or greater"),
  date: z.coerce.date().default(() => new Date()),
  vendor: z.string().trim().max(120).nullish(),
  paymentMethod: z.string().trim().max(60).nullish(),
  taxAmount: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(2000).nullish(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export interface GetExpensesOptions {
  search?: string;
  category?: string;
  month?: string; // e.g. "2026-11"
  startDate?: string | Date;
  endDate?: string | Date;
}

export async function getUserExpenses(
  userId: string,
  options: GetExpensesOptions = {}
) {
  const { search, category, month, startDate, endDate } = options;

  let dateFilter: { gte?: Date; lte?: Date } | undefined;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10) - 1;
    const start = new Date(year, m, 1, 0, 0, 0, 0);
    const end = new Date(year, m + 1, 0, 23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  } else if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
  }

  const whereClause: {
    userId: string;
    category?: string;
    date?: { gte?: Date; lte?: Date };
  } = {
    userId,
    ...(category && category !== "ALL" ? { category } : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
  };

  const allExpenses = await prisma.expense.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
  });

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const thisMonthExpenses = await prisma.expense.findMany({
    where: {
      userId,
      date: { gte: thisMonthStart, lte: thisMonthEnd },
    },
    select: { amount: true },
  });

  const thisMonthTotal = round2(
    thisMonthExpenses.reduce((sum, item) => sum + item.amount, 0)
  );

  let filteredExpenses = allExpenses;
  if (search && search.trim()) {
    const needle = search.trim().toLowerCase();
    filteredExpenses = allExpenses.filter((item) => {
      return (
        item.title.toLowerCase().includes(needle) ||
        (item.vendor && item.vendor.toLowerCase().includes(needle)) ||
        (item.notes && item.notes.toLowerCase().includes(needle)) ||
        item.category.toLowerCase().includes(needle)
      );
    });
  }

  const total = round2(
    filteredExpenses.reduce((sum, item) => sum + item.amount, 0)
  );

  return {
    expenses: filteredExpenses,
    total,
    count: filteredExpenses.length,
    thisMonthTotal,
  };
}

export async function getExpenseById(id: string, userId: string) {
  return prisma.expense.findFirst({
    where: { id, userId },
  });
}

export interface MonthlyFinancialSummary {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // "Nov 2026"
  shortLabel: string; // "Nov"
  income: number;
  expenses: number;
  netProfit: number;
}

export interface UserFinancialReport {
  monthlyBreakdown: MonthlyFinancialSummary[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  thisMonthNetProfit: number;
  profitMarginPercent: number;
}

export async function getUserFinancialReport(
  userId: string,
  monthsCount = 6
): Promise<UserFinancialReport> {
  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      select: { amount: true, paymentDate: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      select: { amount: true, date: true },
    }),
  ]);

  const now = new Date();
  const monthlyBreakdown: MonthlyFinancialSummary[] = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const shortLabel = d.toLocaleDateString("en-US", { month: "short" });

    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const mIncome = round2(
      payments
        .filter((p) => p.paymentDate >= start && p.paymentDate <= end)
        .reduce((sum, p) => sum + p.amount, 0)
    );

    const mExpenses = round2(
      expenses
        .filter((e) => e.date >= start && e.date <= end)
        .reduce((sum, e) => sum + e.amount, 0)
    );

    monthlyBreakdown.push({
      monthKey,
      monthLabel,
      shortLabel,
      income: mIncome,
      expenses: mExpenses,
      netProfit: round2(mIncome - mExpenses),
    });
  }

  const totalIncome = round2(payments.reduce((sum, p) => sum + p.amount, 0));
  const totalExpenses = round2(expenses.reduce((sum, e) => sum + e.amount, 0));
  const netProfit = round2(totalIncome - totalExpenses);

  const curMonth = monthlyBreakdown[monthlyBreakdown.length - 1];
  const thisMonthIncome = curMonth ? curMonth.income : 0;
  const thisMonthExpenses = curMonth ? curMonth.expenses : 0;
  const thisMonthNetProfit = round2(thisMonthIncome - thisMonthExpenses);

  const profitMarginPercent =
    totalIncome > 0 ? round2((netProfit / totalIncome) * 100) : 0;

  return {
    monthlyBreakdown,
    totalIncome,
    totalExpenses,
    netProfit,
    thisMonthIncome,
    thisMonthExpenses,
    thisMonthNetProfit,
    profitMarginPercent,
  };
}
