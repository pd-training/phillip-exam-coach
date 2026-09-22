import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    console.log('Fetching quick quiz questions for paper:', paperId);

    // Get all questions for this paper
    const allQuestions = await (prisma as any).question.findMany({
      where: { paperId: paperId },
      select: {
        id: true,
        chapterNumber: true,
        questionText: true,
        correctAnswer: true,
        explanation: true,
      }
    });

    console.log('Found questions:', allQuestions.length);

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available' },
        { status: 404 }
      );
    }

    // Shuffle and take 15
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, Math.min(15, shuffled.length));

    return NextResponse.json({
      questions: questions.map((q: any) => ({
        id: q.id,
        text: q.questionText,
        chapter: q.chapterNumber,
      })),
      totalQuestions: questions.length,
      timeLimitMinutes: 15,
    });
  } catch (error: any) {
    console.error('Get quick quiz error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const answers = body?.answers || {};
    console.log('Quick quiz submit - answers count:', Object.keys(answers).length);

    if (Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'No answers provided' },
        { status: 400 }
      );
    }

    let correctCount = 0;
    const feedback: any[] = [];

    // Process each answer
    for (const [questionId, studentAnswer] of Object.entries(answers)) {
      try {
        const question = await (prisma as any).question.findUnique({
          where: { id: questionId as string },
          select: { 
            id: true,
            correctAnswer: true, 
            explanation: true, 
            questionText: true 
          }
        });

        if (!question) {
          console.warn('Question not found:', questionId);
          continue;
        }

        const isCorrect = question.correctAnswer === studentAnswer;
        if (isCorrect) correctCount++;

        feedback.push({
          questionId,
          studentAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
        });
      } catch (qError: any) {
        console.error('Error processing question:', questionId, qError.message);
      }
    }

    if (feedback.length === 0) {
      return NextResponse.json(
        { error: 'No valid answers to process' },
        { status: 400 }
      );
    }

    const score = Math.round((correctCount / feedback.length) * 100);

    console.log('Quick quiz result - score:', score, 'correct:', correctCount, '/', feedback.length);

    return NextResponse.json({
      score,
      correctCount,
      totalQuestions: feedback.length,
      feedback,
    });
  } catch (error: any) {
    console.error('Submit quick quiz error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
