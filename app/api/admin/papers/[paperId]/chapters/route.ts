import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const paperId = params.paperId;

    if (!paperId) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
    }

    // Verify paper exists
    const paper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Fetch all chapters for this paper, ordered by number
    const chapters = await (prisma as any).chapter.findMany({
      where: { paperId: paperId },
      orderBy: { number: 'asc' },
      select: {
        id: true,
        number: true,
        title: true,
      }
    });

    return NextResponse.json(chapters);
  } catch (error: any) {
    console.error('Fetch chapters error:', error);

    const errorMessage = error.message || 'Failed to fetch chapters';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
