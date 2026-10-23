import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { computeRecommendations } from "@/lib/student-recommendations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const result = await computeRecommendations(userId);
    return Response.json(result);
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return Response.json(
      { error: "Failed to generate recommendations", details: error.message },
      { status: 500 }
    );
  }
}
