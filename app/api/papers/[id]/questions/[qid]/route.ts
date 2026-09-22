import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const body = await request.json();
    const { questionText, correctAnswer, chapterNumber, explanation, optionA, optionB, optionC, optionD } = body;

    console.log('Updating question:', params.qid);

    await (prisma as any).question.update({
      where: { id: params.qid },
      data: {
        questionText,
        correctAnswer: correctAnswer?.toUpperCase().charAt(0),
        chapterNumber,
        explanation,
        optionA,
        optionB,
        optionC,
        optionD,
      }
    });

    const question = await (prisma as any).question.findUnique({
      where: { id: params.qid },
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
      }
    });

    return NextResponse.json({ question });
  } catch (error: any) {
    console.error('Update error:', error.message);
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

    console.log('Deleting question:', params.qid);

    // Delete the question
    await (prisma as any).question.delete({
      where: { id: params.qid }
    });

    // Update paper's total questions count
    const count = await (prisma as any).question.count({
      where: { paperId: paperId }
    });

    await (prisma as any).paper.update({
      where: { id: paperId },
      data: { totalQuestions: count }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to delete question' },
      { status: 500 }
    );
  }
}
