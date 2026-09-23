import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { paperId: string; chapterNum: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const paperId = params.paperId;
    const chapterNum = params.chapterNum;

    if (!paperId || !chapterNum) {
      return NextResponse.json({ error: "Paper ID and chapter number are required" }, { status: 400 });
    }

    const body = await request.json();
    const { title } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Chapter title is required" }, { status: 400 });
    }

    const chapterNumber = parseInt(chapterNum);
    if (isNaN(chapterNumber)) {
      return NextResponse.json({ error: "Invalid chapter number" }, { status: 400 });
    }

    console.log('Updating chapter:', chapterNumber, 'for paper:', paperId);

    // Verify paper exists
    const paper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
      select: { id: true }
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const chapter = await (prisma as any).chapter.update({
      where: {
        paperId_number: {
          paperId: paperId,
          number: chapterNumber,
        }
      },
      data: { title: title.trim() },
      select: { id: true, number: true, title: true }
    });

    console.log('Chapter updated successfully:', chapter.id);

    return NextResponse.json({ 
      chapter,
      message: "Chapter updated successfully"
    });
  } catch (error: any) {
    console.error('Update chapter error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    const errorMessage = error.message || 'Failed to update chapter';
    return NextResponse.json(
      { error: errorMessage, code: error.code },
      { status: 500 }
    );
  }
}
