import type { QuotationPdfData } from "@/components/quotation-document";
import { formatCurrency, formatDate } from "@/lib/utils";

interface QuotationSheetProps {
  quotation: QuotationPdfData;
  businessName: string;
  businessAddress?: string | null;
  currency?: string;
}

export function QuotationSheet({
  quotation,
  businessName,
  businessAddress,
  currency = "USD",
}: QuotationSheetProps) {
  const money = (amount: number) => formatCurrency(amount, currency);

  return (
    <article className="a4-sheet bg-white px-[15mm] py-[14mm] text-[11px] leading-relaxed text-zinc-900">
      <header className="flex items-start justify-between gap-8 border-b border-zinc-200 pb-6">
        <div className="max-w-[55%]">
          <h2 className="text-xl font-bold tracking-tight">{businessName}</h2>
          {businessAddress ? (
            <p className="mt-1 whitespace-pre-line text-[9px] text-zinc-500">
              {businessAddress}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tracking-[0.2em] text-zinc-900">QUOTATION</div>
          <div className="mt-2 text-sm font-semibold">{quotation.number}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
            {quotation.status}
          </div>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <div className="text-[8px] font-semibold uppercase tracking-widest text-zinc-400">
            Prepared for
          </div>
          <div className="mt-2 text-sm font-semibold">{quotation.clientName}</div>
          {quotation.clientCompany ? (
            <div className="text-zinc-600">{quotation.clientCompany}</div>
          ) : null}
          <div className="text-zinc-600">{quotation.clientEmail ?? ""}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-right">
          <div>
            <div className="text-[8px] font-semibold uppercase tracking-widest text-zinc-400">
              Issued
            </div>
            <div className="mt-2 text-zinc-700">{formatDate(quotation.issueDate)}</div>
          </div>
          <div>
            <div className="text-[8px] font-semibold uppercase tracking-widest text-zinc-400">
              Valid until
            </div>
            <div className="mt-2 text-zinc-700">{formatDate(quotation.validUntil)}</div>
          </div>
        </div>
      </section>

      <table className="mt-8 w-full table-fixed border-collapse text-left">
        <thead>
          <tr className="bg-zinc-100 text-[9px] uppercase tracking-wider text-zinc-500">
            <th className="w-[40%] px-2 py-2 font-semibold">Description</th>
            <th className="w-[12%] px-2 py-2 text-right font-semibold">Qty</th>
            <th className="w-[20%] px-2 py-2 text-right font-semibold">Rate</th>
            <th className="w-[28%] px-2 py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items.map((item, index) => (
            <tr key={index} className="border-b border-zinc-200">
              <td className="px-2 py-2 align-top">{item.description}</td>
              <td className="px-2 py-2 text-right align-top text-zinc-600">{item.quantity}</td>
              <td className="px-2 py-2 text-right align-top text-zinc-600">{money(item.rate)}</td>
              <td className="px-2 py-2 text-right align-top font-medium">
                {money(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="ml-auto mt-6 w-[45%]">
        <div className="flex justify-between py-1">
          <span className="text-zinc-500">Subtotal</span>
          <span>{money(quotation.subtotal)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-zinc-500">Discount</span>
          <span>-{money(quotation.discount)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-zinc-500">Tax</span>
          <span>{money(quotation.tax)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-zinc-300 pt-3 text-sm font-bold">
          <span>Total</span>
          <span>{money(quotation.total)}</span>
        </div>
      </section>

      {quotation.notes ? (
        <section className="mt-8">
          <div className="text-[8px] font-semibold uppercase tracking-widest text-zinc-400">
            Notes
          </div>
          <p className="mt-2 whitespace-pre-line text-zinc-600">{quotation.notes}</p>
        </section>
      ) : null}

      <footer className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-3 text-[9px] text-zinc-400">
        <span>We look forward to working with you.</span>
        <span>{businessName} · Page 1 of 1</span>
      </footer>
    </article>
  );
}
