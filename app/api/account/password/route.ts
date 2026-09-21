import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    const userId = (session.user as any).id;
    const userEmail = session.user.email;

    if (!userId || !userEmail) {
      return Response.json({ error: "User information not found" }, { status: 400 });
    }

    // Verify current password
    const users = await prisma.$queryRaw`
      SELECT id, email, password FROM "User" WHERE id = ${userId}
    `;

    const user = (users as any[])?.[0];
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) {
      return Response.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.$executeRaw`
      UPDATE "User" 
      SET password = ${hashedPassword}
      WHERE id = ${userId}
    `;

    return Response.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    return Response.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
