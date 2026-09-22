import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { attemptId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get attempt details
    const attemptRes = await prisma.$queryRaw`
      SELECT 
        ea.id,
        ea.userid,
        ea.paperid,
        ea.score,
        ea.passed,
        ea.startedat,
        ea.submittedat,
        u.name as student_name,
        u.email as student_email,
        p.title as paper_name,
        p."totalQuestions",
        p."passingScore"
      FROM examattempt ea
      JOIN "User" u ON ea.userid = u.id
      JOIN "Paper" p ON CAST(ea.paperid AS UUID) = p.id
      WHERE ea.id = ${params.attemptId}
    ` as any[];

    if (!attemptRes || attemptRes.length === 0) {
      return Response.json({ error: "Attempt not found" }, { status: 404 });
    }

    const attempt = attemptRes[0];

    // Get answer details from the examattempt table (if stored) or reconstruct from questions
    const answersRes = await prisma.$queryRaw`
      SELECT 
        q.id,
        q."questionText",
        q."correctAnswer",
        q."optionA",
        q."optionB",
        q."optionC",
        q."optionD",
        q."explanation",
        q."chapterNumber"
      FROM "Question" q
      WHERE q."paperId" = CAST(${attempt.paperid} AS UUID)
      ORDER BY q."chapterNumber" ASC, q.id ASC
    ` as any[];

    // Get student answers if stored (check if answers table exists)
    let studentAnswers: any = {};
    try {
      const studentAnswersRes = await prisma.$queryRaw`
        SELECT 
          "questionId",
          "selectedAnswer"
        FROM "StudentAnswer"
        WHERE "attemptId" = ${params.attemptId}
      ` as any[];

      studentAnswersRes.forEach((ans: any) => {
        studentAnswers[ans.questionId] = ans.selectedAnswer;
      });
    } catch (e) {
      // Table might not exist, continue without it
    }

    return Response.json({
      attempt,
      questions: answersRes.map((q: any) => ({
        ...q,
        studentAnswer: studentAnswers[q.id] || null,
        isCorrect: studentAnswers[q.id] === q.correctAnswer,
      })),
    });
  } catch (error: any) {
    console.error("Get attempt error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch attempt" },
      { status: 500 }
    );
  }
}
