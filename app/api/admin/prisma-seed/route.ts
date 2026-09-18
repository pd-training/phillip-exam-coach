import { PrismaClient, Role, AssignmentStatus, Difficulty, AnswerOption } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Clear existing data (optional - comment out if you want to keep old data)
    await prisma.attemptAnswer.deleteMany();
    await prisma.attemptSectionScore.deleteMany();
    await prisma.attempt.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.question.deleteMany();
    await prisma.paperSection.deleteMany();
    await prisma.paper.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.module.deleteMany();
    await prisma.user.deleteMany();

    // Create module
    const module = await prisma.module.create({
      data: {
        code: "RES5",
        name: "RES 5 - Rules, Ethics and Skills for Financial Advisory Services",
        description: "CMFAS RES5 Module",
      },
    });

    // Create paper
    const paper = await prisma.paper.create({
      data: {
        moduleId: module.id,
        title: "RES 5 Mock Exam",
        durationMinutes: 180,
        totalQuestions: 150,
      },
    });

    // Create sections (Part I & Part II)
    const partI = await prisma.paperSection.create({
      data: {
        paperId: paper.id,
        name: "Part I",
        order: 1,
        questionCount: 110,
        passThresholdPct: 75,
      },
    });

    const partII = await prisma.paperSection.create({
      data: {
        paperId: paper.id,
        name: "Part II",
        order: 2,
        questionCount: 40,
        passThresholdPct: 80,
      },
    });

    // Create topics (27 topics for RES5)
    const topics = [];
    for (let i = 1; i <= 27; i++) {
      const topic = await prisma.topic.create({
        data: {
          moduleId: module.id,
          code: i,
          name: `Topic ${i}`,
        },
      });
      topics.push(topic);
    }

    // Create sample questions (110 for Part I)
    for (let i = 0; i < 110; i++) {
      const topicIndex = Math.floor(i / 5) % topics.length;
      const answerOptions = [AnswerOption.A, AnswerOption.B, AnswerOption.C, AnswerOption.D];
      
      await prisma.question.create({
        data: {
          paperId: paper.id,
          sectionId: partI.id,
          topicId: topics[topicIndex].id,
          questionText: `Part I Question ${i + 1}: What is the correct answer to this question?`,
          optionA: "This is option A",
          optionB: "This is option B",
          optionC: "This is option C",
          optionD: "This is option D",
          correctAnswer: answerOptions[i % 4],
          explanation: `This is the explanation for Part I Question ${i + 1}. The correct answer is option ${answerOptions[i % 4]}.`,
          difficulty: [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD][i % 3],
          orderInPaper: i + 1,
        },
      });
    }

    // Create sample questions (40 for Part II)
    for (let i = 0; i < 40; i++) {
      const topicIndex = Math.floor(i / 2) % topics.length;
      const answerOptions = [AnswerOption.A, AnswerOption.B, AnswerOption.C, AnswerOption.D];
      
      await prisma.question.create({
        data: {
          paperId: paper.id,
          sectionId: partII.id,
          topicId: topics[topicIndex].id,
          questionText: `Part II Question ${i + 1}: What is the correct answer to this question?`,
          optionA: "This is option A",
          optionB: "This is option B",
          optionC: "This is option C",
          optionD: "This is option D",
          correctAnswer: answerOptions[i % 4],
          explanation: `This is the explanation for Part II Question ${i + 1}. The correct answer is option ${answerOptions[i % 4]}.`,
          difficulty: [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD][i % 3],
          orderInPaper: 111 + i,
        },
      });
    }

    // Create admin user
    const adminHash = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@phillip.com",
        passwordHash: adminHash,
        roles: [Role.ADMIN],
        active: true,
        approvedAt: new Date(),
        pdpaConsent: true,
        pdpaConsentAt: new Date(),
      },
    });

    // Create student user
    const studentHash = await bcrypt.hash("Student@123", 10);
    const student = await prisma.user.create({
      data: {
        name: "Student User",
        email: "student@phillip.com",
        passwordHash: studentHash,
        roles: [Role.STUDENT],
        active: true,
        approvedAt: new Date(),
        pdpaConsent: true,
        pdpaConsentAt: new Date(),
      },
    });

    // Assign paper to student
    await prisma.assignment.create({
      data: {
        paperId: paper.id,
        userId: student.id,
        status: AssignmentStatus.APPROVED,
      },
    });

    return Response.json({
      success: true,
      message: "Database seeded successfully!",
      data: {
        usersCreated: 2,
        modulesCreated: 1,
        papersCreated: 1,
        topicsCreated: 27,
        questionsCreated: 150,
        assignmentsCreated: 1,
      },
      testAccounts: {
        admin: "admin@phillip.com / Admin@123",
        student: "student@phillip.com / Student@123",
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return Response.json(
      {
        success: false,
        error: String(error),
        message: "Seeding failed",
      },
      { status: 500 }
    );
  }
}
