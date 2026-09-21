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

    // Get student's papers
    const studentPapers = await prisma.$queryRaw`
      SELECT
        sp.id,
        sp."paperId",
        p.title as paper_name,
        sp.status
      FROM "StudentPaper" sp
      JOIN "Paper" p ON p.id = sp."paperId"
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
