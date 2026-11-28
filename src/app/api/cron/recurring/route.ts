import { NextRequest, NextResponse } from "next/server";
import { processDueRecurringInvoices } from "@/lib/recurring";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET is not configured on the server.");
    return NextResponse.json(
      { error: "Cron secret is not configured on the server." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueRecurringInvoices();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("[Cron] Error running recurring invoices:", error);
    return NextResponse.json(
      {
        error: "Failed to process recurring invoices",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// Allow GET for uptime monitors / cron triggers that ping with query secret or auth header
export async function GET(req: NextRequest) {
  return POST(req);
}
