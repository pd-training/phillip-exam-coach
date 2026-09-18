export const dynamic = "force-dynamic";
export const revalidate = 0;

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Clear existing data
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

    // Create sections
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

    // Create topics
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

    // Create questions for Part I
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

    // Create questions for Part II
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
