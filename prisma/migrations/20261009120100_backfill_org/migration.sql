-- Step 2 of 4 (multi-tenancy): backfill every existing row onto the one
-- default org. Purely data, no type changes — safe regardless of which
-- app version is currently deployed.

UPDATE "User" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "YoutubeVideo" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "TiktokClip" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "Script" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "Comment" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "Attachment" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "Asset" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "Editor" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "Inspiration" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "Goal" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "YoutubeAuth" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "TiktokAuth" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
UPDATE "PushDevice" SET "orgId" = 'org_hackinghub' WHERE "orgId" IS NULL;
