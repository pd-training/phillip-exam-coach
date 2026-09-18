import { PrismaClient } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Delete existing admin
    await prisma.user.deleteMany({ where: { email: "admin@phillip.com" } });

    // Hash password using Node's built-in crypto
    const password = "Admin@123";
    const hash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: "admin@phillip.com",
        name: "Admin",
        password: hash,
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
