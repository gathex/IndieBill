import { recordPayment } from "@/actions/payments";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/payments";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PaymentFormProps {
  invoiceId: string;
  balance: number;
  currency?: string;
  locale?: string;
}

export function PaymentForm({
  invoiceId,
  balance,
  currency = "USD",
  locale,
}: PaymentFormProps) {
  return (
    <form action={recordPayment} className="space-y-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <p className="text-xs text-zinc-500">
        Remaining balance: <span className="font-medium text-zinc-900">{formatCurrency(balance, currency, locale)}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="payment-amount">Amount</Label>
          <Input
            id="payment-amount"
            name="amount"
            type="number"
            min="0.01"
            max={balance}
            step="0.01"
            defaultValue={balance.toFixed(2)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="payment-date">Date</Label>
          <Input
            id="payment-date"
            name="paymentDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="payment-method">Method</Label>
        <select
          id="payment-method"
          name="method"
          defaultValue="MANUAL"
          className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="payment-reference">Reference (optional)</Label>
        <Input id="payment-reference" name="reference" placeholder="e.g. WIRE-1042" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="payment-notes">Notes (optional)</Label>
        <Textarea id="payment-notes" name="notes" rows={2} placeholder="Deposit, check number…" />
      </div>
      <Button type="submit" className="w-full">
        Record payment
      </Button>
    </form>
  );
}
