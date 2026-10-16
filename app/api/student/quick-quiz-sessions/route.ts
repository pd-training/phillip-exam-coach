import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// Creates the table on first use so no separate admin migration is needed.
async function ensureTable() {
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
}

// Saves a finished quick quiz. Correctness is checked on the server against the
// stored answers, so the score cannot be set by the browser.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const paperId = typeof body?.paperId === "string" ? body.paperId : "";
    const answers: { questionId: string; answer: string }[] = Array.isArray(body?.answers) ? body.answers : [];
    if (!paperId || answers.length === 0) {
      return Response.json({ error: "paperId and answers are required" }, { status: 400 });
    }

    const ids = answers.map((a) => String(a.questionId));
    const questions: { id: string; correctAnswer: string }[] = await (prisma as any).question.findMany({
      where: { id: { in: ids }, paperId },
      select: { id: true, correctAnswer: true },
    });
    const byId = new Map(questions.map((q) => [String(q.id), q.correctAnswer]));

    const totalQuestions = answers.filter((a) => byId.has(String(a.questionId))).length;
    if (totalQuestions === 0) {
      return Response.json({ error: "No valid questions" }, { status: 400 });
    }
    const correctCount = answers.filter(
      (a) => byId.has(String(a.questionId)) && byId.get(String(a.questionId)) === a.answer
    ).length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    await ensureTable();
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "QuickQuizSession" (id, "userId", "paperId", "totalQuestions", "correctCount", percentage)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      randomUUID(),
      userId,
      paperId,
      totalQuestions,
      correctCount,
      percentage
    );

    return Response.json({ success: true, totalQuestions, correctCount, percentage });
  } catch (error: any) {
    console.error("Save quick quiz error:", error?.message || error);
    return Response.json({ error: "Could not save quiz" }, { status: 500 });
  }
}

// Recent quick quizzes for the signed-in student
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    await ensureTable();
    const sessions = await (prisma as any).$queryRawUnsafe(
      `SELECT s.id, s."paperId", p.title AS "paperTitle", s."totalQuestions", s."correctCount", s.percentage, s."createdAt"
       FROM "QuickQuizSession" s
       LEFT JOIN "Paper" p ON p.id::text = s."paperId"
       WHERE s."userId" = $1
       ORDER BY s."createdAt" DESC
       LIMIT 10`,
      userId
    );

    return Response.json({ sessions: sessions || [] });
  } catch (error: any) {
    console.error("Load quick quiz sessions error:", error?.message || error);
    return Response.json({ sessions: [] });
  }
}
