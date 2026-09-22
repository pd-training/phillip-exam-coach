import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'authenticated' : 'no session');

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    console.log('userId from session:', userId);

    // Parse body
    let body;
    try {
      body = await request.json();
      console.log('Parsed body:', body);
    } catch (e: any) {
      console.error('JSON parse error:', e.message);
      return Response.json({ error: 'JSON parse failed' }, { status: 400 });
    }

    const paperId = body?.paperId;
    console.log('paperId from body:', paperId);

    if (!paperId) {
      return Response.json({ error: 'paperId required' }, { status: 400 });
    }

    // Test UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(paperId);
    console.log('paperId is valid UUID:', isValidUUID);

    if (!isValidUUID) {
      return Response.json({ error: 'Invalid paperId format' }, { status: 400 });
    }

    // Test database query
    console.log('About to query database...');
    try {
      const existing = await prisma.$queryRaw`
        SELECT id, status FROM "PaperRequest"
        WHERE "userId" = ${userId}
        AND "paperId" = ${paperId}
      ` as any[];
      
      console.log('Query successful, found:', existing?.length || 0);
      
      return Response.json({
        success: true,
        userId,
        paperId,
        existing: existing?.length || 0,
        message: 'Test passed'
      });
    } catch (dbError: any) {
      console.error('Database query error:', {
        code: dbError.code,
        message: dbError.message,
        detail: dbError.meta?.cause
      });
      throw dbError;
    }
  } catch (error: any) {
    console.error('Test endpoint error:', error.message);
    return Response.json(
      { error: error.message, code: error.code },
      { status: 500 }
    );
  }
}
