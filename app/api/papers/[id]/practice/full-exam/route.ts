import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    console.log('Fetching full exam - paperId:', paperId);

    // Get paper config using ORM
    const paper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        totalTime: true,
        passingScore: true,
      }
    });

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    // Get all questions for this paper
    const questions = await (prisma as any).question.findMany({
      where: { paperId: paperId },
      select: {
        id: true,
        chapterNumber: true,
        questionText: true,
        correctAnswer: true,
        explanation: true,
      },
      orderBy: { chapterNumber: 'asc' }
    });

    console.log('Found questions:', questions.length);

    // Return in exam format
    return NextResponse.json({
      examConfig: {
        totalTime: paper.totalTime,
        passingScore: paper.passingScore,
      },
      questions: questions.map((q: any) => ({
        id: q.id,
        text: q.questionText,
        chapter: q.chapterNumber,
      })),
      totalQuestions: questions.length,
    });
  } catch (error: any) {
    console.error('Get full exam error:', error.message);
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
    // Parse JSON
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { userId, answers } = body; // answers = { [questionId]: 'A' }
    const paperId = params.id;

    console.log('Submitting exam - userId:', userId, 'paperId:', paperId, 'answers:', Object.keys(answers || {}).length);

    if (!userId || !answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'userId and answers required' },
        { status: 400 }
      );
    }

    // Get all questions to check answers
    const allQuestions = await (prisma as any).question.findMany({
      where: { paperId: paperId },
      select: {
        id: true,
        correctAnswer: true,
      }
    });

    console.log('Found total questions:', allQuestions.length);

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this exam' },
        { status: 400 }
      );
    }

    // Calculate score
    let correctCount = 0;
    const answerDetails: any[] = [];

    for (const q of allQuestions) {
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

    const totalQuestions = allQuestions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Get passing score requirement
    const paper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
      select: { passingScore: true }
    });

    const passingScore = paper?.passingScore || 75;
    const passed = score >= passingScore;

    console.log('Exam result - score:', score, 'passed:', passed);

    // Save exam attempt using raw SQL (examattempt is lowercase)
    try {
      console.log('Saving attempt - userId:', userId, 'paperId:', paperId, 'score:', score);
      const attemptId = crypto.randomUUID();
      await prisma.$queryRaw`
        INSERT INTO examattempt (id, paperid, userid, startedat, submittedat, score, passed, createdat)
        VALUES (
          ${attemptId},
          ${paperId}::uuid,
          ${userId},
          NOW(),
          NOW(),
          ${score},
          ${passed},
          NOW()
        )
      `;
      console.log('Exam attempt saved with ID:', attemptId);
    } catch (insertError: any) {
      console.error('Error saving exam attempt:', insertError.message, insertError.code);
    }

    return NextResponse.json({
      score,
      passed,
      correctCount,
      totalQuestions,
      passingScore,
      answers: answerDetails,
    });
  } catch (error: any) {
    console.error('Submit exam error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit exam' },
      { status: 500 }
    );
  }
}
