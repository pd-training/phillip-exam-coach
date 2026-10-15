import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// Adds the phone column that stores each student's mobile number.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await (prisma as any).$executeRawUnsafe(`
      DO $$ BEGIN
        BEGIN
          ALTER TABLE "User" ADD COLUMN "phone" TEXT;
        EXCEPTION WHEN duplicate_column THEN
          NULL;
        END;
      END $$;
    `);

    const columns = await (prisma as any).$queryRawUnsafe(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'User' AND column_name = 'phone'
    `);

    if (columns.length === 0) {
      return NextResponse.json({ success: false, error: 'phone column is still missing' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'phone column added to User table',
      column: { name: columns[0].column_name, type: columns[0].data_type },
    });
  } catch (error: any) {
    console.error('Column addition error:', error.message);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
}
