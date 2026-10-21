// Shared helpers for the Quick Guide (chapter TL;DR and core bullets).
import prisma from "@/lib/prisma";

export type ChapterGuide = {
  chapterNumber: number;
  tldr: string;
  bullets: string[];
};

// Creates the table on first use so no separate migration is needed.
export async function ensureGuideTable() {
  await (prisma as any).$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ChapterGuide" (
      "paperId" TEXT NOT NULL,
      "chapterNumber" INT NOT NULL,
      tldr TEXT NOT NULL DEFAULT '',
      bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY ("paperId", "chapterNumber")
    )
  `);
}

// Chapters for a paper with any guide text saved against them
export async function loadGuide(paperId: string) {
  await ensureGuideTable();
  const chapters: any[] = await (prisma as any).chapter.findMany({
    where: { paperId },
    select: { number: true, title: true },
    orderBy: { number: "asc" },
  });
  const guides: any[] = await (prisma as any).$queryRawUnsafe(
    `SELECT "chapterNumber", tldr, bullets FROM "ChapterGuide" WHERE "paperId" = $1`,
    paperId
  );
  const byNumber = new Map(guides.map((g) => [Number(g.chapterNumber), g]));
  return chapters.map((c) => {
    const g = byNumber.get(Number(c.number));
    return {
      chapterNumber: Number(c.number),
      title: c.title as string,
      tldr: (g?.tldr as string) || "",
      bullets: Array.isArray(g?.bullets) ? (g.bullets as string[]) : [],
    };
  });
}
