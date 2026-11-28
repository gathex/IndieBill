import { MailtrapClient } from "mailtrap";
import { formatCurrency, formatDate } from "./utils";

/**
 * Checks whether email delivery via Mailtrap HTTP API is configured.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.MAILTRAP_API_TOKEN?.trim());
}

/**
 * Returns a configured MailtrapClient instance.
 * If MAILTRAP_INBOX_ID is set, sends to Sandbox testing inbox.
 * Otherwise, sends to Live production endpoint.
 */
function getMailtrapClient(): MailtrapClient {
  const token = process.env.MAILTRAP_API_TOKEN?.trim() || "";
  const rawInboxId = process.env.MAILTRAP_INBOX_ID?.trim();
  const sandboxId = rawInboxId && !isNaN(Number(rawInboxId)) ? Number(rawInboxId) : undefined;

  return new MailtrapClient({
    token,
    ...(sandboxId ? { sandboxId, testInboxId: sandboxId, sandbox: true } : {}),
  });
}

/**
 * Parses EMAIL_FROM into a clean { name, email } object for Mailtrap.
 * Handles "Name <email@domain.com>", bare "email@domain.com", or falls back gracefully.
 */
export function parseSenderAddress(businessName?: string | null): { name: string; email: string } {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  const defaultName = businessName?.trim() || "IndieBill";
  const defaultEmail = "hello@indiebill.in";

  if (!fromEnv) {
    return { name: defaultName, email: defaultEmail };
  }

  const startAngle = fromEnv.indexOf("<");
  const endAngle = fromEnv.indexOf(">", startAngle);

  if (startAngle !== -1 && endAngle !== -1) {
    const rawName = fromEnv.substring(0, startAngle).trim().replace(/^["']|["']$/g, "");
    const rawEmail = fromEnv.substring(startAngle + 1, endAngle).trim();
    return {
      name: rawName || defaultName,
      email: rawEmail || defaultEmail,
    };
  }

  if (fromEnv.includes("@")) {
    return {
      name: defaultName,
      email: fromEnv,
    };
  }

  return { name: defaultName, email: defaultEmail };
}

/**
 * Backwards-compatible helper returning a formatted sender string.
 */
export function getSenderAddress(businessName?: string | null): string {
  const { name, email } = parseSenderAddress(businessName);
  return `${name} <${email}>`;
}

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
  shareUrl?: string | null;
  pdf?: { filename: string; content: Buffer };
}

export async function sendInvoiceEmail(
  params: SendInvoiceEmailParams,
): Promise<{ skipped: true } | { id?: string }> {
  if (!isEmailConfigured()) {
    // No email provider configured — skip gracefully in local development.
    return { skipped: true };
  }

  const client = getMailtrapClient();
  const from = parseSenderAddress(params.businessName);

  const dueDate = params.dueDate
    ? formatDate(
      params.dueDate,
      { year: "numeric", month: "long", day: "numeric" },
      params.locale,
    )
    : null;
  const formattedAmount = formatCurrency(
    params.amount,
    params.currency ?? "INR",
    params.locale ?? "en-IN",
  );

  try {
    const response = await client.send({
      from,
      to: [{ email: params.to, name: params.clientName }],
      subject: `Invoice ${params.invoiceNumber} from ${params.businessName || "IndieBill"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; color: #18181b; padding: 24px; line-height: 1.6;">
          <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #09090b;">Hi ${params.clientName},</h2>
          <p style="font-size: 15px; color: #3f3f46;">You have a new invoice from <strong>${params.businessName}</strong>.</p>
          
          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px 20px; margin: 20px 0; border: 1px solid #e4e4e7;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Invoice number:</strong> ${params.invoiceNumber}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Amount due:</strong> <span style="font-size: 16px; font-weight: 700; color: #09090b;">${formattedAmount}</span></p>
            ${dueDate ? `<p style="margin: 0; font-size: 14px;"><strong>Due date:</strong> ${dueDate}</p>` : ""}
          </div>

          ${params.paymentLink
          ? `
            <div style="margin: 24px 0;">
              <a href="${params.paymentLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Pay Now (${formattedAmount}) →
              </a>
              <p style="font-size: 12px; color: #71717a; margin-top: 8px;">Supports UPI, Credit/Debit Cards, and Netbanking via Razorpay.</p>
            </div>
          `
          : ""
        }

          ${params.shareUrl
          ? `
            <p style="font-size: 14px; color: #52525b; margin: 16px 0;">
              You can also <a href="${params.shareUrl}" style="color: #2563eb; text-decoration: underline;">view the live invoice and UPI payment QR online</a>.
            </p>
          `
          : ""
        }

          <p style="font-size: 13px; color: #71717a; margin-top: 24px;">The official invoice PDF is attached to this email.</p>
          <p style="font-size: 14px; color: #3f3f46; margin-top: 20px;">Thanks for your business!</p>
        </div>
      `,
      attachments: params.pdf
        ? [
            {
              filename: params.pdf.filename,
              content: params.pdf.content.toString("base64"),
              type: "application/pdf",
              disposition: "attachment",
            },
          ]
        : undefined,
    });

    return { id: response.message_ids?.[0] };
  } catch (error: unknown) {
    console.error("[Mailtrap API Error]:", error);
    let message = "Failed to send invoice email via Mailtrap API.";
    if (error && typeof error === "object") {
      if ("message" in error && typeof error.message === "string") {
        message = error.message;
      }
      if ("errors" in error && Array.isArray((error as { errors?: string[] }).errors)) {
        message = ((error as { errors: string[] }).errors).join(", ");
      }
    }
    throw new Error(message);
  }
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
  shareUrl?: string | null;
  pdf?: { filename: string; content: Buffer };
}

export async function sendQuotationEmail(
  params: SendQuotationEmailParams,
): Promise<{ skipped: true } | { id?: string }> {
  if (!isEmailConfigured()) {
    return { skipped: true };
  }

  const client = getMailtrapClient();
  const from = parseSenderAddress(params.businessName);

  const validUntil = params.validUntil
    ? formatDate(
      params.validUntil,
      { year: "numeric", month: "long", day: "numeric" },
      params.locale,
    )
    : null;
  const formattedAmount = formatCurrency(
    params.amount,
    params.currency ?? "INR",
    params.locale ?? "en-IN",
  );

  try {
    const response = await client.send({
      from,
      to: [{ email: params.to, name: params.clientName }],
      subject: `Quotation ${params.quotationNumber} from ${params.businessName || "IndieBill"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; color: #18181b; padding: 24px; line-height: 1.6;">
          <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #09090b;">Hi ${params.clientName},</h2>
          <p style="font-size: 15px; color: #3f3f46;">Please find our quotation from <strong>${params.businessName}</strong> below.</p>
          
          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px 20px; margin: 20px 0; border: 1px solid #e4e4e7;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Quotation number:</strong> ${params.quotationNumber}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Estimated total:</strong> <span style="font-size: 16px; font-weight: 700; color: #09090b;">${formattedAmount}</span></p>
            ${validUntil ? `<p style="margin: 0; font-size: 14px;"><strong>Valid until:</strong> ${validUntil}</p>` : ""}
          </div>

          ${params.shareUrl
          ? `
            <div style="margin: 24px 0;">
              <a href="${params.shareUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                View Quotation Online →
              </a>
            </div>
          `
          : ""
        }

          <p style="font-size: 13px; color: #71717a; margin-top: 24px;">The quotation PDF is attached to this email.</p>
          <p style="font-size: 14px; color: #3f3f46; margin-top: 20px;">Let us know if you have any questions or would like to proceed!</p>
        </div>
      `,
      attachments: params.pdf
        ? [
            {
              filename: params.pdf.filename,
              content: params.pdf.content.toString("base64"),
              type: "application/pdf",
              disposition: "attachment",
            },
          ]
        : undefined,
    });

    return { id: response.message_ids?.[0] };
  } catch (error: unknown) {
    console.error("[Mailtrap API Error]:", error);
    let message = "Failed to send quotation email via Mailtrap API.";
    if (error && typeof error === "object") {
      if ("message" in error && typeof error.message === "string") {
        message = error.message;
      }
      if ("errors" in error && Array.isArray((error as { errors?: string[] }).errors)) {
        message = ((error as { errors: string[] }).errors).join(", ");
      }
    }
    throw new Error(message);
  }
}

export type ReminderType = "BEFORE_DUE" | "ON_DUE" | "OVERDUE" | "MANUAL";

export interface SendReminderEmailParams {
  to: string;
  businessName: string;
  invoiceNumber: string;
  clientName: string;
  balanceDue: number;
  total: number;
  currency?: string;
  locale?: string;
  dueDate?: Date | string | null;
  paymentLink?: string | null;
  shareUrl?: string | null;
  type: ReminderType;
  pdf?: { filename: string; content: Buffer };
}

export async function sendReminderEmail(
  params: SendReminderEmailParams,
): Promise<{ skipped: true } | { id?: string }> {
  if (!isEmailConfigured()) {
    return { skipped: true };
  }

  const client = getMailtrapClient();
  const from = parseSenderAddress(params.businessName);

  const dueDate = params.dueDate
    ? formatDate(
      params.dueDate,
      { year: "numeric", month: "long", day: "numeric" },
      params.locale,
    )
    : null;
  const formattedBalance = formatCurrency(
    params.balanceDue,
    params.currency ?? "INR",
    params.locale ?? "en-IN",
  );

  let subject = `Payment Reminder: Invoice ${params.invoiceNumber} from ${params.businessName}`;
  let title = "Payment Reminder";
  let message = `This is a friendly reminder that payment for invoice <strong>${params.invoiceNumber}</strong> from <strong>${params.businessName}</strong> is pending.`;

  if (params.type === "BEFORE_DUE") {
    subject = `Upcoming Payment: Invoice ${params.invoiceNumber} from ${params.businessName}`;
    title = "Upcoming Payment Due Soon";
    message = `This is a friendly heads-up that invoice <strong>${params.invoiceNumber}</strong> from <strong>${params.businessName}</strong> ${dueDate ? `is due on <strong>${dueDate}</strong>` : "will be due soon"
      }.`;
  } else if (params.type === "ON_DUE") {
    subject = `Payment Due Today: Invoice ${params.invoiceNumber} from ${params.businessName}`;
    title = "Invoice Due Today";
    message = `This is a gentle reminder that invoice <strong>${params.invoiceNumber}</strong> from <strong>${params.businessName}</strong> is due today.`;
  } else if (params.type === "OVERDUE") {
    subject = `Urgent: Invoice ${params.invoiceNumber} is Overdue — ${params.businessName}`;
    title = "Invoice Payment Overdue";
    message = `Our records indicate that payment for invoice <strong>${params.invoiceNumber}</strong> from <strong>${params.businessName}</strong> ${dueDate ? `was due on <strong>${dueDate}</strong> and ` : ""
      }is now overdue. Please settle this balance at your earliest convenience.`;
  } else if (params.type === "MANUAL") {
    subject = `Follow-up: Invoice ${params.invoiceNumber} from ${params.businessName}`;
    title = "Invoice Payment Follow-up";
    message = `We are following up regarding outstanding invoice <strong>${params.invoiceNumber}</strong> from <strong>${params.businessName}</strong>.`;
  }

  try {
    const response = await client.send({
      from,
      to: [{ email: params.to, name: params.clientName }],
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; color: #18181b; padding: 24px; line-height: 1.6;">
          <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #09090b;">${title}</h2>
          <p style="font-size: 15px; color: #3f3f46;">Hi ${params.clientName},</p>
          <p style="font-size: 15px; color: #3f3f46;">${message}</p>
          
          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px 20px; margin: 20px 0; border: 1px solid #e4e4e7;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Invoice number:</strong> ${params.invoiceNumber}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Remaining balance:</strong> <span style="font-size: 16px; font-weight: 700; color: #b91c1c;">${formattedBalance}</span></p>
            ${dueDate ? `<p style="margin: 0; font-size: 14px;"><strong>Due date:</strong> ${dueDate}</p>` : ""}
          </div>

          ${params.paymentLink
          ? `
            <div style="margin: 24px 0;">
              <a href="${params.paymentLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Pay Outstanding Balance (${formattedBalance}) →
              </a>
              <p style="font-size: 12px; color: #71717a; margin-top: 8px;">Supports UPI, Credit/Debit Cards, and Netbanking via Razorpay.</p>
            </div>
          `
          : ""
        }

          ${params.shareUrl
          ? `
            <p style="font-size: 14px; color: #52525b; margin: 16px 0;">
              You can also <a href="${params.shareUrl}" style="color: #2563eb; text-decoration: underline;">view the live invoice and UPI payment QR online</a>.
            </p>
          `
          : ""
        }

          <p style="font-size: 13px; color: #71717a; margin-top: 24px;">If you have already made this payment, please disregard this notice.</p>
          <p style="font-size: 14px; color: #3f3f46; margin-top: 20px;">Thank you,<br/>${params.businessName}</p>
        </div>
      `,
      attachments: params.pdf
        ? [
            {
              filename: params.pdf.filename,
              content: params.pdf.content.toString("base64"),
              type: "application/pdf",
              disposition: "attachment",
            },
          ]
        : undefined,
    });

    return { id: response.message_ids?.[0] };
  } catch (error: unknown) {
    console.error("[Mailtrap API Error]:", error);
    let message = "Failed to send payment reminder via Mailtrap API.";
    if (error && typeof error === "object") {
      if ("message" in error && typeof error.message === "string") {
        message = error.message;
      }
      if ("errors" in error && Array.isArray((error as { errors?: string[] }).errors)) {
        message = ((error as { errors: string[] }).errors).join(", ");
      }
    }
    throw new Error(message);
  }
}
