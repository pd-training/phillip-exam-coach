export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const papers = await prisma.$queryRaw`
      SELECT id, title, "durationMinutes", "totalQuestions", "isAvailable", "createdAt"
      FROM "Paper"
      ORDER BY "createdAt" DESC
    `;

    return Response.json({
      success: true,
      papers: papers || [],
    });
  } catch (error) {
    console.error("Error fetching papers:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { title, durationMinutes, totalQuestions } = await req.json();

    if (!title) {
      return Response.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Use raw SQL to bypass Prisma enum validation
    const result = await prisma.$queryRaw`
      INSERT INTO "Paper" (id, title, "durationMinutes", "totalQuestions", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${title}, ${durationMinutes || 180}, ${totalQuestions || 150}, NOW(), NOW())
      RETURNING id, title, "durationMinutes", "totalQuestions", "isAvailable", "createdAt"
    `;

    return Response.json({
      success: true,
      paper: result?.[0] || null,
    });
  } catch (error) {
    console.error("Error creating paper:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
