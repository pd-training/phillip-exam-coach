import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Creates the remarks column on first use so no separate migration is needed.
async function ensureRemarksColumn() {
  await (prisma as any).$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS remarks TEXT`);
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user && (session.user as any)?.role === "ADMIN";
}

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await ensureRemarksColumn();
    const rows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT remarks FROM "User" WHERE id = $1`,
      params.userId
    );
    return NextResponse.json({ remarks: rows[0]?.remarks || "" });
  } catch (error: any) {
    console.error("Load remarks error:", error?.message || error);
    return NextResponse.json({ error: "Could not load notes" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const remarks = typeof body?.remarks === "string" ? body.remarks.slice(0, 2000) : "";
    await ensureRemarksColumn();
    await (prisma as any).$executeRawUnsafe(
      `UPDATE "User" SET remarks = $1 WHERE id = $2`,
      remarks,
      params.userId
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save remarks error:", error?.message || error);
    return NextResponse.json({ error: "Could not save notes" }, { status: 500 });
  }
}
