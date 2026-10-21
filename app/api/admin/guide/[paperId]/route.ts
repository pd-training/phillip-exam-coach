import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";
import { ensureGuideTable, loadGuide } from "@/lib/chapter-guide";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return !!session?.user && (session.user as any)?.role === "ADMIN";
}

export async function GET(_req: NextRequest, { params }: { params: { paperId: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const chapters = await loadGuide(params.paperId);
    return NextResponse.json({ chapters });
  } catch (error: any) {
    console.error("Admin load guide error:", error?.message || error);
    return NextResponse.json({ error: "Could not load the guide" }, { status: 500 });
  }
}

// Saves the TL;DR and bullets for one chapter
export async function PUT(req: NextRequest, { params }: { params: { paperId: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const chapterNumber = Number(body?.chapterNumber);
    const tldr = typeof body?.tldr === "string" ? body.tldr.trim().slice(0, 600) : "";
    const bullets: string[] = Array.isArray(body?.bullets)
      ? body.bullets
          .map((b: unknown) => (typeof b === "string" ? b.trim() : ""))
          .filter((b: string) => b.length > 0)
          .slice(0, 12)
          .map((b: string) => b.slice(0, 300))
      : [];
    if (!Number.isInteger(chapterNumber)) {
      return NextResponse.json({ error: "chapterNumber required" }, { status: 400 });
    }

    await ensureGuideTable();
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "ChapterGuide" ("paperId", "chapterNumber", tldr, bullets, "updatedAt")
       VALUES ($1, $2, $3, $4::jsonb, NOW())
       ON CONFLICT ("paperId", "chapterNumber")
       DO UPDATE SET tldr = EXCLUDED.tldr, bullets = EXCLUDED.bullets, "updatedAt" = NOW()`,
      params.paperId,
      chapterNumber,
      tldr,
      JSON.stringify(bullets)
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save guide error:", error?.message || error);
    return NextResponse.json({ error: "Could not save the guide" }, { status: 500 });
  }
}
