import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    // Get paper config
    const paperResult = await prisma.$queryRaw`
      SELECT "totalTime", "passingScore" FROM "Paper" WHERE id = ${paperId}::uuid
    ` as any[];

    if (!paperResult || paperResult.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = paperResult[0];

    // Get exam parts with questions
    const parts = await prisma.$queryRaw`
      SELECT 
        ep.id, 
        ep."partName", 
        ep."chapterStart", 
        ep."chapterEnd", 
        ep."questionCount", 
        ep."passingScore", 
        ep."orderIndex"
      FROM "ExamPart" ep
      WHERE ep."paperId" = ${paperId}::uuid
      ORDER BY ep."orderIndex" ASC
    ` as any[];

    // Get all questions for this paper
    const questions = await prisma.$queryRaw`
      SELECT 
        id, 
        "chapterNumber", 
        "questionText", 
        "correctAnswer", 
        explanation
      FROM "Question"
      WHERE "paperId" = ${paperId}::uuid
      ORDER BY "chapterNumber" ASC, id ASC
    ` as any[];

    // Organize questions by part based on chapter ranges
    const partsWithQuestions = parts.map((part: any) => {
      const partQuestions = questions.filter(
        (q: any) => q.chapterNumber >= part.chapterStart && q.chapterNumber <= part.chapterEnd
      );
      
      // Randomly select questionCount questions from this part
      const shuffled = [...partQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(part.questionCount, partQuestions.length));

      return {
        ...part,
        questions: selected.map((q: any) => ({
          id: q.id,
          text: q.questionText,
          // Don't send correctAnswer/explanation yet (for full exam, feedback after submit)
        })),
      };
    });

    return NextResponse.json({
      examConfig: {
        totalTime: paper.totalTime,
        passingScore: paper.passingScore,
      },
      parts: partsWithQuestions,
    });
  } catch (error: any) {
    console.error('Get full exam error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, answers } = body; // answers = { [questionId]: 'A' }
    const paperId = params.id;

    // Get all correct answers
    const questionsResult = await prisma.$queryRaw`
      SELECT id, "correctAnswer" FROM "Question"
      WHERE "paperId" = ${paperId}::uuid
    ` as any[];

    // Calculate score
    let correctCount = 0;
    const answerDetails: any[] = [];

    for (const q of questionsResult) {
      const studentAnswer = answers[q.id];
      const isCorrect = studentAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;

      answerDetails.push({
        questionId: q.id,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
      });
    }

    const totalQuestions = questionsResult.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Get passing score requirement
    const paperResult = await prisma.$queryRaw`
      SELECT "passingScore" FROM "Paper" WHERE id = ${paperId}::uuid
    ` as any[];

    const passingScore = paperResult[0]?.passingScore || 75;
    const passed = score >= passingScore;

    // Save exam attempt
    await prisma.$queryRaw`
      INSERT INTO "ExamAttempt" (id, "paperId", "userId", "startedAt", "submittedAt", score, passed, "createdAt")
      VALUES (
        gen_random_uuid(),
        ${paperId}::uuid,
        ${userId},
        NOW(),
        NOW(),
        ${score},
        ${passed},
        NOW()
      )
    `;

    return NextResponse.json({
      score,
      passed,
      correctCount,
      totalQuestions,
      passingScore,
      answers: answerDetails,
    });
  } catch (error: any) {
    console.error('Submit exam error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit exam' },
      { status: 500 }
    );
  }
}
