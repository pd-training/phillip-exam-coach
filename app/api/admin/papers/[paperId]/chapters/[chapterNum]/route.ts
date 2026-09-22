import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { paperId: string; chapterNum: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { title } = body;
    const chapterNumber = parseInt(params.chapterNum);

    console.log('Updating chapter:', chapterNumber, 'for paper:', params.paperId);

    const chapter = await (prisma as any).chapter.update({
      where: {
        paperId_number: {
          paperId: params.paperId,
          number: chapterNumber,
        }
      },
      data: { title }
    });

    return NextResponse.json({ chapter });
  } catch (error: any) {
    console.error('Update chapter error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to update chapter' },
      { status: 500 }
    );
  }
}
