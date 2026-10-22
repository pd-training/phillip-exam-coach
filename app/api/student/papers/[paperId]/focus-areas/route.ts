import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// "Where to focus next" for one paper. Built from the student's full practice runs
// on that paper: chapters they answered below 60% in are shown as focus areas.
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

    // Every answer from the student's full practice runs on this paper
    let answers: { questionId: string; isCorrect: boolean; sessionId: string }[] = [];
    try {
      answers = await (prisma as any).$queryRawUnsafe(
        `SELECT a."questionId", a."isCorrect", a."sessionId"
         FROM "QuickQuizAnswer" a
         JOIN "QuickQuizSession" s ON s.id = a."sessionId"
         WHERE s."userId" = $1 AND s."paperId" = $2 AND s.mode = 'full'`,
        userId,
        paperId
      );
    } catch {
      // Tables are created on first practice save, so no rows means no runs yet
      answers = [];
    }

    if (answers.length === 0) {
      return Response.json({
        focusAreas: [],
        hasAttempt: false,
        message: "Complete a full practice run on this paper to unlock focus areas",
      });
    }

    const questions = await (prisma as any).question.findMany({
      where: { paperId: paperId },
      select: { id: true, chapterNumber: true },
    });
    const chapterOf = new Map<string, number>(
      questions.map((q: any) => [String(q.id), Number(q.chapterNumber)])
    );

    // Correct and total answers per chapter
    const chapterStats: Record<number, { correct: number; total: number }> = {};
    let runsCounted = 0;
    const runIds = new Set<string>();
    for (const a of answers) {
      const chapter = chapterOf.get(String(a.questionId));
      if (chapter === undefined) continue;
      runIds.add(a.sessionId);
      if (!chapterStats[chapter]) chapterStats[chapter] = { correct: 0, total: 0 };
      chapterStats[chapter].total += 1;
      if (a.isCorrect) chapterStats[chapter].correct += 1;
    }
    runsCounted = runIds.size;

    const chapterPerformance = Object.entries(chapterStats).map(([chapterNum, stats]) => ({
      chapterNumber: parseInt(chapterNum, 10),
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    const chapters = await (prisma as any).chapter.findMany({ where: { paperId: paperId } });
    const chapterTitles: Record<number, string> = {};
    chapters.forEach((ch: any) => {
      chapterTitles[ch.number] = ch.title;
    });

    const paperRows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT title FROM "Paper" WHERE id::text = $1`,
      paperId
    );
    const paperTitle = paperRows[0]?.title ?? "";

    const weakChapters = chapterPerformance
      .filter((c) => c.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3)
      .map((c) => ({
        id: `${paperId}-${c.chapterNumber}`,
        chapterNumber: c.chapterNumber,
        chapterTitle: chapterTitles[c.chapterNumber] || `Chapter ${c.chapterNumber}`,
        percentage: c.percentage,
        correct: c.correct,
        total: c.total,
        paperTitle,
        paperId,
      }));

    return Response.json({
      focusAreas: weakChapters,
      hasAttempt: true,
      totalAttempts: runsCounted,
      allChaptersCount: chapterPerformance.length,
      weakChaptersCount: chapterPerformance.filter((c) => c.percentage < 60).length,
      aggregatedData: true,
      message: `Based on ${runsCounted} full practice run(s) on this paper`,
    });
  } catch (error: any) {
    console.error("Error fetching focus areas:", error);
    return Response.json(
      { error: "Failed to fetch focus areas", details: error.message, focusAreas: [], hasAttempt: false },
      { status: 500 }
    );
  }
}
