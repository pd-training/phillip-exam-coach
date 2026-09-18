export const dynamic = "force-dynamic";
export const revalidate = 0;

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  try {
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

    const module = await prisma.module.create({
      data: { code: "RES5", name: "RES 5 - Rules, Ethics and Skills for Financial Advisory Services", description: "CMFAS RES5 Module" }
    });

    const paper = await prisma.paper.create({
      data: { moduleId: module.id, title: "RES 5 Mock Exam", durationMinutes: 180, totalQuestions: 150 }
    });

    const partI = await prisma.paperSection.create({
      data: { paperId: paper.id, name: "Part I", order: 1, questionCount: 110, passThresholdPct: 75 }
    });

    const partII = await prisma.paperSection.create({
      data: { paperId: paper.id, name: "Part II", order: 2, questionCount: 40, passThresholdPct: 80 }
    });

    const topics = [];
    for (let i = 1; i <= 27; i++) {
      const topic = await prisma.topic.create({ data: { moduleId: module.id, code: i, name: `Topic ${i}` } });
      topics.push(topic);
    }

    for (let i = 0; i < 110; i++) {
      const topicIndex = Math.floor(i / 5) % topics.length;
      await prisma.question.create({
        data: {
          paperId: paper.id,
          sectionId: partI.id,
          topicId: topics[topicIndex].id,
          questionText: `Part I Q${i + 1}`,
          optionA: "A",
          optionB: "B",
          optionC: "C",
          optionD: "D",
          correctAnswer: (["A", "B", "C", "D"] as any)[i % 4],
          explanation: `Explanation for Q${i + 1}`,
          difficulty: (["EASY", "MEDIUM", "HARD"] as any)[i % 3],
          orderInPaper: i + 1
        }
      });
    }

    for (let i = 0; i < 40; i++) {
      const topicIndex = Math.floor(i / 2) % topics.length;
      await prisma.question.create({
        data: {
          paperId: paper.id,
          sectionId: partII.id,
          topicId: topics[topicIndex].id,
          questionText: `Part II Q${i + 1}`,
          optionA: "A",
          optionB: "B",
          optionC: "C",
          optionD: "D",
          correctAnswer: (["A", "B", "C", "D"] as any)[i % 4],
          explanation: `Explanation for Q${i + 1}`,
          difficulty: (["EASY", "MEDIUM", "HARD"] as any)[i % 3],
          orderInPaper: 111 + i
        }
      });
    }

    const adminHash = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({
      data: { name: "Admin User", email: "admin@phillip.com", passwordHash: adminHash, roles: (["ADMIN"] as any), active: true, approvedAt: new Date(), pdpaConsent: true, pdpaConsentAt: new Date() }
    });

    const studentHash = await bcrypt.hash("Student@123", 10);
    const student = await prisma.user.create({
      data: { name: "Student User", email: "student@phillip.com", passwordHash: studentHash, roles: (["STUDENT"] as any), active: true, approvedAt: new Date(), pdpaConsent: true, pdpaConsentAt: new Date() }
    });

    await prisma.assignment.create({
      data: { paperId: paper.id, userId: student.id, status: ("APPROVED" as any) }
    });

    return Response.json({ success: true, message: "Database seeded successfully!", testAccounts: { admin: "admin@phillip.com / Admin@123", student: "student@phillip.com / Student@123" } });
  } catch (error) {
    return Response.json({ success: false, error: String(error), message: "Seeding failed" }, { status: 500 });
  }
}
