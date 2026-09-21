import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Total users
    const totalUsersResult = await prisma.$queryRaw`
      SELECT COUNT(*)::integer as count FROM "User"
    ` as any[];
    const totalUsers = parseInt(totalUsersResult[0]?.count || 0);

    // Active users (users with at least one attempt)
    const activeUsersResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT "userId")::integer as count FROM "ExamAttempt"
    ` as any[];
    const activeUsers = parseInt(activeUsersResult[0]?.count || 0);

    // Attempts today
    const todayAttemptsResult = await prisma.$queryRaw`
      SELECT COUNT(*)::integer as count FROM "ExamAttempt"
      WHERE DATE("submittedAt") = CURRENT_DATE
    ` as any[];
    const attemptsToday = parseInt(todayAttemptsResult[0]?.count || 0);

    // Average score (only submitted attempts)
    const avgScoreResult = await prisma.$queryRaw`
      SELECT AVG("overallScore")::numeric as avg FROM "ExamAttempt"
      WHERE "overallScore" IS NOT NULL
    ` as any[];
    const avgScore = avgScoreResult[0]?.avg ? parseFloat(avgScoreResult[0].avg).toFixed(1) : "0";

    // Pass rate
    const passRateResult = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::integer as total,
        SUM(CASE WHEN "overallScore" >= 50 THEN 1 ELSE 0 END)::integer as passed
      FROM "ExamAttempt"
      WHERE "overallScore" IS NOT NULL
    ` as any[];
    
    const total = parseInt(passRateResult[0]?.total || 0);
    const passed = parseInt(passRateResult[0]?.passed || 0);
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return Response.json({
      stats: {
        totalUsers,
        activeUsers,
        attemptsToday,
        avgScore,
        passRate,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
