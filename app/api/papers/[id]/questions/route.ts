import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    console.log('Fetching all questions for paper:', paperId);

    const questions = await (prisma as any).question.findMany({
      where: { paperId: paperId },
      select: {
        id: true,
        paperId: true,
        chapterNumber: true,
        questionText: true,
        correctAnswer: true,
        explanation: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
      orderBy: [{ chapterNumber: 'asc' }, { id: 'asc' }]
    });

    console.log('Found questions:', questions.length);

    return NextResponse.json({
      questions,
      count: questions.length,
    });
  } catch (error: any) {
    console.error('Get questions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
