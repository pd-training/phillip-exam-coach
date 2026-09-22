import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// Helper function for update logic
async function updatePaper(paperId: string, body: any) {
  // Validate paper exists first
  const existingPaper = await (prisma as any).paper.findUnique({
    where: { id: paperId },
  });

  if (!existingPaper) {
    return { error: "Paper not found", status: 404, paper: null };
  }

  const { title, description, totalQuestions, durationMinutes, passingScore, isAvailable } = body;

  // For PUT requests, title is required. For PATCH, it's optional.
  if (title !== undefined && (!title || !title.trim())) {
    return { error: "Paper title cannot be empty", status: 400, paper: null };
  }

  const updateData: any = {};

  if (title !== undefined) {
    updateData.title = title.trim();
  }
  if (description !== undefined) {
    updateData.description = description?.trim() || '';
  }
  if (totalQuestions !== undefined && totalQuestions > 0) {
    updateData.totalQuestions = totalQuestions;
  }
  if (durationMinutes !== undefined && durationMinutes > 0) {
    updateData.durationMinutes = durationMinutes;
  }
  if (passingScore !== undefined && passingScore > 0 && passingScore <= 100) {
    updateData.passingScore = passingScore;
  }
  if (isAvailable !== undefined) {
    updateData.isAvailable = isAvailable;
  }

  // If no fields to update, return existing paper
  if (Object.keys(updateData).length === 0) {
    return { error: null, status: 200, paper: existingPaper };
  }

  const paper = await (prisma as any).paper.update({
    where: { id: paperId },
    data: updateData,
  });

  return { error: null, status: 200, paper };
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
    if (!paperId) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
    }

    const body = await request.json();

    console.log('PATCH paper:', paperId, 'with body:', body);

    const result = await updatePaper(paperId, body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    console.log('Paper updated successfully:', result.paper.id);

    return NextResponse.json({
      paper: result.paper,
      message: "Paper details updated successfully"
    });
  } catch (error: any) {
    console.error('PATCH paper error:', error);
    const errorMessage = error.message || 'Failed to update paper';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // For PUT, title is required
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Paper title is required" }, { status: 400 });
    }

    console.log('PUT paper:', paperId, 'with body:', body);

    const result = await updatePaper(paperId, body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    console.log('Paper updated successfully:', result.paper.id);

    return NextResponse.json({
      paper: result.paper,
      message: "Paper updated successfully"
    });
  } catch (error: any) {
    console.error('PUT paper error:', error);
    const errorMessage = error.message || 'Failed to update paper';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
