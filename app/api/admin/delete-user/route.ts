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
    const userId = body?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await (prisma as any).user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (cascading delete will handle related records)
    await (prisma as any).user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ 
      success: true, 
      message: `User "${user.name}" (${user.email}) has been deleted successfully` 
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
