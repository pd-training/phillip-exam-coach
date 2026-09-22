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

    if (!userId) {
      console.error('No userId in session');
      return Response.json({ error: "Session error: no userId" }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const paperId = body?.paperId?.trim();

    if (!paperId) {
      return Response.json({ error: "paperId required" }, { status: 400 });
    }

    console.log('Paper request - userId:', userId, 'paperId:', paperId);

    // Validate paperId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paperId)) {
      console.error('Invalid paperId format:', paperId);
      return Response.json({ error: "Invalid paperId format" }, { status: 400 });
    }

    // Check if request already exists (any status)
    console.log('Checking for existing requests...');
    let existingRequest;
    try {
      existingRequest = await (prisma as any).paperRequest.findMany({
        where: {
          userId: userId,
          paperId: paperId
        },
        select: {
          id: true,
          status: true
        }
      });

      console.log('Existing requests found:', existingRequest?.length || 0);
    } catch (checkError: any) {
      console.error("Error checking existing request:", {
        code: checkError.code,
        message: checkError.message
      });
      existingRequest = [];
    }

    if (existingRequest && existingRequest.length > 0) {
      const req = existingRequest[0];
      if (req.status === 'approved') {
        return Response.json(
          { error: "You already have access to this paper" },
          { status: 400 }
        );
      }
      return Response.json(
        { error: `Request already ${req.status} for this paper` },
        { status: 400 }
      );
    }

    // Create new paper request
    console.log('Creating paper request - userId:', userId, 'paperId:', paperId);
    try {
      await (prisma as any).paperRequest.create({
        data: {
          userId: userId,
          paperId: paperId,
          status: 'pending'
        }
      });
      console.log('INSERT successful');
    } catch (insertError: any) {
      console.error('INSERT error:', {
        code: insertError.code,
        message: insertError.message
      });
      throw insertError;
    }

    return Response.json({
      success: true,
      message: "Request submitted. Admin will review shortly.",
    });
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    const errorCode = error?.code || 'UNKNOWN';

    // Map PostgreSQL error codes
    let userMessage = errorMsg;
    if (errorCode === '23503') {
      userMessage = 'Invalid student or paper ID';
    } else if (errorCode === '23505') {
      userMessage = 'Request already exists';
    }

    console.error('Paper request error - Code:', errorCode, 'Message:', errorMsg);
    return Response.json(
      { error: userMessage, code: errorCode },
      { status: 500 }
    );
  }
}
