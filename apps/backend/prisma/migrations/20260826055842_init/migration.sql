-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('pre', 'Inprogress', 'Done');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('user', 'assistand');

-- CreateTable
CREATE TABLE "Interview" (
    "id" SERIAL NOT NULL,
    "githubData" JSONB NOT NULL,
    "status" "InterviewStatus" NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "interviewID" INTEGER NOT NULL,
    "type" "Type" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_interviewID_fkey" FOREIGN KEY ("interviewID") REFERENCES "Interview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
