import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Attempt = {
  kind: "Full exam" | "Quick quiz";
  paperId: string;
  title: string;
  score: number;
  passingScore: number;
  date: string;
};

// Admin dashboard data: account totals, student progress and attempt history.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = prisma as any;

    const roleCounts: any[] = await db.$queryRawUnsafe(`
      SELECT role, COUNT(*)::int AS count FROM "User" GROUP BY role
    `);
    // Notes are saved on the user page; make sure the column exists before reading it
    await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS remarks TEXT`);

    const students: any[] = await db.$queryRawUnsafe(`
      SELECT id, name, email, remarks FROM "User" WHERE role = 'STUDENT' ORDER BY name NULLS LAST, email
    `);

    // Papers are assigned through PaperRequest rows with status 'approved'
    const assignments: any[] = await db.$queryRawUnsafe(`
      SELECT pr."userId", p.id::text AS "paperId", p.title, p."passingScore",
             COALESCE(pr."reviewedAt", pr."createdAt") AS "registeredAt"
      FROM "PaperRequest" pr
      JOIN "Paper" p ON p.id = pr."paperId"
      WHERE pr.status = 'approved'
    `);

    const examRows: any[] = await db.$queryRawUnsafe(`
      SELECT ea.userid AS "userId", ea.paperid::text AS "paperId", p.title, p."passingScore",
             ea.score, ea.submittedat AS date
      FROM examattempt ea
      JOIN "Paper" p ON p.id = ea.paperid
      WHERE ea.score IS NOT NULL
      ORDER BY ea.submittedat DESC
    `);

    // Quick quiz sessions. The table is created on first save, so treat it as optional.
    let quizRows: any[] = [];
    try {
      quizRows = await db.$queryRawUnsafe(`
        SELECT q."userId", q."paperId", p.title, p."passingScore",
               q.percentage AS score, q."createdAt" AS date
        FROM "QuickQuizSession" q
        LEFT JOIN "Paper" p ON p.id::text = q."paperId"
        ORDER BY q."createdAt" DESC
      `);
    } catch {
      quizRows = [];
    }

    const attemptsByUser = new Map<string, Attempt[]>();
    const addAttempt = (row: any, kind: Attempt["kind"]) => {
      const list = attemptsByUser.get(row.userId) || [];
      list.push({
        kind,
        paperId: row.paperId,
        title: row.title || "Paper",
        score: Number(row.score),
        passingScore: Number(row.passingScore ?? 50),
        date: new Date(row.date).toISOString(),
      });
      attemptsByUser.set(row.userId, list);
    };
    examRows.forEach((r) => addAttempt(r, "Full exam"));
    quizRows.forEach((r) => addAttempt(r, "Quick quiz"));

    const rows = students.map((st) => {
      const attempts = (attemptsByUser.get(st.id) || []).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const papers = assignments
        .filter((a) => a.userId === st.id)
        .map((a) => {
          const mine = attempts.filter((t) => t.paperId === a.paperId);
          const fullExamAttempts = mine.filter((t) => t.kind === "Full exam");
          const passed = fullExamAttempts.some((t) => t.score >= Number(a.passingScore));
          const status = passed
            ? "Passed"
            : fullExamAttempts.length > 0
              ? "Failed"
              : "Not started";
          const bestFull = fullExamAttempts.length
            ? Math.max(...fullExamAttempts.map((t) => t.score))
            : null;
          const quizzes = mine.filter((t) => t.kind === "Quick quiz");
          const bestQuiz = quizzes.length ? Math.max(...quizzes.map((t) => t.score)) : null;
          return {
            paperId: a.paperId,
            title: a.title,
            passingScore: Number(a.passingScore),
            registeredAt: a.registeredAt ? new Date(a.registeredAt).toISOString() : null,
            status,
            bestFull,
            bestQuiz,
          };
        });

      return {
        id: st.id,
        name: st.name || st.email,
        email: st.email,
        remarks: st.remarks || "",
        papers,
        attemptCount: attempts.length,
        lastActive: attempts.length ? attempts[0].date : null,
        attempts: attempts.slice(0, 50),
      };
    });

    const studentCount = students.length;
    const activeCount = rows.filter((r) => r.attemptCount > 0).length;
    const totalAttempts = rows.reduce((n, r) => n + r.attemptCount, 0);
    const count = (role: string) => Number(roleCounts.find((r) => r.role === role)?.count || 0);

    return NextResponse.json({
      summary: {
        allUsers: roleCounts.reduce((n, r) => n + Number(r.count), 0),
        students: studentCount,
        admins: count("ADMIN"),
        activeStudents: activeCount,
        totalAttempts,
        avgAttemptsPerStudent: studentCount ? Math.round((totalAttempts / studentCount) * 10) / 10 : 0,
      },
      students: rows,
    });
  } catch (error: any) {
    console.error("Team overview error:", error?.message || error);
    return NextResponse.json({ error: "Could not load overview" }, { status: 500 });
  }
}
