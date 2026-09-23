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

    // Read CSV file and handle both Windows (\r\n) and Unix (\n) line endings
    let text = await file.text();
    // Normalize line endings to Unix format
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    const lines = text.split('\n');
    const questions = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // CSV parsing: handle quoted fields with commas inside
      const parts = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          // Toggle quote state, but don't add the quote to current
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          // Unquoted comma = field separator
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      // Don't forget the last field
      parts.push(current.trim());

      // Support two CSV formats:
      // Format 1 (8 columns): chapter, question, optionA, optionB, optionC, optionD, answer, explanation
      // Format 2 (4 columns): chapter, question, answer, explanation (generates placeholder options)
      
      const chapter = parts[0] || '';
      const question = parts[1] || '';
      
      let optionA: string;
      let optionB: string;
      let optionC: string;
      let optionD: string;
      let answer: string;
      let explanation: string;

      if (parts.length >= 8) {
        // 8-column format with explicit options (quotes already removed during parsing)
        optionA = parts[2] || '';
        optionB = parts[3] || '';
        optionC = parts[4] || '';
        optionD = parts[5] || '';
        answer = parts[6] || '';
        explanation = parts[7] || '';
      } else if (parts.length >= 4) {
        // 4-column format without options — generate placeholders
        answer = parts[2] || '';
        explanation = parts[3] || '';
        
        // Generate placeholder options based on correct answer
        optionA = answer === 'A' ? '[Correct Answer]' : 'Option A';
        optionB = answer === 'B' ? '[Correct Answer]' : 'Option B';
        optionC = answer === 'C' ? '[Correct Answer]' : 'Option C';
        optionD = answer === 'D' ? '[Correct Answer]' : 'Option D';
      } else {
        continue; // Not enough columns
      }

      // Validate required fields
      if (!chapter || !question || !optionA || !optionB || !optionC || !optionD || !answer) {
        continue;
      }

      // Validate answer is A-D
      if (!['A', 'B', 'C', 'D'].includes(answer.toUpperCase())) {
        continue;
      }

      questions.push({
        paperId: paperId,
        chapterNumber: Math.max(1, parseInt(chapter) || 1),
        questionText: question,
        optionA: optionA,
        optionB: optionB,
        optionC: optionC,
        optionD: optionD,
        correctAnswer: answer.toUpperCase().charAt(0),
        explanation: explanation || '',
      });
    }

    if (questions.length === 0) {
      console.error('No questions parsed from CSV');
      return NextResponse.json(
        { error: 'No valid questions found in CSV. Supported formats: (1) 8-column: chapter,question,optionA,optionB,optionC,optionD,answer,explanation OR (2) 4-column: chapter,question,answer,explanation (options auto-generated)' },
        { status: 400 }
      );
    }

    console.log('Parsed questions:', questions.length);

    // Log first question to debug
    console.log('First question sample:', JSON.stringify(questions[0], null, 2));

    // Delete existing questions for this paper
    console.log('Deleting existing questions for paper:', paperId);
    const deleteResult = await (prisma as any).question.deleteMany({
      where: { paperId: paperId }
    });
    console.log('Deleted questions:', deleteResult.count);

    // Bulk insert new questions WITH option columns (required by schema)
    let insertedCount = 0;
    
    console.log('Attempting bulk insert with', questions.length, 'questions...');
    console.log('Sample question:', JSON.stringify(questions[0], null, 2));
    
    try {
      const result = await (prisma as any).question.createMany({
        data: questions,
        skipDuplicates: false
      });
      insertedCount = result.count;
      console.log('✅ Bulk inserted questions:', insertedCount);
    } catch (bulkError: any) {
      console.error('❌ Bulk insert error:', bulkError.message);
      console.error('Error code:', bulkError.code);
      console.error('Full error:', JSON.stringify(bulkError, null, 2));
      
      // Fallback: insert one by one
      console.log('Falling back to one-by-one insert with', questions.length, 'questions...');
      for (let idx = 0; idx < questions.length; idx++) {
        const q = questions[idx];
        try {
          await (prisma as any).question.create({
            data: q
          });
          insertedCount++;
          if (idx < 3) {
            console.log(`✅ Question ${idx + 1} inserted`);
          }
        } catch (err: any) {
          if (idx < 3) {
            console.error(`❌ Question ${idx + 1} error:`, err.message);
            console.error('Data was:', JSON.stringify(q, null, 2));
          }
        }
      }
      if (insertedCount > 0) {
        console.log('✅ One-by-one insert complete:', insertedCount, 'questions inserted');
      } else {
        console.error('❌ No questions inserted in fallback');
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
      console.error('❌ CRITICAL: No questions were inserted despite', questions.length, 'valid questions in CSV');
      return NextResponse.json(
        { 
          error: 'Failed to insert any questions. The CSV format may be incorrect or there is a database error. Supported formats: (1) 8-column with explicit options or (2) 4-column with auto-generated placeholder options. Check server logs for details.' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Upload succeeded - inserted:', insertedCount, 'questions');
    
    return NextResponse.json({
      success: true,
      count: insertedCount,
      message: `${insertedCount} questions imported successfully`,
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}
