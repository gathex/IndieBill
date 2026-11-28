"use client";

import { useState, useMemo, useTransition } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  toggleCatalogItemActive,
  type CatalogItemInput,
} from "@/actions/catalog";

export interface SerializedCatalogItem {
  id: string;
  name: string;
  description: string | null;
  rate: number;
  unit: string | null;
  hsnSac: string | null;
  defaultTaxRate: number | null;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface CatalogManagerProps {
  initialItems: SerializedCatalogItem[];
  currency?: string;
  locale?: string;
}

const STANDARD_UNITS = ["hr", "day", "project", "item", "month", "session", "audit"];

export function CatalogManager({
  initialItems,
  currency = "USD",
  locale,
}: CatalogManagerProps) {
  const [items, setItems] = useState<SerializedCatalogItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SerializedCatalogItem | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formRate, setFormRate] = useState("");
  const [unitType, setUnitType] = useState("hr");
  const [customUnit, setCustomUnit] = useState("");
  const [formHsnSac, setFormHsnSac] = useState("");
  const [formTaxRate, setFormTaxRate] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<SerializedCatalogItem | null>(null);

  const [isPending, startTransition] = useTransition();
  const [listParentRef] = useAutoAnimate<HTMLTableSectionElement>();

  function openCreateModal() {
    setEditingItem(null);
    setFormName("");
    setFormDescription("");
    setFormRate("");
    setUnitType("hr");
    setCustomUnit("");
    setFormHsnSac("");
    setFormTaxRate("");
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(item: SerializedCatalogItem) {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description ?? "");
    setFormRate(String(item.rate));
    if (item.unit) {
      if (STANDARD_UNITS.includes(item.unit)) {
        setUnitType(item.unit);
        setCustomUnit("");
      } else {
        setUnitType("custom");
        setCustomUnit(item.unit);
      }
    } else {
      setUnitType("hr");
      setCustomUnit("");
    }
    setFormHsnSac(item.hsnSac ?? "");
    setFormTaxRate(item.defaultTaxRate !== null ? String(item.defaultTaxRate) : "");
    setFormIsActive(item.isActive);
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormError(null);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const name = formName.trim();
    if (!name) {
      setFormError("Item or service name is required.");
      return;
    }

    const rate = parseFloat(formRate);
    if (isNaN(rate) || rate < 0) {
      setFormError("Rate must be a positive number or zero.");
      return;
    }

    const taxRate = formTaxRate.trim() ? parseFloat(formTaxRate) : null;
    if (taxRate !== null && (isNaN(taxRate) || taxRate < 0 || taxRate > 100)) {
      setFormError("Default tax rate must be between 0% and 100%.");
      return;
    }

    const selectedUnit = unitType === "custom" ? customUnit.trim() : unitType.trim();

    const payload: CatalogItemInput = {
      name,
      description: formDescription.trim() || null,
      rate,
      unit: selectedUnit || null,
      hsnSac: formHsnSac.trim() || null,
      defaultTaxRate: taxRate,
      isActive: formIsActive,
    };

    startTransition(async () => {
      try {
        if (editingItem) {
          const updated = await updateCatalogItem(editingItem.id, payload);
          setItems((prev) =>
            prev.map((it) =>
              it.id === editingItem.id
                ? {
                  ...it,
                  name: updated.name,
                  description: updated.description,
                  rate: updated.rate,
                  unit: updated.unit,
                  hsnSac: updated.hsnSac,
                  defaultTaxRate: updated.defaultTaxRate,
                  isActive: updated.isActive,
                }
                : it
            )
          );
        } else {
          const created = await createCatalogItem(payload);
          setItems((prev) => [
            {
              id: created.id,
              name: created.name,
              description: created.description,
              rate: created.rate,
              unit: created.unit,
              hsnSac: created.hsnSac,
              defaultTaxRate: created.defaultTaxRate,
              isActive: created.isActive,
            },
            ...prev,
          ]);
        }
        closeModal();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Failed to save item.");
      }
    });
  }

