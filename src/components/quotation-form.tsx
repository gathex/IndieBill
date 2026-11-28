"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuotation, updateQuotation } from "@/actions/quotations";
import { computeGstTotals, getStateDisplayName } from "@/lib/gst";
import { formatCurrency } from "@/lib/utils";
import { CatalogPicker } from "@/components/catalog-picker";
import { type SerializedCatalogItem } from "@/components/catalog-manager";

type EditableStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

export interface QuotationFormQuotation {
  id: string;
  clientId: string;
  status: string;
  issueDate: string;
  validUntil: string;
  notes: string;
  discountPercent: number;
  taxRate: number;
  gstEnabled?: boolean;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    hsnSac?: string | null;
  }>;
}

interface QuotationFormClientProps {
  clients: Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
    gstin?: string | null;
    state?: string | null;
  }>;
  quotation?: QuotationFormQuotation | null;
  currency?: string;
  locale?: string;
  businessState?: string | null;
  businessGstin?: string | null;
  defaultClientId?: string;
  catalogItems?: SerializedCatalogItem[];
}

interface QuotationItemRow {
  description: string;
  quantity: string;
  rate: string;
  unit?: string;
  hsnSac?: string;
}

const emptyItem = (): QuotationItemRow => ({
  description: "",
  quantity: "1",
  rate: "",
  unit: "",
  hsnSac: "",
});

const statusOptions: Array<{ value: EditableStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
];

