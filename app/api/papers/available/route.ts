import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const papers = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.title,
        p.description,
        p."externalLink",
        p."totalTime"
      FROM "Paper" p
      WHERE p."isAvailable" = true
        AND EXISTS (
          SELECT 1 FROM "Question" q WHERE q."paperId" = p.id
        )
      ORDER BY p.title ASC
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
