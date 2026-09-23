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

    console.log('Running direct SQL to add missing Question columns...');

    // Execute raw SQL to add columns if they don't exist
    const addColumnsSQL = `
      DO $$ BEGIN
        BEGIN
          ALTER TABLE "Question" ADD COLUMN "optionA" TEXT NOT NULL DEFAULT '';
          RAISE NOTICE 'Added column optionA';
        EXCEPTION WHEN duplicate_column THEN
          RAISE NOTICE 'Column optionA already exists';
        END;
        BEGIN
          ALTER TABLE "Question" ADD COLUMN "optionB" TEXT NOT NULL DEFAULT '';
          RAISE NOTICE 'Added column optionB';
        EXCEPTION WHEN duplicate_column THEN
          RAISE NOTICE 'Column optionB already exists';
        END;
        BEGIN
          ALTER TABLE "Question" ADD COLUMN "optionC" TEXT NOT NULL DEFAULT '';
          RAISE NOTICE 'Added column optionC';
        EXCEPTION WHEN duplicate_column THEN
          RAISE NOTICE 'Column optionC already exists';
        END;
        BEGIN
          ALTER TABLE "Question" ADD COLUMN "optionD" TEXT NOT NULL DEFAULT '';
          RAISE NOTICE 'Added column optionD';
        EXCEPTION WHEN duplicate_column THEN
          RAISE NOTICE 'Column optionD already exists';
        END;
      END $$;
    `;

    console.log('Executing SQL to add columns...');
    await (prisma as any).$executeRawUnsafe(addColumnsSQL);
    console.log('✅ Column addition SQL executed');

    // Verify columns exist by querying information_schema
    const verifySQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Question' 
      AND column_name IN ('optionA', 'optionB', 'optionC', 'optionD')
      ORDER BY column_name
    `;

    const columns = await (prisma as any).$queryRawUnsafe(verifySQL);
    console.log('Existing option columns:', columns.map((c: any) => c.column_name));

    const hasAllColumns = ['optionA', 'optionB', 'optionC', 'optionD'].every(
      col => columns.some((c: any) => c.column_name === col)
    );

    if (!hasAllColumns) {
      const missing = ['optionA', 'optionB', 'optionC', 'optionD'].filter(
        col => !columns.some((c: any) => c.column_name === col)
      );
      console.error('Missing columns:', missing);
      return NextResponse.json({
        success: false,
        error: 'Some columns are still missing after attempting to add them',
        missing: missing,
        existing: columns.map((c: any) => c.column_name)
      }, { status: 500 });
    }

    console.log('✅ All option columns now exist in database');

    return NextResponse.json({
      success: true,
      message: 'All Question table columns verified and added successfully',
      columns: columns.map((c: any) => c.column_name)
    });

  } catch (error: any) {
    console.error('❌ Column addition error:', error.message);
    console.error('Full error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code,
        details: error.meta
      },
      { status: 500 }
    );
  }
}
