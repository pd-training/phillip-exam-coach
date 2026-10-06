import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Recalculate and sync paper metadata (totalQuestions) from exam parts
 * This helper endpoint can fix papers where metadata got out of sync
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin only' },
        { status: 403 }
      );
    }

    const { paperId } = await request.json();

    if (!paperId) {
      return NextResponse.json(
        { error: 'paperId is required' },
        { status: 400 }
      );
    }

    // Fetch exam parts for this paper
    const parts = await prisma.$queryRaw`
      SELECT id, "questionCount"
      FROM "ExamPart"
      WHERE "paperId" = ${paperId}::uuid
      ORDER BY "orderIndex" ASC
    ` as any[];

    if (!parts || parts.length === 0) {
      return NextResponse.json(
        { error: 'No exam parts found for this paper' },
        { status: 400 }
      );
    }

    // Calculate total questions
    const totalQuestions = parts.reduce((sum, part) => sum + (part.questionCount || 0), 0);

    // Update paper metadata
    await prisma.$queryRaw`
      UPDATE "Paper"
      SET "totalQuestions" = ${totalQuestions}
      WHERE id = ${paperId}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: `Paper metadata synced. Total questions updated to ${totalQuestions}`,
      paperId,
      totalQuestions,
      partsCount: parts.length,
    });
  } catch (error: any) {
    console.error('Sync paper metadata error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync paper metadata' },
      { status: 500 }
    );
  }
}
