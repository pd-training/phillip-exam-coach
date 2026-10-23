import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";
import { ensureLabelColumns } from "@/lib/paper-labels";
import { generateAttemptFeedback } from "@/lib/study-advice";

export const dynamic = "force-dynamic";

function parseJson<T>(value: unknown, fallback: T): T {
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

// Personalised feedback for one exam simulation attempt (summary only)
export async function GET(_req: Request, { params }: { params: { attemptId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    await ensureLabelColumns();
    const rows = (await prisma.$queryRaw`
      SELECT ea.id, ea.paperid::text AS "paperId", ea.score, ea.passed, ea.answers, ea."questionIds",
             p.title AS "paperTitle", p."shortName" AS "paperShortName",
             COALESCE(p."passingScore", 50) AS "passingScore"
      FROM examattempt ea
      JOIN "Paper" p ON p.id = ea.paperid
      WHERE ea.id = ${params.attemptId} AND ea.userid = ${userId}
    `) as any[];
    const attempt = rows[0];
    if (!attempt || attempt.score === null) {
      return Response.json({ error: "Attempt not found" }, { status: 404 });
    }

    const questions = (await prisma.$queryRaw`
      SELECT q.id, q."chapterNumber", q."correctAnswer"
      FROM "Question" q
      WHERE q."paperId"::text = ${attempt.paperId}::text
    `) as any[];
    const byId = new Map<string, { chapterNumber: number; correctAnswer: string }>();
    for (const q of questions) {
      byId.set(q.id, { chapterNumber: Number(q.chapterNumber), correctAnswer: q.correctAnswer });
    }

    const answers = parseJson<Record<string, string>>(attempt.answers, {});
    const questionIds = parseJson<string[]>(attempt.questionIds, Object.keys(answers));

    // Tally each chapter. Unanswered questions count as not correct, as in the score.
    const tally = new Map<number, { correct: number; total: number }>();
    for (const qid of questionIds) {
      const q = byId.get(qid);
      if (!q) continue;
      const t = tally.get(q.chapterNumber) || { correct: 0, total: 0 };
      t.total += 1;
      if (answers[qid] && answers[qid] === q.correctAnswer) t.correct += 1;
      tally.set(q.chapterNumber, t);
    }

    const chapterRows = (await (prisma as any).chapter.findMany({
      where: { paperId: attempt.paperId },
      select: { number: true, title: true },
    })) as { number: number; title: string }[];
    const titles = new Map(chapterRows.map((c) => [Number(c.number), c.title]));

    const chapters = Array.from(tally.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([chapterNumber, t]) => ({
        chapterNumber,
        title: titles.get(chapterNumber) ?? null,
        correct: t.correct,
        total: t.total,
      }));

    const score = Number(attempt.score);
    const passingScore = Number(attempt.passingScore);
    try {
      const feedback = await generateAttemptFeedback({
        paperName: attempt.paperShortName || attempt.paperTitle || "Paper",
        score,
        passingScore,
        passed: score >= passingScore,
        chapters,
      });
      return Response.json({ feedback, aiUsed: true });
    } catch (error: any) {
      console.error("Attempt feedback failed:", error?.message);
      return Response.json(
        { error: "Could not create feedback", details: error?.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Attempt feedback error:", error?.message);
    return Response.json(
      { error: "Could not create feedback", details: error?.message },
      { status: 500 }
    );
  }
}
