import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "border-transparent bg-zinc-900 text-white",
  secondary: "border-transparent bg-zinc-100 text-zinc-900",
  outline: "text-zinc-700",
  success: "border-transparent bg-emerald-100 text-emerald-800",
  warning: "border-transparent bg-amber-100 text-amber-800",
  danger: "border-transparent bg-red-100 text-red-800",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
