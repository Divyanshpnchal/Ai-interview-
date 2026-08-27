/*
  Warnings:

  - The values [pre,Inprogress] on the enum `InterviewStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [user,assistand] on the enum `Type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InterviewStatus_new" AS ENUM ('Pre', 'InProgress', 'Done');
ALTER TABLE "Interview" ALTER COLUMN "status" TYPE "InterviewStatus_new" USING ("status"::text::"InterviewStatus_new");
ALTER TYPE "InterviewStatus" RENAME TO "InterviewStatus_old";
ALTER TYPE "InterviewStatus_new" RENAME TO "InterviewStatus";
DROP TYPE "public"."InterviewStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Type_new" AS ENUM ('User', 'Assistant');
ALTER TABLE "Message" ALTER COLUMN "type" TYPE "Type_new" USING ("type"::text::"Type_new");
ALTER TYPE "Type" RENAME TO "Type_old";
ALTER TYPE "Type_new" RENAME TO "Type";
DROP TYPE "public"."Type_old";
COMMIT;

-- AlterTable
ALTER TABLE "Interview" ALTER COLUMN "status" SET DEFAULT 'Pre';
