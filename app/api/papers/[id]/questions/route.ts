import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    console.log('Fetching all questions for paper:', paperId);

    let questions: any[] = [];

    // Try fetching with option columns first
    try {
      questions = await (prisma as any).question.findMany({
        where: { paperId: paperId },
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
        },
        orderBy: [{ chapterNumber: 'asc' }, { id: 'asc' }]
      });
    } catch (e: any) {
      console.log('Warning: Could not fetch questions with option columns, retrying without them:', e.message);
      
      // Fallback: fetch without option columns
      try {
        questions = await (prisma as any).question.findMany({
          where: { paperId: paperId },
          select: {
            id: true,
            paperId: true,
            chapterNumber: true,
            questionText: true,
            correctAnswer: true,
            explanation: true,
          },
          orderBy: [{ chapterNumber: 'asc' }, { id: 'asc' }]
        });
        
        console.log('Fallback query succeeded, found questions without options:', questions.length);
      } catch (fallbackError: any) {
        console.error('Fallback query also failed:', fallbackError.message);
        throw fallbackError;
      }
    }

    console.log('Found questions:', questions.length);

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
