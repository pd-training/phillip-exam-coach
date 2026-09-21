import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get all active papers
    const papers = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        description,
        "totalQuestions",
        "totalTime"
      FROM "Paper"
      WHERE "isActive" = true
      ORDER BY "name" ASC
    ` as any[];

    return Response.json({ papers: papers || [] });
  } catch (error: any) {
    console.error("Available papers error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch papers" },
      { status: 500 }
    );
  }
}
