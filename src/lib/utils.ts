export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function normalizeLocale(locale?: string): string {
  return locale?.trim() || "en-US";
}

export function formatCurrency(
  amount: number,
  currency = "USD",
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
