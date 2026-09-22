import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; num: string } }
) {
  try {
    const paperId = params.id;
    const chapterNumber = parseInt(params.num);

    console.log('Fetching chapter questions - paperId:', paperId, 'chapter:', chapterNumber);

    // Get all questions for this chapter
    const questions = await (prisma as any).question.findMany({
      where: {
        paperId: paperId,
        chapterNumber: chapterNumber
      },
      select: {
        id: true,
        questionText: true,
        correctAnswer: true,
        explanation: true,
      },
      orderBy: { id: 'asc' }
    });

    console.log('Found questions:', questions.length);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this chapter' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      chapter: chapterNumber,
      questions: questions.map((q: any) => ({
        id: q.id,
        text: q.questionText,
        // Don't send correctAnswer/explanation until answered
      })),
      totalQuestions: questions.length,
    });
  } catch (error: any) {
    console.error('Get chapter questions error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; num: string } }
) {
  try {
    const body = await request.json();
    const { questionId, answer } = body;

    console.log('Submitting answer for question:', questionId);

    // Get the question with correct answer and explanation
    const question = await (prisma as any).question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        questionText: true,
        correctAnswer: true,
        explanation: true,
      }
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const isCorrect = answer === question.correctAnswer;

    return NextResponse.json({
      questionId,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
  } catch (error: any) {
    console.error('Submit chapter answer error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
