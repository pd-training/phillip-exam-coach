import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;

    const paper = await prisma.paper.findUnique({
      where: { id: paperId as any },
      select: { totalTime: true },
    });

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const parts = await prisma.examPart.findMany({
      where: { paperId: paperId as any },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({
      examFormat: {
        totalTime: paper.totalTime,
        parts,
      },
    });
  } catch (error: any) {
    console.error('Get exam format error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exam format' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { totalTime, parts } = body;
    const paperId = params.id;

    // Update paper totalTime
    await prisma.paper.update({
      where: { id: paperId as any },
      data: { totalTime },
    });

    // Delete existing parts
    await prisma.examPart.deleteMany({
      where: { paperId: paperId as any },
    });

    // Create new parts
    const created = await prisma.examPart.createMany({
      data: parts.map((p: any) => ({
        paperId: paperId as any,
        ...p,
      })),
    });

    return NextResponse.json({
      success: true,
      partsCreated: created.count,
    });
  } catch (error: any) {
    console.error('Save exam format error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save exam format' },
      { status: 500 }
    );
  }
}
