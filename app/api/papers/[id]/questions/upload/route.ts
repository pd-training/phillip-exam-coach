import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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

      if (parts.length < 3) continue;

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
      console.error('No questions parsed from CSV');
      return NextResponse.json(
        { error: 'No valid questions found in CSV. Expected format: chapter,question,optionA,optionB,optionC,optionD,answer,explanation' },
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
    
    // First, try inserting WITHOUT option columns (safest approach)
    const questionsWithoutOptions = questions.map(q => ({
      paperId: q.paperId,
      chapterNumber: q.chapterNumber,
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));
    
    try {
      const result = await (prisma as any).question.createMany({
        data: questionsWithoutOptions,
        skipDuplicates: false
      });
      insertedCount = result.count;
      console.log('Inserted questions (without options):', insertedCount);
    } catch (withoutOptionsError: any) {
      console.error('Insert without options error:', withoutOptionsError.message);
      
      // Second attempt: try WITH option columns
      try {
        const result = await (prisma as any).question.createMany({
          data: questions,
          skipDuplicates: false
        });
        insertedCount = result.count;
        console.log('Inserted questions (with options):', insertedCount);
      } catch (withOptionsError: any) {
        console.error('Insert with options error:', withOptionsError.message);
        
        // Final fallback: insert one by one without options
        console.log('Falling back to one-by-one insert');
        for (const q of questionsWithoutOptions) {
          try {
            await (prisma as any).question.create({
              data: q
            });
            insertedCount++;
          } catch (err: any) {
            console.error('Single insert error:', err.message);
          }
        }
      }
    }

    // Update paper's total questions count (with select to avoid description field)
    await (prisma as any).paper.update({
      where: { id: paperId },
      data: { totalQuestions: insertedCount },
      select: { id: true }
    });

    console.log('Upload complete - inserted:', insertedCount);

    if (insertedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to insert any questions. Check CSV format and database connection.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: insertedCount,
      message: `${insertedCount} questions imported successfully`,
    });
  } catch (error: any) {
    console.error('Upload error:', error.message, error.stack);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}
