import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    // Note: Database tables are created via migrations, not seed
    // Skip deleteMany() to avoid type generation issues at build time

    // Create module
    const module = await prisma.module.create({
      data: {
        code: "RES5",
        name: "RES 5 - Rules, Ethics and Skills for Financial Advisory Services",
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
      const answerOptions = ["A", "B", "C", "D"];
      const difficulties = ["EASY", "MEDIUM", "HARD"];
      
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
          correctAnswer: answerOptions[i % 4] as any,
          explanation: `This is the explanation for Part I Question ${i + 1}. The correct answer is option ${answerOptions[i % 4]}.`,
          difficulty: difficulties[i % 3] as any,
          orderInPaper: i + 1,
        },
      });
    }

    // Create sample questions (40 for Part II)
    for (let i = 0; i < 40; i++) {
      const topicIndex = Math.floor(i / 2) % topics.length;
      const answerOptions = ["A", "B", "C", "D"];
      const difficulties = ["EASY", "MEDIUM", "HARD"];
      
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
          correctAnswer: answerOptions[i % 4] as any,
          explanation: `This is the explanation for Part II Question ${i + 1}. The correct answer is option ${answerOptions[i % 4]}.`,
          difficulty: difficulties[i % 3] as any,
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
        password: adminHash,
        role: "ADMIN" as any,
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
        password: studentHash,
        role: "STUDENT" as any,
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
        status: "APPROVED" as any,
      },
    });

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
