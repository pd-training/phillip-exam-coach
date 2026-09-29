import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get only available papers
    const papers = await prisma.paper.findMany({
      where: {
        isAvailable: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    // Map to return only needed fields
    const result = papers.map((paper) => ({
      id: paper.id,
      title: paper.title,
      description: paper.description || '',
      totalTime: paper.totalTime,
    }));

    return Response.json({ papers: result });
  } catch (error: any) {
    console.error("Available papers error:", error.message);
    return Response.json(
      { error: error.message || "Failed to fetch papers" },
      { status: 500 }
    );
  }
}
