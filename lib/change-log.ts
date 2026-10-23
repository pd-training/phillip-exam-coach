// Simple change log for question and paper edits. Logging never blocks a save:
// if the log write fails, the error is logged and the edit still goes through.

import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

let tableReady: Promise<void> | null = null;

export function ensureChangeLogTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ChangeLog" (
          id TEXT PRIMARY KEY,
          "paperId" TEXT NOT NULL,
          "entityType" TEXT NOT NULL,
          action TEXT NOT NULL,
          summary TEXT NOT NULL,
          details TEXT,
          "actorId" TEXT,
          "actorEmail" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )`);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ChangeLog_paperId_idx" ON "ChangeLog" ("paperId", "createdAt")`
      );
    })().catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
}

export interface FieldChange {
  field: string;
  from: string;
  to: string;
}

// Compares only the fields that were sent, and returns the ones that changed
export function diffFields(
  before: Record<string, any>,
  after: Record<string, any>,
  fields: string[]
): FieldChange[] {
  const clip = (v: unknown) => String(v ?? "").slice(0, 300);
  const changes: FieldChange[] = [];
  for (const f of fields) {
    if (after[f] === undefined) continue;
    if (clip(before[f]) !== clip(after[f])) {
      changes.push({ field: f, from: clip(before[f]), to: clip(after[f]) });
    }
  }
  return changes;
}

export async function logChange(input: {
  paperId: string;
  entityType: "Question" | "Paper";
  action: string;
  summary: string;
  details?: unknown;
  actorId?: string | null;
  actorEmail?: string | null;
}): Promise<void> {
  try {
    await ensureChangeLogTable();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ChangeLog" (id, "paperId", "entityType", action, summary, details, "actorId", "actorEmail")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      randomUUID(),
      input.paperId,
      input.entityType,
      input.action,
      input.summary,
      input.details === undefined ? null : JSON.stringify(input.details),
      input.actorId ?? null,
      input.actorEmail ?? null
    );
  } catch (error) {
    console.error("Change log write failed:", error);
  }
}

export async function getChanges(paperId: string, limit = 200): Promise<any[]> {
  await ensureChangeLogTable();
  return (await prisma.$queryRawUnsafe(
    `SELECT id, "entityType", action, summary, details, "actorEmail", "createdAt"
     FROM "ChangeLog" WHERE "paperId" = $1
     ORDER BY "createdAt" DESC LIMIT $2`,
    paperId,
    limit
  )) as any[];
}
