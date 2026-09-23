import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Expected CSV format (with header row):
// chapter,question,optionA,optionB,optionC,optionD,answer,explanation
// 1,"What is..?","Option A text","Option B text","Option C text","Option D text","A","Explanation here"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const paperId = params.id;

    console.log('Uploading questions for paper:', paperId);

    // Verify paper exists
    const paper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
      select: { id: true }
    });

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    // Read CSV file
    const text = await file.text();
    const lines = text.split('\n');
    const questions = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV (handle quoted fields)
      const parts = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim().replace(/^"(.*)"$/, '$1'));
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim().replace(/^"(.*)"$/, '$1'));

      if (parts.length < 4) continue;

      // Expected CSV format: chapter, question, optionA, optionB, optionC, optionD, answer, explanation
      const chapter = parts[0];
      const question = parts[1];
      const optionA = parts[2] || '';
      const optionB = parts[3] || '';
      const optionC = parts[4] || '';
      const optionD = parts[5] || '';
      const answer = parts[6];
      const explanation = parts[7] || '';

      if (!chapter || !question || !answer) continue;

      questions.push({
        paperId: paperId,
        chapterNumber: parseInt(chapter) || 1,
        questionText: question,
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD.trim(),
        correctAnswer: answer.toUpperCase().charAt(0),
        explanation: explanation.trim(),
      });
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions found in CSV' },
        { status: 400 }
      );
    }

    console.log('Parsed questions:', questions.length);

    // Delete existing questions for this paper
    await (prisma as any).question.deleteMany({
      where: { paperId: paperId }
    });

    // Bulk insert new questions using createMany
    let insertedCount = 0;
    try {
      const result = await (prisma as any).question.createMany({
        data: questions,
        skipDuplicates: false
      });
      insertedCount = result.count;
      console.log('Inserted questions with options:', insertedCount);
    } catch (e: any) {
      console.error('Bulk insert error (with options):', e.message);
      
      // Fallback: try without option columns if they don't exist
      if (e.message?.includes('optionA') || e.message?.includes('optionB') || e.message?.includes('optionC') || e.message?.includes('optionD')) {
        console.log('Option columns not available, retrying without them');
        
        // Remove option fields and retry
        const questionsWithoutOptions = questions.map(q => ({
          paperId: q.paperId,
          chapterNumber: q.chapterNumber,
          questionText: q.questionText,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        }));
        
        try {
          const retryResult = await (prisma as any).question.createMany({
            data: questionsWithoutOptions,
            skipDuplicates: false
          });
          insertedCount = retryResult.count;
          console.log('Inserted questions without options:', insertedCount);
        } catch (retryError: any) {
          console.error('Fallback insert error:', retryError.message);
          // Final fallback: insert one by one
          for (const q of questionsWithoutOptions) {
            try {
              await (prisma as any).question.create({
                data: q
              });
              insertedCount++;
            } catch (err) {
              console.error('Single insert error:', err);
            }
          }
        }
      } else {
        // Other error - try inserting one by one
        console.log('Retrying one by one');
        for (const q of questions) {
          try {
            await (prisma as any).question.create({
              data: q
            });
            insertedCount++;
          } catch (err: any) {
            console.error('Single insert error:', err.message);
            // If options are the issue, try without them
            if (err.message?.includes('option')) {
              try {
                await (prisma as any).question.create({
                  data: {
                    paperId: q.paperId,
                    chapterNumber: q.chapterNumber,
                    questionText: q.questionText,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                  }
                });
                insertedCount++;
              } catch (fallbackErr) {
                console.error('Fallback single insert error:', fallbackErr);
              }
            }
          }
        }
      }
    }

    // Update paper's total questions count
    await (prisma as any).paper.update({
      where: { id: paperId },
      data: { totalQuestions: insertedCount }
    });

    console.log('Upload complete - inserted:', insertedCount);

    return NextResponse.json({
      success: true,
      count: insertedCount,
      message: `${insertedCount} questions imported successfully`,
    });
  } catch (error: any) {
    console.error('Upload error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to upload questions' },
      { status: 500 }
    );
  }
}
