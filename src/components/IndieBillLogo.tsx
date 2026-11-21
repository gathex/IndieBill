import { cn } from "@/lib/utils";

export interface IndieBillLogoProps {
  showText?: boolean;
  size?: number;
  className?: string;
  textClassName?: string;
}

export function IndieBillLogo({
  showText = true,
  size = 28,
  className,
  textClassName,
}: IndieBillLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect
          width="32"
          height="32"
          rx="7"
          fill="#111111"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.8"
        />
        <path
          d="M9 9v14"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M15.5 9v14"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M15.5 9h4a3.5 3.5 0 0 1 0 7h-4"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.5 16h4.5a3.5 3.5 0 0 1 0 7h-4.5"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight text-zinc-900 dark:text-zinc-100",
            textClassName
          )}
          style={{
            fontSize: `${Math.max(15, Math.round(size * 0.68))}px`,
            lineHeight: 1,
          }}
        >
          IndieBill
        </span>
      )}
    </div>
  );
}

export default IndieBillLogo;
