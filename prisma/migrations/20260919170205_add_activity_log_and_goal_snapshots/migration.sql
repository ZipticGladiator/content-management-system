-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "GoalSnapshot" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalSnapshot_goalId_idx" ON "GoalSnapshot"("goalId");

-- AddForeignKey
ALTER TABLE "GoalSnapshot" ADD CONSTRAINT "GoalSnapshot_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
