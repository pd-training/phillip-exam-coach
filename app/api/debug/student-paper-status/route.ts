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

    // Check all paper requests for this user
    const allRequests = await prisma.$queryRaw`
      SELECT
        pr.id,
        pr."paperId",
        pr.status,
        p.title,
        p."isAvailable",
        (SELECT COUNT(*) FROM "Question" WHERE "paperId" = p.id) as "questionCount"
      FROM "PaperRequest" pr
      JOIN "Paper" p ON p.id = pr."paperId"
      WHERE pr."userId" = ${userId}
      ORDER BY pr."createdAt" DESC
    ` as any[];

    // Check which papers meet all criteria
    const eligiblePapers = allRequests.filter((p: any) => 
      p.status === 'approved' && 
      p.isAvailable === true && 
      p.questionCount > 0
    );

    return NextResponse.json({
      userId,
      allRequests: allRequests.map((r: any) => ({
        paperId: r.paperId,
        title: r.title,
        status: r.status,
        isAvailable: r.isAvailable,
        questionCount: Number(r.questionCount),
        meetsAllCriteria: r.status === 'approved' && r.isAvailable === true && Number(r.questionCount) > 0
      })),
      eligibleCount: eligiblePapers.length,
      issues: allRequests.map((r: any) => {
        const issues = [];
        if (r.status !== 'approved') issues.push(`Status is '${r.status}' (need 'approved')`);
        if (!r.isAvailable) issues.push('Paper not marked as available');
        if (Number(r.questionCount) === 0) issues.push('No questions uploaded');
        return { title: r.title, issues };
      }).filter((x: any) => x.issues.length > 0)
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error.message || 'Debug failed' },
      { status: 500 }
    );
  }
}
