-- AlterTable - Add options to Question table
ALTER TABLE "Question" ADD COLUMN "optionA" TEXT NOT NULL DEFAULT '',
ADD COLUMN "optionB" TEXT NOT NULL DEFAULT '',
ADD COLUMN "optionC" TEXT NOT NULL DEFAULT '',
ADD COLUMN "optionD" TEXT NOT NULL DEFAULT '';

-- AlterTable - Add description to Paper table
ALTER TABLE "Paper" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
