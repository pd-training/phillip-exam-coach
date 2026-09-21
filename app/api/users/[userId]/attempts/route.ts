import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

// Fetch user exam attempts
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

    // Return empty attempts for now - schema needs investigation
    const attempts: any[] = [];

    return Response.json({ attempts });
  } catch (error) {
    console.error("Error fetching attempts:", error);
    return Response.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}
