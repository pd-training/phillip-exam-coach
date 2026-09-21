import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    // Get 15 random questions
    const questions = await prisma.$queryRaw`
      SELECT 
        id, 
        "chapterNumber", 
        "questionText", 
        "correctAnswer", 
        explanation
      FROM "Question"
      WHERE "paperId" = ${paperId}::uuid
      ORDER BY RANDOM()
      LIMIT 15
    ` as any[];

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      questions: questions.map((q: any) => ({
        id: q.id,
        text: q.questionText,
        chapter: q.chapterNumber,
        // For quick quiz, we'll send feedback immediately after each answer
      })),
      totalQuestions: questions.length,
      timeLimitMinutes: 15,
    });
  } catch (error: any) {
    console.error('Get quick quiz error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quiz' },
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
    const { questionId, answer } = body;

    // Get the question with correct answer and explanation
    const questionResult = await prisma.$queryRaw`
      SELECT 
        id, 
        "questionText", 
        "correctAnswer", 
        explanation,
        "chapterNumber"
      FROM "Question"
      WHERE id = ${questionId}::uuid
    ` as any[];

    if (!questionResult || questionResult.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const question = questionResult[0];
    const isCorrect = answer === question.correctAnswer;

    // Return immediate feedback
    return NextResponse.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      studentAnswer: answer,
    });
  } catch (error: any) {
    console.error('Quick quiz answer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process answer' },
      { status: 500 }
    );
  }
}
