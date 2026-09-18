import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

export async function GET() {
  try {
    const prisma = new PrismaClient();

    // Generate correct hash
    const correctHash = crypto
      .createHash("sha256")
      .update("Admin@123")
      .digest("hex");

    // Update admin password
    const user = await prisma.user.update({
      where: { email: "admin@phillip.com" },
      data: { password: correctHash },
    });

    return Response.json({
      success: true,
      message: "Password reset",
      user: {
        email: user.email,
        passwordHash: user.password,
      },
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
