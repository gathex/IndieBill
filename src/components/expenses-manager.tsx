"use client";

import { useState, useMemo, useTransition } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
} from "@/lib/expenses";
import {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
} from "@/actions/expenses";

export interface SerializedExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  vendor: string | null;
  paymentMethod: string | null;
  taxAmount: number;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ExpensesManagerProps {
  initialExpenses: SerializedExpense[];
  currency?: string;
  locale?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Software: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  Hardware: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  Travel: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  Office: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  Marketing: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800",
  Subcontractor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  Utilities: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
  Other: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
};

export function ExpensesManager({
  initialExpenses,
  currency = "INR",
  locale,
}: ExpensesManagerProps) {
  const [expenses, setExpenses] = useState<SerializedExpense[]>(initialExpenses);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SerializedExpense | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [formDate, setFormDate] = useState("");
  const [formVendor, setFormVendor] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>(EXPENSE_PAYMENT_METHODS[0]);
  const [formTaxAmount, setFormTaxAmount] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<SerializedExpense | null>(null);

  const [isPending, startTransition] = useTransition();
  const [listParentRef] = useAutoAnimate<HTMLTableSectionElement>();

  const money = (val: number) => formatCurrency(val, currency, locale);

  // Available months from current data plus current month
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    set.add(curKey);

    for (const exp of expenses) {
      if (exp.date) {
        const d = new Date(exp.date);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          set.add(key);
        }
      }
    }
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Category filter
      if (categoryFilter !== "ALL" && exp.category !== categoryFilter) {
        return false;
      }
      // Month filter
      if (monthFilter !== "ALL") {
        const d = new Date(exp.date);
        const expMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (expMonthKey !== monthFilter) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const needle = searchQuery.trim().toLowerCase();
        const matchesTitle = exp.title.toLowerCase().includes(needle);
        const matchesVendor = exp.vendor ? exp.vendor.toLowerCase().includes(needle) : false;
        const matchesCategory = exp.category.toLowerCase().includes(needle);
        const matchesNotes = exp.notes ? exp.notes.toLowerCase().includes(needle) : false;
        if (!matchesTitle && !matchesVendor && !matchesCategory && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, categoryFilter, monthFilter, searchQuery]);

  // Calculated totals
  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return expenses
      .filter((exp) => {
        const d = new Date(exp.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === curKey;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  function openCreateModal() {
    setEditingExpense(null);
    setFormTitle("");
    setFormAmount("");
    setFormCategory(EXPENSE_CATEGORIES[0]);
    const today = new Date().toISOString().split("T")[0];
    setFormDate(today);
    setFormVendor("");
    setFormPaymentMethod(EXPENSE_PAYMENT_METHODS[0]);
    setFormTaxAmount("");
    setFormNotes("");
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(exp: SerializedExpense) {
    setEditingExpense(exp);
    setFormTitle(exp.title);
    setFormAmount(String(exp.amount));
    setFormCategory(exp.category);
    const dateFormatted = new Date(exp.date).toISOString().split("T")[0];
    setFormDate(dateFormatted);
    setFormVendor(exp.vendor ?? "");
    setFormPaymentMethod(exp.paymentMethod ?? EXPENSE_PAYMENT_METHODS[0]);
    setFormTaxAmount(exp.taxAmount > 0 ? String(exp.taxAmount) : "");
    setFormNotes(exp.notes ?? "");
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingExpense(null);
    setFormError(null);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const title = formTitle.trim();
    if (!title) {
      setFormError("Title is required.");
      return;
    }

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount < 0) {
      setFormError("Amount must be a non-negative number.");
      return;
    }

    const taxAmount = formTaxAmount.trim() ? parseFloat(formTaxAmount) : 0;
    if (isNaN(taxAmount) || taxAmount < 0) {
      setFormError("Tax amount must be 0 or greater.");
      return;
    }

    const dateVal = formDate ? new Date(formDate) : new Date();

    startTransition(async () => {
      try {
        if (editingExpense) {
          const updated = await updateExpenseAction(editingExpense.id, {
            title,
            amount,
            category: formCategory,
            date: dateVal,
            vendor: formVendor.trim() || null,
            paymentMethod: formPaymentMethod.trim() || null,
            taxAmount,
            notes: formNotes.trim() || null,
          });

          setExpenses((prev) =>
            prev.map((item) =>
              item.id === editingExpense.id
                ? {
                  ...item,
                  title: updated.title,
                  amount: updated.amount,
                  category: updated.category,
                  date: updated.date.toISOString(),
                  vendor: updated.vendor,
                  paymentMethod: updated.paymentMethod,
                  taxAmount: updated.taxAmount,
                  notes: updated.notes,
                }
                : item
            )
          );
        } else {
          const created = await createExpenseAction({
            title,
            amount,
            category: formCategory,
            date: dateVal,
            vendor: formVendor.trim() || null,
            paymentMethod: formPaymentMethod.trim() || null,
            taxAmount,
            notes: formNotes.trim() || null,
          });

          setExpenses((prev) => [
            {
              id: created.id,
              title: created.title,
              amount: created.amount,
              category: created.category,
              date: created.date.toISOString(),
              vendor: created.vendor,
              paymentMethod: created.paymentMethod,
              taxAmount: created.taxAmount,
              notes: created.notes,
              createdAt: created.createdAt.toISOString(),
            },
            ...prev,
          ]);
        }
        closeModal();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Failed to save expense.");
      }
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    startTransition(async () => {
      try {
        await deleteExpenseAction(targetId);
        setExpenses((prev) => prev.filter((item) => item.id !== targetId));
        setDeleteTarget(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete expense.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track business costs, software subscriptions, office overhead, and contractor payments.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          + Add expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              This Month&apos;s Expenses
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {money(thisMonthTotal)}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Current calendar month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Filtered Total
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {money(filteredTotal)}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {filteredExpenses.length} matching expense(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total Expenses
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {expenses.length}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              All-time recorded entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1">
              <Input
                type="search"
                placeholder="Search by title, vendor, category, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              >
                <option value="ALL">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                aria-label="Filter by month"
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              >
                <option value="ALL">All Months</option>
                {availableMonths.map((m) => {
                  const [y, mon] = m.split("-");
                  const d = new Date(parseInt(y, 10), parseInt(mon, 10) - 1, 1);
                  const label = d.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  });
                  return (
                    <option key={m} value={m}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {(searchQuery || categoryFilter !== "ALL" || monthFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("ALL");
                  setMonthFilter("ALL");
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardContent className="pt-6">
          {filteredExpenses.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                No expenses found
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {searchQuery || categoryFilter !== "ALL" || monthFilter !== "ALL"
                  ? "Try clearing your filters or search keywords."
                  : "Start recording business deductions and operating costs."}
              </p>
              <Button onClick={openCreateModal} className="mt-4">
                Record first expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Title & Vendor</th>
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Payment</th>
                    <th className="py-3 pr-4 font-medium text-right">Amount</th>
                    <th className="py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody ref={listParentRef} className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="py-3.5 pr-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                        {formatDate(exp.date, undefined, locale)}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {exp.title}
                        </div>
                        {exp.vendor && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {exp.vendor}
                          </div>
                        )}
                        {exp.notes && (
                          <div className="mt-0.5 line-clamp-1 text-xs text-zinc-400 dark:text-zinc-500 italic">
                            {exp.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other
                            }`}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        {exp.paymentMethod ? (
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">
                            {exp.paymentMethod}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-right">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {money(exp.amount)}
                        </div>
                        {exp.taxAmount > 0 && (
                          <div className="text-[11px] text-zinc-400">
                            Tax: {money(exp.taxAmount)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(exp)}
                            className="h-8 px-2.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(exp)}
                            className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl animate-modal-in">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {editingExpense ? "Edit Expense" : "Add Expense"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title">Expense Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Figma Professional Annual Plan"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount ({currency}) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Category & Payment Method Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  >
                    {EXPENSE_PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vendor & Tax Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor">Vendor / Supplier</Label>
                  <Input
                    id="vendor"
                    placeholder="e.g. Figma, Inc. or Amazon"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxAmount">Tax Included ({currency})</Label>
                  <Input
                    id="taxAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formTaxAmount}
                    onChange={(e) => setFormTaxAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes / Tax Deductibility Details</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Optional notes or invoice receipt details"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : editingExpense ? "Update Expense" : "Save Expense"}
                </Button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto my-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Delete Expense?
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete &ldquo;{deleteTarget.title}&rdquo; ({money(deleteTarget.amount)})?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteConfirm}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
