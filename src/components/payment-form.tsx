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
  currency = "INR",
  locale,
}: PaymentFormProps) {
  return (
    <form action={recordPayment} className="space-y-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Remaining balance:{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {formatCurrency(balance, currency, locale)}
        </span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Row 1: Amount and Date */}
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
          <Label htmlFor="payment-date">Date</Label>
          <Input
            id="payment-date"
            name="paymentDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>

        {/* Row 2: Method and Reference (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="payment-method">Method</Label>
          <select
            id="payment-method"
            name="method"
            defaultValue="MANUAL"
            className="flex h-9 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment-reference">Reference (optional)</Label>
          <Input
            id="payment-reference"
            name="reference"
            placeholder="e.g. UTR / UPI / WIRE-1042"
          />
        </div>

        {/* Row 3 (full width): Notes (optional) */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="payment-notes">Notes (optional)</Label>
          <Textarea
            id="payment-notes"
            name="notes"
            rows={2}
            placeholder="Deposit, check number, transaction details…"
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" className="w-full sm:w-auto min-w-[150px]">
          Record payment
        </Button>
      </div>
    </form>
  );
}
