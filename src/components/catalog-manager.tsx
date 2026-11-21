"use client";

import { useState, useMemo, useTransition } from "react";
import { formatCurrency } from "@/lib/utils";
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

const commonUnits = ["hr", "item", "project", "month", "day", "audit", "session"];

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
  const [formUnit, setFormUnit] = useState("");
  const [formHsnSac, setFormHsnSac] = useState("");
  const [formTaxRate, setFormTaxRate] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<SerializedCatalogItem | null>(null);

  const [isPending, startTransition] = useTransition();

  function openCreateModal() {
    setEditingItem(null);
    setFormName("");
    setFormDescription("");
    setFormRate("");
    setFormUnit("");
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
    setFormUnit(item.unit ?? "");
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

    const payload: CatalogItemInput = {
      name,
      description: formDescription.trim() || null,
      rate,
      unit: formUnit.trim() || null,
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
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  activeFilter === "all"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("active")}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  activeFilter === "active"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("inactive")}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  activeFilter === "inactive"
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
                <tbody>
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
            className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {editingItem ? "Edit Catalog Item" : "New Catalog Item"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError ? (
                <div className="rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-600 dark:text-red-400">
                  {formError}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="catalog-name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="catalog-name"
                  placeholder="e.g. UI/UX Design, Backend API Development"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="catalog-rate">
                    Rate ({currency}) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="catalog-rate"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="catalog-unit">Unit (e.g. hr, project)</Label>
                  <Input
                    id="catalog-unit"
                    placeholder="hr, item, project"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {commonUnits.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setFormUnit(u)}
                        className={`text-[10px] rounded px-1.5 py-0.5 border ${
                          formUnit === u
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="catalog-hsn">HSN / SAC Code</Label>
                  <Input
                    id="catalog-hsn"
                    placeholder="e.g. 998314"
                    value={formHsnSac}
                    onChange={(e) => setFormHsnSac(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="catalog-tax">Default Tax Rate %</Label>
                  <Input
                    id="catalog-tax"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g. 18 or 8.5"
                    value={formTaxRate}
                    onChange={(e) => setFormTaxRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catalog-desc">Description (Optional)</Label>
                <Textarea
                  id="catalog-desc"
                  rows={3}
                  placeholder="Detailed scope, specifications, or deliverables included in this item…"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catalog-is-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
                />
                <Label htmlFor="catalog-is-active" className="cursor-pointer">
                  Active (show in invoice/quotation catalog picker)
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
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
