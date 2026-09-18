export const dynamic = "force-dynamic";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";

export async function GET() {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    const users = await prisma.$queryRaw`
      SELECT id, email, name, role, "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `;

    await prisma.$disconnect();

    return Response.json({
      success: true,
      users: users || [],
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return Response.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const bcrypt = require("bcryptjs");
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // Check if user already exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE email = ${email}
    `;

    if (existing && existing.length > 0) {
      await prisma.$disconnect();
      return Response.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use raw SQL to bypass Prisma enum validation
    const result = await prisma.$queryRaw`
      INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${email}, ${hashedPassword}, ${role || "STUDENT"}, NOW(), NOW())
      RETURNING id, name, email, role, "createdAt"
    `;

    await prisma.$disconnect();

    return Response.json({
      success: true,
      user: result?.[0] || null,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
