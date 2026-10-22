import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";
import { normalizeSgPhone } from "@/lib/phone";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS phone TEXT`;

    const users = await prisma.$queryRaw`
      SELECT id, name, email, role, phone, "createdAt", "updatedAt"
      FROM "User"
      WHERE id = ${params.userId}
    ` as any[];

    if (!users || users.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user: users[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone } = await request.json();

    if (phone !== undefined) {
      const normalized = normalizeSgPhone(phone);
      if (normalized.error) {
        return Response.json({ error: normalized.error }, { status: 400 });
      }
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS phone TEXT`;
      await prisma.$executeRaw`UPDATE "User" SET phone = ${normalized.value}, "updatedAt" = NOW() WHERE id = ${params.userId}`;
    }

    if (name !== undefined && email !== undefined) {
      await prisma.$queryRaw`
        UPDATE "User"
        SET name = ${name}, email = ${email}, "updatedAt" = NOW()
        WHERE id = ${params.userId}
      `;
    }

    const updated = await prisma.$queryRaw`
      SELECT id, name, email, role, phone, "createdAt", "updatedAt"
      FROM "User"
      WHERE id = ${params.userId}
    ` as any[];

    return Response.json({ user: updated[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}
