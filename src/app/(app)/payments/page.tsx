import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { deletePayment } from "@/actions/payments";
import {
  PAYMENT_METHOD_LABELS,
  getUserPayments,
  type PaymentMethod,
} from "@/lib/payments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getUserSettings } from "@/lib/users";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Notice } from "@/components/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [payments, settings] = await Promise.all([
    getUserPayments(userId),
    getUserSettings(userId),
  ]);
  const money = (amount: number) =>
    formatCurrency(amount, settings.currency, settings.locale);
  const totalReceived = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      <Notice notice={notice} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Payments</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {payments.length} payment(s) · {money(totalReceived)} received
          </p>
        </div>
        <Link href="/invoices">
          <Button variant="outline">Go to invoices</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          {payments.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No payments recorded yet. Record one from any invoice.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Invoice</th>
                    <th className="py-2 pr-4 font-medium">Client</th>
                    <th className="py-2 pr-4 font-medium">Method</th>
                    <th className="py-2 pr-4 font-medium">Reference</th>
                    <th className="py-2 pr-4 font-medium text-right">Amount</th>
                    <th className="py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                        {formatDate(payment.paymentDate, undefined, settings.locale)}
                      </td>
                      <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                        <Link
                          href={`/invoices/${payment.invoiceId}`}
                          className="hover:underline"
                        >
                          {payment.invoice.number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                        {payment.invoice.client.name}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">
                          {PAYMENT_METHOD_LABELS[payment.method as PaymentMethod] ??
                            payment.method}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                        {payment.reference ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                        {money(payment.amount)}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          <Link href={`/invoices/${payment.invoiceId}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <form action={deletePayment}>
                            <input type="hidden" name="id" value={payment.id} />
                            <ConfirmSubmitButton
                              type="submit"
                              variant="danger"
                              size="sm"
                              confirmMessage="Delete this payment? The invoice balance will be recalculated."
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
