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

    // Get attempt details - try with answers column first
    let attemptRes: any[] = [];
    try {
      attemptRes = await prisma.$queryRaw`
        SELECT 
          ea.id,
          ea.userid,
          ea.paperid,
          ea.score,
          ea.passed,
          ea.startedat,
          ea.submittedat,
          ea.answers,
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
    } catch (err: any) {
      // If answers column doesn't exist, fetch without it
      if (err.message && err.message.includes('column') && err.message.includes('answers')) {
        console.log('⚠️ answers column does not exist yet, fetching without it');
        attemptRes = await prisma.$queryRaw`
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
      } else {
        throw err;
      }
    }

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

    // Get student answers from examattempt.answers (JSONB column)
    let studentAnswers: Record<string, string> = {};
    if (attempt.answers) {
      try {
        studentAnswers = typeof attempt.answers === 'string' 
          ? JSON.parse(attempt.answers)
          : attempt.answers;
        console.log("✅ Loaded student answers from examattempt.answers:", Object.keys(studentAnswers).length, "questions answered");
      } catch (e: any) {
        console.log("⚠️ Could not parse answers from examattempt:", e.message);
      }
    } else {
      console.log("⚠️ No answers found in examattempt table - add answers column: GET /api/admin/add-answers-column");
    }

    // Calculate time taken
    const timeTaken = Math.round(
      (new Date(attempt.submittedat).getTime() - new Date(attempt.startedat).getTime()) / 1000
    );

    console.log("Returning attempt details with", answersRes.length, "questions, time taken:", timeTaken, "seconds");
    
    return Response.json({
      attempt: {
        ...attempt,
        timeTaken, // Add time taken in seconds
      },
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
