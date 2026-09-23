import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log('Attempting to add missing Question columns...');

    // Check which columns are missing
    const columnCheckQuery = `
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'Question' 
      AND column_name IN ('optionB', 'optionC', 'optionD')
    `;
    
    try {
      const result = await (prisma as any).$queryRawUnsafe(columnCheckQuery);
      console.log('Existing option columns:', result.map((r: any) => r.column_name));
    } catch (err: any) {
      console.log('Column check query failed:', err.message);
    }

    // Add missing columns one by one
    const missingColumns = [];
    
    try {
      await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Question" ADD COLUMN "optionB" TEXT NOT NULL DEFAULT ''`);
      console.log('✅ Added optionB');
    } catch (err: any) {
      console.log('optionB error:', err.message.substring(0, 100));
      if (!err.message.includes('already exists')) missingColumns.push('optionB');
    }

    try {
      await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Question" ADD COLUMN "optionC" TEXT NOT NULL DEFAULT ''`);
      console.log('✅ Added optionC');
    } catch (err: any) {
      console.log('optionC error:', err.message.substring(0, 100));
      if (!err.message.includes('already exists')) missingColumns.push('optionC');
    }

    try {
      await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Question" ADD COLUMN "optionD" TEXT NOT NULL DEFAULT ''`);
      console.log('✅ Added optionD');
    } catch (err: any) {
      console.log('optionD error:', err.message.substring(0, 100));
      if (!err.message.includes('already exists')) missingColumns.push('optionD');
    }

    if (missingColumns.length > 0) {
      console.error('Failed to add columns:', missingColumns);
    }

    // Verify columns exist by trying to insert a test row
    try {
      const testId = 'test-col-verify-' + Date.now();
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "Question" (id, "paperId", "chapterNumber", "questionText", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "explanation") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        testId,
        '00000000-0000-0000-0000-000000000000', // dummy UUID
        1,
        'Test question',
        'Option A',
        'Option B', 
        'Option C',
        'Option D',
        'A',
        'Test explanation'
      );
      console.log('✅ Test insert succeeded - columns exist');
      
      // Clean up test row
      await (prisma as any).question.delete({ where: { id: testId } });
    } catch (testErr: any) {
      console.error('❌ Test insert failed:', testErr.message);
      return NextResponse.json({
        error: 'Columns still missing after migration attempt',
        details: testErr.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Question table columns verified/fixed successfully. You can now upload questions.'
    });
  } catch (error: any) {
    console.error('Migration fix error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Alternative endpoint to deploy pending Prisma migrations
 * This should be called if raw SQL approach doesn't work
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log('Deploying pending Prisma migrations...');

    // Get pending migrations
    const result = await (prisma as any).$executeRaw`SELECT * FROM "_prisma_migrations" ORDER BY "finishedAt" DESC LIMIT 5`;
    console.log('Recent migrations:', result);

    return NextResponse.json({
      success: true,
      message: 'Run: npx prisma migrate deploy',
      note: 'This endpoint shows migration status. To deploy migrations, run the command above in your terminal.'
    });
  } catch (error: any) {
    console.error('Migration check error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
