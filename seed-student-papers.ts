import prisma from './lib/prisma';

async function seedStudentPapers() {
  try {
    console.log('🌱 Seeding student papers...');

    // Get student user
    const student = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE email = 'student@phillip.com' LIMIT 1
    ` as any[];

    if (!student.length) {
      console.error('❌ Student user not found');
      return;
    }

    const studentId = student[0].id;
    console.log(`Found student: ${studentId}`);

    // Get all papers
    const papers = await prisma.$queryRaw`
      SELECT id, title FROM "Paper" ORDER BY title
    ` as any[];

    console.log(`Found ${papers.length} papers`);

    // Assign first 2 papers to student
    for (const paper of papers.slice(0, 2)) {
      // Check if already exists
      const existing = await prisma.$queryRaw`
        SELECT id FROM "StudentPaper"
        WHERE "userId" = ${studentId} AND "paperId" = ${paper.id}
      ` as any[];

      if (!existing.length) {
        await prisma.$queryRaw`
          INSERT INTO "StudentPaper" ("userId", "paperId", status, "createdAt")
          VALUES (${studentId}, ${paper.id}, 'active', NOW())
        `;
        console.log(`✅ Assigned: ${paper.title}`);
      } else {
        console.log(`⏭️  Already assigned: ${paper.title}`);
      }
    }

    console.log('✅ Seeding complete');
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    process.exit(0);
  }
}

seedStudentPapers();
