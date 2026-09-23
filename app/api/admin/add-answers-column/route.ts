import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Adding answers column to examattempt table...');

    // Add answers column as JSONB
    await prisma.$executeRaw`
      ALTER TABLE examattempt
      ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}';
    `;

    console.log('Successfully added answers column to examattempt');

    return NextResponse.json({ 
      success: true, 
      message: 'answers column added to examattempt table' 
    });
  } catch (error: any) {
    console.error('Error adding column:', error.message);
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
