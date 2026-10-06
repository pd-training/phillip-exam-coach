import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (user?.role !== 'ADMIN') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    console.log('Starting score recalculation for all attempts...');

    // Fetch all attempts with their related data
    const attempts = await prisma.$queryRaw`
      SELECT
        ea.id,
        ea.paperid,
        ea.score as old_score,
        ea.passed as old_passed,
        ea.answers,
        ea."questionIds",
        ea."partScores",
        p."totalQuestions",
        p."passingScore"
      FROM examattempt ea
      LEFT JOIN "Paper" p ON ea.paperid = p.id
      ORDER BY ea."submittedat" DESC
    ` as any[];

    console.log(`Found ${attempts.length} attempts to recalculate`);

    let updatedCount = 0;
    let changedCount = 0;
    const changes: any[] = [];

    for (const attempt of attempts) {
      // Parse answers and questionIds
      let answers: Record<string, string> = {};
      let questionIds: string[] = [];

      try {
        if (attempt.answers) {
          answers = typeof attempt.answers === 'string'
            ? JSON.parse(attempt.answers)
            : attempt.answers;
        }
        if (attempt.questionIds) {
          questionIds = typeof attempt.questionIds === 'string'
            ? JSON.parse(attempt.questionIds)
            : attempt.questionIds;
        }
      } catch (err) {
        console.log(`Could not parse answers/questionIds for attempt ${attempt.id}:`, err);
      }

      // Fetch all questions for this paper
      const questions = await prisma.$queryRaw`
        SELECT id, "correctAnswer"
        FROM "Question"
        WHERE "paperId"::text = ${attempt.paperid}::text
      ` as any[];

      // Count correct answers
      let correctCount = 0;
      for (const questionId of questionIds) {
        const question = questions.find((q: any) => q.id === questionId);
        if (question && answers[questionId] === question.correctAnswer) {
          correctCount++;
        }
      }

      // Calculate new score
      // Priority: questionIds.length > sum of exam parts > paper.totalQuestions
      let totalQuestions = questionIds.length || attempt.totalQuestions || 0;

      if (totalQuestions === 0) {
        // Try to get from partScores if available
        try {
          if (attempt.partScores) {
            const partScores = typeof attempt.partScores === 'string'
              ? JSON.parse(attempt.partScores)
              : attempt.partScores;
            if (Array.isArray(partScores)) {
              totalQuestions = partScores.reduce((sum: number, p: any) => sum + (p.total || 0), 0);
            }
          }
        } catch (err) {
          console.log(`Could not parse partScores for attempt ${attempt.id}`);
        }
      }

      const newScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const passingScore = attempt.passingScore || 75;
      const newPassed = newScore >= passingScore;

      // Update if score changed
      if (newScore !== attempt.old_score || newPassed !== attempt.old_passed) {
        await prisma.$queryRaw`
          UPDATE examattempt
          SET score = ${newScore}, passed = ${newPassed}
          WHERE id = ${attempt.id}
        `;

        changedCount++;
        changes.push({
          attemptId: attempt.id,
          oldScore: attempt.old_score,
          newScore: newScore,
          oldPassed: attempt.old_passed,
          newPassed: newPassed,
          totalQuestions: totalQuestions,
          correctCount: correctCount,
        });

        console.log(`Updated attempt ${attempt.id}: ${attempt.old_score}% -> ${newScore}%, passed: ${attempt.old_passed} -> ${newPassed}`);
      }

      updatedCount++;
    }

    console.log(`Recalculation complete: ${changedCount} attempts changed out of ${updatedCount} processed`);

    return Response.json({
      success: true,
      message: `Processed ${updatedCount} attempts, updated ${changedCount} with new scores`,
      changedAttempts: changes,
    });
  } catch (error: any) {
    console.error("Error recalculating scores:", error);
    return Response.json(
      {
        error: "Failed to recalculate scores",
        details: error.message
      },
      { status: 500 }
    );
  }
}
