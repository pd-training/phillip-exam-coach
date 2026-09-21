-- CreateTable StudentPaper
CREATE TABLE "StudentPaper" (
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
CREATE TABLE "PaperRequest" (
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

-- CreateIndex
CREATE UNIQUE INDEX "StudentPaper_userId_paperId_key" ON "StudentPaper"("userId", "paperId");

-- CreateIndex
CREATE INDEX "StudentPaper_userId_idx" ON "StudentPaper"("userId");

-- CreateIndex
CREATE INDEX "StudentPaper_status_idx" ON "StudentPaper"("status");

-- CreateIndex
CREATE INDEX "PaperRequest_userId_idx" ON "PaperRequest"("userId");

-- CreateIndex
CREATE INDEX "PaperRequest_status_idx" ON "PaperRequest"("status");

-- AddForeignKey
ALTER TABLE "StudentPaper" ADD CONSTRAINT "StudentPaper_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPaper" ADD CONSTRAINT "StudentPaper_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperRequest" ADD CONSTRAINT "PaperRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperRequest" ADD CONSTRAINT "PaperRequest_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
