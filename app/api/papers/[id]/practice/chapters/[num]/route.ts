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

    // Get all questions for this chapter
    const questions = await prisma.$queryRaw`
      SELECT 
        id, 
        "questionText", 
        "correctAnswer", 
        explanation
      FROM "Question"
      WHERE "paperId" = ${paperId}::uuid 
      AND "chapterNumber" = ${chapterNumber}
      ORDER BY id ASC
    ` as any[];

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
    console.error('Get chapter questions error:', error);
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

    // Get the question with correct answer and explanation
    const questionResult = await prisma.$queryRaw`
      SELECT 
        id, 
        "questionText", 
        "correctAnswer", 
        explanation
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
    console.error('Chapter practice answer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process answer' },
      { status: 500 }
    );
  }
}
