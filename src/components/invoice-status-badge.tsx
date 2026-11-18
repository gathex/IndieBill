import { cn } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/lib/invoices";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const variant: BadgeVariant =
    status === "PAID"
      ? "success"
      : status === "PARTIAL"
        ? "warning"
        : status === "OVERDUE"
          ? "danger"
          : status === "SENT"
            ? "default"
            : "secondary";
  return (
    <Badge
      variant={variant}
      className={cn(
        "border-0",
        status === "SENT" && "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
        status === "PARTIAL" && "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
      )}
    >
      {status === "PARTIAL" ? "PARTIALLY PAID" : status}
    </Badge>
  );
}
