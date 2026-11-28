"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, skipOnboarding } from "@/actions/onboarding";
import { SearchableSelect } from "@/components/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INDIAN_STATES, isValidGstin } from "@/lib/gst";
import type { LocaleOption } from "@/lib/locale-data";
import { cn } from "@/lib/utils";

interface OnboardingInitialData {
  displayName: string;
  businessName: string;
  phone: string;
  businessAddress: string;
  state: string;
  currency: string;
  gstin: string;
  defaultGstRate: number | null;
  invoicePrefix: string;
  qrUpiId: string;
  bankName: string;
  qrAccountNumber: string;
  bankIfsc: string;
}

const STEP_META = [
  {
    step: 1,
    eyebrow: "Your Business",
    title: "Tell us about your studio or brand",
    subtitle: "These details appear at the top of your invoices, quotations, and emails.",
  },
  {
    step: 2,
    eyebrow: "Billing & Tax",
    title: "Currency, GST & invoice numbering",
    subtitle: "Configure your defaults once—every new invoice picks these up automatically.",
  },
  {
    step: 3,
    eyebrow: "Payment Details",
    title: "Get paid faster via UPI or bank",
    subtitle: "Add your UPI ID for instant QR codes on shared invoices, or add bank details.",
  },
] as const;

const GST_RATE_PRESETS = ["5", "12", "18", "28"] as const;

