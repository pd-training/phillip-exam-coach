import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface WeakChapter {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  percentage: number;
  correct: number;
  total: number;
  paperTitle: string;
  paperId: string;
}

export async function GET(
  request: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const paperId = params.paperId;

    console.log("Fetching focus areas for userId:", userId, "paperId:", paperId);

    // Get all full exam attempts for this paper (only answered questions from full exam)
    let attemptsRes: any[] = [];
    try {
      attemptsRes = await prisma.$queryRaw`
        SELECT 
          ea.id,
          ea.paperid,
          ea.answers,
          ea."questionIds",
          p.title as "paperTitle",
          p."totalQuestions",
          p."passingScore"
        FROM examattempt ea
        JOIN "Paper" p ON ea.paperid = p.id
        WHERE ea.userid = ${userId}
        AND ea.paperid = ${paperId}::uuid
        ORDER BY ea.submittedat DESC
      ` as any[];
    } catch (err: any) {
      const errorMsg = err.message || '';
      if (errorMsg.includes('questionIds')) {
        console.log('⚠️ questionIds column does not exist yet, fetching without it');
        attemptsRes = await prisma.$queryRaw`
          SELECT 
            ea.id,
            ea.paperid,
            ea.answers,
            p.title as "paperTitle",
            p."totalQuestions",
            p."passingScore"
          FROM examattempt ea
          JOIN "Paper" p ON ea.paperid = p.id
          WHERE ea.userid = ${userId}
          AND ea.paperid = ${paperId}::uuid
          ORDER BY ea.submittedat DESC
        ` as any[];
      } else {
        throw err;
      }
    }

    console.log("Found attempts for this paper:", attemptsRes.length);

    // If no attempts, return empty focus areas
    if (!attemptsRes || attemptsRes.length === 0) {
      console.log("No attempts found for this paper - focus areas locked");
      return Response.json({ 
        focusAreas: [],
        hasAttempt: false,
        message: "Complete your first full exam to unlock focus areas for this paper"
      });
    }

    // Get all questions for this paper
    const questions = await prisma.$queryRaw`
      SELECT 
        id,
        "chapterNumber",
        "correctAnswer",
        "questionText"
      FROM "Question"
      WHERE "paperId"::text = ${paperId}::text
    ` as any[];

    console.log("Found questions:", questions.length);

    // Calculate chapter performance aggregated across ALL attempts
    const chapterStats: Record<number, { correct: number; total: number }> = {};

    console.log(`Aggregating performance from ${attemptsRes.length} attempt(s) on this paper`);

    // Aggregate performance across all attempts
    for (const attempt of attemptsRes) {
      let studentAnswers: Record<string, string> = {};
      
      if (attempt.answers) {
        try {
          studentAnswers = typeof attempt.answers === 'string' 
            ? JSON.parse(attempt.answers) 
            : attempt.answers;
        } catch (e) {
          console.log('⚠️ Could not parse answers for attempt:', attempt.id);
        }
      }

      // Track which questions were in this attempt
      let attemptQuestionIds: Set<string>;
      if (attempt.questionIds) {
        try {
          const qIds = typeof attempt.questionIds === 'string' 
            ? JSON.parse(attempt.questionIds) 
            : attempt.questionIds;
          attemptQuestionIds = new Set(qIds || []);
        } catch (e) {
          attemptQuestionIds = new Set(Object.keys(studentAnswers));
        }
      } else {
        attemptQuestionIds = new Set(Object.keys(studentAnswers));
      }

      // Score each question and aggregate by chapter
      // Same question can appear in multiple attempts - each counts separately
      for (const q of questions) {
        // Only count questions that were in this attempt
        if (!attemptQuestionIds.has(q.id)) {
          continue;
        }

        if (!chapterStats[q.chapterNumber]) {
          chapterStats[q.chapterNumber] = { correct: 0, total: 0 };
        }

        // Increment total questions attempted (across all attempts)
        chapterStats[q.chapterNumber].total += 1;

        // Increment correct count if answer was right
        const studentAnswer = studentAnswers[q.id];
        if (studentAnswer === q.correctAnswer) {
          chapterStats[q.chapterNumber].correct += 1;
        }
      }
    }

    // Convert to array and calculate percentages
    const chapterPerformance = Object.entries(chapterStats).map(([chapterNum, stats]) => ({
      chapterNumber: parseInt(chapterNum),
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    console.log("Aggregated chapter performance:");
    chapterPerformance.forEach(c => {
      console.log(`  Chapter ${c.chapterNumber}: ${c.correct}/${c.total} = ${c.percentage}%`);
    });

    console.log("Chapter performance:", chapterPerformance.length, "chapters");

    // Get chapter titles
    const chapters = await (prisma as any).chapter.findMany({
      where: { paperId: paperId },
    });

    const chapterTitles: Record<number, string> = {};
    chapters.forEach((ch: any) => {
      chapterTitles[ch.number] = ch.title;
    });

    // Find weak chapters (< 60%) and sort by performance (worst first)
    const weakChapters = chapterPerformance
      .filter(c => c.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3)  // Top 3 weakest
      .map(c => ({
        id: `${paperId}-${c.chapterNumber}`,
        chapterNumber: c.chapterNumber,
        chapterTitle: chapterTitles[c.chapterNumber] || `Chapter ${c.chapterNumber}`,
        percentage: c.percentage,
        correct: c.correct,
        total: c.total,
        paperTitle: attemptsRes[0].paperTitle,
        paperId: paperId,
      }));

    console.log("Focus areas (weak chapters from aggregated attempts):", weakChapters.length);

    return Response.json({
      focusAreas: weakChapters,
      hasAttempt: true,
      totalAttempts: attemptsRes.length,
      allChaptersCount: chapterPerformance.length,
      weakChaptersCount: chapterPerformance.filter(c => c.percentage < 60).length,
      aggregatedData: true,  // Clearly indicates this is aggregated across all attempts
      message: `Based on analysis of ${attemptsRes.length} full exam attempt(s) on this paper`,
    });
  } catch (error: any) {
    console.error("Error fetching focus areas:", error);
    console.error("Error stack:", error.stack);
    return Response.json({
      error: "Failed to fetch focus areas",
      details: error.message,
      focusAreas: [],
      hasAttempt: false,
    }, { status: 500 });
  }
}
