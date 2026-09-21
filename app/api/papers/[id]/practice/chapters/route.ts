import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    // Get all unique chapters from questions
    const chapters = await prisma.$queryRaw`
      SELECT DISTINCT "chapterNumber"
      FROM "Question"
      WHERE "paperId" = ${paperId}::uuid
      ORDER BY "chapterNumber" ASC
    ` as any[];

    // Get question count per chapter
    const chaptersWithCounts = await Promise.all(
      chapters.map(async (ch: any) => {
        const countResult = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM "Question"
          WHERE "paperId" = ${paperId}::uuid 
          AND "chapterNumber" = ${ch.chapterNumber}
        ` as any[];

        return {
          number: ch.chapterNumber,
          questionCount: countResult[0]?.count || 0,
          title: `Chapter ${ch.chapterNumber}`,
        };
      })
    );

    return NextResponse.json({
      chapters: chaptersWithCounts,
    });
  } catch (error: any) {
    console.error('Get chapters error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}
