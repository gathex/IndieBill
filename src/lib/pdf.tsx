import { renderToBuffer } from "@react-pdf/renderer";
import {
  InvoiceDocument,
  type InvoiceDocumentProps,
} from "@/components/invoice-document";
import {
  QuotationDocument,
  type QuotationDocumentProps,
} from "@/components/quotation-document";

export async function renderInvoicePdf(
  props: InvoiceDocumentProps,
): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument {...props} />);
}

export async function renderQuotationPdf(
  props: QuotationDocumentProps,
): Promise<Buffer> {
  return renderToBuffer(<QuotationDocument {...props} />);
}
