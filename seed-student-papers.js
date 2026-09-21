require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' }
});

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Seeding student papers...');

    // Get student
    const student = await prisma.user.findUnique({
      where: { email: 'student@phillip.com' }
    });

    if (!student) {
      console.error('❌ Student not found');
      return;
    }

    console.log(`Found student: ${student.id}`);

    // Get all papers
    const papers = await prisma.paper.findMany({ take: 2 });
    console.log(`Found ${papers.length} papers`);

    // Assign papers
    for (const paper of papers) {
      const existing = await prisma.studentPaper.findUnique({
        where: { userId_paperId: { userId: student.id, paperId: paper.id } }
      }).catch(() => null);

      if (!existing) {
        await prisma.studentPaper.create({
          data: {
            userId: student.id,
            paperId: paper.id,
            status: 'active'
          }
        });
        console.log(`✅ Assigned: ${paper.title}`);
      } else {
        console.log(`⏭️  Already: ${paper.title}`);
      }
    }

    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed();
