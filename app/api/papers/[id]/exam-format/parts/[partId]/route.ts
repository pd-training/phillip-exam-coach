import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setPartWeights } from "@/lib/exam-part-weights";
import { parseChapterWeights } from "@/lib/chapter-weights";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; partId: string } }
) {
  try {
    const { id, partId } = params;
    const body = await request.json();

    const { partName, chapterStart, chapterEnd, questionCount, passingScore } =
      body;
    const weightsSent = Object.prototype.hasOwnProperty.call(body, "chapterWeights");

    // Validate required fields
    if (!partName || chapterStart === undefined || chapterEnd === undefined || questionCount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the exam part
    const result = await prisma.$queryRaw`
      UPDATE "ExamPart"
      SET
        "partName" = ${partName},
        "chapterStart" = ${chapterStart},
        "chapterEnd" = ${chapterEnd},
        "questionCount" = ${questionCount},
        "passingScore" = ${passingScore || 70},
        "updatedAt" = NOW()
      WHERE id = ${partId}::uuid AND "paperId" = ${id}::uuid
      RETURNING id, "partName", "chapterStart", "chapterEnd", "questionCount", "passingScore", "orderIndex"
    ` as any[];

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "Exam part not found" },
        { status: 404 }
      );
    }

    if (weightsSent) {
      await setPartWeights(partId, parseChapterWeights(body.chapterWeights));
    }

    return NextResponse.json({
      success: true,
      examPart: { ...result[0], chapterWeights: parseChapterWeights(body.chapterWeights) },
    });
  } catch (error: any) {
    console.error("Error updating exam part:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update exam part" },
      { status: 500 }
    );
  }
}
