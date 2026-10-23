import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";
import { buildReadiness, generateStudyAdvice, ExamResult } from "@/lib/study-advice";
import { computeRecommendations } from "@/lib/student-recommendations";
import { ensureLabelColumns } from "@/lib/paper-labels";

export const dynamic = "force-dynamic";

// Exam readiness and AI study advice for the signed-in student.
// Falls back to the rules-based list if the AI call fails.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const recommendations = await computeRecommendations(userId);

    // Exam simulation results, newest first, per paper
    await ensureLabelColumns();
    const rows = (await prisma.$queryRaw`
      SELECT ea.paperid::text AS "paperId", p.title AS "paperTitle", p."shortName" AS "paperShortName",
             COALESCE(p."passingScore", 50) AS "passingScore", ea.score
      FROM examattempt ea
      JOIN "Paper" p ON p.id = ea.paperid
      WHERE ea.userid = ${userId} AND ea.score IS NOT NULL
      ORDER BY ea.submittedat DESC
    `) as any[];

    const byPaper = new Map<string, ExamResult>();
    for (const r of rows) {
      const existing = byPaper.get(r.paperId);
      if (existing) {
        existing.attempts += 1;
        continue;
      }
      byPaper.set(r.paperId, {
        paperId: r.paperId,
        paperName: r.paperShortName || r.paperTitle || "Paper",
        passingScore: Number(r.passingScore),
        latestScore: Number(r.score),
        attempts: 1,
      });
    }
    const exams = Array.from(byPaper.values());

    try {
      const result = await generateStudyAdvice(recommendations, exams);
      return Response.json({ ...result, recommendations, aiUsed: true });
    } catch (error: any) {
      console.error("AI study advice failed:", error?.message);
      return Response.json({
        advice: [],
        readiness: buildReadiness(recommendations, exams),
        recommendations,
        aiUsed: false,
        details: error?.message,
      });
    }
  } catch (error: any) {
    console.error("Study advice failed:", error?.message);
    return Response.json(
      { error: "Could not load practice results", details: error?.message },
      { status: 500 }
    );
  }
}
