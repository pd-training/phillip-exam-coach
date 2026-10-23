import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

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

type Tally = Map<number, { correct: number; total: number }>;

// Per-chapter results for one exam simulation, plus the average across all
// students' simulations on the same paper (for comparison).
function tallyAttempt(
  answers: Record<string, string>,
  questionIds: string[],
  byId: Map<string, { chapterNumber: number; correctAnswer: string }>
): Tally {
  const tally: Tally = new Map();
  for (const qid of questionIds) {
    const q = byId.get(qid);
    if (!q) continue;
    const t = tally.get(q.chapterNumber) || { correct: 0, total: 0 };
    t.total += 1;
    if (answers[qid] && answers[qid] === q.correctAnswer) t.correct += 1;
    tally.set(q.chapterNumber, t);
  }
  return tally;
}

export async function GET(_req: Request, { params }: { params: { attemptId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const rows = (await prisma.$queryRaw`
      SELECT ea.id, ea.paperid::text AS "paperId", ea.score, ea.answers, ea."questionIds",
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
    const mine = tallyAttempt(answers, questionIds, byId);

    // Average across other students' recent simulations on this paper
    const others = (await prisma.$queryRaw`
      SELECT ea.answers, ea."questionIds"
      FROM examattempt ea
      WHERE ea.paperid::text = ${attempt.paperId}::text
        AND ea.score IS NOT NULL
        AND ea.id <> ${params.attemptId}
      ORDER BY ea.submittedat DESC
      LIMIT 300
    `) as any[];
    const allTotals = new Map<number, { correct: number; total: number }>();
    for (const o of others) {
      const t = tallyAttempt(
        parseJson<Record<string, string>>(o.answers, {}),
        parseJson<string[]>(o.questionIds, []),
        byId
      );
      t.forEach((v, ch) => {
        const a = allTotals.get(ch) || { correct: 0, total: 0 };
        a.correct += v.correct;
        a.total += v.total;
        allTotals.set(ch, a);
      });
    }

    const chapterRows = (await (prisma as any).chapter.findMany({
      where: { paperId: attempt.paperId },
      select: { number: true, title: true },
    })) as { number: number; title: string }[];
    const titles = new Map(chapterRows.map((c) => [Number(c.number), c.title]));

    const chapters = Array.from(mine.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([chapterNumber, t]) => {
        const avg = allTotals.get(chapterNumber);
        return {
          chapterNumber,
          title: titles.get(chapterNumber) ?? null,
          correct: t.correct,
          total: t.total,
          pct: t.total ? Math.round((t.correct / t.total) * 100) : 0,
          averagePct: avg && avg.total > 0 ? Math.round((avg.correct / avg.total) * 100) : null,
        };
      });

    return Response.json({
      paperName: attempt.paperShortName || attempt.paperTitle || "Paper",
      score: Number(attempt.score),
      passingScore: Number(attempt.passingScore),
      studentsCompared: others.length,
      chapters,
    });
  } catch (error: any) {
    console.error("Chapter performance error:", error?.message);
    return Response.json(
      { error: "Could not load chapter performance", details: error?.message },
      { status: 500 }
    );
  }
}
