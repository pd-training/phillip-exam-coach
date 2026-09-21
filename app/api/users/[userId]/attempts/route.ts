import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach",
    },
  },
});

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawAttempts = await prisma.attempt.findMany({
      where: { userId: params.userId },
      include: {
        paper: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const attempts = rawAttempts.map((a) => ({
      id: a.id,
      paperId: a.paperId,
      paperTitle: a.paper.title,
      status: a.status,
      overallScore: a.overallScore,
      passed: a.passed,
      submittedAt: a.submittedAt,
      createdAt: a.createdAt,
    }));

    return Response.json({ attempts });
  } catch (error) {
    console.error("Error fetching attempts:", error);
    return Response.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}
