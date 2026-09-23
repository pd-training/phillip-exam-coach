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
        title: true,
        durationMinutes: true,
        passingScore: true,
        totalQuestions: true,
      }
    });

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    // Check if this paper has exam parts
    const examParts = await (prisma as any).examPart.findMany({
      where: { paperId: paperId },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        partName: true,
        chapterStart: true,
        chapterEnd: true,
        questionCount: true,
        passingScore: true,
        orderIndex: true,
      }
    });

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
    console.log('Exam parts found:', examParts.length);

    let selectedQuestions: any[] = [];
    let questionsByPart: any[] = [];

    // If exam parts are defined, use them to structure the exam
    if (examParts && examParts.length > 0) {
      console.log('Using exam parts structure');
      
      for (const part of examParts) {
        // Filter questions in the chapter range for this part
        const questionsInPartRange = allQuestions.filter(
          q => q.chapterNumber >= part.chapterStart && q.chapterNumber <= part.chapterEnd
        );

        // Randomly select the configured number of questions for this part
        const numToSelect = Math.min(part.questionCount, questionsInPartRange.length);
        const partQuestions = questionsInPartRange
          .sort(() => Math.random() - 0.5)
          .slice(0, numToSelect);

        selectedQuestions.push(...partQuestions);
        
        questionsByPart.push({
          part: part.partName,
          partId: part.id,
          passingScore: part.passingScore,
          questions: partQuestions.map((q: any) => ({
            id: q.id,
            text: q.questionText,
            chapter: q.chapterNumber,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
          })),
        });
      }
      
      console.log('Selected questions for exam with parts:', selectedQuestions.length);
    } else {
      // No parts defined - use standard selection
      console.log('No exam parts defined, using standard selection');
      const numToSelect = paper.totalQuestions > 0 
        ? Math.min(paper.totalQuestions, allQuestions.length) 
        : allQuestions.length;
      selectedQuestions = allQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, numToSelect);

      console.log('Selected questions for exam:', selectedQuestions.length, 'from', numToSelect, 'configured');
    }

    // Return in exam format
    return NextResponse.json({
      examConfig: {
        title: paper.title,
        totalTime: paper.durationMinutes,
        passingScore: paper.passingScore,
        totalQuestions: paper.totalQuestions > 0 ? paper.totalQuestions : undefined,
        hasParts: examParts.length > 0,
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
      questionsByPart: questionsByPart,
      parts: examParts,
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

    const { userId, answers, timeTaken } = body; // answers = { [questionId]: 'A' }, timeTaken in seconds
    const paperId = params.id;

    console.log('Submitting exam - userId:', userId, 'paperId:', paperId, 'answers:', Object.keys(answers || {}).length, 'timeTaken:', timeTaken);

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
      console.log('Saving attempt - userId:', userId, 'paperId:', paperId, 'score:', score, 'timeTaken:', timeTaken);
      attemptId = crypto.randomUUID();
      const now = new Date();
      const startTime = new Date(now.getTime() - (timeTaken || 0) * 1000); // Subtract timeTaken seconds
      
      // Store answers as JSON
      const answersJson = JSON.stringify(answers);
      
      // Try to insert with answers column - if it fails, insert without it
      try {
        await prisma.$queryRaw`
          INSERT INTO examattempt (id, paperid, userid, startedat, submittedat, score, passed, answers, createdat)
          VALUES (
            ${attemptId},
            ${paperId}::uuid,
            ${userId},
            ${startTime},
            ${now},
            ${score},
            ${passed},
            ${answersJson}::jsonb,
            NOW()
          )
        `;
        console.log('Exam attempt saved with ID:', attemptId, '(with answers)');
      } catch (insertWithAnswersError: any) {
        // If answers column doesn't exist, try without it
        const errorMsg = insertWithAnswersError.message || '';
        if (errorMsg.includes('column') && errorMsg.includes('answers')) {
          console.log('answers column does not exist, saving without it');
          await prisma.$queryRaw`
            INSERT INTO examattempt (id, paperid, userid, startedat, submittedat, score, passed, createdat)
            VALUES (
              ${attemptId},
              ${paperId}::uuid,
              ${userId},
              ${startTime},
              ${now},
              ${score},
              ${passed},
              NOW()
            )
          `;
          console.log('Exam attempt saved with ID:', attemptId, '(without answers - migration pending)');
        } else {
          throw insertWithAnswersError;
        }
      }
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