  function handleToggleActive(item: SerializedCatalogItem) {
    startTransition(async () => {
      try {
        const updated = await toggleCatalogItemActive(item.id);
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, isActive: updated.isActive } : it))
        );
      } catch (err) {
        console.error("Failed to toggle status:", err);
      }
    });
  }

  function confirmDelete(item: SerializedCatalogItem) {
    setDeleteTarget(item);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    startTransition(async () => {
      try {
        await deleteCatalogItem(targetId);
        setItems((prev) => prev.filter((it) => it.id !== targetId));
        setDeleteTarget(null);
      } catch (err) {
        console.error("Failed to delete item:", err);
      }
    });
  }

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeFilter === "active" && !item.isActive) return false;
      if (activeFilter === "inactive" && item.isActive) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.unit && item.unit.toLowerCase().includes(q)) ||
        (item.hsnSac && item.hsnSac.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery, activeFilter]);

  const activeCount = useMemo(() => items.filter((i) => i.isActive).length, [items]);
  const inactiveCount = useMemo(() => items.filter((i) => !i.isActive).length, [items]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Item & Service Catalog
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Define reusable services, rates, units, and tax defaults for one-click invoice creation.
          </p>
        </div>
        <Button onClick={openCreateModal}>+ Add item</Button>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full max-w-sm">
              <Input
                placeholder="Search by name, description, unit, or HSN/SAC…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 bg-zinc-50 dark:bg-zinc-900 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${activeFilter === "all"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("active")}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${activeFilter === "active"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("inactive")}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${activeFilter === "inactive"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>
          </div>

          {/* Catalog items table */}
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {items.length === 0 ? (
                <>
                  No catalog items found.{" "}
                  <button
                    onClick={openCreateModal}
                    className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4"
                  >
                    Add your first catalog item
                  </button>
                  .
                </>
              ) : (
                "No items match your filter criteria."
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <th className="py-2.5 pr-4 font-medium">Item / Service</th>
                    <th className="py-2.5 pr-4 font-medium">Unit</th>
                    <th className="py-2.5 pr-4 font-medium">HSN / SAC</th>
                    <th className="py-2.5 pr-4 font-medium text-right">Default Tax</th>
                    <th className="py-2.5 pr-4 font-medium text-right">Rate</th>
                    <th className="py-2.5 pr-4 font-medium text-center">Status</th>
                    <th className="py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody ref={listParentRef}>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </div>
                        {item.description ? (
                          <div className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {item.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3.5 pr-4 text-zinc-600 dark:text-zinc-400">
                        {item.unit ? (
                          <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                            {item.unit}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                        {item.hsnSac ?? "—"}
                      </td>
                      <td className="py-3.5 pr-4 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                        {item.defaultTaxRate !== null ? `${item.defaultTaxRate}%` : "—"}
                      </td>
                      <td className="py-3.5 pr-4 text-right font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatCurrency(item.rate, currency, locale)}
                        {item.unit ? (
                          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-1">
                            /{item.unit}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          title="Click to toggle status"
                          className="cursor-pointer transition-opacity hover:opacity-80"
                        >
                          {item.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                            onClick={() => confirmDelete(item)}
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
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5 animate-modal-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3.5">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {editingItem ? "Edit Catalog Item" : "New Catalog Item"}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {editingItem
                    ? "Update details, rates, and tax preferences for this item."
                    : "Add a reusable product or service to your catalog."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close modal"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {formError ? (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-600 dark:text-red-400">
                  {formError}
                </div>
              ) : null}

              {/* Row 1: Name (full width) */}
              <div className="space-y-1.5">
                <Label htmlFor="catalog-name" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="catalog-name"
                  placeholder="e.g. UI/UX Design, Backend API Development"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-10 text-sm"
                  required
                />
              </div>

              {/* Row 2: 2-column grid: Rate and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="catalog-rate" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Rate ({currency === "INR" || !currency ? "INR" : currency}) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹"}
                    </span>
                    <Input
                      id="catalog-rate"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={formRate}
                      onChange={(e) => setFormRate(e.target.value)}
                      className="pl-8 h-10 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="catalog-unit" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Unit
                  </Label>
                  <div className="space-y-2">
                    <select
                      id="catalog-unit"
                      value={unitType}
                      onChange={(e) => {
                        setUnitType(e.target.value);
                        if (e.target.value !== "custom") {
                          setCustomUnit("");
                        }
                      }}
                      className="w-full h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
                    >
                      <option value="hr">hr</option>
                      <option value="day">day</option>
                      <option value="project">project</option>
                      <option value="item">item</option>
                      <option value="month">month</option>
                      <option value="session">session</option>
                      <option value="audit">audit</option>
                      <option value="custom">Custom...</option>
                    </select>
                    {unitType === "custom" && (
                      <Input
                        placeholder="Enter custom unit (e.g. word, page)"
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        className="h-10 text-sm animate-in fade-in duration-150"
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: 2-column grid: HSN/SAC and Default Tax Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="catalog-hsn" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    HSN / SAC Code
                  </Label>
                  <Input
                    id="catalog-hsn"
                    placeholder="e.g. 998314"
                    value={formHsnSac}
                    onChange={(e) => setFormHsnSac(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="catalog-tax" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Default Tax Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="catalog-tax"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g. 18"
                      value={formTaxRate}
                      onChange={(e) => setFormTaxRate(e.target.value)}
                      className="pr-8 h-10 text-sm"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 4: Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="catalog-desc" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Description
                  </Label>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">Optional</span>
                </div>
                <Textarea
                  id="catalog-desc"
                  rows={2}
                  placeholder="Detailed scope, specifications, or deliverables included in this item…"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="resize-none text-sm"
                />
              </div>

              {/* Row 5: Compact Active Toggle Switch */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30 p-3.5 transition-colors">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Active</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Show in invoice & quotation picker
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formIsActive}
                  onClick={() => setFormIsActive((prev) => !prev)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600",
                    formIsActive ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-900 shadow-sm ring-0 transition duration-200 ease-in-out",
                      formIsActive ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isPending}
                  className="h-9 px-4 text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-4 text-xs font-medium"
                >
                  {isPending ? "Saving…" : editingItem ? "Update item" : "Create item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Delete Catalog Item
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                &ldquo;{deleteTarget.name}&rdquo;
              </strong>
              ? This action cannot be undone. Existing invoices or quotations that used this item will not be affected.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting…" : "Delete item"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
