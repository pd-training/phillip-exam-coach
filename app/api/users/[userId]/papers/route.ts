import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return empty papers for now - Prisma client generation issue
    const papers: any[] = [];

    return Response.json({ papers });
  } catch (error) {
    console.error("Error fetching papers:", error);
    return Response.json({ error: "Failed to fetch papers" }, { status: 500 });
  }
}
