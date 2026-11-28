"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SearchableSelect } from "@/components/searchable-select";
import { updateSettings } from "@/actions/settings";
import type { LocaleOption } from "@/lib/locale-data";
import { INDIAN_STATES } from "@/lib/gst";

interface SettingsFormProps {
  name: string;
  businessName: string;
  businessAddress: string;
  currency: string;
  country: string;
  language: string;
  logoDataUrl: string | null;
  qrName: string;
  qrVpa: string;
  qrUpiId: string;
  qrAccountNumber: string;
  gstin?: string;
  state?: string;
  countries: LocaleOption[];
  currencies: LocaleOption[];
  languages: LocaleOption[];
}

function fallbackCode(value: string, options: LocaleOption[], fallback: string) {
  return options.some((option) => option.code === value) ? value : fallback;
}

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg"];
const MAX_LOGO_BYTES = 1024 * 1024;

export function SettingsForm({
  name,
  businessName,
  businessAddress,
  currency,
  country,
  language,
  logoDataUrl,
  qrName,
  qrVpa,
  qrUpiId,
  qrAccountNumber,
  gstin = "",
  state = "",
  countries,
  currencies,
  languages,
}: SettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name,
    businessName,
    businessAddress,
    currency: fallbackCode(currency, currencies, "USD"),
    country: fallbackCode(country, countries, "US"),
    language: fallbackCode(language, languages, "en"),
    logoDataUrl,
    qrName,
    qrVpa,
    qrUpiId,
    qrAccountNumber,
    gstin,
    state,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError("Logo must be a PNG or JPG image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("Logo must be 1 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, logoDataUrl: reader.result as string }));
        setSaved(false);
      }
    };
    reader.onerror = () => setError("Unable to read the logo file.");
    reader.readAsDataURL(file);
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Shown on invoices and emails.</p>
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
            <Label htmlFor="logo">Company logo</Label>
            <input
              id="logo"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoChange}
              className="block w-full text-sm text-zinc-700 dark:text-zinc-300 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-50"
            />
            {form.logoDataUrl ? (
              <div className="flex items-center gap-4 rounded-md border border-zinc-200 dark:border-zinc-800 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.logoDataUrl}
                  alt="Company logo preview"
                  className="h-14 w-14 shrink-0 rounded border border-zinc-200 dark:border-zinc-800 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Logo ready to save</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Used in the header and as a faded watermark on documents.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, logoDataUrl: null }));
                    setSaved(false);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : null}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              PNG or JPG up to 1 MB. Changes apply to new previews and PDFs.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SearchableSelect
              id="country"
              label="Country"
              value={form.country}
              options={countries}
              onChange={(value) => update("country", value)}
              placeholder="Search all countries…"
            />
            <SearchableSelect
              id="currency"
              label="Default currency"
              value={form.currency}
              options={currencies}
              onChange={(value) => update("currency", value)}
              placeholder="Search all currencies…"
            />
          </div>
          <SearchableSelect
            id="language"
            label="Language"
            value={form.language}
            options={languages}
            onChange={(value) => update("language", value)}
            placeholder="Search all languages…"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Language and country control date and number formatting on invoices,
            quotations, payments, and PDFs.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Indian GST Details
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Optional GST identification number and state for invoices and quotations with CGST, SGST, or IGST breakdown.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={form.gstin}
                onChange={(e) => update("gstin", e.target.value.toUpperCase())}
                placeholder="e.g. 27AAPFU0939F1ZV"
                maxLength={15}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                15-character Goods and Services Tax Identification Number.
              </p>
            </div>
            <div className="space-y-2">
              <SearchableSelect
                id="state"
                label="State / Union Territory"
                value={form.state}
                options={INDIAN_STATES}
                onChange={(value) => update("state", value)}
                placeholder="Select state or UT…"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Used to determine intra-state (CGST+SGST) vs inter-state (IGST).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">QR payment details</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Used in invoice QR codes for direct UPI scan-to-pay.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qrName">Name</Label>
              <Input
                id="qrName"
                value={form.qrName}
                onChange={(e) => update("qrName", e.target.value)}
                placeholder="Payee name shown in the QR code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrVpa">VPA</Label>
              <Input
                id="qrVpa"
                value={form.qrVpa}
                onChange={(e) => update("qrVpa", e.target.value)}
                placeholder="name@bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrUpiId">UPI ID</Label>
              <Input
                id="qrUpiId"
                value={form.qrUpiId}
                onChange={(e) => update("qrUpiId", e.target.value)}
                placeholder="name@upi"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Used for the UPI payment link; takes priority over VPA.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrAccountNumber">Account number</Label>
              <Input
                id="qrAccountNumber"
                value={form.qrAccountNumber}
                onChange={(e) => update("qrAccountNumber", e.target.value)}
                placeholder="Bank account number"
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            With a VPA or UPI ID the QR opens a UPI payment app. Otherwise it
            shows these details as a payment request.
          </p>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-600 dark:text-emerald-400">Settings saved.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
