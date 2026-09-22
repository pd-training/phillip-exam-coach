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

    // Parse request body safely
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const userId = body?.userId?.trim?.() || body?.userId;
    const paperId = body?.paperId?.trim?.() || body?.paperId;

    console.log('Assign paper - userId:', userId, 'paperId:', paperId);

    if (!userId || !paperId) {
      return NextResponse.json(
        { error: 'userId and paperId required' },
        { status: 400 }
      );
    }

    console.log('Proceeding with userId (CUID):', userId, 'paperId (UUID):', paperId);

    // Check for ANY existing request (regardless of status)
    console.log('Checking for existing requests...');
    let existing;
    try {
      existing = await (prisma as any).paperRequest.findMany({
        where: {
          userId: userId,
          paperId: paperId
        },
        select: {
          id: true,
          status: true
        }
      });

      console.log('Existing requests found:', existing?.length || 0);
      if (existing && existing.length > 0) {
        console.log('Existing request status:', existing[0].status);
      }
    } catch (e: any) {
      console.error('Error checking existing request:', e.message);
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
        await (prisma as any).paperRequest.update({
          where: { id: req.id },
          data: { status: 'approved', reviewedAt: new Date() }
        });
      } catch (updateError: any) {
        console.error('UPDATE error:', updateError.message);
        throw updateError;
      }
      return NextResponse.json({ success: true, message: 'Paper assigned successfully' });
    }

    // No existing request, create new approved request
    console.log('Creating new PaperRequest for userId:', userId, 'paperId:', paperId);
    try {
      await (prisma as any).paperRequest.create({
        data: {
          userId: userId,
          paperId: paperId,
          status: 'approved',
          reviewedAt: new Date()
        }
      });
      console.log('INSERT successful');
    } catch (insertError: any) {
      console.error('INSERT error:', insertError.message);
      throw insertError;
    }

    return NextResponse.json({ success: true, message: 'Paper assigned successfully' });
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    const errorCode = error?.code || 'UNKNOWN';

    // Map PostgreSQL error codes
    let userMessage = errorMsg;
    if (errorCode === '23503') {
      userMessage = 'Invalid student or paper ID';
    } else if (errorCode === '23505') {
      userMessage = 'Request already exists';
    }

    console.error('Assign paper error - Code:', errorCode, 'Message:', errorMsg);
    return NextResponse.json(
      { error: userMessage, code: errorCode },
      { status: 500 }
    );
  }
}
