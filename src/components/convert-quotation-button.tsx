"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { convertQuotationToInvoice } from "@/actions/quotations";
import { Button } from "@/components/ui/button";

interface ConvertQuotationButtonProps {
  quotationId: string;
  convertedInvoiceId?: string | null;
  className?: string;
}

export function ConvertQuotationButton({
  quotationId,
  convertedInvoiceId,
  className,
}: ConvertQuotationButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert() {
    if (convertedInvoiceId) {
      router.push(`/invoices/${convertedInvoiceId}`);
      return;
    }
    if (!window.confirm("Convert this quotation into a new draft invoice?")) return;

    setLoading(true);
    setError(null);
    try {
      const result = await convertQuotationToInvoice(quotationId);
      router.push(`/invoices/${result.id}`);
      router.refresh();
    } catch {
      setError("Failed to convert quotation.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button type="button" className="w-full" onClick={handleConvert} disabled={loading}>
        {loading
          ? "Converting…"
          : convertedInvoiceId
            ? "View invoice"
            : "Convert to invoice"}
      </Button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
