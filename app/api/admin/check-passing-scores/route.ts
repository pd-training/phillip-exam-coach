import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (user?.role !== 'ADMIN') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get all papers with their passing scores
    const papers = await prisma.$queryRaw`
      SELECT
        id,
        title,
        "passingScore",
        "totalQuestions"
      FROM "Paper"
      ORDER BY "passingScore" ASC
    ` as any[];

    // Find papers with very low passing scores (< 50%)
    const lowPassingScorePapers = papers.filter((p: any) => (p.passingScore || 75) < 50);

    // Get attempts for papers with low passing scores
    const problematicAttempts = await prisma.$queryRaw`
      SELECT
        ea.id,
        ea.paperid,
        ea.userid,
        u.name as username,
        ea.score,
        ea.passed,
        p.title as paper_title,
        p."passingScore"
      FROM examattempt ea
      LEFT JOIN "User" u ON ea.userid = u.id
      LEFT JOIN "Paper" p ON ea.paperid = p.id
      WHERE ea.score < 50
      AND ea.passed = true
      ORDER BY ea.score ASC
      LIMIT 20
    ` as any[];

    return Response.json({
      papers: papers,
      lowPassingScorePapers: lowPassingScorePapers,
      problematicAttempts: problematicAttempts,
      summary: {
        totalPapers: papers.length,
        papersWithLowThreshold: lowPassingScorePapers.length,
        passedWithLowScores: problematicAttempts.length,
      }
    });
  } catch (error: any) {
    console.error("Error checking passing scores:", error);
    return Response.json(
      {
        error: "Failed to check passing scores",
        details: error.message
      },
      { status: 500 }
    );
  }
}
