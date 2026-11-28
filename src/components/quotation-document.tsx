import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface QuotationPdfData {
  id: string;
  number: string;
  status: string;
  issueDate: Date;
  validUntil: Date | null;
  subtotal: number;
  discount: number;
  tax: number;
  taxRate?: number;
  gstEnabled?: boolean;
  taxType?: string;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  businessGstin?: string | null;
  businessState?: string | null;
  clientGstin?: string | null;
  clientState?: string | null;
  placeOfSupply?: string | null;
  total: number;
  notes: string | null;
  clientName: string;
  clientEmail: string | null;
  clientCompany?: string | null;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    hsnSac?: string | null;
  }>;
}

export interface QuotationDocumentProps {
  quotation: QuotationPdfData;
  businessName: string;
  businessAddress?: string | null;
  businessGstin?: string | null;
  currency?: string;
  locale?: string;
  logoDataUrl?: string | null;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 40, fontSize: 11, color: "#18181b" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "flex-start" },
  brandCopy: { flexGrow: 1 },
  headerLogo: { width: 48, height: 48, marginRight: 12, objectFit: "contain" },
  watermark: {
    position: "absolute",
    top: 260,
    left: 148,
    width: 300,
    height: 300,
    opacity: 0.06,
    objectFit: "contain",
  },
  brand: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  muted: { fontSize: 9, color: "#71717a" },
  title: { fontSize: 22, fontWeight: "bold", color: "#18181b" },
  status: { fontSize: 10, color: "#52525b", marginTop: 6, textAlign: "right" },
  section: { marginTop: 26 },
  label: { fontSize: 8, color: "#a1a1aa", marginBottom: 4, textTransform: "uppercase" },
  value: { fontSize: 11, lineHeight: 1.5 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  half: { width: "48%" },
  table: { marginTop: 24 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  colDesc: { width: "40%" },
  colQty: { width: "12%" },
  colRate: { width: "20%" },
  colAmount: { width: "28%" },
  colDescHsn: { width: "35%" },
  colHsn: { width: "15%" },
  colQtyHsn: { width: "12%" },
  colRateHsn: { width: "18%" },
  colAmountHsn: { width: "20%" },
  cell: { fontSize: 10 },
  right: { textAlign: "right" },
  totals: { marginTop: 16, alignSelf: "flex-end", width: "45%" },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalBold: { fontSize: 13, fontWeight: "bold", paddingTop: 6 },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export function QuotationDocument({
  quotation,
  businessName,
  businessAddress,
  businessGstin,
  currency = "INR",
  locale,
  logoDataUrl,
}: QuotationDocumentProps) {
  const money = (amount: number) => formatCurrency(amount, currency, locale);
  const showHsn = Boolean(quotation.gstEnabled || quotation.items.some((i) => i.hsnSac));
  const effectiveBusinessGstin = quotation.businessGstin || businessGstin;

  return (
    <Document
      title={`Quotation ${quotation.number}`}
      author={businessName}
      subject={`Quotation ${quotation.number}`}
    >
      <Page size="A4" style={styles.page}>
        {logoDataUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={logoDataUrl} style={styles.watermark} />
        ) : null}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            {logoDataUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoDataUrl} style={styles.headerLogo} />
            ) : null}
            <View style={styles.brandCopy}>
              <Text style={styles.brand}>{businessName}</Text>
              {businessAddress ? (
                <Text style={styles.muted}>{businessAddress}</Text>
              ) : null}
              {effectiveBusinessGstin ? (
                <Text style={styles.muted}>GSTIN: {effectiveBusinessGstin}</Text>
              ) : null}
            </View>
          </View>
          <View>
            <Text style={styles.title}>QUOTATION</Text>
            <Text style={styles.status}>{quotation.number}</Text>
            <Text style={styles.status}>{quotation.status}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Prepared for</Text>
            <Text style={styles.value}>{quotation.clientName}</Text>
            {quotation.clientCompany ? (
              <Text style={styles.value}>{quotation.clientCompany}</Text>
            ) : null}
            <Text style={styles.value}>{quotation.clientEmail ?? ""}</Text>
            {quotation.clientGstin ? (
              <Text style={styles.value}>GSTIN: {quotation.clientGstin}</Text>
            ) : null}
            {quotation.placeOfSupply ? (
              <Text style={styles.value}>Place of Supply: {quotation.placeOfSupply}</Text>
            ) : null}
          </View>
          <View style={styles.half}>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Issued</Text>
                <Text style={styles.value}>{formatDate(quotation.issueDate, undefined, locale)}</Text>
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Valid until</Text>
                <Text style={styles.value}>{formatDate(quotation.validUntil, undefined, locale)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            {showHsn ? (
              <>
                <Text style={[styles.cell, styles.colDescHsn]}>Description</Text>
                <Text style={[styles.cell, styles.colHsn]}>HSN/SAC</Text>
                <Text style={[styles.cell, styles.colQtyHsn, styles.right]}>Qty</Text>
                <Text style={[styles.cell, styles.colRateHsn, styles.right]}>Rate</Text>
                <Text style={[styles.cell, styles.colAmountHsn, styles.right]}>Amount</Text>
              </>
            ) : (
              <>
                <Text style={[styles.cell, styles.colDesc]}>Description</Text>
                <Text style={[styles.cell, styles.colQty, styles.right]}>Qty</Text>
                <Text style={[styles.cell, styles.colRate, styles.right]}>Rate</Text>
                <Text style={[styles.cell, styles.colAmount, styles.right]}>Amount</Text>
              </>
            )}
          </View>
          {quotation.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              {showHsn ? (
                <>
                  <Text style={[styles.cell, styles.colDescHsn]}>{item.description}</Text>
                  <Text style={[styles.cell, styles.colHsn]}>{item.hsnSac || "-"}</Text>
                  <Text style={[styles.cell, styles.colQtyHsn, styles.right]}>{item.quantity}</Text>
                  <Text style={[styles.cell, styles.colRateHsn, styles.right]}>{money(item.rate)}</Text>
                  <Text style={[styles.cell, styles.colAmountHsn, styles.right]}>{money(item.amount)}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.cell, styles.colDesc]}>{item.description}</Text>
                  <Text style={[styles.cell, styles.colQty, styles.right]}>{item.quantity}</Text>
                  <Text style={[styles.cell, styles.colRate, styles.right]}>{money(item.rate)}</Text>
                  <Text style={[styles.cell, styles.colAmount, styles.right]}>{money(item.amount)}</Text>
                </>
              )}
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text style={styles.cell}>Subtotal</Text>
            <Text style={styles.cell}>{money(quotation.subtotal)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.cell}>Discount</Text>
            <Text style={styles.cell}>-{money(quotation.discount)}</Text>
          </View>
          {quotation.gstEnabled && quotation.taxType === "INTRA_STATE" ? (
            <>
              <View style={styles.totalLine}>
                <Text style={styles.cell}>CGST ({(quotation.taxRate ?? 0) / 2}%)</Text>
                <Text style={styles.cell}>{money(quotation.cgstAmount ?? 0)}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.cell}>SGST ({(quotation.taxRate ?? 0) / 2}%)</Text>
                <Text style={styles.cell}>{money(quotation.sgstAmount ?? 0)}</Text>
              </View>
            </>
          ) : quotation.gstEnabled && quotation.taxType === "INTER_STATE" ? (
            <View style={styles.totalLine}>
              <Text style={styles.cell}>IGST ({quotation.taxRate ?? 0}%)</Text>
              <Text style={styles.cell}>{money(quotation.igstAmount ?? quotation.tax)}</Text>
            </View>
          ) : (
            <View style={styles.totalLine}>
              <Text style={styles.cell}>Tax</Text>
              <Text style={styles.cell}>{money(quotation.tax)}</Text>
            </View>
          )}
          <View style={[styles.totalLine, styles.totalBold]}>
            <Text>Total</Text>
            <Text>{money(quotation.total)}</Text>
          </View>
        </View>

        {quotation.notes ? (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{quotation.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.muted}>We look forward to working with you.</Text>
          <Text style={styles.muted}>{businessName}</Text>
        </View>
      </Page>
    </Document>
  );
}
