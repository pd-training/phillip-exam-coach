import prisma from "@/lib/prisma";

// Short code (e.g. "M9A") and part label (e.g. "Part II of CM-LIP") for a paper.
// Stored as extra columns; created at runtime so no Prisma migration is needed.

export interface PaperLabels {
  shortName: string | null;
  partLabel: string | null;
}

let columnsReady: Promise<void> | null = null;

function ensureLabelColumns(): Promise<void> {
  if (!columnsReady) {
    columnsReady = (async () => {
      await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Paper" ADD COLUMN IF NOT EXISTS "shortName" TEXT`);
      await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Paper" ADD COLUMN IF NOT EXISTS "partLabel" TEXT`);
    })().catch((err) => {
      columnsReady = null;
      throw err;
    });
  }
  return columnsReady;
}

export async function getPaperLabels(paperId: string): Promise<PaperLabels> {
  try {
    await ensureLabelColumns();
    const rows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT "shortName", "partLabel" FROM "Paper" WHERE id::text = $1`,
      paperId
    );
    return {
      shortName: rows[0]?.shortName ?? null,
      partLabel: rows[0]?.partLabel ?? null,
    };
  } catch (error: any) {
    console.error("Load paper labels error:", error?.message || error);
    return { shortName: null, partLabel: null };
  }
}

export async function setPaperLabels(paperId: string, labels: PaperLabels): Promise<void> {
  await ensureLabelColumns();
  await (prisma as any).$executeRawUnsafe(
    `UPDATE "Paper" SET "shortName" = $2, "partLabel" = $3 WHERE id::text = $1`,
    paperId,
    labels.shortName,
    labels.partLabel
  );
}

export function cleanLabel(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
