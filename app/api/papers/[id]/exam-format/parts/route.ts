import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { setPartWeights } from '@/lib/exam-part-weights';
import { parseChapterWeights } from '@/lib/chapter-weights';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { partName, chapterStart, chapterEnd, questionCount, passingScore, chapterWeights } = body;
    const paperId = params.id;

    if (!partName || !chapterStart || !chapterEnd || questionCount === undefined || passingScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the highest orderIndex
    const result = await prisma.$queryRaw`
      SELECT MAX("orderIndex") as "maxOrder"
      FROM "ExamPart"
      WHERE "paperId" = ${paperId}::uuid
    ` as any[];

    const maxOrder = result[0]?.maxOrder || 0;
    const newOrderIndex = maxOrder + 1;

    // Create new part
    const inserted = await prisma.$queryRaw`
      INSERT INTO "ExamPart" (id, "paperId", "partName", "chapterStart", "chapterEnd", "questionCount", "passingScore", "orderIndex", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${paperId}::uuid, ${partName}, ${chapterStart}, ${chapterEnd}, ${questionCount}, ${passingScore}, ${newOrderIndex}, NOW(), NOW())
      RETURNING id
    ` as any[];

    if (inserted?.[0]?.id) {
      await setPartWeights(String(inserted[0].id), parseChapterWeights(chapterWeights));
    }

    return NextResponse.json({
      success: true,
      message: 'Exam part added successfully',
    });
  } catch (error: any) {
    console.error('Add exam part error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add exam part' },
      { status: 500 }
    );
  }
}
