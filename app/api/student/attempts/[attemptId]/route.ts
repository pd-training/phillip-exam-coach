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

    console.log("Fetching attempt details for attemptId:", attemptId, "userId:", userId);

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

    console.log("Attempt query result:", attemptRes?.length);

    if (!attemptRes || attemptRes.length === 0) {
      console.log("Attempt not found or access denied");
      return Response.json({ error: "Attempt not found or access denied" }, { status: 404 });
    }

    const attempt = attemptRes[0];
    console.log("Attempt found:", attempt.id, "Paper:", attempt.paper_name);

    // Get questions for this paper
    console.log("Fetching questions for paperId:", attempt.paperid);
    let questions: any[] = [];
    
    try {
      const questionsRes = await prisma.$queryRaw`
        SELECT 
          q.id,
          q."questionText",
          q."correctAnswer",
          q."explanation",
          q."chapterNumber",
          q."optionA",
          q."optionB",
          q."optionC",
          q."optionD"
        FROM "Question" q
        WHERE q."paperId"::text = ${attempt.paperid}::text
        ORDER BY q.id ASC
      ` as any[];
      
      questions = questionsRes || [];
      console.log("Found questions:", questions.length);
    } catch (questionsError) {
      console.log("Warning: Could not fetch questions with current schema, continuing without options:", questionsError);
      // Continue without options - try fetching just basic question data
      try {
        const basicQuestionsRes = await prisma.$queryRaw`
          SELECT id, "questionText", "correctAnswer", "explanation"
          FROM "Question"
          WHERE "paperId"::text = ${attempt.paperid}::text
          ORDER BY id ASC
        ` as any[];
        questions = basicQuestionsRes || [];
      } catch (e) {
        console.log("Could not fetch questions at all, continuing with empty list:", e);
        questions = [];
      }
    }

    // Get student answers from StudentAnswer table if it exists
    let studentAnswers: any[] = [];
    try {
      console.log("Fetching student answers for attemptId:", attemptId);
      studentAnswers = await (prisma as any).studentAnswer.findMany({
        where: { attemptId },
      });
      console.log("Found student answers:", studentAnswers.length);
    } catch (err: any) {
      console.log("StudentAnswer table not found or empty:", err.message);
      // StudentAnswer table might not exist yet - continue with empty answers
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

    console.log("Returning attempt details with", questionsWithAnswers.length, "questions");

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
        timeTaken: Math.round((new Date(attempt.submittedat).getTime() - new Date(attempt.startedat).getTime()) / 1000),
      },
      questions: questionsWithAnswers,
    });
  } catch (error: any) {
    console.error("Error fetching student attempt details:", error);
    console.error("Error stack:", error.stack);
    return Response.json(
      { 
        error: "Failed to fetch attempt details",
        details: error.message
      },
      { status: 500 }
    );
  }
}
