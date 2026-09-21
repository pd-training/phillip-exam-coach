import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    // Use raw SQL to fetch paper
    const paperResult = await prisma.$queryRaw`
      SELECT "totalTime" FROM "Paper" WHERE id = ${paperId}::uuid
    ` as any[];

    if (!paperResult || paperResult.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = paperResult[0];

    // Fetch exam parts
    const parts = await prisma.$queryRaw`
      SELECT id, "partName", "chapterStart", "chapterEnd", "questionCount", "passingScore", "orderIndex"
      FROM "ExamPart"
      WHERE "paperId" = ${paperId}::uuid
      ORDER BY "orderIndex" ASC
    `;

    return NextResponse.json({
      examFormat: {
        totalTime: paper.totalTime || 120,
        parts: parts || [],
      },
    });
  } catch (error: any) {
    console.error('Get exam format error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exam format' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { totalTime, parts } = body;
    const paperId = params.id;

    // Update paper totalTime
    await prisma.$queryRaw`
      UPDATE "Paper"
      SET "totalTime" = ${totalTime}
      WHERE id = ${paperId}::uuid
    `;

    // Delete existing parts
    await prisma.$queryRaw`
      DELETE FROM "ExamPart"
      WHERE "paperId" = ${paperId}::uuid
    `;

    // Create new parts
    for (const part of parts) {
      await prisma.$queryRaw`
        INSERT INTO "ExamPart" (id, "paperId", "partName", "chapterStart", "chapterEnd", "questionCount", "passingScore", "orderIndex", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${paperId}::uuid, ${part.partName}, ${part.chapterStart}, ${part.chapterEnd}, ${part.questionCount}, ${part.passingScore}, ${part.orderIndex}, NOW(), NOW())
      `;
    }

    return NextResponse.json({
      success: true,
      partsCreated: parts.length,
    });
  } catch (error: any) {
    console.error('Save exam format error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save exam format' },
      { status: 500 }
    );
  }
}
