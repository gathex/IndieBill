import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { catalogItemSchema } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const item = await prisma.catalogItem.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error(`GET /api/catalog/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch catalog item" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.catalogItem.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
    }

    const body = await request.json();
    const partialSchema = catalogItemSchema.partial();
    const parsed = partialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.description !== undefined)
      data.description = parsed.data.description?.trim() || null;
    if (parsed.data.rate !== undefined) data.rate = Number(parsed.data.rate) || 0;
    if (parsed.data.unit !== undefined) data.unit = parsed.data.unit?.trim() || null;
    if (parsed.data.hsnSac !== undefined)
      data.hsnSac = parsed.data.hsnSac?.trim() || null;
    if (parsed.data.defaultTaxRate !== undefined) {
      data.defaultTaxRate =
        parsed.data.defaultTaxRate !== null &&
        !isNaN(Number(parsed.data.defaultTaxRate))
          ? Number(parsed.data.defaultTaxRate)
          : null;
    }
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

    const updated = await prisma.catalogItem.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/catalog/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to update catalog item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.catalogItem.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
    }

    await prisma.catalogItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Catalog item deleted successfully",
    });
  } catch (error) {
    console.error(`DELETE /api/catalog/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete catalog item" },
      { status: 500 }
    );
  }
}
