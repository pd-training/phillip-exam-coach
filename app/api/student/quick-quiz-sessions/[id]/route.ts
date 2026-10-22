import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Question-by-question review of one saved run, for the signed-in student only
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const runs: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT s.id, s.mode, s."chapterNumber", s."totalQuestions", s."correctCount", s.percentage, s."createdAt", p.title AS "paperTitle"
       FROM "QuickQuizSession" s
       LEFT JOIN "Paper" p ON p.id::text = s."paperId"
       WHERE s.id = $1 AND s."userId" = $2`,
      params.id,
      userId
    );
    const run = runs[0];
    if (!run) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const answers: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT "questionId", answer, "isCorrect", position
       FROM "QuickQuizAnswer"
       WHERE "sessionId" = $1
       ORDER BY position ASC`,
      params.id
    );

    const questions: any[] = await (prisma as any).question.findMany({
      where: { id: { in: answers.map((a) => String(a.questionId)) } },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        correctAnswer: true,
        explanation: true,
      },
    });
    const byId = new Map(questions.map((q) => [String(q.id), q]));

    const items = answers.map((a) => {
      const q = byId.get(String(a.questionId));
      return {
        position: a.position,
        questionText: q?.questionText ?? "Question no longer available",
        options: q ? { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD } : null,
        answer: a.answer,
        correctAnswer: q?.correctAnswer ?? null,
        isCorrect: Boolean(a.isCorrect),
        explanation: q?.explanation ?? "",
      };
    });

    return Response.json({ run, items });
  } catch (error: any) {
    console.error("Load run review error:", error?.message || error);
    return Response.json({ error: "Could not load review" }, { status: 500 });
  }
}
