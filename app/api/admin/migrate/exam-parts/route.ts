import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Find all papers
    const papers = await prisma.$queryRaw`
      SELECT id, "totalQuestions"
      FROM "Paper"
      ORDER BY "createdAt" ASC
    ` as any[];

    let createdCount = 0;
    const results = [];

    for (const paper of papers) {
      // Check if paper has exam parts
      const existingParts = await prisma.$queryRaw`
        SELECT id
        FROM "ExamPart"
        WHERE "paperId" = ${paper.id}::uuid
      ` as any[];

      if (existingParts.length === 0) {
        // Create default exam part
        const questionCount = paper.totalQuestions || 150;
        await prisma.$queryRaw`
          INSERT INTO "ExamPart" (id, "paperId", "partName", "chapterStart", "chapterEnd", "questionCount", "passingScore", "orderIndex", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${paper.id}::uuid, 'Full Exam', 1, 100, ${questionCount}, 70, 1, NOW(), NOW())
        `;
        createdCount++;
        results.push({
          paperId: paper.id,
          status: "created",
          questionCount,
        });
      } else {
        results.push({
          paperId: paper.id,
          status: "skipped",
          reason: "Already has exam parts",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete. Created ${createdCount} default exam parts for papers without parts.`,
      totalPapers: papers.length,
      created: createdCount,
      skipped: papers.length - createdCount,
      details: results,
    });
  } catch (error: any) {
    console.error('Exam parts migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
