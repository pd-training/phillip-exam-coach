import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { getChanges } from "@/lib/change-log";

export const dynamic = "force-dynamic";

// Change history for one paper (admin only)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const changes = await getChanges(params.id);
    return NextResponse.json({ changes });
  } catch (error: any) {
    console.error("Change log read failed:", error);
    return NextResponse.json({ error: "Could not load change history", details: error?.message }, { status: 500 });
  }
}
