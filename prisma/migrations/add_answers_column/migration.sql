-- Add answers column to examattempt table to store student's selected answers
ALTER TABLE examattempt ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}';