export function QuotationFormClient({
  clients,
  quotation,
  currency = "INR",
  locale,
  businessState,
  businessGstin,
  defaultClientId,
  catalogItems,
}: QuotationFormClientProps) {
  const router = useRouter();
  const isEdit = Boolean(quotation);
  const [itemsParentRef] = useAutoAnimate<HTMLDivElement>();

  const [clientId, setClientId] = useState(
    quotation?.clientId ??
      (defaultClientId && clients.some((client) => client.id === defaultClientId)
        ? defaultClientId
        : clients[0]?.id) ??
      "",
  );
  const [status, setStatus] = useState<EditableStatus>(
    (["DRAFT", "SENT", "ACCEPTED", "REJECTED"].includes(quotation?.status ?? "")
      ? quotation?.status
      : "DRAFT") as EditableStatus,
  );
  const [issueDate, setIssueDate] = useState(
    quotation?.issueDate ? quotation.issueDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [validUntil, setValidUntil] = useState(
    quotation?.validUntil ? quotation.validUntil.slice(0, 10) : "",
  );
  const [notes, setNotes] = useState(quotation?.notes ?? "");
  const [discountPercent, setDiscountPercent] = useState(String(quotation?.discountPercent ?? 0));
  const [taxRate, setTaxRate] = useState(String(quotation?.taxRate ?? 0));
  const [gstEnabled, setGstEnabled] = useState(
    quotation?.gstEnabled ?? Boolean(businessGstin || businessState),
  );
  const [items, setItems] = useState<QuotationItemRow[]>(
    quotation?.items?.length
      ? quotation.items.map((i) => ({
          description: i.description,
          quantity: String(i.quantity),
          rate: String(i.rate),
          unit: "",
          hsnSac: i.hsnSac ?? "",
        }))
      : [emptyItem()],
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);
  const clientState = selectedClient?.state;

  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0),
    0,
  );
  const totals = computeGstTotals({
    subtotal,
    discountPercent: parseFloat(discountPercent) || 0,
    taxRate: parseFloat(taxRate) || 0,
    gstEnabled,
    businessState,
    clientState,
  });

  function updateItem(index: number, patch: Partial<QuotationItemRow>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function applyCatalogItem(index: number, catalogItem: SerializedCatalogItem) {
    let desc = catalogItem.name;
    if (catalogItem.description) {
      desc += ` — ${catalogItem.description}`;
    }

    updateItem(index, {
      description: desc,
      rate: String(catalogItem.rate),
      unit: catalogItem.unit ?? "",
      hsnSac: catalogItem.hsnSac ?? "",
    });

    if (catalogItem.defaultTaxRate !== null && catalogItem.defaultTaxRate !== undefined) {
      setTaxRate(String(catalogItem.defaultTaxRate));
    }
  }

  function addFromCatalog(catalogItem: SerializedCatalogItem) {
    let desc = catalogItem.name;
    if (catalogItem.description) {
      desc += ` — ${catalogItem.description}`;
    }

    setItems((prev) => [
      ...prev,
      {
        description: desc,
        quantity: "1",
        rate: String(catalogItem.rate),
        unit: catalogItem.unit ?? "",
        hsnSac: catalogItem.hsnSac ?? "",
      },
    ]);

    if (catalogItem.defaultTaxRate !== null && catalogItem.defaultTaxRate !== undefined) {
      setTaxRate(String(catalogItem.defaultTaxRate));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanedItems = items
      .map((item) => ({
        description: item.description.trim(),
        quantity: parseFloat(item.quantity) || 1,
        rate: parseFloat(item.rate) || 0,
        hsnSac: item.hsnSac?.trim() || null,
      }))
      .filter((item) => item.description.length > 0);

    if (!clientId) {
      setError("Please select a client.");
      return;
    }
    if (cleanedItems.length === 0) {
      setError("Add at least one line item to the quotation.");
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        clientId,
        status,
        issueDate: issueDate || new Date().toISOString(),
        validUntil: validUntil || null,
        notes: notes.trim() || null,
        discountPercent: parseFloat(discountPercent) || 0,
        taxRate: parseFloat(taxRate) || 0,
        gstEnabled,
        items: cleanedItems,
      };

      const result = quotation
        ? await updateQuotation(quotation.id, input)
        : await createQuotation(input);

      router.push(`/quotations/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quotation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client</Label>
          <select
            id="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            {clients.length === 0 ? <option value="">No clients yet</option> : null}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company ? `${client.company} — ${client.name}` : client.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as EditableStatus)}
            className="flex h-9 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="issueDate">Issue date</Label>
          <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validUntil">Valid until</Label>
          <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountPercent">Discount %</Label>
          <Input
            id="discountPercent"
            type="number"
            min="0"
            step="0.01"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tax %</Label>
          <Input
            id="taxRate"
            type="number"
            min="0"
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="gstEnabled" className="text-sm font-medium cursor-pointer">
              Indian GST Quotation
            </Label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Split tax into CGST + SGST (intra-state) or IGST (inter-state) based on place of supply.
            </p>
          </div>
          <input
            id="gstEnabled"
            type="checkbox"
            checked={gstEnabled}
            onChange={(e) => setGstEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 cursor-pointer"
          />
        </div>
        {gstEnabled ? (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400">
            <div>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Place of Supply:</span>{" "}
              {clientState ? getStateDisplayName(clientState) : "Not set on client (edit client to set state)"}
            </div>
            <div>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Tax Type:</span>{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {totals.taxType === "INTRA_STATE"
                  ? "Intra-State (CGST + SGST)"
                  : totals.taxType === "INTER_STATE"
                  ? "Inter-State (IGST)"
                  : "None"}
              </span>
            </div>
            {selectedClient?.gstin ? (
              <div>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Client GSTIN:</span>{" "}
                {selectedClient.gstin}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Line items</Label>
          <CatalogPicker
            items={catalogItems}
            currency={currency}
            locale={locale}
            onSelect={addFromCatalog}
            buttonLabel="+ Add from catalog"
            size="sm"
          />
        </div>
        <div ref={itemsParentRef} className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2.5 bg-zinc-50/50 dark:bg-zinc-900/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CatalogPicker
                    items={catalogItems}
                    currency={currency}
                    locale={locale}
                    onSelect={(cat) => applyCatalogItem(index, cat)}
                    buttonLabel="Select from catalog"
                    size="sm"
                  />
                  <div className="flex items-center gap-1.5">
                    <Input
                      placeholder="Unit (e.g. hr)"
                      value={item.unit ?? ""}
                      onChange={(e) => updateItem(index, { unit: e.target.value })}
                      className="h-7 w-24 text-xs"
                    />
                    <Input
                      placeholder="HSN/SAC"
                      value={item.hsnSac ?? ""}
                      onChange={(e) => updateItem(index, { hsnSac: e.target.value })}
                      className="h-7 w-28 text-xs font-mono"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  disabled={items.length === 1}
                >
                  ✕ Remove
                </Button>
              </div>

              <div className="grid grid-cols-12 gap-2.5">
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      className="w-full"
                    />
                    {item.unit ? (
                      <span className="absolute right-2.5 top-2 text-xs text-zinc-400 pointer-events-none font-mono">
                        {item.unit}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateItem(index, { rate: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
          >
            + Add line item
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Scope notes, terms, validity details…"
        />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal, currency, locale)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Discount ({discountPercent || 0}%)</span>
            <span>-{formatCurrency(totals.discount, currency, locale)}</span>
          </div>
          {gstEnabled && totals.taxType === "INTRA_STATE" ? (
            <>
              <div className="flex justify-between text-sm">
                <span>CGST ({(totals.taxRate) / 2}%)</span>
                <span>{formatCurrency(totals.cgstAmount, currency, locale)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST ({(totals.taxRate) / 2}%)</span>
                <span>{formatCurrency(totals.sgstAmount, currency, locale)}</span>
              </div>
            </>
          ) : gstEnabled && totals.taxType === "INTER_STATE" ? (
            <div className="flex justify-between text-sm">
              <span>IGST ({totals.taxRate}%)</span>
              <span>{formatCurrency(totals.igstAmount, currency, locale)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span>Tax ({parseFloat(taxRate) || 0}%)</span>
              <span>{formatCurrency(totals.tax, currency, locale)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(totals.total, currency, locale)}</span>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Update quotation" : "Create quotation"}
        </Button>
      </div>
    </form>
  );
}
