import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, qid } = params;

    if (!id || !qid) {
      return NextResponse.json({ error: 'Paper ID and Question ID are required' }, { status: 400 });
    }

    const body = await request.json();
    const { questionText, correctAnswer, chapterNumber, explanation, optionA, optionB, optionC, optionD } = body;

    // Validate required fields
    if (!questionText || !questionText.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    if (!correctAnswer || !['A', 'B', 'C', 'D'].includes(correctAnswer.toUpperCase())) {
      return NextResponse.json({ error: 'Valid correct answer (A-D) is required' }, { status: 400 });
    }

    if (isNaN(chapterNumber)) {
      return NextResponse.json({ error: 'Valid chapter number is required' }, { status: 400 });
    }

    console.log('Updating question:', qid, 'in paper:', id);

    // Verify question exists
    const existingQuestion = await (prisma as any).question.findUnique({
      where: { id: qid },
    });

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    if (existingQuestion.paperId !== id) {
      return NextResponse.json({ error: 'Question does not belong to this paper' }, { status: 403 });
    }

    await (prisma as any).question.update({
      where: { id: qid },
      data: {
        questionText: questionText.trim(),
        correctAnswer: correctAnswer?.toUpperCase().charAt(0),
        chapterNumber: parseInt(chapterNumber),
        explanation: explanation?.trim() || '',
        optionA: optionA?.trim() || '',
        optionB: optionB?.trim() || '',
        optionC: optionC?.trim() || '',
        optionD: optionD?.trim() || '',
      }
    });

    const question = await (prisma as any).question.findUnique({
      where: { id: qid },
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

    console.log('Question updated successfully:', question.id);

    return NextResponse.json({ 
      question,
      message: 'Question updated successfully'
    });
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
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, qid } = params;

    if (!id || !qid) {
      return NextResponse.json({ error: 'Paper ID and Question ID are required' }, { status: 400 });
    }

    console.log('Deleting question:', qid, 'from paper:', id);

    // Verify question exists and belongs to paper
    const question = await (prisma as any).question.findUnique({
      where: { id: qid },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    if (question.paperId !== id) {
      return NextResponse.json({ error: 'Question does not belong to this paper' }, { status: 403 });
    }

    // Delete the question
    await (prisma as any).question.delete({
      where: { id: qid }
    });

    // Update paper's total questions count
    const count = await (prisma as any).question.count({
      where: { paperId: id }
    });

    await (prisma as any).paper.update({
      where: { id },
      data: { totalQuestions: count }
    });

    console.log('Question deleted successfully:', qid);

    return NextResponse.json({ 
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete question' },
      { status: 500 }
    );
  }
}
