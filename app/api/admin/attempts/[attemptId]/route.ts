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

    const attemptId = params.attemptId;
    if (!attemptId) {
      return Response.json({ error: "Attempt ID is required" }, { status: 400 });
    }

    console.log("Fetching attempt with ID:", attemptId);

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
      JOIN "Paper" p ON ea.paperid = p.id
      WHERE ea.id = ${attemptId}
    ` as any[];

    console.log("Attempt query result:", attemptRes);

    if (!attemptRes || attemptRes.length === 0) {
      return Response.json({ error: "Attempt not found" }, { status: 404 });
    }

    const attempt = attemptRes[0];
    console.log("Attempt data:", attempt);

    // Get answer details from the examattempt table (if stored) or reconstruct from questions
    console.log("Fetching questions for paperid:", attempt.paperid, "type:", typeof attempt.paperid);
    
    let answersRes: any[] = [];
    try {
      answersRes = await prisma.$queryRaw`
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
        WHERE q."paperId"::text = ${attempt.paperid}::text
        ORDER BY q."chapterNumber" ASC, q.id ASC
      ` as any[];
      console.log("✓ Questions fetched with options:", answersRes?.length, "questions");
    } catch (e: any) {
      console.log("Warning: Could not fetch questions with all columns, retrying without options:", e.message);
      try {
        answersRes = await prisma.$queryRaw`
          SELECT 
            q.id,
            q."questionText",
            q."correctAnswer",
            q."explanation",
            q."chapterNumber"
          FROM "Question" q
          WHERE q."paperId"::text = ${attempt.paperid}::text
          ORDER BY q."chapterNumber" ASC, q.id ASC
        ` as any[];
        console.log("✓ Questions fetched without options:", answersRes?.length, "questions");
      } catch (retryError) {
        console.log("✗ Could not fetch questions at all:", retryError);
        answersRes = [];
      }
    }

    console.log("Questions query returned:", answersRes?.length, "questions");
    if (answersRes.length === 0) {
      console.warn("WARNING: No questions found for paper", attempt.paperid);
    }

    // Get student answers if stored (check if answers table exists)
    let studentAnswers: any = {};
    try {
      const studentAnswersRes = await prisma.$queryRaw`
        SELECT 
          "questionId",
          "selectedAnswer"
        FROM "StudentAnswer"
        WHERE "attemptId" = ${attemptId}
      ` as any[];

      console.log("StudentAnswers query returned:", studentAnswersRes?.length, "answers");

      studentAnswersRes.forEach((ans: any) => {
        studentAnswers[ans.questionId] = ans.selectedAnswer;
      });
    } catch (e: any) {
      // Table might not exist, continue without it
      console.log("StudentAnswer table query failed (table may not exist):", e.message);
    }

    console.log("Returning attempt details with", answersRes.length, "questions");
    
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
    console.error("Error stack:", error.stack);
    return Response.json(
      { error: error.message || "Failed to fetch attempt", details: error.toString() },
      { status: 500 }
    );
  }
}
