import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const paperId = params.paperId;

    if (!paperId) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
    }

    console.log('Creating chapters for paper:', paperId);

    // Get unique chapter numbers from questions
    const questions = await (prisma as any).question.findMany({
      where: { paperId: paperId },
      select: { chapterNumber: true },
      distinct: ['chapterNumber'],
      orderBy: { chapterNumber: 'asc' }
    });

    console.log('Found chapter numbers:', questions.map((q: any) => q.chapterNumber));

    let createdCount = 0;

    // Create chapters for each unique chapter number
    for (const q of questions) {
      try {
        const existing = await (prisma as any).chapter.findUnique({
          where: {
            paperId_number: {
              paperId: paperId,
              number: q.chapterNumber
            }
          }
        });

        if (!existing) {
          await (prisma as any).chapter.create({
            data: {
              paperId: paperId,
              number: q.chapterNumber,
              title: `Chapter ${q.chapterNumber}`
            }
          });
          createdCount++;
          console.log('✅ Created chapter:', q.chapterNumber);
        } else {
          console.log('ℹ️  Chapter already exists:', q.chapterNumber);
        }
      } catch (err: any) {
        console.error('Error creating chapter', q.chapterNumber, ':', err.message);
      }
    }

    console.log('✅ Total chapters created:', createdCount);

    return NextResponse.json({
      success: true,
      message: `Created ${createdCount} chapters from questions`,
      chaptersCreated: createdCount,
      totalChapters: questions.length
    });

  } catch (error: any) {
    console.error('Create chapters error:', error);

    return NextResponse.json(
      { 
        error: error.message || 'Failed to create chapters'
      },
      { status: 500 }
    );
  }
}
