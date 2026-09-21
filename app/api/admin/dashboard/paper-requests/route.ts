import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const requests = await prisma.$queryRaw`
      SELECT 
        pr.id,
        pr."userId",
        pr."paperId",
        pr."requestedAt",
        pr.status,
        u.name as student_name,
        u.email as student_email,
        p.title as paper_name
      FROM "PaperRequest" pr
      JOIN "User" u ON pr."userId" = u.id
      JOIN "Paper" p ON pr."paperId" = p.id
      WHERE pr.status = 'pending'
      ORDER BY pr."requestedAt" ASC
    ` as any[];

    return Response.json({ requests });
  } catch (error: any) {
    console.error("Paper requests error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { requestId, action } = await request.json();

    if (!["approve", "reject"].includes(action)) {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "approve") {
      // Get the request details
      const reqResult = await prisma.$queryRaw`
        SELECT "userId", "paperId" FROM "PaperRequest"
        WHERE id = ${requestId}
      ` as any[];

      if (reqResult.length === 0) {
        return Response.json({ error: "Request not found" }, { status: 404 });
      }

      // Update request status to approved
      await prisma.$queryRaw`
        UPDATE "PaperRequest"
        SET status = 'approved', "reviewedAt" = NOW()
        WHERE id = ${requestId}
      `;

      return Response.json({ success: true, message: "Request approved" });
    } else {
      // Reject
      await prisma.$queryRaw`
        UPDATE "PaperRequest"
        SET status = 'rejected', "respondedAt" = NOW()
        WHERE id = ${requestId}
      `;

      return Response.json({ success: true, message: "Request rejected" });
    }
  } catch (error: any) {
    console.error("Paper request action error:", error);
    return Response.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
