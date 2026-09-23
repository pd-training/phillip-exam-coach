import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Get student's papers (from approved paper requests where paper is available)
    const studentPapers = await prisma.$queryRaw`
      SELECT
        pr.id,
        p.id as "paperId",
        p.title as "paper_name",
        p."durationMinutes",
        p."totalQuestions",
        p."isAvailable",
        p."createdAt",
        pr.status
      FROM "PaperRequest" pr
      JOIN "Paper" p ON p.id = pr."paperId"
      WHERE pr."userId" = ${userId}
      AND pr.status = 'approved'
      AND p."isAvailable" = true
      ORDER BY p.title ASC
    ` as any[];

    return NextResponse.json({
      papers: studentPapers || [],
    });
  } catch (error: any) {
    console.error('Get student papers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}
