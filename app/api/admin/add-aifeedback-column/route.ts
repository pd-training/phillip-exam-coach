import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// Adds the aiFeedback column used to cache AI-written attempt feedback.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await (prisma as any).$executeRawUnsafe(`
      DO $$ BEGIN
        BEGIN
          ALTER TABLE examattempt ADD COLUMN "aiFeedback" JSONB;
        EXCEPTION WHEN duplicate_column THEN
          NULL;
        END;
      END $$;
    `);

    const columns = await (prisma as any).$queryRawUnsafe(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'examattempt' AND column_name = 'aiFeedback'
    `);

    if (columns.length === 0) {
      return NextResponse.json({ success: false, error: 'aiFeedback column is still missing' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'aiFeedback column added to examattempt table',
      column: { name: columns[0].column_name, type: columns[0].data_type },
    });
  } catch (error: any) {
    console.error('Column addition error:', error.message);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
}
