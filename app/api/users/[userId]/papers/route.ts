import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
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

    const assignments = await prisma.assignment.findMany({
      where: { userId: params.userId },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const papers = assignments.map((a) => a.paper);

    return Response.json({ papers });
  } catch (error) {
    console.error("Error fetching papers:", error);
    return Response.json({ error: "Failed to fetch papers" }, { status: 500 });
  }
}
