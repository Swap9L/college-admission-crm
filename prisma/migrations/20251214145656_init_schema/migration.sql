-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'FACULTY');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('NOT_CALLED', 'RINGING', 'CALL_BACK', 'INTERESTED', 'NOT_INTERESTED', 'ADMISSION_TAKEN');

-- CreateEnum
CREATE TYPE "Interest" AS ENUM ('MCA', 'NURSING', 'BTECH', 'BCA', 'MBA', 'DIPLOMA', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FACULTY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "prevCourse" TEXT,
    "futureInterest" "Interest",
    "callStatus" "CallStatus" NOT NULL DEFAULT 'NOT_CALLED',
    "notes" TEXT,
    "uploadedById" TEXT NOT NULL,
    "lastUpdatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_phone_key" ON "Student"("phone");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
