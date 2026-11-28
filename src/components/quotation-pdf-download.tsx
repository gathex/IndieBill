"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import {
  QuotationDocument,
  type QuotationPdfData,
} from "@/components/quotation-document";
import { Button } from "@/components/ui/button";

interface QuotationPdfDownloadProps {
  quotation: QuotationPdfData;
  businessName: string;
  businessAddress?: string | null;
  businessGstin?: string | null;
  currency?: string;
  locale?: string;
  logoDataUrl?: string | null;
}

export function QuotationPdfDownload({
  quotation,
  businessName,
  businessAddress,
  businessGstin,
  currency = "INR",
  locale,
  logoDataUrl,
}: QuotationPdfDownloadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const blob = await pdf(
        <QuotationDocument
          quotation={quotation}
          businessName={businessName}
          businessAddress={businessAddress}
          businessGstin={businessGstin}
          currency={currency}
          locale={locale}
          logoDataUrl={logoDataUrl}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotation-${quotation.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="outline" className="w-full" onClick={handleDownload} disabled={loading}>
        {loading ? "Generating…" : "Download PDF"}
      </Button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
