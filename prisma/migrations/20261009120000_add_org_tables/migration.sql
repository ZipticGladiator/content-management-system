-- Step 1 of 3 (multi-tenancy): purely additive. New tables, and nullable
-- org_id columns on every existing table. Old, currently-deployed code
-- doesn't know these columns exist, so this is safe to run ahead of the
-- code that uses them.

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'CREATOR_PRO', 'AGENCY');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT '#ccff00',
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "seatLimit" INTEGER NOT NULL DEFAULT 2,
    "accountLimit" INTEGER NOT NULL DEFAULT 1,
    "aiDraftLimit" INTEGER NOT NULL DEFAULT 20,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- The one organization every existing row will be backfilled into (step 2).
-- Unlimited-ish limits so current usage is never blocked by the new plan system.
INSERT INTO "Organization" ("id", "name", "accentColor", "plan", "seatLimit", "accountLimit", "aiDraftLimit", "updatedAt")
VALUES ('org_hackinghub', 'Hacking Hub', '#ccff00', 'AGENCY', 999, 999, 999999, CURRENT_TIMESTAMP);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "token" TEXT NOT NULL,
    "invitedByName" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_orgId_idx" ON "Invite"("orgId");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AiDraftLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "AiDraftLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDraftLog_orgId_createdAt_idx" ON "AiDraftLog"("orgId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiDraftLog" ADD CONSTRAINT "AiDraftLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Nullable org_id columns on every existing table (backfilled in step 2, enforced NOT NULL in step 3).
ALTER TABLE "User" ADD COLUMN "orgId" TEXT;
ALTER TABLE "YoutubeVideo" ADD COLUMN "orgId" TEXT;
ALTER TABLE "TiktokClip" ADD COLUMN "orgId" TEXT;
ALTER TABLE "Script" ADD COLUMN "orgId" TEXT;
ALTER TABLE "Comment" ADD COLUMN "orgId" TEXT;
ALTER TABLE "Attachment" ADD COLUMN "orgId" TEXT;
ALTER TABLE "Asset" ADD COLUMN "orgId" TEXT;
ALTER TABLE "Editor" ADD COLUMN "orgId" TEXT;
ALTER TABLE "Inspiration" ADD COLUMN "orgId" TEXT;
ALTER TABLE "Goal" ADD COLUMN "orgId" TEXT;
ALTER TABLE "YoutubeAuth" ADD COLUMN "orgId" TEXT;
ALTER TABLE "TiktokAuth" ADD COLUMN "orgId" TEXT;
ALTER TABLE "PushDevice" ADD COLUMN "orgId" TEXT;
