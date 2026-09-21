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

    const updated = await prisma.question.update({
      where: { id: params.qid as any },
      data: {
        questionText,
        correctAnswer: correctAnswer?.toUpperCase().charAt(0),
        chapterNumber,
        explanation,
      },
    });

    return NextResponse.json({ question: updated });
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

    await prisma.question.delete({
      where: { id: params.qid as any },
    });

    // Update paper's total questions count
    const count = await prisma.question.count({
      where: { paperId: paperId as any },
    });

    await prisma.paper.update({
      where: { id: paperId as any },
      data: { totalQuestions: count },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete question' },
      { status: 500 }
    );
  }
}
