import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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
    if (!paperId) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, totalQuestions, durationMinutes, passingScore } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Paper title is required" }, { status: 400 });
    }

    console.log('Updating paper:', paperId, 'with title:', title, 'totalQuestions:', totalQuestions, 'durationMinutes:', durationMinutes, 'passingScore:', passingScore);

    // Validate paper exists first
    const existingPaper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
    });

    if (!existingPaper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const paper = await (prisma as any).paper.update({
      where: { id: paperId },
      data: {
        title: title.trim(),
        ...(description !== undefined && { description: description?.trim() || '' }),
        ...(totalQuestions !== undefined && totalQuestions > 0 && { totalQuestions }),
        ...(durationMinutes !== undefined && durationMinutes > 0 && { durationMinutes }),
        ...(passingScore !== undefined && passingScore > 0 && passingScore <= 100 && { passingScore }),
      }
    });

    console.log('Paper updated successfully:', paper.id);

    return NextResponse.json({ 
      paper,
      message: "Paper details updated successfully"
    });
  } catch (error: any) {
    console.error('Update paper error:', error);
    const errorMessage = error.message || 'Failed to update paper';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
