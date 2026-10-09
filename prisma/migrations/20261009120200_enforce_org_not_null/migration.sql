-- Step 3 of 4 (multi-tenancy): enforce org_id as NOT NULL, with a database-
-- level default of the one existing org. That default is the safety net:
-- it means even an old, not-yet-redeployed instance of the app (which has
-- never heard of org_id and never supplies it on insert) keeps working
-- without erroring — new rows it creates just land in the default org,
-- same as every row before this migration.

ALTER TABLE "User" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "YoutubeVideo" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "TiktokClip" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "Script" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "Comment" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "Attachment" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "Asset" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "Editor" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "Inspiration" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "Goal" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "YoutubeAuth" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "TiktokAuth" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';
ALTER TABLE "PushDevice" ALTER COLUMN "orgId" SET NOT NULL, ALTER COLUMN "orgId" SET DEFAULT 'org_hackinghub';

CREATE UNIQUE INDEX "YoutubeAuth_orgId_key" ON "YoutubeAuth"("orgId");
CREATE UNIQUE INDEX "TiktokAuth_orgId_key" ON "TiktokAuth"("orgId");

CREATE INDEX "User_orgId_idx" ON "User"("orgId");
CREATE INDEX "YoutubeVideo_orgId_idx" ON "YoutubeVideo"("orgId");
CREATE INDEX "TiktokClip_orgId_idx" ON "TiktokClip"("orgId");
CREATE INDEX "Script_orgId_idx" ON "Script"("orgId");
CREATE INDEX "Comment_orgId_idx" ON "Comment"("orgId");
CREATE INDEX "Attachment_orgId_idx" ON "Attachment"("orgId");
CREATE INDEX "Asset_orgId_idx" ON "Asset"("orgId");
CREATE INDEX "Editor_orgId_idx" ON "Editor"("orgId");
CREATE INDEX "Inspiration_orgId_idx" ON "Inspiration"("orgId");
CREATE INDEX "Goal_orgId_idx" ON "Goal"("orgId");
CREATE INDEX "PushDevice_orgId_idx" ON "PushDevice"("orgId");

ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "YoutubeVideo" ADD CONSTRAINT "YoutubeVideo_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TiktokClip" ADD CONSTRAINT "TiktokClip_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Script" ADD CONSTRAINT "Script_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Editor" ADD CONSTRAINT "Editor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inspiration" ADD CONSTRAINT "Inspiration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "YoutubeAuth" ADD CONSTRAINT "YoutubeAuth_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TiktokAuth" ADD CONSTRAINT "TiktokAuth_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushDevice" ADD CONSTRAINT "PushDevice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
