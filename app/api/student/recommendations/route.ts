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

    const userId = (session.user as any).id;

    // Get student's past attempts
    const attempts = await prisma.$queryRaw`
      SELECT 
        ea.id,
        ea.paperid,
        p.id as "paperId",
        p.title as "paperTitle",
        ea.score,
        ea.submittedat
      FROM examattempt ea
      LEFT JOIN "Paper" p ON ea.paperid = p.id
      WHERE ea.userid = ${userId}
      ORDER BY ea.submittedat DESC
      LIMIT 20
    ` as any[];

    // If no attempts, return empty recommendations
    if (!attempts || attempts.length === 0) {
      return Response.json({ recommendations: [] });
    }

    // Calculate average score across all attempts
    const avgScore = Math.round(
      attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
    );

    // Find papers where student scored below average
    const underperformingPapers = attempts.filter((a: any) => a.score < avgScore);

    if (underperformingPapers.length === 0) {
      // All scores above average - suggest chapters from most recent attempt
      return Response.json({ 
        recommendations: [],
        message: "Great performance! Keep practicing to maintain your edge."
      });
    }

    // Build recommendations from underperforming papers
    const recommendations = [];

    for (const paper of underperformingPapers.slice(0, 3)) {
      // Get chapters from this paper
      const chapters = await (prisma as any).chapter.findMany({
        where: { paperId: paper.paperId },
        orderBy: { number: 'asc' },
      });

      // Suggest 3-5 chapters from papers where they underperformed
      // Alternate between early, middle, and later chapters for variety
      const suggestedChapters = chapters.length > 0 
        ? [
            chapters[0], // First chapter
            chapters[Math.floor(chapters.length / 2)], // Middle chapter
            chapters[chapters.length - 1], // Last chapter
          ].filter(Boolean)
        : [];

      for (const chapter of suggestedChapters) {
        if (recommendations.length < 5) {
          // Calculate weakness score (inverse of their paper score)
          const weaknessScore = 100 - paper.score;
          
          recommendations.push({
            id: chapter.id,
            paperTitle: paper.paperTitle,
            paperId: paper.paperId,
            chapterNumber: chapter.number,
            chapterTitle: chapter.title,
            weaknessScore: Math.min(weaknessScore + Math.random() * 10, 100), // Add slight variation
            scoreOnPaper: paper.score,
          });
        }
      }
    }

    // Sort by weakness score (highest first - most need for practice)
    recommendations.sort((a: any, b: any) => b.weaknessScore - a.weaknessScore);

    return Response.json({ 
      recommendations: recommendations.slice(0, 5),
      averageScore: avgScore,
      totalAttempts: attempts.length,
    });
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return Response.json({ 
      error: "Failed to generate recommendations",
      recommendations: [] 
    }, { status: 500 });
  }
}
