import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;
    
    console.log('Fetching paper:', paperId);

    // Fetch paper using ORM
    const paper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        title: true,
        durationMinutes: true,
        totalQuestions: true,
        isAvailable: true,
        passingScore: true,
        totalTime: true,
      }
    });

    if (!paper) {
      console.log('Paper not found:', paperId);
      return Response.json(
        { success: false, error: 'Paper not found' },
        { status: 404 }
      );
    }

    console.log('Found paper:', paper.title);

    // Fetch questions for this paper
    const questions = await (prisma as any).question.findMany({
      where: { paperId: paperId },
      select: {
        id: true,
        questionText: true,
        correctAnswer: true,
        explanation: true,
        chapterNumber: true,
      },
      orderBy: { chapterNumber: 'asc' }
    });

    console.log('Found questions:', questions.length);

    return Response.json({
      success: true,
      paper: {
        ...paper,
        questions: questions || [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching paper:', {
      message: error.message,
      code: error.code
    });
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch paper' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const paperId = params.id;
    if (!paperId) {
      return Response.json({ error: "Paper ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { isAvailable } = body;

    if (isAvailable === undefined) {
      return Response.json({ error: "isAvailable field is required" }, { status: 400 });
    }

    console.log('PUT paper:', paperId, 'isAvailable:', isAvailable);

    // Verify paper exists
    const existingPaper = await (prisma as any).paper.findUnique({
      where: { id: paperId },
    });

    if (!existingPaper) {
      return Response.json({ error: "Paper not found" }, { status: 404 });
    }

    // Update isAvailable field
    const paper = await (prisma as any).paper.update({
      where: { id: paperId },
      data: { isAvailable: isAvailable }
    });

    console.log('Paper availability updated:', paper.id, 'to', paper.isAvailable);

    return Response.json({
      success: true,
      paper: {
        id: paper.id,
        title: paper.title,
        isAvailable: paper.isAvailable
      }
    });
  } catch (error: any) {
    console.error('PUT paper error:', error);
    return Response.json(
      { error: error.message || 'Failed to update paper' },
      { status: 500 }
    );
  }
}
