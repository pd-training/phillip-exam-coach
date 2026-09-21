import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { firstName, lastName, email } = await request.json();
    const userId = (session.user as any).id;

    const fullName = `${firstName} ${lastName}`.trim();

    // Update user
    await prisma.$queryRaw`
      UPDATE "User"
      SET "name" = ${fullName}
      WHERE "id" = ${userId}
    `;

    return Response.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    console.error("Admin account update error:", error);
    return Response.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
