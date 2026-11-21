export interface IndianState {
  code: string;
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman and Diu" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh (New)" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
];

export function isValidGstin(gstin?: string | null): boolean {
  if (!gstin) return false;
  const trimmed = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Zz][0-9A-Za-z]{1}$/;
  return gstinRegex.test(trimmed);
}

export function normalizeState(val?: string | null): string {
  if (!val) return "";
  const v = val.trim().toLowerCase();
  const match = INDIAN_STATES.find(
    (s) => s.code.toLowerCase() === v || s.name.toLowerCase() === v,
  );
  if (match) return match.code;
  return v;
}

export function isSameState(stateA?: string | null, stateB?: string | null): boolean {
  const normA = normalizeState(stateA);
  const normB = normalizeState(stateB);
  if (!normA || !normB) return false;
  return normA === normB;
}

export function getStateDisplayName(stateVal?: string | null): string {
  if (!stateVal) return "";
  const trimmed = stateVal.trim();
  const match = INDIAN_STATES.find(
    (s) =>
      s.code.toLowerCase() === trimmed.toLowerCase() ||
      s.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (match) return `${match.name} (${match.code})`;
  return trimmed;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface GstCalculationInput {
  subtotal: number;
  discountPercent: number;
  taxRate: number;
  gstEnabled?: boolean;
  businessState?: string | null;
  clientState?: string | null;
}

export interface GstCalculationResult {
  gstEnabled: boolean;
  taxType: "NONE" | "INTRA_STATE" | "INTER_STATE";
  subtotal: number;
  discount: number;
  taxable: number;
  taxRate: number;
  tax: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
}

export function computeGstTotals({
  subtotal: rawSubtotal,
  discountPercent,
  taxRate,
  gstEnabled = false,
  businessState,
  clientState,
}: GstCalculationInput): GstCalculationResult {
  const subtotal = round2(rawSubtotal);
  const discount = round2(subtotal * (discountPercent / 100));
  const taxable = round2(subtotal - discount);
  const tax = round2(taxable * (taxRate / 100));

  if (!gstEnabled) {
    return {
      gstEnabled: false,
      taxType: "NONE",
      subtotal,
      discount,
      taxable,
      taxRate,
      tax,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: round2(taxable + tax),
    };
  }

  const isSame = isSameState(businessState, clientState);
  if (isSame) {
    const cgst = round2(tax / 2);
    const sgst = round2(tax - cgst);
    return {
      gstEnabled: true,
      taxType: "INTRA_STATE",
      subtotal,
      discount,
      taxable,
      taxRate,
      tax,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: 0,
      total: round2(taxable + cgst + sgst),
    };
  }

  return {
    gstEnabled: true,
    taxType: "INTER_STATE",
    subtotal,
    discount,
    taxable,
    taxRate,
    tax,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: tax,
    total: round2(taxable + tax),
  };
}
