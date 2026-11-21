"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/searchable-select";
import { createClient, updateClient } from "@/actions/clients";
import { INDIAN_STATES } from "@/lib/gst";

interface ClientFormClientProps {
  next?: string;
  client?: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    notes: string | null;
    gstin?: string | null;
    state?: string | null;
  } | null;
}

export function ClientFormClient({ client, next }: ClientFormClientProps) {
  const router = useRouter();
  const isEdit = Boolean(client);

  const [name, setName] = useState(client?.name ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [company, setCompany] = useState(client?.company ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [gstin, setGstin] = useState(client?.gstin ?? "");
  const [state, setState] = useState(client?.state ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const input = { name, email, company, phone, notes, gstin, state };
      if (client) {
        await updateClient(client.id, input);
        router.push(`/clients/${client.id}`);
      } else {
        const result = await createClient(input);
        router.push(next ?? `/clients/${result.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN (Optional)</Label>
          <Input
            id="gstin"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            placeholder="e.g. 27AAPFU0939F1ZV"
            maxLength={15}
          />
        </div>
        <div className="space-y-2">
          <SearchableSelect
            id="client-state"
            label="State / Union Territory (Optional)"
            value={state}
            options={INDIAN_STATES}
            onChange={(value) => setState(value)}
            placeholder="Select state or UT…"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Update client" : "Create client"}
        </Button>
      </div>
    </form>
  );
}
