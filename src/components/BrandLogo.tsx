import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  variant?: "icon" | "wordmark" | "full";
  size?: number;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = "full",
  size = 28,
  className,
  priority = true,
}: BrandLogoProps) {
  const iconSize = size;
  const wordmarkHeight = Math.round(size * 0.72);
  const wordmarkWidth = Math.round(wordmarkHeight * (482 / 146));

  if (variant === "icon") {
    return (
      <div className={cn("inline-flex items-center select-none", className)}>
        <Image
          src="/brand/IB.png"
          alt="IndieBill"
          width={iconSize}
          height={iconSize}
          priority={priority}
          className="rounded-lg object-contain shrink-0"
          style={{ width: iconSize, height: iconSize }}
        />
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <div className={cn("inline-flex items-center select-none", className)}>
        <Image
          src="/brand/Indebill.png"
          alt="IndieBill"
          width={wordmarkWidth}
          height={wordmarkHeight}
          priority={priority}
          className="object-contain shrink-0 dark:invert"
          style={{ width: wordmarkWidth, height: wordmarkHeight }}
        />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <Image
        src="/brand/IB.png"
        alt="IndieBill"
        width={iconSize}
        height={iconSize}
        priority={priority}
        className="rounded-lg object-contain shrink-0"
        style={{ width: iconSize, height: iconSize }}
      />
      <span
        className="font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
        style={{
          fontSize: `${Math.max(16, Math.round(size * 0.7))}px`,
          lineHeight: 1,
        }}
      >
        IndieBill
      </span>
    </div>
  );
}

export default BrandLogo;
