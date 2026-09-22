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
    console.log('About to INSERT into PaperRequest');
    try {
      await prisma.$queryRaw`
        INSERT INTO "PaperRequest" ("userId", "paperId", status, "requestedAt", "reviewedAt")
        VALUES (${userId}, ${paperId}, 'approved', NOW(), NOW())
      `;
      console.log('INSERT successful for userId:', userId, 'paperId:', paperId);
    } catch (insertError: any) {
      console.error('INSERT error:', insertError.message || insertError);
      throw insertError;
    }

    return NextResponse.json({ success: true, message: 'Paper assigned successfully' });
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || 'UNKNOWN';
    console.error('Assign paper error - Code:', errorCode, 'Message:', errorMsg);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    return NextResponse.json(
      { error: errorMsg, code: errorCode },
      { status: 500 }
    );
  }
}
