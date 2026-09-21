import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, lastName, phone } = await req.json();
    const userId = (session.user as any).id;

    if (!userId) {
      return Response.json({ error: "User ID not found in session" }, { status: 400 });
    }

    // Combine first and last name
    const fullName = `${firstName} ${lastName}`.trim();

    // Update using raw SQL to avoid Prisma issues
    await prisma.$executeRaw`
      UPDATE "User" 
      SET name = ${fullName}
      WHERE id = ${userId}
    `;

    return Response.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return Response.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
