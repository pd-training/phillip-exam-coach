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

    console.log('Creating Chapter table if it does not exist...');

    // Create the Chapter table using SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "Chapter" (
        id TEXT PRIMARY KEY,
        "paperId" UUID NOT NULL,
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("paperId", number),
        CONSTRAINT "Chapter_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"(id) ON DELETE CASCADE
      );
    `;

    console.log('Executing table creation SQL...');
    await (prisma as any).$executeRawUnsafe(createTableSQL);
    console.log('✅ Chapter table created or already exists');

    // Create index on paperId for performance
    try {
      const indexSQL = `
        CREATE INDEX IF NOT EXISTS "Chapter_paperId_idx" ON "Chapter"("paperId");
      `;
      await (prisma as any).$executeRawUnsafe(indexSQL);
      console.log('✅ Index created on paperId');
    } catch (indexErr: any) {
      console.log('ℹ️  Index creation skipped:', indexErr.message.substring(0, 100));
    }

    // Verify table exists
    const verifySQL = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Chapter'
      ) as exists;
    `;

    const result = await (prisma as any).$queryRawUnsafe(verifySQL);
    const tableExists = result[0]?.exists || false;

    if (!tableExists) {
      return NextResponse.json({
        success: false,
        error: 'Chapter table still does not exist after creation attempt',
        details: result
      }, { status: 500 });
    }

    console.log('✅ Chapter table verified to exist');

    return NextResponse.json({
      success: true,
      message: 'Chapter table created successfully',
      tableExists: true
    });

  } catch (error: any) {
    console.error('❌ Table creation error:', error.message);
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
