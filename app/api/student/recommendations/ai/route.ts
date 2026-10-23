import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { generateStudyAdvice } from "@/lib/study-advice";
import { computeRecommendations } from "@/lib/student-recommendations";

export const dynamic = "force-dynamic";

// AI study advice for the signed-in student. Uses the rules-based
// recommendations as input, and falls back to them if the AI call fails.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const recommendations = await computeRecommendations(userId);

    try {
      const advice = await generateStudyAdvice(recommendations);
      return Response.json({ advice, recommendations, aiUsed: true });
    } catch (error: any) {
      console.error("AI study advice failed:", error?.message);
      return Response.json({
        advice: [],
        recommendations,
        aiUsed: false,
        details: error?.message,
      });
    }
  } catch (error: any) {
    console.error("Study advice failed:", error?.message);
    return Response.json(
      { error: "Could not load practice results", details: error?.message },
      { status: 500 }
    );
  }
}
