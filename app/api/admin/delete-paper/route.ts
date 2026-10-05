import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const paperId = body?.paperId;

    if (!paperId) {
      return NextResponse.json(
        { error: 'paperId required' },
        { status: 400 }
      );
    }

    // Check if paper exists and get its info
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: { id: true, title: true }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Check how many exam attempts exist for this paper
    const attemptCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "examattempt" WHERE paperid = ${paperId}::uuid
    ` as any[];

    const hasAttempts = Number(attemptCount[0]?.count) > 0;

    if (hasAttempts) {
      return NextResponse.json(
        { 
          error: `Cannot delete paper with exam attempts (${Number(attemptCount[0]?.count)} attempts found). Please delete attempts first or archive the paper.`,
          hasAttempts: true
        },
        { status: 400 }
      );
    }

    // Delete paper (cascade will handle related records via Prisma ORM)
    await prisma.paper.delete({
      where: { id: paperId }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Paper "${paper.title}" has been deleted successfully` 
    });
  } catch (error: any) {
    console.error('Delete paper error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete paper' },
      { status: 500 }
    );
  }
}
