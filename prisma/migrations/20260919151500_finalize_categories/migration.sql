-- AlterEnum
-- All rows were migrated off the old category values before this ran (see project history).
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('EDUCATIONAL', 'TECHNICAL', 'LIFESTYLE');
ALTER TABLE "public"."TiktokClip" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "public"."YoutubeVideo" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "YoutubeVideo" ALTER COLUMN "category" TYPE "Category_new" USING ("category"::text::"Category_new");
ALTER TABLE "TiktokClip" ALTER COLUMN "category" TYPE "Category_new" USING ("category"::text::"Category_new");
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "public"."Category_old";
ALTER TABLE "TiktokClip" ALTER COLUMN "category" SET DEFAULT 'EDUCATIONAL';
ALTER TABLE "YoutubeVideo" ALTER COLUMN "category" SET DEFAULT 'EDUCATIONAL';
COMMIT;
