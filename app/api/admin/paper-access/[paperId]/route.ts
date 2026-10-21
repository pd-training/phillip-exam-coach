import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return null;
  }
  return session;
}

// Students with their access to one paper
export async function GET(_request: NextRequest, { params }: { params: { paperId: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const paperId = params.paperId;
    const students: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT u.id, u.name, u.email, u.active,
        EXISTS (
          SELECT 1 FROM "PaperRequest" pr
          WHERE pr."userId" = u.id AND pr."paperId"::text = $1 AND pr.status = 'approved'
        ) AS "hasAccess",
        EXISTS (
          SELECT 1 FROM "PaperRequest" pr
          WHERE pr."userId" = u.id AND pr."paperId"::text = $1 AND pr.status = 'pending'
        ) AS "requested"
       FROM "User" u
       WHERE u.role <> 'ADMIN'
       ORDER BY u.name ASC NULLS LAST, u.email ASC`,
      paperId
    );
    return NextResponse.json({ students });
  } catch (error: any) {
    console.error("Paper access load error:", error?.message || error);
    return NextResponse.json({ error: "Could not load access" }, { status: 500 });
  }
}

// Sets the full list of students who can access this paper. Students added get
// an approved request; students removed lose their requests for this paper.
export async function PUT(request: NextRequest, { params }: { params: { paperId: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const paperId = params.paperId;
    const body = await request.json().catch(() => null);
    const wanted: string[] = Array.isArray(body?.userIds) ? body.userIds.map(String) : null;
    if (!wanted) {
      return NextResponse.json({ error: "userIds required" }, { status: 400 });
    }

    const current: { userId: string }[] = await (prisma as any).$queryRawUnsafe(
      `SELECT DISTINCT pr."userId" FROM "PaperRequest" pr
       WHERE pr."paperId"::text = $1 AND pr.status = 'approved'`,
      paperId
    );
    const currentSet = new Set(current.map((r) => String(r.userId)));
    const wantedSet = new Set(wanted);

    const toGrant = wanted.filter((id) => !currentSet.has(id));
    const toRevoke = Array.from(currentSet).filter((id) => !wantedSet.has(id));

    for (const userId of toGrant) {
      const existing = await (prisma as any).paperRequest.findFirst({
        where: { userId, paperId },
        select: { id: true },
      });
      if (existing) {
        await (prisma as any).paperRequest.update({
          where: { id: existing.id },
          data: { status: "approved", reviewedAt: new Date() },
        });
      } else {
        await (prisma as any).paperRequest.create({
          data: { userId, paperId, status: "approved", reviewedAt: new Date() },
        });
      }
    }

    if (toRevoke.length > 0) {
      await (prisma as any).paperRequest.deleteMany({
        where: { userId: { in: toRevoke }, paperId },
      });
    }

    return NextResponse.json({ success: true, granted: toGrant.length, revoked: toRevoke.length });
  } catch (error: any) {
    console.error("Paper access save error:", error?.message || error);
    return NextResponse.json({ error: "Could not save access" }, { status: 500 });
  }
}
