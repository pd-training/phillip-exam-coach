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
    
    // Log part configuration
    if (examParts.length > 0) {
      console.log('Part configurations:');
      examParts.forEach((part, idx) => {
        console.log(`  Part ${idx + 1}: ${part.partName} - Chapters ${part.chapterStart}-${part.chapterEnd}, ${part.questionCount} questions, passing score ${part.passingScore}%`);
      });
    }

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

        // Get unique chapters in this part's questions
        const chaptersInPart = [...new Set(questionsInPartRange.map(q => q.chapterNumber))].sort((a, b) => Number(a) - Number(b));

        // Randomly select the configured number of questions for this part
        const numToSelect = Math.min(part.questionCount, questionsInPartRange.length);
        const partQuestions = questionsInPartRange
          .sort(() => Math.random() - 0.5)
          .slice(0, numToSelect);

        console.log(`Part "${part.partName}": Expected chapters ${part.chapterStart}-${part.chapterEnd}, found chapters [${chaptersInPart.join(', ')}], selecting ${numToSelect} from ${questionsInPartRange.length} available`);

        selectedQuestions.push(...partQuestions);
        
        questionsByPart.push({
          part: part.partName,
          partId: part.id,
          passingScore: part.passingScore,
          chapterStart: part.chapterStart,
          chapterEnd: part.chapterEnd,
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
      
      // Validate: log any questions that don't match their part's chapter range
      console.log('=== VALIDATION: Checking question-part chapter alignment ===');
      for (let i = 0; i < questionsByPart.length; i++) {
        const part = examParts[i];
        const partData = questionsByPart[i];
        const misaligned = partData.questions.filter((q: any) => 
          q.chapter < part.chapterStart || q.chapter > part.chapterEnd
        );
        if (misaligned.length > 0) {
          console.error(`❌ Part "${part.partName}" has ${misaligned.length} questions outside range ${part.chapterStart}-${part.chapterEnd}:`, 
            misaligned.map((q: any) => `Ch${q.chapter}`));
        } else {
          console.log(`✓ Part "${part.partName}" (Ch${part.chapterStart}-${part.chapterEnd}): All ${partData.questions.length} questions correctly aligned`);
        }
      }
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
      parts: examParts.map((part: any) => ({
        id: part.id,
        partName: part.partName,
        chapterStart: part.chapterStart,
        chapterEnd: part.chapterEnd,
        questionCount: part.questionCount,
        passingScore: part.passingScore,
        orderIndex: part.orderIndex,
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

    const { userId, answers, questionIds, timeTaken } = body; // questionIds = all question IDs presented in the exam
    const paperId = params.id;

    console.log('Submitting exam - userId:', userId, 'paperId:', paperId, 'answers:', Object.keys(answers || {}).length, 'questions presented:', questionIds?.length, 'timeTaken:', timeTaken);

    if (!userId || !answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'userId and answers required' },
        { status: 400 }
      );
    }

    // Get paper config and exam parts
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

    // Fetch exam parts if they exist
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

    // Get all questions with chapter info to check answers
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

    // Calculate part-wise scores if parts exist
    let partScores: any[] = [];
    if (examParts && examParts.length > 0) {
      console.log('Calculating scores for', examParts.length, 'parts');
      
      // For each part, filter questions by chapter range
      for (const part of examParts) {
        // Find all questions presented in this part's chapter range
        const questionsInPart = questionIds && questionIds.length > 0
          ? allQuestions.filter(q => 
              questionIds.includes(q.id) &&
              q.chapterNumber >= part.chapterStart && 
              q.chapterNumber <= part.chapterEnd
            )
          : allQuestions.filter(q => 
              q.chapterNumber >= part.chapterStart && 
              q.chapterNumber <= part.chapterEnd
            );

        const totalQuestionsInPart = questionsInPart.length;
        
        // Count correct answers from questions in this part
        let partCorrectCount = 0;
        for (const q of questionsInPart) {
          const studentAnswer = answers[q.id];
          if (studentAnswer && studentAnswer === q.correctAnswer) {
            partCorrectCount++;
          }
        }

        // Score based on ALL questions in this part (not just answered)
        const partScore = totalQuestionsInPart > 0 
          ? Math.round((partCorrectCount / totalQuestionsInPart) * 100)
          : 0;
        const partPassed = partScore >= part.passingScore;

        partScores.push({
          partName: part.partName,
          partId: part.id,
          score: partScore,
          passed: partPassed,
          passingScore: part.passingScore,
          correct: partCorrectCount,
          total: totalQuestionsInPart,  // Total questions presented in this part
        });

        console.log(`Part ${part.partName}: ${partCorrectCount}/${totalQuestionsInPart} = ${partScore}%`);
      }
    }

    // Score is based on TOTAL questions in the paper, regardless of how many were answered
    // Unanswered questions count as 0 (incorrect)
    const totalQuestions = paper.totalQuestions || allQuestions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    console.log(`Score calculation: ${correctCount} correct out of ${totalQuestions} total = ${score}%`);
    const passingScore = paper.passingScore || 75;
    
    // If parts exist, overall pass is based on passing all parts. Otherwise use overall score.
    let passed = false;
    if (examParts && examParts.length > 0) {
      // Must pass ALL parts
      passed = partScores.length > 0 && partScores.every(p => p.passed);
      console.log('Part-based passing:', passed, 'All parts passed:', partScores.every(p => p.passed));
    } else {
      // Use overall score
      passed = score >= passingScore;
    }

    console.log('Exam result - overall score:', score, 'passed:', passed);

    // Save exam attempt using raw SQL (examattempt is lowercase)
    let attemptId = '';
    try {
      console.log('Saving attempt - userId:', userId, 'paperId:', paperId, 'score:', score, 'timeTaken:', timeTaken);
      attemptId = crypto.randomUUID();
      const now = new Date();
      const startTime = new Date(now.getTime() - (timeTaken || 0) * 1000); // Subtract timeTaken seconds
      
      // Store answers and questionIds as JSON
      const answersJson = JSON.stringify(answers);
      const questionIdsJson = JSON.stringify(questionIds || []);
      const partScoresJson = partScores.length > 0 ? JSON.stringify(partScores) : null;
      
      // Try to insert with answers, partScores, and questionIds columns
      try {
        await prisma.$queryRaw`
          INSERT INTO examattempt (id, paperid, userid, startedat, submittedat, score, passed, answers, "questionIds", "partScores", createdat)
          VALUES (
            ${attemptId},
            ${paperId}::uuid,
            ${userId},
            ${startTime},
            ${now},
            ${score},
            ${passed},
            ${answersJson}::jsonb,
            ${questionIdsJson}::jsonb,
            ${partScoresJson}::jsonb,
            NOW()
          )
        `;
        console.log('Exam attempt saved with ID:', attemptId, '(with answers, questionIds, and partScores)');
      } catch (insertWithScoresError: any) {
        // If questionIds column doesn't exist, try without it
        const errorMsg = insertWithScoresError.message || '';
        if (errorMsg.includes('questionIds') || (errorMsg.includes('column') && errorMsg.includes('does not exist'))) {
          console.log('questionIds column does not exist, saving without it');
          try {
            await prisma.$queryRaw`
              INSERT INTO examattempt (id, paperid, userid, startedat, submittedat, score, passed, answers, "partScores", createdat)
              VALUES (
                ${attemptId},
                ${paperId}::uuid,
                ${userId},
                ${startTime},
                ${now},
                ${score},
                ${passed},
                ${answersJson}::jsonb,
                ${partScoresJson}::jsonb,
                NOW()
              )
            `;
            console.log('Exam attempt saved with ID:', attemptId, '(with answers and partScores)');
          } catch (insertWithPartScoresError: any) {
            // Try without partScores
            const partScoresErrorMsg = insertWithPartScoresError.message || '';
            if (partScoresErrorMsg.includes('partScores')) {
              console.log('partScores column does not exist, saving without it');
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
                console.log('Exam attempt saved with ID:', attemptId, '(with answers only)');
              } catch (insertWithAnswersError: any) {
                // If answers column doesn't exist either, save without it
                const answerErrorMsg = insertWithAnswersError.message || '';
                if (answerErrorMsg.includes('column') && answerErrorMsg.includes('answers')) {
                  console.log('No optional columns exist, saving without them');
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
                  console.log('Exam attempt saved with ID:', attemptId, '(without optional columns)');
                } else {
                  throw insertWithAnswersError;
                }
              }
            } else {
              throw insertWithPartScoresError;
            }
          }
        } else {
          throw insertWithScoresError;
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
      partScores: partScores.length > 0 ? partScores : null,
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
