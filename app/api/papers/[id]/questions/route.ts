import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    const questions = await prisma.$queryRaw`
      SELECT id, "paperId", "chapterNumber", "questionText", "correctAnswer", explanation
      FROM "Question"
      WHERE "paperId" = ${paperId}::uuid
      ORDER BY "chapterNumber" ASC, id ASC
    `;

    return NextResponse.json({
      questions,
      count: (questions as any[]).length,
    });
  } catch (error: any) {
    console.error('Get questions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
