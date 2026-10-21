import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";
import { loadGuide } from "@/lib/chapter-guide";

export const dynamic = "force-dynamic";

// Quick Guide for a paper. Students need an approved paper request (admins can read any).
export async function GET(_req: NextRequest, { params }: { params: { paperId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).role === "ADMIN";

    if (!isAdmin) {
      const access: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT 1 FROM "PaperRequest" WHERE "userId" = $1 AND "paperId"::text = $2 AND status = 'approved' LIMIT 1`,
        userId,
        params.paperId
      );
      if (access.length === 0) {
        return NextResponse.json({ error: "No access to this paper" }, { status: 403 });
      }
    }

    const chapters = await loadGuide(params.paperId);
    return NextResponse.json({ chapters });
  } catch (error: any) {
    console.error("Load guide error:", error?.message || error);
    return NextResponse.json({ error: "Could not load the guide" }, { status: 500 });
  }
}
