import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // Verify paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId as any },
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

      const [chapter, question, answer, explanation] = parts;

      if (!chapter || !question || !answer) continue;

      questions.push({
        paperId: paperId as any,
        chapterNumber: parseInt(chapter) || 1,
        questionText: question,
        correctAnswer: answer.toUpperCase().charAt(0),
        explanation: explanation || '',
      });
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions found in CSV' },
        { status: 400 }
      );
    }

    // Delete existing questions for this paper
    await prisma.question.deleteMany({
      where: { paperId: paperId as any },
    });

    // Bulk insert new questions
    const created = await prisma.question.createMany({
      data: questions,
    });

    // Update paper's total questions count
    await prisma.paper.update({
      where: { id: paperId as any },
      data: { totalQuestions: created.count },
    });

    return NextResponse.json({
      success: true,
      count: created.count,
      message: `${created.count} questions imported successfully`,
    });
  } catch (error: any) {
    console.error('Upload error:', error);

    // Better error messages
    if (error.message?.includes('relation "Question" does not exist')) {
      return NextResponse.json(
        {
          error: 'Database tables not initialized. Please wait for deployment to complete and try again.',
          details: 'The Question table is being created during deployment.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
