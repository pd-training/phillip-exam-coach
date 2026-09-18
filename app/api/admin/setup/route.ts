import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  try {
    // Check if admin exists
    const existing = await prisma.user.findUnique({
      where: { email: "admin@phillip.com" },
    });

    if (existing) {
      return Response.json({ success: true, message: "Admin already exists" });
    }

    // Create admin user
    const hash = crypto
      .createHash("sha256")
      .update("Admin@123")
      .digest("hex");

    const admin = await prisma.user.create({
      data: {
        email: "admin@phillip.com",
        name: "Admin User",
        password: hash,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });

    return Response.json({ success: true, admin });
  } catch (error) {
    return Response.json(
      { error: String(error), message: "Setup failed - check server logs" },
      { status: 500 }
    );
  }
}
