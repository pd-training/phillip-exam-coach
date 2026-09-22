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
    const { answers } = await request.json();
    // answers = { [questionId]: 'A' }

    let correctCount = 0;
    const feedback: any[] = [];

    for (const [questionId, studentAnswer] of Object.entries(answers)) {
      const question = await (prisma as any).question.findUnique({
        where: { id: questionId },
        select: { correctAnswer: true, explanation: true }
      });

      const isCorrect = question?.correctAnswer === studentAnswer;
      if (isCorrect) correctCount++;

      feedback.push({
        questionId,
        studentAnswer,
        correctAnswer: question?.correctAnswer,
        isCorrect,
        explanation: question?.explanation,
      });
    }

    const score = Math.round((correctCount / feedback.length) * 100);

    return NextResponse.json({
      score,
      correctCount,
      totalQuestions: feedback.length,
      feedback,
    });
  } catch (error: any) {
    console.error('Submit quick quiz error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
