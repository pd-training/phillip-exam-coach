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
    console.log("Fetching recommendations for userId:", userId);

    // Get student's past attempts (only from available papers)
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
      AND p."isAvailable" = true
      ORDER BY ea.submittedat DESC
      LIMIT 20
    ` as any[];

    console.log("Found attempts:", attempts.length);

    // If no attempts, return empty recommendations
    if (!attempts || attempts.length === 0) {
      console.log("No attempts found, returning empty recommendations");
      return Response.json({ recommendations: [] });
    }

    // Calculate average score across all attempts
    const avgScore = Math.round(
      attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
    );
    console.log("Average score:", avgScore);

    // Find papers where student scored below average
    const underperformingPapers = attempts.filter((a: any) => a.score < avgScore);
    console.log("Underperforming papers:", underperformingPapers.length);

    if (underperformingPapers.length === 0) {
      // All scores above average
      console.log("All scores above average, no recommendations needed");
      return Response.json({ 
        recommendations: [],
        message: "Great performance! Keep practicing to maintain your edge."
      });
    }

    // Build recommendations from underperforming papers
    const recommendations = [];
    const seenChapters = new Set<string>(); // Track unique chapters (paperId + chapterNumber)

    for (const paper of underperformingPapers.slice(0, 3)) {
      console.log("Processing paper:", paper.paperId, paper.paperTitle);
      
      try {
        // Get chapters from this paper
        const chapters = await (prisma as any).chapter.findMany({
          where: { paperId: paper.paperId },
          orderBy: { number: 'asc' },
        });

        console.log("Found chapters:", chapters.length);

        // Suggest chapters from papers where they underperformed
        const suggestedChapters = chapters.length > 0 
          ? [
              chapters[0], // First chapter
              chapters[Math.floor(chapters.length / 2)], // Middle chapter
              chapters[chapters.length - 1], // Last chapter
            ].filter(Boolean)
          : [];

        for (const chapter of suggestedChapters) {
          // Check if we've already recommended this chapter
          const chapterKey = `${paper.paperId}-${chapter.number}`;
          
          if (recommendations.length < 3 && !seenChapters.has(chapterKey)) {
            seenChapters.add(chapterKey);
            
            // Calculate weakness score (inverse of their paper score)
            const weaknessScore = 100 - paper.score;
            
            recommendations.push({
              id: chapter.id,
              paperTitle: paper.paperTitle,
              paperId: paper.paperId,
              chapterNumber: chapter.number,
              chapterTitle: chapter.title,
              weaknessScore: Math.min(weaknessScore + Math.random() * 10, 100),
              scoreOnPaper: paper.score,
            });
          }
        }
      } catch (paperErr) {
        console.error("Error processing paper:", paper.paperId, paperErr);
        // Continue to next paper
      }
    }

    // Sort by weakness score (highest first - most need for practice)
    recommendations.sort((a: any, b: any) => b.weaknessScore - a.weaknessScore);

    console.log("Generated recommendations:", recommendations.length);

    return Response.json({ 
      recommendations: recommendations.slice(0, 3),
      averageScore: avgScore,
      totalAttempts: attempts.length,
    });
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    console.error("Error stack:", error.stack);
    return Response.json({ 
      error: "Failed to generate recommendations",
      details: error.message,
      recommendations: [] 
    }, { status: 500 });
  }
}
