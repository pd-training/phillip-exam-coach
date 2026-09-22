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

    const questionId = body?.questionId;
    const answer = body?.answer;

    console.log('Quick quiz answer - questionId:', questionId, 'answer:', answer);

    if (!questionId || !answer) {
      return NextResponse.json(
        { error: 'questionId and answer required' },
        { status: 400 }
      );
    }

    // Fetch the question
    try {
      const question = await (prisma as any).question.findUnique({
        where: { id: questionId as string },
        select: {
          id: true,
          correctAnswer: true,
          explanation: true,
          questionText: true,
        }
      });

      if (!question) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }

      const isCorrect = question.correctAnswer === answer;

      console.log('Question check - correct:', isCorrect);

      return NextResponse.json({
        questionId,
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    } catch (qError: any) {
      console.error('Error fetching question:', qError.message);
      throw qError;
    }
  } catch (error: any) {
    console.error('Submit quick quiz error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
