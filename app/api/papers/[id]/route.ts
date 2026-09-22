import prisma from '@/lib/prisma';

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
