import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log('Running direct SQL to add partScores column to examattempt table...');

    // Execute raw SQL to add partScores column if it doesn't exist
    const addColumnSQL = `
      DO $$ BEGIN
        BEGIN
          ALTER TABLE examattempt ADD COLUMN "partScores" JSONB;
          RAISE NOTICE 'Added column partScores';
        EXCEPTION WHEN duplicate_column THEN
          RAISE NOTICE 'Column partScores already exists';
        END;
      END $$;
    `;

    console.log('Executing SQL to add partScores column...');
    await (prisma as any).$executeRawUnsafe(addColumnSQL);
    console.log('✅ Column addition SQL executed');

    // Verify column exists by querying information_schema
    const verifySQL = `
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'examattempt' 
      AND column_name = 'partScores'
    `;

    const columns = await (prisma as any).$queryRawUnsafe(verifySQL);
    console.log('Existing partScores column:', columns);

    if (columns.length === 0) {
      console.error('partScores column still missing after attempting to add');
      return NextResponse.json({
        success: false,
        error: 'partScores column is still missing after attempting to add it',
      }, { status: 500 });
    }

    console.log('✅ partScores column now exists in database');

    return NextResponse.json({
      success: true,
      message: 'partScores column added successfully to examattempt table',
      column: {
        name: columns[0].column_name,
        type: columns[0].data_type
      }
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
