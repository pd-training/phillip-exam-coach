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

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const attemptId = params.attemptId;

    if (!attemptId) {
      return Response.json({ error: "Attempt ID is required" }, { status: 400 });
    }

    // Get attempt details - only if it belongs to the current user
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
      JOIN "Paper" p ON ea.paperid = p.id
      WHERE ea.id = ${attemptId}
      AND ea.userid = ${userId}
    ` as any[];

    if (!attemptRes || attemptRes.length === 0) {
      return Response.json({ error: "Attempt not found or access denied" }, { status: 404 });
    }

    const attempt = attemptRes[0];

    // Get questions for this paper
    const questions = await (prisma as any).question.findMany({
      where: { paperId: attempt.paperid },
      orderBy: { id: 'asc' },
    });

    // Get student answers from StudentAnswer table if it exists
    let studentAnswers: any[] = [];
    try {
      studentAnswers = await (prisma as any).studentAnswer.findMany({
        where: { attemptId },
      });
    } catch (err) {
      // StudentAnswer table might not exist yet
      console.log("StudentAnswer table not found, attempting to fetch from attempt data");
    }

    // Map student answers to questions
    const questionsWithAnswers = questions.map((q: any) => {
      const studentAnswer = studentAnswers.find(sa => sa.questionId === q.id);
      const isCorrect = studentAnswer?.answer === q.correctAnswer;

      return {
        id: q.id,
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        explanation: q.explanation,
        chapterNumber: q.chapterNumber,
        studentAnswer: studentAnswer?.answer || null,
        isCorrect: isCorrect || false,
      };
    });

    return Response.json({
      attempt: {
        id: attempt.id,
        userid: attempt.userid,
        paperid: attempt.paperid,
        score: attempt.score,
        passed: attempt.passed,
        startedat: attempt.startedat,
        submittedat: attempt.submittedat,
        student_name: attempt.student_name,
        student_email: attempt.student_email,
        paper_name: attempt.paper_name,
        totalQuestions: attempt.totalQuestions,
        passingScore: attempt.passingScore,
      },
      questions: questionsWithAnswers,
    });
  } catch (error: any) {
    console.error("Error fetching student attempt details:", error);
    return Response.json(
      { error: "Failed to fetch attempt details" },
      { status: 500 }
    );
  }
}
