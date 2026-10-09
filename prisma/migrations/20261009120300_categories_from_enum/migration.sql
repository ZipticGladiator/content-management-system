-- Step 4 of 4 (multi-tenancy) — HOLD until deploy: run this one alongside
-- the new org-aware code going live, not ahead of it. It's the one part of
-- this migration an old, still-deployed instance of the app would not
-- tolerate: its generated Prisma Client expects the "Category" Postgres
-- enum on this column, so converting it out from under that code risks
-- breaking any in-flight request on the old version until Vercel finishes
-- cycling it out.

ALTER TABLE "YoutubeVideo" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "YoutubeVideo" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "YoutubeVideo" ALTER COLUMN "category" SET DEFAULT '';

ALTER TABLE "TiktokClip" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "TiktokClip" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "TiktokClip" ALTER COLUMN "category" SET DEFAULT '';

-- Postgres gives every table an implicit row type of the same name, so the
-- old enum type must be gone before a table named "Category" can exist.
DROP TYPE "Category";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_orgId_key_key" ON "Category"("orgId", "key");

-- CreateIndex
CREATE INDEX "Category_orgId_idx" ON "Category"("orgId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the default org's categories, matching the old enum's three values
-- exactly so every existing video/clip's stored category still resolves.
INSERT INTO "Category" ("id", "key", "label", "order", "orgId", "updatedAt") VALUES
  ('cat_hackinghub_educational', 'EDUCATIONAL', 'Educational', 0, 'org_hackinghub', CURRENT_TIMESTAMP),
  ('cat_hackinghub_technical', 'TECHNICAL', 'Technical', 1, 'org_hackinghub', CURRENT_TIMESTAMP),
  ('cat_hackinghub_lifestyle', 'LIFESTYLE', 'Lifestyle', 2, 'org_hackinghub', CURRENT_TIMESTAMP);
