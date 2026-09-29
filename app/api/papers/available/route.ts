import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const papers = await prisma.$queryRaw`
      SELECT 
        id,
        title,
        description,
        "totalTime"
      FROM "Paper"
      WHERE "isAvailable" = true
      ORDER BY title ASC
    ` as any[];

    return NextResponse.json({ papers: papers || [] });
  } catch (error: any) {
    console.error("Available papers error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch papers" },
      { status: 500 }
    );
  }
}
