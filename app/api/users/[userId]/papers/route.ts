import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const papers = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.title,
        pr.status
      FROM "PaperRequest" pr
      JOIN "Paper" p ON pr."paperId" = p.id
      WHERE pr."userId" = ${params.userId}
      ORDER BY p.title ASC
    ` as any[];

    return Response.json({ papers: papers || [] });
  } catch (error: any) {
    console.error("Error fetching papers:", error);
    return Response.json({ error: "Failed to fetch papers" }, { status: 500 });
  }
}
