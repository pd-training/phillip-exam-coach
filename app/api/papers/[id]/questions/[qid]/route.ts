import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const body = await request.json();
    const { questionText, correctAnswer, chapterNumber, explanation } = body;

    await prisma.$queryRaw`
      UPDATE "Question"
      SET "questionText" = ${questionText},
          "correctAnswer" = ${correctAnswer?.toUpperCase().charAt(0)},
          "chapterNumber" = ${chapterNumber},
          explanation = ${explanation},
          "updatedAt" = NOW()
      WHERE id = ${params.qid}::uuid
    `;

    const result = await prisma.$queryRaw`
      SELECT id, "paperId", "chapterNumber", "questionText", "correctAnswer", explanation
      FROM "Question"
      WHERE id = ${params.qid}::uuid
    ` as any[];

    return NextResponse.json({ question: result?.[0] });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const paperId = params.id;

    await prisma.$queryRaw`
      DELETE FROM "Question"
      WHERE id = ${params.qid}::uuid
    `;

    // Update paper's total questions count
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Question"
      WHERE "paperId" = ${paperId}::uuid
    ` as any[];

    const count = countResult?.[0]?.count || 0;

    await prisma.$queryRaw`
      UPDATE "Paper"
      SET "totalQuestions" = ${count}
      WHERE id = ${paperId}::uuid
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete question' },
      { status: 500 }
    );
  }
}
