import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface InvoicePdfData {
  id: string;
  number: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  subtotal: number;
  discount: number;
  tax: number;
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
  }>;
}

export interface InvoiceDocumentProps {
  invoice: InvoicePdfData;
  businessName: string;
  businessAddress?: string | null;
  currency?: string;
  locale?: string;
  logoDataUrl?: string | null;
  qrDataUrl?: string | null;
  qrLabel?: string;
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
  cell: { fontSize: 10 },
  right: { textAlign: "right" },
  totals: { marginTop: 16, alignSelf: "flex-end", width: "45%" },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalBold: { fontSize: 13, fontWeight: "bold", paddingTop: 6 },
  qr: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    padding: 12,
  },
  qrImage: { width: 64, height: 64 },
  qrCopy: { flexGrow: 1, width: "75%", marginLeft: 12 },
  qrLabel: { fontSize: 8, color: "#a1a1aa", textTransform: "uppercase" },
  qrTitle: { fontSize: 10, fontWeight: "bold", marginTop: 4 },
  qrText: { fontSize: 9, color: "#71717a", marginTop: 4, lineHeight: 1.4 },
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

export function InvoiceDocument({
  invoice,
  businessName,
  businessAddress,
  currency = "USD",
  locale,
  logoDataUrl,
  qrDataUrl,
  qrLabel = "Scan to pay online",
}: InvoiceDocumentProps) {
  const money = (amount: number) => formatCurrency(amount, currency, locale);

  return (
    <Document
      title={`Invoice ${invoice.number}`}
      author={businessName}
      subject={`Invoice ${invoice.number}`}
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
            </View>
          </View>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.status}>{invoice.number}</Text>
            <Text style={styles.status}>{invoice.status}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Billed to</Text>
            <Text style={styles.value}>{invoice.clientName}</Text>
            {invoice.clientCompany ? (
              <Text style={styles.value}>{invoice.clientCompany}</Text>
            ) : null}
            <Text style={styles.value}>{invoice.clientEmail ?? ""}</Text>
          </View>
          <View style={styles.half}>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Issued</Text>
                <Text style={styles.value}>{formatDate(invoice.issueDate, undefined, locale)}</Text>
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Due</Text>
                <Text style={styles.value}>{formatDate(invoice.dueDate, undefined, locale)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.cell, styles.colDesc]}>Description</Text>
            <Text style={[styles.cell, styles.colQty, styles.right]}>Qty</Text>
            <Text style={[styles.cell, styles.colRate, styles.right]}>Rate</Text>
            <Text style={[styles.cell, styles.colAmount, styles.right]}>Amount</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.cell, styles.colQty, styles.right]}>{item.quantity}</Text>
              <Text style={[styles.cell, styles.colRate, styles.right]}>{money(item.rate)}</Text>
              <Text style={[styles.cell, styles.colAmount, styles.right]}>{money(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text style={styles.cell}>Subtotal</Text>
            <Text style={styles.cell}>{money(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.cell}>Discount</Text>
            <Text style={styles.cell}>-{money(invoice.discount)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.cell}>Tax</Text>
            <Text style={styles.cell}>{money(invoice.tax)}</Text>
          </View>
          <View style={[styles.totalLine, styles.totalBold]}>
            <Text>Total</Text>
            <Text>{money(invoice.total)}</Text>
          </View>
        </View>

        {qrDataUrl ? (
          <View style={styles.qr}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qrDataUrl} style={styles.qrImage} />
            <View style={styles.qrCopy}>
              <Text style={styles.qrLabel}>Pay by QR code</Text>
              <Text style={styles.qrTitle}>{qrLabel}</Text>
              <Text style={styles.qrText}>
                Point a phone camera at the code to open the payment link or
                payment details for {invoice.number}.
              </Text>
            </View>
          </View>
        ) : null}

        {invoice.notes ? (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{invoice.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.muted}>Thank you for your business.</Text>
          <Text style={styles.muted}>{businessName}</Text>
        </View>
      </Page>
    </Document>
  );
}
