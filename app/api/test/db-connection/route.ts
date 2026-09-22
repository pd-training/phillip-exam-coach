import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('Database connection successful');
    return NextResponse.json({
      success: true,
      message: 'Database connected',
      result: result
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
