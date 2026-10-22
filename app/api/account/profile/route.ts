import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";
import { normalizeSgPhone } from "@/lib/phone";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS phone TEXT`;
    const rows = await prisma.$queryRaw`SELECT phone FROM "User" WHERE id = ${userId}` as any[];
    return Response.json({ phone: rows?.[0]?.phone ?? null });
  } catch (error) {
    console.error("Profile load error:", error);
    return Response.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

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

    if (phone !== undefined) {
      const normalized = normalizeSgPhone(phone);
      if (normalized.error) {
        return Response.json({ error: normalized.error }, { status: 400 });
      }
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS phone TEXT`;
      await prisma.$executeRaw`UPDATE "User" SET phone = ${normalized.value} WHERE id = ${userId}`;
    }

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
