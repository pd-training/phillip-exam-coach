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
        ea."userId",
        ea."paperId",
        ea.score,
        ea."submittedAt",
        u.name as student_name,
        p.title as paper_name
      FROM examattempt ea
      JOIN "user" u ON ea."userId" = u.id
      JOIN paper p ON ea."paperId" = p.id
      ORDER BY ea."submittedAt" DESC
      LIMIT 10
    ` as any[];

    return Response.json({ attempts });
  } catch (error: any) {
    console.error("Recent attempts error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}
