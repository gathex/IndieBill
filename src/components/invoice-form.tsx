"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createInvoice, updateInvoice } from "@/actions/invoices";
import { computeInvoiceTotals, type InvoiceStatus } from "@/lib/invoices";
import { formatCurrency } from "@/lib/utils";

export interface InvoiceFormInvoice {
  id: string;
  clientId: string;
  status: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  discountPercent: number;
  taxRate: number;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

interface InvoiceFormClientProps {
  clients: Array<{ id: string; name: string; email: string; company: string | null }>;
  invoice?: InvoiceFormInvoice | null;
  currency?: string;
}

interface InvoiceItemRow {
  description: string;
  quantity: string;
  rate: string;
}

const emptyItem = (): InvoiceItemRow => ({ description: "", quantity: "1", rate: "" });

export function InvoiceFormClient({
  clients,
  invoice,
  currency = "USD",
}: InvoiceFormClientProps) {
  const router = useRouter();
  const isEdit = Boolean(invoice);

  const [clientId, setClientId] = useState(invoice?.clientId ?? clients[0]?.id ?? "");
  const [status, setStatus] = useState<InvoiceStatus>(() => {
    const initial = invoice?.status;
    return initial === "PARTIAL" || initial === "OVERDUE"
      ? "SENT"
      : ((initial as InvoiceStatus) ?? "DRAFT");
  });
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate ? invoice.issueDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(invoice?.dueDate ? invoice.dueDate.slice(0, 10) : "");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [discountPercent, setDiscountPercent] = useState(String(invoice?.discountPercent ?? 0));
  const [taxRate, setTaxRate] = useState(String(invoice?.taxRate ?? 0));
  const [items, setItems] = useState<InvoiceItemRow[]>(
    invoice?.items?.length
      ? invoice.items.map((i) => ({
          description: i.description,
          quantity: String(i.quantity),
          rate: String(i.rate),
        }))
      : [{ ...emptyItem(), description: "", quantity: "1", rate: "" }],
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0),
    0,
  );
  const totals = computeInvoiceTotals({
    subtotal,
    discountPercent: parseFloat(discountPercent) || 0,
    taxRate: parseFloat(taxRate) || 0,
  });

  function updateItem(index: number, patch: Partial<InvoiceItemRow>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanedItems = items
      .map((item) => ({
        description: item.description.trim(),
        quantity: parseFloat(item.quantity) || 1,
        rate: parseFloat(item.rate) || 0,
      }))
      .filter((item) => item.description.length > 0);

    if (!clientId) {
      setError("Please select a client.");
      return;
    }
    if (cleanedItems.length === 0) {
      setError("Add at least one line item to the invoice.");
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        clientId,
        status,
        issueDate: issueDate || new Date().toISOString(),
        dueDate: dueDate || null,
        notes: notes.trim() || null,
        discountPercent: parseFloat(discountPercent) || 0,
        taxRate: parseFloat(taxRate) || 0,
        items: cleanedItems,
      };

  const statusValue =
    status === "PARTIAL" || status === "OVERDUE" ? "SENT" : status;

      const result = invoice
        ? await updateInvoice(invoice.id, {
            ...input,
            status: statusValue,
          })
        : await createInvoice({
            ...input,
            status: statusValue,
          });

      router.push(`/invoices/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invoice.");
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
            className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
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
            onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
            className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="issueDate">Issue date</Label>
          <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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

      <div className="space-y-2">
        <Label>Line items</Label>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={item.rate}
                  onChange={(e) => updateItem(index, { rate: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  disabled={items.length === 1}
                >
                  ✕
                </Button>
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
          placeholder="Payment instructions, thank you note…"
        />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Discount ({discountPercent || 0}%)</span>
            <span>-{formatCurrency(totals.discount, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax ({parseFloat(taxRate) || 0}%)</span>
            <span>{formatCurrency(totals.tax, currency)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(totals.total, currency)}</span>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Update invoice" : "Create invoice"}
        </Button>
      </div>
    </form>
  );
}
