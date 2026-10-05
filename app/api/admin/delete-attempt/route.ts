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
    const attemptId = body?.attemptId;

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId required' },
        { status: 400 }
      );
    }

    // Check if attempt exists
    const attempt = await prisma.$queryRaw`
      SELECT id FROM "examattempt" WHERE id = ${attemptId}
    ` as any[];

    if (!attempt || attempt.length === 0) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Delete the attempt
    await prisma.$queryRaw`
      DELETE FROM "examattempt" WHERE id = ${attemptId}
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Exam attempt deleted successfully' 
    });
  } catch (error: any) {
    console.error('Delete attempt error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete attempt' },
      { status: 500 }
    );
  }
}
