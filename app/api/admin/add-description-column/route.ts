import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return Response.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Add description column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "Paper" 
      ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT ''
    `;

    return Response.json({
      success: true,
      message: 'Description column added to Paper table',
    });
  } catch (error: any) {
    console.error('Add description column error:', error);
    return Response.json(
      { error: error.message || 'Failed to add description column' },
      { status: 500 }
    );
  }
}
