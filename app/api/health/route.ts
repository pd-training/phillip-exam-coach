import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Health check started');
    console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as health` as any[];
    
    console.log('Database query successful');
    
    return Response.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Health check error:", error.message);
    console.error("Full error:", error);
    return Response.json(
      {
        status: 'error',
        error: error.message,
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'not set',
      },
      { status: 500 }
    );
  }
}
