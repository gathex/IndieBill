import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getUserCatalogItems, catalogItemSchema } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? searchParams.get("query") ?? undefined;
  const activeOnly = searchParams.get("activeOnly") === "true";

  try {
    const items = await getUserCatalogItems(session.user.id, {
      search: q,
      activeOnly,
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/catalog error:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = catalogItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const item = await prisma.catalogItem.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        rate: Number(parsed.data.rate) || 0,
        unit: parsed.data.unit?.trim() || null,
        hsnSac: parsed.data.hsnSac?.trim() || null,
        defaultTaxRate:
          parsed.data.defaultTaxRate !== undefined &&
          parsed.data.defaultTaxRate !== null &&
          !isNaN(Number(parsed.data.defaultTaxRate))
            ? Number(parsed.data.defaultTaxRate)
            : null,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/catalog error:", error);
    return NextResponse.json(
      { error: "Failed to create catalog item" },
      { status: 500 }
    );
  }
}
