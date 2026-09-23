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

    const attempts = await prisma.$queryRaw`
      SELECT 
        ea.id,
        ea.userid,
        ea.paperid,
        ea.score,
        ea.passed,
        ea.startedat,
        ea.submittedat,
        u.name as student_name,
        p.title as paper_name,
        p."passingScore"
      FROM examattempt ea
      JOIN "User" u ON ea.userid = u.id
      JOIN "Paper" p ON ea.paperid = p.id
      ORDER BY ea.submittedat DESC
      LIMIT 10
    ` as any[];

    // Add timeTaken calculation to each attempt
    const attemptsWithTime = attempts.map(attempt => ({
      ...attempt,
      timeTaken: Math.round(
        (new Date(attempt.submittedat).getTime() - new Date(attempt.startedat).getTime()) / 1000
      ),
    }));

    return Response.json({ attempts: attemptsWithTime });
  } catch (error: any) {
    console.error("Recent attempts error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}
