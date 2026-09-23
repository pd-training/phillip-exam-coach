import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; num: string } }
) {
  try {
    const paperId = params.id;
    const chapterNumber = parseInt(params.num);

    console.log('Fetching chapter questions - paperId:', paperId, 'chapter:', chapterNumber);

    // Get all questions for this chapter
    const allQuestions = await (prisma as any).question.findMany({
      where: {
        paperId: paperId,
        chapterNumber: chapterNumber
      },
      select: {
        id: true,
        questionText: true,
        correctAnswer: true,
        explanation: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
    });

    console.log('Found total questions in chapter:', allQuestions.length);

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this chapter' },
        { status: 404 }
      );
    }

    // Shuffle and limit to 10 questions per attempt
    const shuffled = shuffleArray(allQuestions);
    const selectedQuestions = shuffled.slice(0, 10);

    return NextResponse.json({
      chapter: chapterNumber,
      questions: selectedQuestions.map((q: any) => ({
        id: q.id,
        text: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        // Don't send correctAnswer/explanation until answered
      })),
      totalQuestionsInChapter: allQuestions.length,
      questionsThisAttempt: selectedQuestions.length,
    });
  } catch (error: any) {
    console.error('Get chapter questions error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; num: string } }
) {
  try {
    const body = await request.json();
    const { questionId, answer } = body;

    console.log('Submitting answer for question:', questionId);

    // Get the question with correct answer and explanation
    const question = await (prisma as any).question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        questionText: true,
        correctAnswer: true,
        explanation: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      }
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const isCorrect = answer === question.correctAnswer;

    return NextResponse.json({
      questionId,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      studentAnswer: answer,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
    });
  } catch (error: any) {
    console.error('Submit chapter answer error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
