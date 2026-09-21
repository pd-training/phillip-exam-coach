import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import authConfig from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Get student's papers (both active and from requests)
    const studentPapers = await prisma.$queryRaw`
      SELECT DISTINCT
        p.id,
        p.title,
        p."totalQuestions",
        p."durationMinutes"
      FROM "Paper" p
      INNER JOIN "StudentPaper" sp ON p.id = sp."paperId"
      WHERE sp."userId" = ${userId}
      AND sp.status = 'active'
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
