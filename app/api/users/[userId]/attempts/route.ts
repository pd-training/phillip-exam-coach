import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return empty attempts for now - schema needs investigation
    const attempts: any[] = [];

    return Response.json({ attempts });
  } catch (error) {
    console.error("Error fetching attempts:", error);
    return Response.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}
