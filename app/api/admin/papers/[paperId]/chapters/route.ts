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
      select: { id: true }
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
    console.error('Fetch chapters error:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', JSON.stringify({
      message: error.message,
      code: error.code,
      meta: error.meta
    }));

    const errorMessage = error.message || 'Failed to fetch chapters';
    return NextResponse.json(
      {
        error: errorMessage,
        code: error.code,
        details: error.meta?.cause || 'No details'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const paperId = params.paperId;
    const { chapters } = await request.json();

    if (!paperId) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
    }

    if (!Array.isArray(chapters)) {
      return NextResponse.json(
        { error: "Chapters must be an array" },
        { status: 400 }
      );
    }

    // Update each chapter title
    const updatedChapters = [];
    for (const chapter of chapters) {
      if (chapter.title && chapter.title.trim()) {
        const updated = await (prisma as any).chapter.updateMany({
          where: {
            paperId: paperId,
            number: chapter.number
          },
          data: {
            title: chapter.title.trim(),
          }
        });
        updatedChapters.push(updated);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Chapters updated successfully",
      updated: updatedChapters.length,
    });
  } catch (error: any) {
    console.error('Update chapters error:', error.message);
    return NextResponse.json(
      { error: error.message || "Failed to update chapters" },
      { status: 500 }
    );
  }
}
