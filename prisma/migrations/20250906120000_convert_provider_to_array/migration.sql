-- Convert provider field from single enum to array
-- First, add the new providers array column
ALTER TABLE "users" ADD COLUMN "providers" "AuthProvider"[] DEFAULT ARRAY[]::AuthProvider[];

-- Migrate existing data: convert single provider to array
UPDATE "users" 
SET "providers" = ARRAY["provider"]::AuthProvider[]
WHERE "provider" IS NOT NULL;

-- For users without provider, set empty array
UPDATE "users" 
SET "providers" = ARRAY[]::AuthProvider[]
WHERE "provider" IS NULL;

-- Drop the old provider column
ALTER TABLE "users" DROP COLUMN "provider";

-- Update indexes
DROP INDEX IF EXISTS "users_provider_providerId_idx";