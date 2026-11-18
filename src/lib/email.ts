import { Resend } from "resend";
import { formatCurrency, formatDate } from "./utils";

interface SendInvoiceEmailParams {
  to: string;
  businessName: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  currency?: string;
  locale?: string;
  dueDate?: Date | string | null;
  paymentLink?: string | null;
  pdf?: { filename: string; content: Buffer };
}

export async function sendInvoiceEmail(
  params: SendInvoiceEmailParams,
): Promise<{ skipped: true } | { id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No email provider configured — skip gracefully in local development.
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const dueDate = params.dueDate
    ? formatDate(
        params.dueDate,
        { year: "numeric", month: "long", day: "numeric" },
        params.locale,
      )
    : null;
  const formattedAmount = formatCurrency(
    params.amount,
    params.currency ?? "USD",
    params.locale,
  );

  const { data, error } = await resend.emails.send({
    from: `${params.businessName} <onboarding@resend.dev>`,
    to: [params.to],
    subject: `Invoice ${params.invoiceNumber} from ${params.businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #18181b;">
        <h2>Hi ${params.clientName},</h2>
        <p>You have a new invoice from <strong>${params.businessName}</strong>.</p>
        <p>
          Invoice number: <strong>${params.invoiceNumber}</strong><br/>
          Amount due: <strong>${formattedAmount}</strong><br/>
          ${dueDate ? `Due date: <strong>${dueDate}</strong><br/>` : ""}
        </p>
        <p>The invoice PDF is attached to this email.</p>
        ${
          params.paymentLink
            ? `<p>You can <a href="${params.paymentLink}">pay securely online</a>.</p>`
            : ""
        }
        <p>Thanks for your business!</p>
      </div>
    `,
    attachments: params.pdf
      ? [{ filename: params.pdf.filename, content: params.pdf.content }]
      : undefined,
  });

  if (error) throw error;
  return { id: data?.id };
}

interface SendQuotationEmailParams {
  to: string;
  businessName: string;
  quotationNumber: string;
  clientName: string;
  amount: number;
  currency?: string;
  locale?: string;
  validUntil?: Date | string | null;
  pdf?: { filename: string; content: Buffer };
}

export async function sendQuotationEmail(
  params: SendQuotationEmailParams,
): Promise<{ skipped: true } | { id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const validUntil = params.validUntil
    ? formatDate(
        params.validUntil,
        { year: "numeric", month: "long", day: "numeric" },
        params.locale,
      )
    : null;
  const formattedAmount = formatCurrency(
    params.amount,
    params.currency ?? "USD",
    params.locale,
  );

  const { data, error } = await resend.emails.send({
    from: `${params.businessName} <onboarding@resend.dev>`,
    to: [params.to],
    subject: `Quotation ${params.quotationNumber} from ${params.businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #18181b;">
        <h2>Hi ${params.clientName},</h2>
        <p>Please find our quotation from <strong>${params.businessName}</strong> below.</p>
        <p>
          Quotation number: <strong>${params.quotationNumber}</strong><br/>
          Estimated total: <strong>${formattedAmount}</strong><br/>
          ${validUntil ? `Valid until: <strong>${validUntil}</strong><br/>` : ""}
        </p>
        <p>The quotation PDF is attached to this email.</p>
        <p>Let us know if you have any questions or would like to proceed.</p>
      </div>
    `,
    attachments: params.pdf
      ? [{ filename: params.pdf.filename, content: params.pdf.content }]
      : undefined,
  });

  if (error) throw error;
  return { id: data?.id };
}
