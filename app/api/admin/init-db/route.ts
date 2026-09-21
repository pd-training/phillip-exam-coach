import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const initSQL = `
-- ExamAttempt table (critical - used by dashboard)
CREATE TABLE IF NOT EXISTS "ExamAttempt" (
    "id" TEXT NOT NULL,
    "paperId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExamAttempt_paperId_idx" ON "ExamAttempt"("paperId");
CREATE INDEX IF NOT EXISTS "ExamAttempt_userId_idx" ON "ExamAttempt"("userId");
CREATE INDEX IF NOT EXISTS "ExamAttempt_submittedAt_idx" ON "ExamAttempt"("submittedAt");

-- Add foreign key constraints if they don't exist
DO \$\$ BEGIN
  BEGIN
    ALTER TABLE "ExamAttempt" 
      ADD CONSTRAINT "ExamAttempt_paperId_fkey" 
      FOREIGN KEY ("paperId") REFERENCES "Paper"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END;
  BEGIN
    ALTER TABLE "ExamAttempt"
      ADD CONSTRAINT "ExamAttempt_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END \$\$;

-- Chapter table
CREATE TABLE IF NOT EXISTS "Chapter" (
    "id" TEXT NOT NULL,
    "paperId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Chapter_paperId_number_key" ON "Chapter"("paperId", "number");
CREATE INDEX IF NOT EXISTS "Chapter_paperId_idx" ON "Chapter"("paperId");

DO \$\$ BEGIN
  BEGIN
    ALTER TABLE "Chapter"
      ADD CONSTRAINT "Chapter_paperId_fkey"
      FOREIGN KEY ("paperId") REFERENCES "Paper"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END \$\$;

-- Question table
CREATE TABLE IF NOT EXISTS "Question" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paperId" UUID NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "correctAnswer" VARCHAR(1) NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Question_paperId_idx" ON "Question"("paperId");
CREATE INDEX IF NOT EXISTS "Question_chapterNumber_idx" ON "Question"("chapterNumber");

DO \$\$ BEGIN
  BEGIN
    ALTER TABLE "Question"
      ADD CONSTRAINT "Question_paperId_fkey"
      FOREIGN KEY ("paperId") REFERENCES "Paper"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END \$\$;

-- ExamPart table
CREATE TABLE IF NOT EXISTS "ExamPart" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paperId" UUID NOT NULL,
    "partName" VARCHAR(50) NOT NULL,
    "chapterStart" INTEGER NOT NULL,
    "chapterEnd" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamPart_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExamPart_paperId_idx" ON "ExamPart"("paperId");
CREATE INDEX IF NOT EXISTS "ExamPart_orderIndex_idx" ON "ExamPart"("orderIndex");

DO \$\$ BEGIN
  BEGIN
    ALTER TABLE "ExamPart"
      ADD CONSTRAINT "ExamPart_paperId_fkey"
      FOREIGN KEY ("paperId") REFERENCES "Paper"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END \$\$;

-- QuestionPool table
CREATE TABLE IF NOT EXISTS "QuestionPool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionPool_pkey" PRIMARY KEY ("id")
);
`;

export async function POST(request: Request) {
  try {
    console.log('Initializing database tables...');

    // Split the SQL into individual statements and execute them
    const statements = initSQL.split(';').filter((stmt) => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await prisma.$executeRawUnsafe(statement + ';');
      }
    }

    console.log('Database initialization successful');

    return Response.json({
      status: 'success',
      message: 'Database tables initialized successfully',
    });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return Response.json(
      {
        status: 'error',
        error: error.message || 'Failed to initialize database',
      },
      { status: 500 }
    );
  }
}
