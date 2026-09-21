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

    console.log('Assign paper - userId:', userId, 'paperId:', paperId);

    if (!userId || !paperId) {
      return NextResponse.json(
        { error: 'userId and paperId required' },
        { status: 400 }
      );
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(paperId)) {
      console.error('Invalid UUID format - userId:', userId, 'paperId:', paperId);
      return NextResponse.json(
        { error: 'Invalid userId or paperId format' },
        { status: 400 }
      );
    }

    // Check if already assigned (approved request exists)
    let existing;
    try {
      existing = await prisma.$queryRaw`
        SELECT id FROM "PaperRequest"
        WHERE "userId" = ${userId}
        AND "paperId" = ${paperId}
        AND status = 'approved'
      ` as any[];
    } catch (e) {
      console.error('Error checking existing request:', e);
      existing = [];
    }

    if (existing && existing.length > 0) {
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

    return NextResponse.json({ success: true, message: 'Paper assigned successfully' });
  } catch (error: any) {
    console.error('Assign paper error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign paper' },
      { status: 500 }
    );
  }
}
