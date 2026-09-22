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

    console.log('Proceeding with userId (CUID):', userId, 'paperId (UUID):', paperId);

    // Check for ANY existing request (regardless of status)
    let existing;
    try {
      existing = await prisma.$queryRaw`
        SELECT id, status FROM "PaperRequest"
        WHERE "userId" = ${userId}
        AND "paperId" = ${paperId}
      ` as any[];
      
      console.log('Existing requests found:', existing?.length || 0);
      if (existing && existing.length > 0) {
        console.log('Existing request status:', existing[0].status);
      }
    } catch (e) {
      console.error('Error checking existing request:', e);
      existing = [];
    }

    if (existing && existing.length > 0) {
      const req = existing[0];
      // If already approved, return success
      if (req.status === 'approved') {
        return NextResponse.json({ success: true, message: 'Paper already assigned' });
      }
      
      // If pending or rejected, update to approved
      console.log('Updating existing request to approved');
      try {
        await prisma.$queryRaw`
          UPDATE "PaperRequest"
          SET status = 'approved', "reviewedAt" = NOW()
          WHERE id = ${req.id}
        `;
      } catch (updateError: any) {
        console.error('UPDATE error:', updateError.message || updateError);
        throw updateError;
      }
      return NextResponse.json({ success: true, message: 'Paper assigned successfully' });
    }

    // No existing request, create new approved request
    console.log('Creating new PaperRequest for userId:', userId, 'paperId:', paperId);
    try {
      await prisma.$queryRaw`
        INSERT INTO "PaperRequest" ("userId", "paperId", status, "requestedAt", "reviewedAt")
        VALUES (${userId}, ${paperId}, 'approved', NOW(), NOW())
      `;
      console.log('INSERT successful');
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
