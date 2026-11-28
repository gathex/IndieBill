"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { sendManualReminder } from "@/lib/reminders";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

/**
 * Updates the business payment reminder configuration.
 */
export async function updateReminderSettings(formData: FormData) {
  const userId = await requireUserId();

  const remindersEnabled =
    formData.get("remindersEnabled") === "true" ||
    formData.get("remindersEnabled") === "on";

  const remindBeforeDays = parseInt(formData.get("remindBeforeDays") as string, 10);
  const remindOnDueDate =
    formData.get("remindOnDueDate") === "true" ||
    formData.get("remindOnDueDate") === "on";

  const rawAfterDays = (formData.get("remindAfterDays") as string) || "3,7,14";
  const remindAfterDays = rawAfterDays
    .split(",")
    .map((s) => s.trim())
    .filter((s) => !isNaN(parseInt(s, 10)))
    .join(",");

  await prisma.user.update({
    where: { id: userId },
    data: {
      remindersEnabled,
      remindBeforeDays: isNaN(remindBeforeDays) ? 3 : remindBeforeDays,
      remindOnDueDate,
      remindAfterDays: remindAfterDays || "3,7,14",
    },
  });

  revalidatePath("/settings");
}

/**
 * Toggles whether automated reminders are paused for a specific invoice.
 */
export async function toggleInvoiceReminders(invoiceId: string) {
  const userId = await requireUserId();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    select: { id: true, remindersPaused: true },
  });

  if (!invoice) {
    throw new Error("Invoice not found or unauthorized.");
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      remindersPaused: !invoice.remindersPaused,
    },
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

/**
 * Sends a manual payment reminder email right now for a specific invoice.
 */
export async function sendInvoiceReminderNow(invoiceId: string) {
  const userId = await requireUserId();

  try {
    const res = await sendManualReminder(invoiceId, userId);
    revalidatePath(`/invoices/${invoiceId}`);
    if (res.skipped) {
      redirect(`/invoices/${invoiceId}?notice=reminder-skipped`);
    }
    redirect(`/invoices/${invoiceId}?notice=reminder-sent`);
  } catch (err) {
    // If it's a Next.js redirect exception, re-throw it
    if (err && typeof err === "object" && "digest" in err && typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[Reminders] Failed to send reminder email:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to send payment reminder.";
    revalidatePath(`/invoices/${invoiceId}`);
    redirect(`/invoices/${invoiceId}?notice=reminder-failed&error=${encodeURIComponent(errorMessage)}`);
  }
}
