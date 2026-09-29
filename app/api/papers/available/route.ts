import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get only available papers (where admin has turned on availability)
    const papers = await prisma.paper.findMany({
      where: {
        isAvailable: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        totalTime: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return Response.json({ papers: papers || [] });
  } catch (error: any) {
    console.error("Available papers error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch papers" },
      { status: 500 }
    );
  }
}
