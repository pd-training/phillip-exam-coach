import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// Creates the tables on first use so no separate admin migration is needed.
async function ensureTables() {
  await (prisma as any).$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "QuickQuizSession" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "paperId" TEXT NOT NULL,
      "totalQuestions" INT NOT NULL,
      "correctCount" INT NOT NULL,
      percentage INT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  // Quick quiz, chapter practice and full practice results share this table.
  // Older rows are quick quizzes.
  await (prisma as any).$executeRawUnsafe(`ALTER TABLE "QuickQuizSession" ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'quick'`);
  await (prisma as any).$executeRawUnsafe(`ALTER TABLE "QuickQuizSession" ADD COLUMN IF NOT EXISTS "chapterNumber" INT`);
  // One row per question answered in a run, so each run can be reviewed.
  await (prisma as any).$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "QuickQuizAnswer" (
      id TEXT PRIMARY KEY,
      "sessionId" TEXT NOT NULL,
      "questionId" TEXT NOT NULL,
      answer TEXT NOT NULL,
      "isCorrect" BOOLEAN NOT NULL,
      position INT NOT NULL
    )
  `);
}

// Saves a finished run. Correctness is checked on the server against the stored
// answers, so the score cannot be set by the browser. Each question counts once.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const paperId = typeof body?.paperId === "string" ? body.paperId : "";
    const mode = body?.mode === "chapter" ? "chapter" : body?.mode === "full" ? "full" : "quick";
    const chapterNumber = mode === "chapter" && Number.isInteger(body?.chapterNumber) ? body.chapterNumber : null;
    const rawAnswers: { questionId: string; answer: string }[] = Array.isArray(body?.answers) ? body.answers : [];

    // First answer for each question wins, so repeats are ignored
    const seen = new Set<string>();
    const answers = rawAnswers.filter((a) => {
      const id = String(a?.questionId ?? "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    if (!paperId || answers.length === 0) {
      return Response.json({ error: "paperId and answers are required" }, { status: 400 });
    }

    const ids = answers.map((a) => String(a.questionId));
    const questions: { id: string; correctAnswer: string }[] = await (prisma as any).question.findMany({
      where: { id: { in: ids }, paperId },
      select: { id: true, correctAnswer: true },
    });
    const byId = new Map(questions.map((q) => [String(q.id), q.correctAnswer]));

    const valid = answers.filter((a) => byId.has(String(a.questionId)));
    const totalQuestions = valid.length;
    if (totalQuestions === 0) {
      return Response.json({ error: "No valid questions" }, { status: 400 });
    }
    const correctCount = valid.filter((a) => byId.get(String(a.questionId)) === a.answer).length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    await ensureTables();
    const sessionId = randomUUID();
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "QuickQuizSession" (id, "userId", "paperId", "totalQuestions", "correctCount", percentage, mode, "chapterNumber")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      sessionId,
      userId,
      paperId,
      totalQuestions,
      correctCount,
      percentage,
      mode,
      chapterNumber
    );

    for (let i = 0; i < valid.length; i++) {
      const a = valid[i];
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "QuickQuizAnswer" (id, "sessionId", "questionId", answer, "isCorrect", position)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        randomUUID(),
        sessionId,
        String(a.questionId),
        String(a.answer),
        byId.get(String(a.questionId)) === a.answer,
        i + 1
      );
    }

    return Response.json({ success: true, totalQuestions, correctCount, percentage });
  } catch (error: any) {
    console.error("Save practice run error:", error?.message || error);
    return Response.json({ error: "Could not save run" }, { status: 500 });
  }
}

// Recent runs for the signed-in student
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    await ensureTables();
    const sessions = await (prisma as any).$queryRawUnsafe(
      `SELECT s.id, s."paperId", p.title AS "paperTitle", s.mode, s."chapterNumber", s."totalQuestions", s."correctCount", s.percentage, s."createdAt"
       FROM "QuickQuizSession" s
       LEFT JOIN "Paper" p ON p.id::text = s."paperId"
       WHERE s."userId" = $1
       ORDER BY s."createdAt" DESC
       LIMIT 100`,
      userId
    );

    return Response.json({ sessions: sessions || [] });
  } catch (error: any) {
    console.error("Load practice runs error:", error?.message || error);
    return Response.json({ sessions: [] });
  }
}
