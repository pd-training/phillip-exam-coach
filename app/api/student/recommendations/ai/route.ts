import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { generateStudyAdvice } from "@/lib/study-advice";
import type { Recommendations } from "@/lib/progress-recommendations";

export const dynamic = "force-dynamic";

// AI study advice for the signed-in student. Uses the rules-based
// recommendations as input, and falls back to them if the AI call fails.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reuse the rules engine by calling it with the student's own cookies
  const rulesRes = await fetch(`${req.nextUrl.origin}/api/student/recommendations`, {
    headers: { cookie: req.headers.get("cookie") || "" },
    cache: "no-store",
  });
  if (!rulesRes.ok) {
    return Response.json({ error: "Could not load practice results" }, { status: 500 });
  }
  const recommendations: Recommendations = await rulesRes.json();

  try {
    const advice = await generateStudyAdvice(recommendations);
    return Response.json({ advice, recommendations, aiUsed: true });
  } catch (error: any) {
    console.error("AI study advice failed:", error?.message);
    return Response.json({
      advice: [],
      recommendations,
      aiUsed: false,
    });
  }
}
