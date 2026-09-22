import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    console.log('Fetching chapters for paper:', paperId);

    // Get all questions grouped by chapter
    const allQuestions = await (prisma as any).question.findMany({
      where: { paperId: paperId },
      select: {
        chapterNumber: true,
      },
      orderBy: { chapterNumber: 'asc' }
    });

    // Group by chapter and count
    const chapterMap = new Map<number, number>();
    for (const q of allQuestions) {
      const count = (chapterMap.get(q.chapterNumber) || 0) + 1;
      chapterMap.set(q.chapterNumber, count);
    }

    const chapters = Array.from(chapterMap.entries()).map(([number, count]) => ({
      number,
      questionCount: count,
      title: `Chapter ${number}`,
    }));

    console.log('Found chapters:', chapters.length);

    return NextResponse.json({
      chapters: chapters,
    });
  } catch (error: any) {
    console.error('Get chapters error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}
