-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_paperId_fkey";
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_sectionId_fkey";
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_topicId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Question_paperId_idx";
DROP INDEX IF EXISTS "Question_sectionId_idx";
DROP INDEX IF EXISTS "Question_topicId_idx";

-- DropTable
DROP TABLE IF EXISTS "Question" CASCADE;
DROP TABLE IF EXISTS "ExamPart" CASCADE;

-- CreateTable Question
CREATE TABLE "Question" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paperId" UUID NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "correctAnswer" VARCHAR(1) NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExamPart
CREATE TABLE "ExamPart" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paperId" UUID NOT NULL,
    "partName" VARCHAR(50) NOT NULL,
    "chapterStart" INTEGER NOT NULL,
    "chapterEnd" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamPart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_paperId_idx" ON "Question"("paperId");
CREATE INDEX "Question_chapterNumber_idx" ON "Question"("chapterNumber");

-- CreateIndex
CREATE INDEX "ExamPart_paperId_idx" ON "ExamPart"("paperId");
CREATE INDEX "ExamPart_orderIndex_idx" ON "ExamPart"("orderIndex");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamPart" ADD CONSTRAINT "ExamPart_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
