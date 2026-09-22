import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description } = body;

    console.log('Updating paper:', params.paperId, 'title:', title);

    const paper = await (prisma as any).paper.update({
      where: { id: params.paperId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
      }
    });

    return NextResponse.json({ paper });
  } catch (error: any) {
    console.error('Update paper error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to update paper' },
      { status: 500 }
    );
  }
}
