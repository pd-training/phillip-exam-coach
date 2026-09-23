import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get only available papers (where admin has not turned off availability)
    const papers = await prisma.$queryRaw`
      SELECT 
        id,
        title,
        "totalTime"
      FROM "Paper"
      WHERE "isAvailable" = true
      ORDER BY title ASC
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
