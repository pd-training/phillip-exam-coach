export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
    timestamp: new Date().toISOString()
  });
}
