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

    // Get paper title
    const paper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
      select: { title: true }
    });

    // Get all chapters with their titles
    const chapters = await (prisma as any).chapter.findMany({
      where: { paperId: paperId },
      select: {
        number: true,
        title: true,
      },
      orderBy: { number: 'asc' }
    });

    console.log('Found chapters:', chapters.length);

    return NextResponse.json({
      paperTitle: paper?.title || 'Practice Chapter',
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
