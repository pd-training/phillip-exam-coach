import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get all requests for this student
    const requests = await prisma.$queryRaw`
      SELECT 
        pr.id,
        pr."paperId",
        pr.status,
        pr."requestedAt",
        p.title as paper_name
      FROM "PaperRequest" pr
      JOIN "Paper" p ON pr."paperId" = p.id
      WHERE pr."userId" = ${userId}
      ORDER BY pr."requestedAt" DESC
    ` as any[];

    return Response.json({ requests });
  } catch (error: any) {
    console.error("Student paper requests error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { paperId } = await request.json();

    console.log('Paper request - userId:', userId, 'paperId:', paperId);

    if (!paperId) {
      return Response.json({ error: "paperId required" }, { status: 400 });
    }

    // Validate paperId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paperId)) {
      console.error('Invalid paperId format:', paperId);
      return Response.json({ error: "Invalid paperId format" }, { status: 400 });
    }

    // userId is a CUID, not a UUID - skip UUID validation for userId

    // Check if student already has this paper (via approved request)
    let existingApprovedRequest;
    try {
      existingApprovedRequest = await prisma.$queryRaw`
        SELECT id FROM "PaperRequest"
        WHERE "userId" = ${userId}
        AND "paperId" = ${paperId}
        AND status = 'approved'
      ` as any[];
    } catch (e) {
      console.error("Error checking approved request:", e);
      existingApprovedRequest = [];
    }

    if (existingApprovedRequest && existingApprovedRequest.length > 0) {
      return Response.json(
        { error: "You already have access to this paper" },
        { status: 400 }
      );
    }

    // Check if request already exists (pending or approved)
    let existingRequest;
    try {
      existingRequest = await prisma.$queryRaw`
        SELECT id, status FROM "PaperRequest"
        WHERE "userId" = ${userId}
        AND "paperId" = ${paperId}
        AND status IN ('pending', 'approved')
      ` as any[];
    } catch (e) {
      console.error("Error checking existing request:", e);
      existingRequest = [];
    }

    if (existingRequest && existingRequest.length > 0) {
      return Response.json(
        {
          error: `Request already ${
            existingRequest[0].status === 'pending' ? 'pending' : 'approved'
          } for this paper`,
        },
        { status: 400 }
      );
    }

    // Create new paper request
    console.log('About to INSERT paper request - userId:', userId, 'paperId:', paperId);
    try {
      await prisma.$queryRaw`
        INSERT INTO "PaperRequest" ("userId", "paperId", status, "requestedAt")
        VALUES (${userId}, ${paperId}, 'pending', NOW())
      `;
      console.log('INSERT successful');
    } catch (insertError: any) {
      console.error('INSERT error code:', insertError.code);
      console.error('INSERT error message:', insertError.message);
      console.error('Full INSERT error:', JSON.stringify(insertError, null, 2));
      throw insertError;
    }

    return Response.json({
      success: true,
      message: "Request submitted. Admin will review shortly.",
    });
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || 'UNKNOWN';
    console.error('Create paper request error - Code:', errorCode, 'Message:', errorMsg);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return Response.json(
      { error: errorMsg, code: errorCode },
      { status: 500 }
    );
  }
}
