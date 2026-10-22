import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Quick quiz, chapter and full practice runs for all students (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const runs = await (prisma as any).$queryRawUnsafe(
      `SELECT s.id, s."paperId", p.title AS "paperTitle", s.mode, s."chapterNumber",
              s."totalQuestions", s."correctCount", s.percentage, s."createdAt",
              u.id AS "userId", u.name AS "studentName", u.email AS "studentEmail"
       FROM "QuickQuizSession" s
       JOIN "User" u ON u.id = s."userId"
       LEFT JOIN "Paper" p ON p.id::text = s."paperId"
       ORDER BY s."createdAt" DESC
       LIMIT 1000`
    );
    return Response.json({ runs: runs || [] });
  } catch (error: any) {
    // The table is created on first student use, so a missing table means no runs yet
    console.error("Load practice runs (admin) error:", error?.message || error);
    return Response.json({ runs: [] });
  }
}
