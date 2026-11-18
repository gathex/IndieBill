import { cn } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/lib/invoices";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const variant: BadgeVariant =
    status === "PAID" ? "success" : status === "OVERDUE" ? "danger" : status === "SENT" ? "default" : "secondary";
  return (
    <Badge variant={variant} className={cn("border-0", status === "SENT" && "bg-blue-100 text-blue-800")}>
      {status}
    </Badge>
  );
}
