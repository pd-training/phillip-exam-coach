import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";
import {
  AnsweredQuestion,
  buildRecommendations,
} from "@/lib/progress-recommendations";

export const dynamic = "force-dynamic";

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // The student's recent completed attempts, with the answers they gave
    const attempts = (await prisma.$queryRaw`
      SELECT ea.id, ea.paperid::text as "paperId", p.title as "paperTitle",
             ea.answers, ea."questionIds"
      FROM examattempt ea
      JOIN "Paper" p ON ea.paperid = p.id
      WHERE ea.userid = ${userId}
        AND ea.score IS NOT NULL
      ORDER BY ea.submittedat DESC
      LIMIT 50
    `) as any[];

    // Papers this student can access and that are live
    const accessible = (await prisma.$queryRaw`
      SELECT p.id::text as "paperId", p.title as "paperTitle"
      FROM "StudentPaper" sp
      JOIN "Paper" p ON sp."paperId" = p.id
      WHERE sp."userId" = ${userId}
        AND sp.status = 'active'
        AND p."isAvailable" = true
    `) as any[];

    // Papers the student attempted but no longer has access to still count
    const paperIds = new Map<string, string>();
    for (const p of accessible) paperIds.set(p.paperId, p.paperTitle);
    for (const a of attempts) paperIds.set(a.paperId, a.paperTitle);

    // Question chapter + correct answer, per paper
    const questionsByPaper = new Map<
      string,
      Map<string, { chapterNumber: number; correctAnswer: string }>
    >();
    const paperChapterNumbers = new Map<string, Set<number>>();
    for (const paperId of paperIds.keys()) {
      const rows = (await prisma.$queryRaw`
        SELECT q.id, q."chapterNumber", q."correctAnswer"
        FROM "Question" q
        WHERE q."paperId"::text = ${paperId}::text
      `) as any[];
      const byId = new Map<string, { chapterNumber: number; correctAnswer: string }>();
      const chapters = new Set<number>();
      for (const r of rows) {
        byId.set(r.id, {
          chapterNumber: Number(r.chapterNumber),
          correctAnswer: r.correctAnswer,
        });
        chapters.add(Number(r.chapterNumber));
      }
      questionsByPaper.set(paperId, byId);
      paperChapterNumbers.set(paperId, chapters);
    }

    // Chapter titles
    const chapterTitles = new Map<string, string>();
    if (paperIds.size > 0) {
      const chapterRows = await (prisma as any).chapter.findMany({
        where: { paperId: { in: Array.from(paperIds.keys()) } },
        select: { paperId: true, number: true, title: true },
      });
      for (const c of chapterRows) {
        chapterTitles.set(`${c.paperId}|${c.number}`, c.title);
      }
    }
    const titleFor = (paperId: string, n: number) =>
      chapterTitles.get(`${paperId}|${n}`) ?? null;

    // Turn each attempt's answers into per-question correct/incorrect records
    const answered: AnsweredQuestion[] = [];
    for (const attempt of attempts) {
      const answers = parseJsonField<Record<string, string>>(attempt.answers, {});
      const questionIds = parseJsonField<string[]>(
        attempt.questionIds,
        Object.keys(answers)
      );
      const byId = questionsByPaper.get(attempt.paperId);
      if (!byId) continue;

      for (const qid of questionIds) {
        const given = answers[qid];
        const question = byId.get(qid);
        if (!given || !question) continue; // unanswered or unknown: not counted

        answered.push({
          attemptId: attempt.id,
          paperId: attempt.paperId,
          paperTitle: attempt.paperTitle,
          chapterNumber: question.chapterNumber,
          chapterTitle: titleFor(attempt.paperId, question.chapterNumber),
          correct: given === question.correctAnswer,
        });
      }
    }

    // Chapters per paper, for the "not yet practised" list
    const paperChapters = new Map<
      string,
      { paperTitle: string; chapters: { chapterNumber: number; chapterTitle: string | null }[] }
    >();
    for (const paperId of accessible.map((p: any) => p.paperId)) {
      const numbers = Array.from(paperChapterNumbers.get(paperId) ?? []).sort((a, b) => a - b);
      paperChapters.set(paperId, {
        paperTitle: paperIds.get(paperId) ?? "",
        chapters: numbers.map((n) => ({
          chapterNumber: n,
          chapterTitle: titleFor(paperId, n),
        })),
      });
    }

    const result = buildRecommendations(answered, paperChapters);
    return Response.json(result);
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return Response.json(
      { error: "Failed to generate recommendations", details: error.message },
      { status: 500 }
    );
  }
}
