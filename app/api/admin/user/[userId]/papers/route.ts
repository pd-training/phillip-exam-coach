import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin only' },
        { status: 403 }
      );
    }

    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // Get all paper requests for this user that are approved
    const papers = await (prisma as any).paperRequest.findMany({
      where: {
        userId: userId,
        status: 'approved'
      },
      select: {
        paperId: true,
        paper: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      papers: papers.map(p => ({
        paperId: p.paperId,
        ...p.paper
      }))
    });
  } catch (error: any) {
    console.error('Error fetching user papers:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}
