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

    const { userId, paperId } = await request.json();

    // Check if already assigned (approved request exists)
    const existing = await prisma.$queryRaw`
      SELECT id FROM "PaperRequest"
      WHERE "userId" = ${userId} AND "paperId" = ${paperId}
      AND status = 'approved'
    ` as any[];

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Paper already assigned' },
        { status: 400 }
      );
    }

    // Assign paper by creating an approved request
    await prisma.$queryRaw`
      INSERT INTO "PaperRequest" ("userId", "paperId", status, "requestedAt", "reviewedAt")
      VALUES (${userId}, ${paperId}, 'approved', NOW(), NOW())
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Assign paper error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
