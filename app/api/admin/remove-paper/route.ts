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
    const userId = body?.userId?.trim?.() || body?.userId;
    const paperId = body?.paperId?.trim?.() || body?.paperId;

    if (!userId || !paperId) {
      return NextResponse.json(
        { error: 'userId and paperId required' },
        { status: 400 }
      );
    }

    // Find and delete the paper request
    const deleted = await (prisma as any).paperRequest.deleteMany({
      where: {
        userId: userId,
        paperId: paperId
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Paper assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Paper removed successfully' 
    });
  } catch (error: any) {
    console.error('Remove paper error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to remove paper' },
      { status: 500 }
    );
  }
}
