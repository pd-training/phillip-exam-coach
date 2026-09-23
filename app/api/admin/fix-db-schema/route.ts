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

    // Manually add the missing columns if they don't exist
    const queries = [
      `ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "optionB" TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "optionC" TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "optionD" TEXT NOT NULL DEFAULT ''`,
    ];

    for (const query of queries) {
      try {
        await (prisma as any).$executeRawUnsafe(query);
        console.log('✅ Executed:', query.substring(0, 50) + '...');
      } catch (err: any) {
        console.log('ℹ️  Column might already exist:', err.message.substring(0, 100));
      }
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
