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

    // Add externalLink column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "Paper" 
      ADD COLUMN IF NOT EXISTS "externalLink" TEXT
    `;

    return Response.json({
      success: true,
      message: 'External link column added to Paper table',
    });
  } catch (error: any) {
    console.error('Add external link column error:', error);
    return Response.json(
      { error: error.message || 'Failed to add external link column' },
      { status: 500 }
    );
  }
}
