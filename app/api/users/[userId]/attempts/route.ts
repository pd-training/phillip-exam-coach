import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempts = await prisma.$queryRaw`
      SELECT 
        ea.id,
        ea."paperId",
        p.title as "paperTitle",
        ea.status,
        ea."overallScore" as score,
        CASE 
          WHEN ea."overallScore" >= COALESCE(p."passingScore", 50) THEN 'Pass'
          WHEN ea."overallScore" IS NULL THEN NULL
          ELSE 'Fail'
        END as result,
        FLOOR(EXTRACT(EPOCH FROM (ea."submittedAt" - ea."createdAt")) / 60)::INT as "timeTaken",
        ea."submittedAt",
        ea."createdAt"
      FROM "ExamAttempt" ea
      LEFT JOIN "Paper" p ON ea."paperId" = p.id
      WHERE ea."userId" = ${params.userId}
      ORDER BY ea."createdAt" DESC
      LIMIT 50
    ` as any[];

    return Response.json({ attempts: attempts || [] });
  } catch (error: any) {
    console.error("Error fetching attempts:", error);
    return Response.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}
