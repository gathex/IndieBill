export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function normalizeLocale(locale?: string): string {
  return locale?.trim() || "en-IN";
}

export function formatCurrency(
  amount: number,
  currency = "INR",
  locale?: string,
): string {
  const resolvedLocale = normalizeLocale(locale);
  const key = `${resolvedLocale}:${currency}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency,
    });
    currencyFormatters.set(key, formatter);
  }
  return formatter.format(amount);
}

const CURRENCY_SYMBOL_FALLBACKS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "$",
  AUD: "$",
  CHF: "CHF",
};

export function getCurrencySymbol(currency = "INR", locale?: string): string {
  const resolvedCurrency = currency?.trim() || "INR";
  try {
    const parts = new Intl.NumberFormat(normalizeLocale(locale), {
      style: "currency",
      currency: resolvedCurrency,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    const symbolPart = parts.find((part) => part.type === "currency");
    if (symbolPart?.value) return symbolPart.value;
  } catch {
    // Fall through to static symbol map for unsupported codes
  }
  return CURRENCY_SYMBOL_FALLBACKS[resolvedCurrency] ?? resolvedCurrency;
}

export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale?: string,
): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(normalizeLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}
