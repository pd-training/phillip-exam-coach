import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin only' },
        { status: 403 }
      );
    }

    // Fetch all exam attempts with user info
    const attempts = await prisma.$queryRaw`
      SELECT 
        ea.id,
        ea.paperid,
        ea.userid,
        u.name as username,
        u.email,
        ea.startedat,
        ea.submittedat,
        ea.score,
        ea.passed,
        ea.createdat
      FROM "examattempt" ea
      LEFT JOIN "User" u ON ea.userid = u.id
      ORDER BY ea.submittedat DESC NULLS LAST, ea.startedat DESC
    `;

    return NextResponse.json(attempts);
  } catch (error: any) {
    console.error('Fetch exam attempts error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch exam attempts' },
      { status: 500 }
    );
  }
}
