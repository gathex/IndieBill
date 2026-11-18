import { cn } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { QuotationStatus } from "@/lib/quotations";

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const variant: BadgeVariant =
    status === "ACCEPTED" || status === "CONVERTED"
      ? "success"
      : status === "REJECTED"
        ? "danger"
        : status === "EXPIRED"
          ? "warning"
          : status === "SENT"
            ? "default"
            : "secondary";
  return (
    <Badge
      variant={variant}
      className={cn(
        "border-0",
        status === "SENT" && "bg-blue-100 text-blue-800",
        status === "CONVERTED" && "bg-indigo-100 text-indigo-800",
      )}
    >
      {status}
    </Badge>
  );
}
