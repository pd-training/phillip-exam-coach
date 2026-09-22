import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Try a simple query using ORM
    const users = await (prisma as any).user.findMany({ take: 1 });
    
    console.log('Database connection successful');
    return NextResponse.json({
      success: true,
      message: 'Database connected',
      usersFound: users.length
    });
  } catch (error: any) {
    console.error('Database connection error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
