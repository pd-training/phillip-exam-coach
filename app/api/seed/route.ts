import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Delete existing admin
    await prisma.user.deleteMany({ where: { email: "admin@phillip.com" } });

    // Create admin user
    const hashedPassword = await hash("Admin@123", 10);
    
    const admin = await prisma.user.create({
      data: {
        email: "admin@phillip.com",
        name: "Admin",
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });

    return Response.json({ success: true, admin });
  } catch (error) {
    console.error(error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
