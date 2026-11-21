import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserSettings } from "@/lib/users";
import { getUserExpenses } from "@/lib/expenses";
import { ExpensesManager } from "@/components/expenses-manager";

export const metadata = {
  title: "Expenses",
};

export default async function ExpensesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [expensesData, settings] = await Promise.all([
    getUserExpenses(userId),
    getUserSettings(userId),
  ]);

  const serializedExpenses = expensesData.expenses.map((exp) => ({
    id: exp.id,
    title: exp.title,
    category: exp.category,
    amount: exp.amount,
    date: exp.date.toISOString(),
    vendor: exp.vendor,
    paymentMethod: exp.paymentMethod,
    taxAmount: exp.taxAmount,
    notes: exp.notes,
    createdAt: exp.createdAt.toISOString(),
    updatedAt: exp.updatedAt.toISOString(),
  }));

  return (
    <ExpensesManager
      initialExpenses={serializedExpenses}
      currency={settings.currency}
      locale={settings.locale}
    />
  );
}
