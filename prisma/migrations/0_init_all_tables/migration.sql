-- CreateTable Account
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable Session
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable Paper
CREATE TABLE IF NOT EXISTS "Paper" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "passingScore" INTEGER NOT NULL DEFAULT 75,
    "timeWarning" INTEGER NOT NULL DEFAULT 5,
    "showAnswerReview" BOOLEAN NOT NULL DEFAULT true,
    "allowRetakes" BOOLEAN NOT NULL DEFAULT false,
    "retakeLimit" INTEGER NOT NULL DEFAULT 0,
    "totalTime" INTEGER NOT NULL DEFAULT 120,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable Chapter
CREATE TABLE IF NOT EXISTS "Chapter" (
    "id" TEXT NOT NULL,
    "paperId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable Question
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

-- CreateTable ExamPart
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

-- CreateTable ExamAttempt
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

-- CreateTable StudentPaper
CREATE TABLE IF NOT EXISTS "StudentPaper" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "requestedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable PaperRequest
CREATE TABLE IF NOT EXISTS "PaperRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable QuestionPool
CREATE TABLE IF NOT EXISTS "QuestionPool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionPool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "Paper_isAvailable_idx" ON "Paper"("isAvailable");
CREATE UNIQUE INDEX IF NOT EXISTS "Chapter_paperId_number_key" ON "Chapter"("paperId", "number");
CREATE INDEX IF NOT EXISTS "Chapter_paperId_idx" ON "Chapter"("paperId");
CREATE INDEX IF NOT EXISTS "Question_paperId_idx" ON "Question"("paperId");
CREATE INDEX IF NOT EXISTS "Question_chapterNumber_idx" ON "Question"("chapterNumber");
CREATE INDEX IF NOT EXISTS "ExamPart_paperId_idx" ON "ExamPart"("paperId");
CREATE INDEX IF NOT EXISTS "ExamPart_orderIndex_idx" ON "ExamPart"("orderIndex");
CREATE UNIQUE INDEX IF NOT EXISTS "StudentPaper_userId_paperId_key" ON "StudentPaper"("userId", "paperId");
CREATE INDEX IF NOT EXISTS "StudentPaper_userId_idx" ON "StudentPaper"("userId");
CREATE INDEX IF NOT EXISTS "StudentPaper_status_idx" ON "StudentPaper"("status");
CREATE INDEX IF NOT EXISTS "PaperRequest_userId_idx" ON "PaperRequest"("userId");
CREATE INDEX IF NOT EXISTS "PaperRequest_status_idx" ON "PaperRequest"("status");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamPart" ADD CONSTRAINT "ExamPart_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentPaper" ADD CONSTRAINT "StudentPaper_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentPaper" ADD CONSTRAINT "StudentPaper_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaperRequest" ADD CONSTRAINT "PaperRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaperRequest" ADD CONSTRAINT "PaperRequest_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
