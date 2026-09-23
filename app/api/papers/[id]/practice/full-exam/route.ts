import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    console.log('Fetching full exam - paperId:', paperId);

    // Get paper config including exam format settings
    const paper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        durationMinutes: true,
        passingScore: true,
        totalQuestions: true,
      }
    });

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    // Get all questions for this paper
    const allQuestions = await (prisma as any).question.findMany({
      where: { paperId: paperId },
      select: {
        id: true,
        chapterNumber: true,
        questionText: true,
        correctAnswer: true,
        explanation: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
      orderBy: { chapterNumber: 'asc' }
    });

    console.log('Found total questions in bank:', allQuestions.length, 'Paper configured for:', paper.totalQuestions);

    // Randomly select the configured number of questions
    // If totalQuestions is 0 or not set, use all questions; otherwise use the configured amount
    const numToSelect = paper.totalQuestions > 0 
      ? Math.min(paper.totalQuestions, allQuestions.length) 
      : allQuestions.length;
    const selectedQuestions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, numToSelect);

    console.log('Selected questions for exam:', selectedQuestions.length, 'from', numToSelect, 'configured');

    // Return in exam format
    return NextResponse.json({
      examConfig: {
        totalTime: paper.durationMinutes,
        passingScore: paper.passingScore,
        totalQuestions: paper.totalQuestions > 0 ? paper.totalQuestions : undefined,
      },
      questions: selectedQuestions.map((q: any) => ({
        id: q.id,
        text: q.questionText,
        chapter: q.chapterNumber,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      })),
      totalQuestions: selectedQuestions.length,
    });
  } catch (error: any) {
    console.error('Get full exam error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse JSON
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { userId, answers } = body; // answers = { [questionId]: 'A' }
    const paperId = params.id;

    console.log('Submitting exam - userId:', userId, 'paperId:', paperId, 'answers:', Object.keys(answers || {}).length);

    if (!userId || !answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'userId and answers required' },
        { status: 400 }
      );
    }

    // Get paper config to know totalQuestions
    const paper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
      select: { 
        passingScore: true,
        totalQuestions: true,
      }
    });

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    // Get all questions to check answers
    const allQuestions = await (prisma as any).question.findMany({
      where: { paperId: paperId },
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

    console.log('Found total questions in bank:', allQuestions.length, 'Paper configured for:', paper.totalQuestions);

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this exam' },
        { status: 400 }
      );
    }

    // Calculate score - only score the answers that were submitted (up to totalQuestions)
    let correctCount = 0;
    const answerDetails: any[] = [];
    const submittedAnswerIds = Object.keys(answers);
    
    // Find the questions that match the submitted answers
    const answeredQuestions = allQuestions.filter(q => submittedAnswerIds.includes(q.id));

    for (const q of answeredQuestions) {
      const studentAnswer = answers[q.id];
      const isCorrect = studentAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;

      answerDetails.push({
        questionId: q.id,
        questionText: q.questionText,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      });
    }

    // Score is based on the number of questions answered (limited by paper's totalQuestions setting)
    const numAnswered = answeredQuestions.length;
    const totalQuestions = Math.min(numAnswered, paper.totalQuestions || numAnswered);
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passingScore = paper.passingScore || 75;
    const passed = score >= passingScore;

    console.log('Exam result - score:', score, 'passed:', passed);

    // Save exam attempt using raw SQL (examattempt is lowercase)
    let attemptId = '';
    try {
      console.log('Saving attempt - userId:', userId, 'paperId:', paperId, 'score:', score);
      attemptId = crypto.randomUUID();
      await prisma.$queryRaw`
        INSERT INTO examattempt (id, paperid, userid, startedat, submittedat, score, passed, createdat)
        VALUES (
          ${attemptId},
          ${paperId}::uuid,
          ${userId},
          NOW(),
          NOW(),
          ${score},
          ${passed},
          NOW()
        )
      `;
      console.log('Exam attempt saved with ID:', attemptId);
    } catch (insertError: any) {
      console.error('Error saving exam attempt:', insertError.message, insertError.code);
    }

    return NextResponse.json({
      attemptId,
      score,
      passed,
      correctCount,
      totalQuestions,
      passingScore,
      answers: answerDetails,
    });
  } catch (error: any) {
    console.error('Submit exam error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit exam' },
      { status: 500 }
    );
  }
}
