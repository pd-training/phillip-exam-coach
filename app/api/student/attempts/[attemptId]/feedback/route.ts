import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { getAttemptFeedback } from "@/lib/attempt-feedback";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { attemptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const result = await getAttemptFeedback(params.attemptId, userId);
    if (!result) {
      return Response.json({ error: "Attempt not found" }, { status: 404 });
    }
    return Response.json(result);
  } catch (error: any) {
    console.error("Attempt feedback error:", error?.message);
    return Response.json({ lines: null, source: 'rules' });
  }
}
