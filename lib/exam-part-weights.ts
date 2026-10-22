// Server-side storage for chapter weights on exam parts.
// Stored as a JSON text column on "ExamPart", added at runtime (no Prisma migration needed).
import prisma from "@/lib/prisma";
import { ChapterWeights, parseChapterWeights } from "@/lib/chapter-weights";

let columnReady: Promise<void> | null = null;

export function ensureWeightColumn(): Promise<void> {
  if (!columnReady) {
    columnReady = (async () => {
      await (prisma as any).$executeRawUnsafe(`ALTER TABLE "ExamPart" ADD COLUMN IF NOT EXISTS "chapterWeights" TEXT`);
    })().catch((err) => {
      columnReady = null;
      throw err;
    });
  }
  return columnReady;
}

// Weights for every part of a paper that has them set (parts without weights are absent)
export async function getWeightsForPaper(paperId: string): Promise<Map<string, ChapterWeights>> {
  const map = new Map<string, ChapterWeights>();
  try {
    await ensureWeightColumn();
    const rows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT id::text AS id, "chapterWeights" FROM "ExamPart" WHERE "paperId"::text = $1`,
      paperId
    );
    for (const row of rows) {
      const parsed = parseChapterWeights(row.chapterWeights);
      if (parsed) map.set(row.id, parsed);
    }
  } catch (error: any) {
    console.error("Load chapter weights error:", error?.message || error);
  }
  return map;
}

export async function setPartWeights(partId: string, weights: ChapterWeights | null): Promise<void> {
  await ensureWeightColumn();
  await (prisma as any).$executeRawUnsafe(
    `UPDATE "ExamPart" SET "chapterWeights" = $2 WHERE id::text = $1`,
    partId,
    weights ? JSON.stringify(weights) : null
  );
}
