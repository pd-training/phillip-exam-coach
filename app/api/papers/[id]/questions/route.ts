import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    const questions = await prisma.question.findMany({
      where: { paperId: paperId as any },
      orderBy: [{ chapterNumber: 'asc' }],
    });

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
