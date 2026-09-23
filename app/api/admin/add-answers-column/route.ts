import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Adding answers column to examattempt table...');

    // Try to add the column
    await prisma.$executeRaw`
      ALTER TABLE examattempt
      ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}';
    `;

    console.log('✅ Successfully added answers column to examattempt');
    return NextResponse.json({ 
      success: true, 
      message: '✅ answers column added to examattempt table' 
    });
  } catch (error: any) {
    console.error('Error adding column:', error);
    // Try with raw SQL query as fallback
    try {
      const result = await prisma.$queryRaw`
        ALTER TABLE examattempt
        ADD COLUMN answers JSONB DEFAULT '{}';
      `;
      console.log('✅ Column added via fallback SQL');
      return NextResponse.json({ 
        success: true, 
        message: '✅ answers column added (via fallback)' 
      });
    } catch (fallbackError: any) {
      console.error('Fallback also failed:', fallbackError.message);
      return NextResponse.json(
        { 
          success: false, 
          error: fallbackError.message
        },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: NextRequest) {
  // Allow POST as well for flexibility
  return GET(request);
}

