"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CatalogPicker } from "@/components/catalog-picker";
import { type SerializedCatalogItem } from "@/components/catalog-manager";
import { computeGstTotals, getStateDisplayName } from "@/lib/gst";
import {
  createRecurringInvoice,
  updateRecurringInvoice,
  deleteRecurringInvoice,
  toggleRecurringStatus,
  generateRecurringNow,
  type RecurringInvoiceInput,
} from "@/actions/recurring";

export type RecurringFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
export type RecurringStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export interface SerializedRecurringItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  unit?: string | null;
  hsnSac?: string | null;
}

export interface SerializedRecurringInvoice {
  id: string;
  clientId: string;
  title: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextRunDate: string;
  endDate?: string | null;
  dueInDays: number;
  autoSendEmail: boolean;
  status: RecurringStatus;
  currency?: string | null;
  notes?: string | null;
  discount: number;
  taxRate: number;
  gstEnabled: boolean;
  lastGeneratedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    company?: string | null;
    gstin?: string | null;
    state?: string | null;
  };
  items: SerializedRecurringItem[];
  generatedInvoices?: Array<{
    id: string;
    number: string;
    total: number;
    status: string;
    issueDate: string;
  }>;
}

export interface RecurringClient {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  gstin?: string | null;
  state?: string | null;
}

interface RecurringManagerProps {
  initialSchedules: SerializedRecurringInvoice[];
  clients: RecurringClient[];
  catalogItems?: SerializedCatalogItem[];
  currency?: string;
  locale?: string;
  businessState?: string | null;
  businessGstin?: string | null;
}

interface FormItemRow {
  id?: string;
  description: string;
  quantity: string;
  rate: string;
  unit: string;
  hsnSac: string;
}

const emptyItem = (): FormItemRow => ({
  description: "",
  quantity: "1",
  rate: "",
  unit: "",
  hsnSac: "",
});

function calculateScheduleCycleTotal(
  schedule: {
    items: Array<{ quantity: number; rate: number }>;
    discount: number;
    taxRate: number;
    gstEnabled: boolean;
    client?: { state?: string | null };
  },
  businessState?: string | null,
): number {
  const subtotal = schedule.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0,
  );
  const gst = computeGstTotals({
    subtotal,
    discountPercent: schedule.discount,
    taxRate: schedule.taxRate,
    gstEnabled: schedule.gstEnabled,
    businessState,
    clientState: schedule.client?.state,
  });
  return gst.total;
}

function getFrequencyLabel(frequency: string): string {
  switch (frequency) {
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    case "QUARTERLY":
      return "Quarterly";
    case "YEARLY":
      return "Yearly";
    default:
      return frequency;
  }
}

function getFrequencySuffix(frequency: string): string {
  switch (frequency) {
    case "WEEKLY":
      return "/ wk";
    case "MONTHLY":
      return "/ mo";
    case "QUARTERLY":
      return "/ qtr";
    case "YEARLY":
      return "/ yr";
    default:
      return "";
  }
}

function getRelativeDateLabel(dateStr: string): { label: string; isPast: boolean; isToday: boolean } {
  const target = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffMs = targetDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: "Today", isPast: false, isToday: true };
  }
  if (diffDays === 1) {
    return { label: "Tomorrow", isPast: false, isToday: false };
  }
  if (diffDays === -1) {
    return { label: "Yesterday", isPast: true, isToday: false };
  }
  if (diffDays < -1) {
    return { label: `${Math.abs(diffDays)}d overdue`, isPast: true, isToday: false };
  }
  return { label: `In ${diffDays}d`, isPast: false, isToday: false };
}

