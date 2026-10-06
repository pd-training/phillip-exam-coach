-- Add active field to User table
ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- Create index for querying by active status
CREATE INDEX "User_active_idx" ON "User"("active");
