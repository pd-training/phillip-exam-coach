import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const attempts = await prisma.$queryRaw`
      SELECT 
        ea.id,
        ea.paperid,
        p.title as "paperTitle",
        ea.score,
        CASE 
          WHEN ea.score >= COALESCE(p."passingScore", 50) THEN 'Pass'
          WHEN ea.score IS NULL THEN NULL
          ELSE 'Fail'
        END as result,
        FLOOR(EXTRACT(EPOCH FROM (ea.submittedat - ea.startedat)) / 60)::INT as "timeTaken",
        ea.submittedat,
        ea.createdat
      FROM examattempt ea
      LEFT JOIN "Paper" p ON ea.paperid = p.id
      WHERE ea.userid = ${userId}
      ORDER BY ea.submittedat DESC
      LIMIT 50
    ` as any[];

    // Calculate stats
    const fullExamAttempts = attempts || [];
    const completedCount = fullExamAttempts.length;
    const averageScore = completedCount > 0
      ? Math.round(fullExamAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / completedCount)
      : 0;
    const passCount = fullExamAttempts.filter((a: any) => a.result === 'Pass').length;

    return Response.json({ 
      attempts: fullExamAttempts,
      stats: {
        completedCount,
        averageScore,
        passCount,
      }
    });
  } catch (error: any) {
    console.error("Error fetching student attempts:", error);
    return Response.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}
