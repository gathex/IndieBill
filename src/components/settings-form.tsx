"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { updateSettings } from "@/actions/settings";

interface SettingsFormProps {
  name: string;
  businessName: string;
  businessAddress: string;
  currency: string;
}

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"];

export function SettingsForm({
  name,
  businessName,
  businessAddress,
  currency,
}: SettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name,
    businessName,
    businessAddress,
    currency: CURRENCIES.includes(currency) ? currency : "USD",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateSettings(form as Parameters<typeof updateSettings>[0]);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                placeholder="Freelancer Studio"
              />
              <p className="text-xs text-zinc-500">Shown on invoices and emails.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business address</Label>
            <Textarea
              id="businessAddress"
              value={form.businessAddress}
              onChange={(e) => update("businessAddress", e.target.value)}
              placeholder="Street, city, country"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Default currency</Label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
              className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-600">Settings saved.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
