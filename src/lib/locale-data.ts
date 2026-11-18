import { getAlpha2Codes } from "i18n-iso-countries";
import iso639 from "iso-639-1";

export interface LocaleOption {
  code: string;
  name: string;
}

const COUNTRY_CODES = Object.keys(getAlpha2Codes()).sort();
const LANGUAGE_CODES: string[] = iso639.getAllCodes().slice().sort();

function displayName(
  type: "region" | "language" | "currency",
  code: string,
  locale: string,
): string {
  try {
    return new Intl.DisplayNames([locale], { type }).of(code) ?? code;
  } catch {
    return code;
  }
}

function currencyCodes(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("currency").slice().sort();
  }
  return ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CHF"];
}

export function getCountryOptions(locale = "en"): LocaleOption[] {
  return COUNTRY_CODES.map((code) => ({
    code,
    name: displayName("region", code, locale),
  }));
}

export function getCurrencyOptions(locale = "en"): LocaleOption[] {
  return currencyCodes().map((code) => ({
    code,
    name: displayName("currency", code, locale),
  }));
}

export function getLanguageOptions(locale = "en"): LocaleOption[] {
  return LANGUAGE_CODES.map((code) => ({
    code,
    name: displayName("language", code, locale),
  }));
}

export function isValidCountryCode(code: string): boolean {
  return COUNTRY_CODES.includes(code);
}

export function isValidCurrencyCode(code: string): boolean {
  return currencyCodes().includes(code);
}

export function isValidLanguageCode(code: string): boolean {
  return LANGUAGE_CODES.includes(code);
}

export function buildLocale(language: string, country: string): string {
  return `${language}-${country}`;
}