export function OnboardingWizard({
  initialData,
  currencies,
}: {
  initialData: OnboardingInitialData;
  currencies: LocaleOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: initialData.businessName || "",
    phone: initialData.phone || "",
    businessAddress: initialData.businessAddress || "",
    state: initialData.state || "",
    currency:
      initialData.currency && initialData.currency !== "USD"
        ? initialData.currency
        : "INR",
    gstRegistered: Boolean(initialData.gstin),
    gstin: initialData.gstin || "",
    defaultGstRate:
      initialData.defaultGstRate != null
        ? String(initialData.defaultGstRate)
        : "18",
    invoicePrefix: initialData.invoicePrefix || "INV-",
    qrUpiId: initialData.qrUpiId || "",
    bankName: initialData.bankName || "",
    qrAccountNumber: initialData.qrAccountNumber || "",
    bankIfsc: initialData.bankIfsc || "",
  });

  const updateField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const currentMeta = STEP_META[step - 1];
  const progressPercent = (step / 3) * 100;

  const handleNext = () => {
    setError(null);

    if (step === 1) {
      if (!form.businessName.trim()) {
        setError("Please enter your Business or Brand Name to continue.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (form.gstRegistered && form.gstin.trim() && !isValidGstin(form.gstin)) {
        setError(
          "Please enter a valid 15-character GSTIN (e.g. 27AAPFU0939F1ZV), or leave it blank for now.",
        );
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSkip = async () => {
    setError(null);
    setIsSkipping(true);
    try {
      await skipOnboarding();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not skip onboarding right now. Please try again.");
      setIsSkipping(false);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.businessName.trim()) {
      setStep(1);
      setError("Please enter your Business or Brand Name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedRate =
        form.gstRegistered &&
        form.defaultGstRate.trim() !== "" &&
        Number.isFinite(Number(form.defaultGstRate))
          ? Number(form.defaultGstRate)
          : null;

      const res = await completeOnboarding({
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        businessAddress: form.businessAddress.trim(),
        state: form.state,
        currency: form.currency || "INR",
        gstRegistered: form.gstRegistered,
        gstin: form.gstin.trim().toUpperCase(),
        defaultGstRate: parsedRate,
        invoicePrefix: form.invoicePrefix.trim() || "INV-",
        qrUpiId: form.qrUpiId.trim(),
        bankName: form.bankName.trim(),
        qrAccountNumber: form.qrAccountNumber.trim(),
        bankIfsc: form.bankIfsc.trim().toUpperCase(),
      });

      if (!res.ok) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong saving your workspace setup. Please try again.");
      setIsSubmitting(false);
    }
  };

  const previewPrefix = form.invoicePrefix.trim() || "INV-";

  return (
    <div className="mx-auto w-full max-w-xl py-2 sm:py-6">
      {/* Top Progress Bar & Skip */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-full bg-orange-500/15 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Welcome, {initialData.displayName.split(" ")[0]}
            </span>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Step {step} of 3
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting || isSkipping}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSkipping ? "Skipping…" : "Skip for now →"}
          </button>
        </div>

        {/* Continuous Progress Track */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 dark:bg-orange-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Q&A Card */}
      <form
        onSubmit={handleFinish}
        className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 shadow-xl shadow-zinc-950/5 dark:shadow-black/50 p-6 sm:p-8 space-y-6"
      >
        {/* Step Heading */}
        <div className="space-y-1.5 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
            {currentMeta.eyebrow}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {currentMeta.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {currentMeta.subtitle}
          </p>
        </div>

        {/* Step 1: Your Business */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ob-business-name">
                Business / Brand Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="ob-business-name"
                value={form.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="e.g. Kala Design Studio"
                autoFocus
                className="h-10"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ob-phone">Phone (optional)</Label>
                <Input
                  id="ob-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <SearchableSelect
                  id="ob-state"
                  label="State / Union Territory"
                  value={form.state}
                  options={INDIAN_STATES}
                  onChange={(code) => updateField("state", code)}
                  placeholder="Select state…"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ob-address">Address / City (optional)</Label>
              <Textarea
                id="ob-address"
                rows={3}
                value={form.businessAddress}
                onChange={(e) => updateField("businessAddress", e.target.value)}
                placeholder="e.g. 42 Indiranagar 100 Ft Rd, Bengaluru 560038"
                className="resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Billing & Tax */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <SearchableSelect
                  id="ob-currency"
                  label="Default Currency"
                  value={form.currency}
                  options={currencies}
                  onChange={(code) => updateField("currency", code)}
                  placeholder="Search currency…"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ob-prefix">Invoice Prefix</Label>
                <Input
                  id="ob-prefix"
                  value={form.invoicePrefix}
                  onChange={(e) => updateField("invoicePrefix", e.target.value)}
                  placeholder="INV-"
                  maxLength={20}
                  className="h-10 font-mono"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Preview: <span className="font-mono text-zinc-800 dark:text-zinc-200">{previewPrefix}0001</span>
                </p>
              </div>
            </div>

            {/* GST Registered Toggle */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Are you GST registered?
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Enables automatic CGST + SGST / IGST splits and HSN/SAC codes.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.gstRegistered}
                  onClick={() => updateField("gstRegistered", !form.gstRegistered)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
                    form.gstRegistered
                      ? "bg-orange-500"
                      : "bg-zinc-300 dark:bg-zinc-700",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200",
                      form.gstRegistered ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {form.gstRegistered && (
                <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-zinc-200/80 dark:border-zinc-800">
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-gstin">GSTIN (optional for now)</Label>
                    <Input
                      id="ob-gstin"
                      value={form.gstin}
                      onChange={(e) =>
                        updateField("gstin", e.target.value.toUpperCase())
                      }
                      placeholder="27AAPFU0939F1ZV"
                      maxLength={15}
                      className="h-10 font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ob-gst-rate">Default GST %</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="ob-gst-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.defaultGstRate}
                        onChange={(e) =>
                          updateField("defaultGstRate", e.target.value)
                        }
                        className="h-10"
                      />
                      <div className="flex gap-1">
                        {GST_RATE_PRESETS.map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => updateField("defaultGstRate", rate)}
                            className={cn(
                              "px-2 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer",
                              form.defaultGstRate === rate
                                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                                : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                            )}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Payment Details */}
        {step === 3 && (
          <div className="space-y-5">
            {/* UPI ID */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ob-upi">UPI ID (recommended)</Label>
                <Input
                  id="ob-upi"
                  value={form.qrUpiId}
                  onChange={(e) => updateField("qrUpiId", e.target.value)}
                  placeholder="yourname@okaxis"
                  className="h-10 font-mono"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                <svg
                  className="h-4 w-4 shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM18 18h3v3h-3z" />
                </svg>
                <div className="space-y-0.5">
                  <p className="font-medium">
                    Powers instant scannable UPI QR codes on your invoices
                  </p>
                  <p className="text-[11px] opacity-85">
                    {form.qrUpiId.trim()
                      ? `Live QR payee: ${form.qrUpiId.trim()} (GPay, PhonePe, Paytm, BHIM)`
                      : "Clients can scan & pay directly with GPay, PhonePe, Paytm, or BHIM with 0% fee."}
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Bank Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Bank Transfer Details (Optional)
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-bank-name" className="text-xs">
                    Bank Name
                  </Label>
                  <Input
                    id="ob-bank-name"
                    value={form.bankName}
                    onChange={(e) => updateField("bankName", e.target.value)}
                    placeholder="HDFC Bank"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-bank-account" className="text-xs">
                    Account Number
                  </Label>
                  <Input
                    id="ob-bank-account"
                    value={form.qrAccountNumber}
                    onChange={(e) =>
                      updateField("qrAccountNumber", e.target.value)
                    }
                    placeholder="000123456789"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-bank-ifsc" className="text-xs">
                    IFSC Code
                  </Label>
                  <Input
                    id="ob-bank-ifsc"
                    value={form.bankIfsc}
                    onChange={(e) =>
                      updateField("bankIfsc", e.target.value.toUpperCase())
                    }
                    placeholder="HDFC0001234"
                    maxLength={20}
                    className="h-9 text-sm font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline Error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {error}
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting || isSkipping}
                className="cursor-pointer"
              >
                ← Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="cursor-pointer px-5"
              >
                Next →
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || isSkipping}
                className="cursor-pointer px-5"
              >
                {isSubmitting ? "Saving setup…" : "Finish & Go to Dashboard"}
              </Button>
            )}
          </div>
        </div>
      </form>

      <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-500">
        You can change any of these details anytime from{" "}
        <span className="text-zinc-700 dark:text-zinc-300 font-medium">Settings</span>.
      </p>
    </div>
  );
}