export function RecurringManager({
  initialSchedules,
  clients,
  catalogItems = [],
  currency = "USD",
  locale,
  businessState,
  businessGstin,
}: RecurringManagerProps) {
  const [schedules, setSchedules] = useState<SerializedRecurringInvoice[]>(initialSchedules);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED" | "COMPLETED">("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("ALL");

  // Notifications banner
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
    link?: { label: string; href: string };
  } | null>(null);

  // Loading states for individual card actions
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<SerializedRecurringInvoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SerializedRecurringInvoice | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formClientId, setFormClientId] = useState(clients[0]?.id ?? "");
  const [formFrequency, setFormFrequency] = useState<"WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
  const [formStartDate, setFormStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState("");
  const [formDueInDays, setFormDueInDays] = useState("15");
  const [formAutoSendEmail, setFormAutoSendEmail] = useState(false);
  const [formNotes, setFormNotes] = useState("");
  const [formDiscount, setFormDiscount] = useState("0");
  const [formTaxRate, setFormTaxRate] = useState("0");
  const [formGstEnabled, setFormGstEnabled] = useState(Boolean(businessGstin || businessState));
  const [formItems, setFormItems] = useState<FormItemRow[]>([emptyItem()]);
  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, startSubmitTransition] = useTransition();

  // Animation hooks
  const [schedulesListRef] = useAutoAnimate<HTMLDivElement>();
  const [modalItemsRef] = useAutoAnimate<HTMLDivElement>();

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      // Status filter
      if (statusFilter !== "ALL" && schedule.status !== statusFilter) {
        return false;
      }
      // Frequency filter
      if (frequencyFilter !== "ALL" && schedule.frequency !== frequencyFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = schedule.title.toLowerCase().includes(q);
        const matchesClient = schedule.client.name.toLowerCase().includes(q);
        const matchesCompany = schedule.client.company
          ? schedule.client.company.toLowerCase().includes(q)
          : false;
        const matchesItems = schedule.items.some((item) =>
          item.description.toLowerCase().includes(q),
        );
        if (!matchesTitle && !matchesClient && !matchesCompany && !matchesItems) {
          return false;
        }
      }
      return true;
    });
  }, [schedules, statusFilter, frequencyFilter, searchQuery]);

  // Status counts
  const activeCount = useMemo(
    () => schedules.filter((s) => s.status === "ACTIVE").length,
    [schedules],
  );
  const pausedCount = useMemo(
    () => schedules.filter((s) => s.status === "PAUSED").length,
    [schedules],
  );
  const completedCount = useMemo(
    () => schedules.filter((s) => s.status === "COMPLETED").length,
    [schedules],
  );

  // Form selected client and live totals
  const formSelectedClient = useMemo(
    () => clients.find((c) => c.id === formClientId),
    [clients, formClientId],
  );

  const formSubtotal = useMemo(() => {
    return formItems.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.rate) || 0;
      return sum + q * r;
    }, 0);
  }, [formItems]);

  const formGstResult = useMemo(() => {
    return computeGstTotals({
      subtotal: formSubtotal,
      discountPercent: parseFloat(formDiscount) || 0,
      taxRate: parseFloat(formTaxRate) || 0,
      gstEnabled: formGstEnabled,
      businessState,
      clientState: formSelectedClient?.state,
    });
  }, [
    formSubtotal,
    formDiscount,
    formTaxRate,
    formGstEnabled,
    businessState,
    formSelectedClient,
  ]);

  // Open Create Modal
  function openCreateModal() {
    setEditingSchedule(null);
    setFormTitle("");
    setFormClientId(clients[0]?.id ?? "");
    setFormFrequency("MONTHLY");
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate("");
    setFormDueInDays("15");
    setFormAutoSendEmail(false);
    setFormNotes("");
    setFormDiscount("0");
    setFormTaxRate("0");
    setFormGstEnabled(Boolean(businessGstin || businessState));
    setFormItems([emptyItem()]);
    setFormError(null);
    setIsModalOpen(true);
  }

  // Open Edit Modal
  function openEditModal(schedule: SerializedRecurringInvoice) {
    setEditingSchedule(schedule);
    setFormTitle(schedule.title);
    setFormClientId(schedule.clientId);
    setFormFrequency(schedule.frequency);
    setFormStartDate(schedule.startDate.slice(0, 10));
    setFormEndDate(schedule.endDate ? schedule.endDate.slice(0, 10) : "");
    setFormDueInDays(String(schedule.dueInDays));
    setFormAutoSendEmail(schedule.autoSendEmail);
    setFormNotes(schedule.notes ?? "");
    setFormDiscount(String(schedule.discount));
    setFormTaxRate(String(schedule.taxRate));
    setFormGstEnabled(schedule.gstEnabled);
    setFormItems(
      schedule.items.length > 0
        ? schedule.items.map((i) => ({
            id: i.id,
            description: i.description,
            quantity: String(i.quantity),
            rate: String(i.rate),
            unit: i.unit ?? "",
            hsnSac: i.hsnSac ?? "",
          }))
        : [emptyItem()],
    );
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setFormError(null);
  }

  // Line Items Manipulation
  function handleItemChange(index: number, field: keyof FormItemRow, value: string) {
    setFormItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function handleAddItem() {
    setFormItems((prev) => [...prev, emptyItem()]);
  }

  function handleRemoveItem(index: number) {
    setFormItems((prev) => {
      if (prev.length <= 1) return [emptyItem()];
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleCatalogSelect(catItem: SerializedCatalogItem) {
    setFormItems((prev) => {
      // If the last item is empty, replace it; otherwise append
      const last = prev[prev.length - 1];
      const isLastEmpty = !last.description.trim() && (!last.rate || last.rate === "0");

      const newRow: FormItemRow = {
        description: catItem.name,
        quantity: "1",
        rate: String(catItem.rate),
        unit: catItem.unit ?? "",
        hsnSac: catItem.hsnSac ?? "",
      };

      if (isLastEmpty) {
        return [...prev.slice(0, -1), newRow];
      }
      return [...prev, newRow];
    });

    // Auto-fill tax rate if current tax rate is 0 and catalog item specifies one
    if (
      catItem.defaultTaxRate !== null &&
      catItem.defaultTaxRate !== undefined &&
      (parseFloat(formTaxRate) === 0 || !formTaxRate)
    ) {
      setFormTaxRate(String(catItem.defaultTaxRate));
    }
  }

  // Form Submit (Create / Update)
  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!formClientId) {
      setFormError("Please select a client.");
      return;
    }

    const cleanedItems = formItems
      .filter((i) => i.description.trim())
      .map((i) => ({
        description: i.description.trim(),
        quantity: parseFloat(i.quantity) || 1,
        rate: parseFloat(i.rate) || 0,
        unit: i.unit.trim() || null,
        hsnSac: i.hsnSac.trim() || null,
      }));

    if (cleanedItems.length === 0) {
      setFormError("Please add at least one line item with a description.");
      return;
    }

    const payload: RecurringInvoiceInput = {
      title: formTitle.trim(),
      clientId: formClientId,
      frequency: formFrequency,
      startDate: formStartDate,
      endDate: formEndDate ? formEndDate : null,
      dueInDays: parseInt(formDueInDays, 10) || 15,
      autoSendEmail: formAutoSendEmail,
      currency,
      notes: formNotes.trim() || null,
      discount: parseFloat(formDiscount) || 0,
      taxRate: parseFloat(formTaxRate) || 0,
      gstEnabled: formGstEnabled,
      items: cleanedItems,
    };

    startSubmitTransition(async () => {
      try {
        if (editingSchedule) {
          const updated = await updateRecurringInvoice(editingSchedule.id, payload);
          setSchedules((prev) =>
            prev.map((s) =>
              s.id === editingSchedule.id
                ? {
                    ...s,
                    title: updated.title,
                    clientId: updated.clientId,
                    frequency: updated.frequency as RecurringFrequency,
                    startDate: updated.startDate.toISOString(),
                    nextRunDate: updated.nextRunDate.toISOString(),
                    endDate: updated.endDate ? updated.endDate.toISOString() : null,
                    dueInDays: updated.dueInDays,
                    autoSendEmail: updated.autoSendEmail,
                    currency: updated.currency,
                    notes: updated.notes,
                    discount: updated.discount,
                    taxRate: updated.taxRate,
                    gstEnabled: updated.gstEnabled,
                    client: {
                      id: updated.client.id,
                      name: updated.client.name,
                      email: updated.client.email,
                      company: updated.client.company,
                      gstin: updated.client.gstin,
                      state: updated.client.state,
                    },
                    items: updated.items.map((it) => ({
                      id: it.id,
                      description: it.description,
                      quantity: it.quantity,
                      rate: it.rate,
                      unit: it.unit,
                      hsnSac: it.hsnSac,
                    })),
                  }
                : s,
            ),
          );
          setBanner({
            type: "success",
            text: `Schedule "${updated.title}" updated successfully.`,
          });
        } else {
          const created = await createRecurringInvoice(payload);
          const newSchedule: SerializedRecurringInvoice = {
            id: created.id,
            clientId: created.clientId,
            title: created.title,
            frequency: created.frequency as RecurringFrequency,
            startDate: created.startDate.toISOString(),
            nextRunDate: created.nextRunDate.toISOString(),
            endDate: created.endDate ? created.endDate.toISOString() : null,
            dueInDays: created.dueInDays,
            autoSendEmail: created.autoSendEmail,
            status: created.status as RecurringStatus,
            currency: created.currency,
            notes: created.notes,
            discount: created.discount,
            taxRate: created.taxRate,
            gstEnabled: created.gstEnabled,
            lastGeneratedAt: null,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
            client: {
              id: created.client.id,
              name: created.client.name,
              email: created.client.email,
              company: created.client.company,
              gstin: created.client.gstin,
              state: created.client.state,
            },
            items: created.items.map((it) => ({
              id: it.id,
              description: it.description,
              quantity: it.quantity,
              rate: it.rate,
              unit: it.unit,
              hsnSac: it.hsnSac,
            })),
            generatedInvoices: [],
          };
          setSchedules((prev) => [newSchedule, ...prev]);
          setBanner({
            type: "success",
            text: `Recurring schedule "${created.title}" created.`,
          });
        }
        closeModal();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Failed to save schedule.");
      }
    });
  }

  // Generate Now Action
  async function handleGenerateNow(schedule: SerializedRecurringInvoice) {
    setGeneratingId(schedule.id);
    try {
      const res = await generateRecurringNow(schedule.id);
      if (res.success) {
        setBanner({
          type: "success",
          text: `Invoice #${res.invoiceNumber} created from schedule "${schedule.title}"!`,
          link: { label: "View Invoice →", href: `/invoices/${res.invoiceId}` },
        });

        // Update schedule local state with new lastGeneratedAt, nextRunDate, and invoice history
        const cycleTotal = calculateScheduleCycleTotal(schedule, businessState);
        setSchedules((prev) =>
          prev.map((s) =>
            s.id === schedule.id
              ? {
                  ...s,
                  lastGeneratedAt: new Date().toISOString(),
                  nextRunDate: new Date(res.nextRunDate).toISOString(),
                  generatedInvoices: [
                    {
                      id: res.invoiceId,
                      number: res.invoiceNumber,
                      total: cycleTotal,
                      status: schedule.autoSendEmail ? "SENT" : "DRAFT",
                      issueDate: new Date().toISOString(),
                    },
                    ...(s.generatedInvoices || []),
                  ].slice(0, 5),
                }
              : s,
          ),
        );
      }
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to generate invoice now.",
      });
    } finally {
      setGeneratingId(null);
    }
  }

  // Toggle Status Action (ACTIVE <-> PAUSED)
  async function handleToggleStatus(schedule: SerializedRecurringInvoice) {
    setTogglingId(schedule.id);
    try {
      const res = await toggleRecurringStatus(schedule.id);
      if (res.success) {
        setSchedules((prev) =>
          prev.map((s) =>
            s.id === schedule.id ? { ...s, status: res.status as RecurringStatus } : s,
          ),
        );
        setBanner({
          type: "success",
          text: `Schedule status changed to ${res.status}.`,
        });
      }
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to toggle status.",
      });
    } finally {
      setTogglingId(null);
    }
  }

  // Delete Action
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      const res = await deleteRecurringInvoice(deleteTarget.id);
      if (res.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        setBanner({
          type: "success",
          text: `Schedule "${deleteTarget.title}" deleted. Previously generated invoices were preserved.`,
        });
        setDeleteTarget(null);
      }
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete schedule.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Recurring Invoices
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Automate retainer agreements, recurring subscriptions, and periodic client billings.
          </p>
        </div>
        <Button onClick={openCreateModal} className="shrink-0">
          + New Recurring Schedule
        </Button>
      </div>

      {/* Banner / Toast Notification */}
      {banner && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm transition-all ${
            banner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-900 dark:border-red-800/80 dark:bg-red-950/40 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{banner.text}</span>
            {banner.link && (
              <Link
                href={banner.link.href}
                className="font-semibold underline underline-offset-4 hover:opacity-80"
              >
                {banner.link.label}
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="w-full max-w-sm">
              <Input
                placeholder="Search by schedule title, client, or items…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 bg-zinc-50 dark:bg-zinc-900 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    statusFilter === "ALL"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  All ({schedules.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    statusFilter === "ACTIVE"
                      ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("PAUSED")}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    statusFilter === "PAUSED"
                      ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Paused ({pausedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("COMPLETED")}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    statusFilter === "COMPLETED"
                      ? "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Done ({completedCount})
                </button>
              </div>

              {/* Frequency Dropdown Filter */}
              <select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="ALL">All Frequencies</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedules List (AutoAnimated) */}
      <div ref={schedulesListRef} className="space-y-3">
        {filteredSchedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {schedules.length === 0 ? "No recurring schedules yet" : "No schedules match your filters"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {schedules.length === 0
                ? "Set up automatic recurring billing schedules for monthly client retainers, SaaS licenses, or ongoing support."
                : "Try adjusting your search terms or status filters above."}
            </p>
            {schedules.length === 0 && (
              <div className="mt-6">
                <Button onClick={openCreateModal}>+ Create First Schedule</Button>
              </div>
            )}
          </div>
        ) : (
          filteredSchedules.map((schedule) => {
            const cycleTotal = calculateScheduleCycleTotal(schedule, businessState);
            const relDate = getRelativeDateLabel(schedule.nextRunDate);

            return (
              <div
                key={schedule.id}
                className="group relative flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700 lg:flex-row lg:items-center"
              >
                {/* Schedule Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {schedule.title}
                    </h2>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                        schedule.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          : schedule.status === "PAUSED"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {schedule.status}
                    </span>

                    {/* Frequency Badge */}
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {getFrequencyLabel(schedule.frequency)}
                    </span>

                    {schedule.autoSendEmail && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        title="Invoices automatically emailed to client upon generation"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Auto-email
                      </span>
                    )}
                  </div>

                  {/* Client & Metadata */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      Client: {schedule.client.name}
                      {schedule.client.company ? ` (${schedule.client.company})` : ""}
                    </span>
                    <span>•</span>
                    <span>{schedule.items.length} item{schedule.items.length === 1 ? "" : "s"}</span>
                    <span>•</span>
                    <span>Net {schedule.dueInDays} days</span>
                    {schedule.lastGeneratedAt && (
                      <>
                        <span>•</span>
                        <span>Last run: {formatDate(schedule.lastGeneratedAt, undefined, locale)}</span>
                      </>
                    )}
                  </div>

                  {/* Invoice History Pill */}
                  {schedule.generatedInvoices && schedule.generatedInvoices.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Recent:</span>
                      <div className="flex flex-wrap gap-1">
                        {schedule.generatedInvoices.slice(0, 3).map((inv) => (
                          <Link
                            key={inv.id}
                            href={`/invoices/${inv.id}`}
                            className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            {inv.number}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Next Run Date, Amount & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800/60 pt-3 lg:border-t-0 lg:pt-0 lg:justify-end">
                  {/* Next Run & Cycle Amount */}
                  <div className="text-left lg:text-right">
                    <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {formatCurrency(cycleTotal, currency, locale)}
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-1">
                        {getFrequencySuffix(schedule.frequency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">Next run:</span>
                      <span
                        className={`font-medium ${
                          schedule.status === "PAUSED"
                            ? "text-zinc-400 line-through"
                            : relDate.isPast
                            ? "text-red-600 dark:text-red-400 font-semibold"
                            : relDate.isToday
                            ? "text-blue-600 dark:text-blue-400 font-semibold"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {formatDate(schedule.nextRunDate, undefined, locale)} ({relDate.label})
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Generate Now Button */}
                    <button
                      type="button"
                      disabled={generatingId === schedule.id}
                      onClick={() => handleGenerateNow(schedule)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-950 dark:hover:text-white disabled:opacity-50 transition-colors"
                      title="Trigger immediate invoice generation from this schedule"
                    >
                      {generatingId === schedule.id ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Generating…</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Generate Now</span>
                        </>
                      )}
                    </button>

                    {/* Pause / Resume Toggle Button */}
                    {schedule.status !== "COMPLETED" && (
                      <button
                        type="button"
                        disabled={togglingId === schedule.id}
                        onClick={() => handleToggleStatus(schedule)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          schedule.status === "ACTIVE"
                            ? "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            : "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        }`}
                        title={schedule.status === "ACTIVE" ? "Pause automatic schedule" : "Resume automatic schedule"}
                      >
                        {togglingId === schedule.id ? (
                          <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : schedule.status === "ACTIVE" ? (
                          <>
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                              <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                            </svg>
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <polygon points="5,3 19,12 5,21" />
                            </svg>
                            <span>Resume</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(schedule)}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit recurring schedule"
                      aria-label="Edit schedule"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(schedule)}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete recurring schedule"
                      aria-label="Delete schedule"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-modal-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {editingSchedule ? "Edit Recurring Schedule" : "New Recurring Schedule"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Configure automatic invoice generation schedule, client terms, and line items.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* Schedule Title */}
              <div className="space-y-1.5">
                <Label htmlFor="recurring-title" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Schedule Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recurring-title"
                  placeholder="e.g. Monthly Retainer, Cloud Infrastructure Maintenance"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="h-10 text-sm"
                  required
                />
              </div>

              {/* Client & Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="recurring-client" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Client <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="recurring-client"
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    required
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recurring-frequency" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Billing Frequency <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="recurring-frequency"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as RecurringFrequency)}
                    className="w-full h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="WEEKLY">Weekly (every 7 days)</option>
                    <option value="MONTHLY">Monthly (same day each month)</option>
                    <option value="QUARTERLY">Quarterly (every 3 months)</option>
                    <option value="YEARLY">Yearly (annually)</option>
                  </select>
                </div>
              </div>

              {/* Dates & Payment Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="recurring-start" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Start / Next Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="recurring-start"
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="h-10 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recurring-end" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    End Date <span className="text-xs text-zinc-400">(Optional)</span>
                  </Label>
                  <Input
                    id="recurring-end"
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recurring-due-days" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Due In (Days)
                  </Label>
                  <Input
                    id="recurring-due-days"
                    type="number"
                    min="0"
                    max="180"
                    value={formDueInDays}
                    onChange={(e) => setFormDueInDays(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              {/* Auto Send Email Toggle */}
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 bg-zinc-50 dark:bg-zinc-800/50">
                <input
                  type="checkbox"
                  id="recurring-auto-send"
                  checked={formAutoSendEmail}
                  onChange={(e) => setFormAutoSendEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <label htmlFor="recurring-auto-send" className="cursor-pointer text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
                  <span className="font-medium">Auto-send invoice via email</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    When this schedule triggers, automatically email the invoice PDF to{" "}
                    <span className="font-mono">{formSelectedClient?.email || "the client"}</span>.
                  </p>
                </label>
              </div>

              {/* Line Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Line Items
                  </h4>
                  <div className="flex items-center gap-2">
                    <CatalogPicker
                      onSelect={handleCatalogSelect}
                      items={catalogItems}
                      currency={currency}
                      locale={locale}
                      buttonLabel="Pick from catalog"
                      size="sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      + Add line item
                    </Button>
                  </div>
                </div>

                <div ref={modalItemsRef} className="space-y-3">
                  {formItems.map((item, index) => {
                    const rowAmount =
                      (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);

                    return (
                      <div
                        key={item.id || index}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/60 dark:bg-zinc-800/30 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                          {/* Description */}
                          <div className="sm:col-span-5 space-y-1">
                            <Label className="text-[11px] text-zinc-500">Description *</Label>
                            <Input
                              placeholder="Service or item description"
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(index, "description", e.target.value)
                              }
                              className="h-8 text-xs bg-white dark:bg-zinc-800"
                              required
                            />
                          </div>

                          {/* Quantity */}
                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[11px] text-zinc-500">Qty</Label>
                            <Input
                              type="number"
                              step="any"
                              min="0.01"
                              placeholder="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, "quantity", e.target.value)
                              }
                              className="h-8 text-xs bg-white dark:bg-zinc-800 tabular-nums"
                            />
                          </div>

                          {/* Rate */}
                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[11px] text-zinc-500">Rate</Label>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="0.00"
                              value={item.rate}
                              onChange={(e) =>
                                handleItemChange(index, "rate", e.target.value)
                              }
                              className="h-8 text-xs bg-white dark:bg-zinc-800 tabular-nums"
                            />
                          </div>

                          {/* Unit */}
                          <div className="sm:col-span-1 space-y-1">
                            <Label className="text-[11px] text-zinc-500">Unit</Label>
                            <Input
                              placeholder="mo / hr"
                              value={item.unit}
                              onChange={(e) =>
                                handleItemChange(index, "unit", e.target.value)
                              }
                              className="h-8 text-xs bg-white dark:bg-zinc-800"
                            />
                          </div>

                          {/* Row Total & Delete */}
                          <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-5 sm:pt-6">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                              {formatCurrency(rowAmount, currency, locale)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 p-1"
                              title="Remove item"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Optional HSN/SAC code */}
                        {formGstEnabled && (
                          <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                            <Label className="text-[10px] text-zinc-400 font-mono">HSN/SAC:</Label>
                            <input
                              type="text"
                              placeholder="e.g. 998313"
                              value={item.hsnSac}
                              onChange={(e) =>
                                handleItemChange(index, "hsnSac", e.target.value)
                              }
                              className="h-6 w-28 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-[11px] font-mono text-zinc-800 dark:text-zinc-200"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tax & Discount Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="recurring-discount" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Discount (%)
                  </Label>
                  <Input
                    id="recurring-discount"
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recurring-tax" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Tax Rate (%)
                  </Label>
                  <Input
                    id="recurring-tax"
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={formTaxRate}
                    onChange={(e) => setFormTaxRate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    GST Treatment
                  </Label>
                  <label className="flex items-center gap-2 h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formGstEnabled}
                      onChange={(e) => setFormGstEnabled(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <span>Apply Indian GST</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="recurring-notes" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Invoice Notes / Terms <span className="text-xs text-zinc-400">(Optional)</span>
                </Label>
                <Textarea
                  id="recurring-notes"
                  rows={2}
                  placeholder="e.g. Thanks for your business! Direct bank transfer details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Live Totals Card */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 space-y-2">
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-mono">
                    {formatCurrency(formGstResult.subtotal, currency, locale)}
                  </span>
                </div>

                {formGstResult.discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({formDiscount}%)</span>
                    <span className="tabular-nums font-mono">
                      -{formatCurrency(formGstResult.discount, currency, locale)}
                    </span>
                  </div>
                )}

                {formGstEnabled ? (
                  <>
                    <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        Taxable Amount
                        {formSelectedClient?.state && (
                          <span className="ml-1 text-[10px] text-zinc-400">
                            (Supply to: {getStateDisplayName(formSelectedClient.state)})
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums font-mono">
                        {formatCurrency(formGstResult.taxable, currency, locale)}
                      </span>
                    </div>

                    {formGstResult.taxType === "INTRA_STATE" && (
                      <>
                        <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-300">
                          <span>CGST ({(parseFloat(formTaxRate) || 0) / 2}%)</span>
                          <span className="tabular-nums font-mono">
                            {formatCurrency(formGstResult.cgstAmount, currency, locale)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-300">
                          <span>SGST ({(parseFloat(formTaxRate) || 0) / 2}%)</span>
                          <span className="tabular-nums font-mono">
                            {formatCurrency(formGstResult.sgstAmount, currency, locale)}
                          </span>
                        </div>
                      </>
                    )}

                    {formGstResult.taxType === "INTER_STATE" && (
                      <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-300">
                        <span>IGST ({parseFloat(formTaxRate) || 0}%)</span>
                        <span className="tabular-nums font-mono">
                          {formatCurrency(formGstResult.igstAmount, currency, locale)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  formGstResult.tax > 0 && (
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-300">
                      <span>Tax ({formTaxRate}%)</span>
                      <span className="tabular-nums font-mono">
                        {formatCurrency(formGstResult.tax, currency, locale)}
                      </span>
                    </div>
                  )
                )}

                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <span>Total Per Cycle ({getFrequencyLabel(formFrequency)})</span>
                  <span className="tabular-nums text-base">
                    {formatCurrency(formGstResult.total, currency, locale)}
                  </span>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving…"
                    : editingSchedule
                    ? "Update Schedule"
                    : "Create Recurring Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl animate-modal-in space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Delete Recurring Schedule
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete the schedule{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                &ldquo;{deleteTarget.title}&rdquo;
              </strong>
              ?
            </p>
            <p className="text-xs text-zinc-500">
              This will stop all future automatic runs. Invoices generated in the past will be preserved with their full history.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
              >
                Delete Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
