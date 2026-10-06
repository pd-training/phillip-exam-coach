export const dynamic = "force-dynamic";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";

export async function POST(req: Request) {
  try {
    const { userId, active } = await req.json();

    if (!userId || typeof active !== "boolean") {
      return Response.json(
        { success: false, error: "userId and active status are required" },
        { status: 400 }
      );
    }

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // Update user active status
    const result = await prisma.$queryRaw`
      UPDATE "User"
      SET active = ${active}, "updatedAt" = NOW()
      WHERE id = ${userId}
      RETURNING id, name, email, role, active, "updatedAt"
    `;

    await prisma.$disconnect();

    if (!result || result.length === 0) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = result[0];
    const statusText = active ? "activated" : "suspended";

    return Response.json({
      success: true,
      message: `User ${statusText} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
