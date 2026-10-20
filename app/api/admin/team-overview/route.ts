import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Per-student progress for the admin Team overview page.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = prisma as any;

    const students: any[] = await db.$queryRawUnsafe(`
      SELECT id, name, email FROM "User" WHERE role = 'STUDENT' ORDER BY name NULLS LAST, email
    `);

    const assignments: any[] = await db.$queryRawUnsafe(`
      SELECT sp."userId", p.id::text AS "paperId", p.title, p."passingScore"
      FROM "StudentPaper" sp
      JOIN "Paper" p ON p.id = sp."paperId"
      WHERE sp.status = 'active'
    `);

    // Full exam attempts (Sim): count, best score and latest submission per student and paper
    const fullExam: any[] = await db.$queryRawUnsafe(`
      SELECT "userId", "paperId"::text AS "paperId", COUNT(*)::int AS attempts,
             MAX(score)::int AS "bestScore", MAX("submittedAt") AS "lastAt"
      FROM examattempt
      WHERE score IS NOT NULL
      GROUP BY "userId", "paperId"
    `);

    // Quick quiz sessions (Prac). The table is created on first save, so treat it as optional.
    let quizzes: any[] = [];
    try {
      quizzes = await db.$queryRawUnsafe(`
        SELECT "userId", "paperId", COUNT(*)::int AS attempts,
               MAX(percentage)::int AS "bestScore", MAX("createdAt") AS "lastAt"
        FROM "QuickQuizSession"
        GROUP BY "userId", "paperId"
      `);
    } catch {
      quizzes = [];
    }

    const key = (userId: string, paperId: string) => `${userId}|${paperId}`;
    const sim = new Map(fullExam.map((r) => [key(r.userId, r.paperId), r]));
    const prac = new Map(quizzes.map((r) => [key(r.userId, r.paperId), r]));

    const rows = students.map((st) => {
      const papers = assignments
        .filter((a) => a.userId === st.id)
        .map((a) => {
          const s = sim.get(key(st.id, a.paperId));
          const p = prac.get(key(st.id, a.paperId));
          return {
            paperId: a.paperId,
            title: a.title,
            passingScore: a.passingScore,
            sim: { attempts: s?.attempts || 0, bestScore: s?.bestScore ?? null },
            prac: { attempts: p?.attempts || 0, bestScore: p?.bestScore ?? null },
          };
        });

      const lastDates = [
        ...fullExam.filter((r) => r.userId === st.id).map((r) => r.lastAt),
        ...quizzes.filter((r) => r.userId === st.id).map((r) => r.lastAt),
      ]
        .filter(Boolean)
        .map((d) => new Date(d).getTime());

      return {
        id: st.id,
        name: st.name || st.email,
        email: st.email,
        papers,
        simAttempts: papers.reduce((n, p) => n + p.sim.attempts, 0),
        pracAttempts: papers.reduce((n, p) => n + p.prac.attempts, 0),
        lastActive: lastDates.length ? new Date(Math.max(...lastDates)).toISOString() : null,
      };
    });

    const started = rows.filter((r) => r.simAttempts + r.pracAttempts > 0).length;
    const notStarted = assignments.filter(
      (a) => !sim.has(key(a.userId, a.paperId)) && !prac.has(key(a.userId, a.paperId))
    ).length;

    return NextResponse.json({
      summary: {
        students: rows.length,
        started,
        simAttempts: fullExam.reduce((n, r) => n + Number(r.attempts), 0),
        notStarted,
      },
      students: rows,
    });
  } catch (error: any) {
    console.error("Team overview error:", error?.message || error);
    return NextResponse.json({ error: "Could not load overview" }, { status: 500 });
  }
}
