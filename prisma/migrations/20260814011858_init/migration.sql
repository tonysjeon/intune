-- CreateEnum
CREATE TYPE "ComparisonStatus" AS ENUM ('PENDING', 'READY', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "status" "ComparisonStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonMember" (
    "comparisonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentVersion" TEXT NOT NULL,

    CONSTRAINT "ComparisonMember_pkey" PRIMARY KEY ("comparisonId","userId")
);

-- CreateTable
CREATE TABLE "ComparisonResult" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "artistScore" DOUBLE PRECISION NOT NULL,
    "trackScore" DOUBLE PRECISION NOT NULL,
    "genreScore" DOUBLE PRECISION NOT NULL,
    "embeddingScore" DOUBLE PRECISION NOT NULL,
    "resultJson" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Comparison_inviteCode_key" ON "Comparison"("inviteCode");

-- CreateIndex
CREATE INDEX "Comparison_createdByUserId_idx" ON "Comparison"("createdByUserId");

-- CreateIndex
CREATE INDEX "Comparison_status_idx" ON "Comparison"("status");

-- CreateIndex
CREATE INDEX "ComparisonMember_userId_idx" ON "ComparisonMember"("userId");

-- CreateIndex
CREATE INDEX "ComparisonResult_comparisonId_generatedAt_idx" ON "ComparisonResult"("comparisonId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonResult_comparisonId_modelVersion_key" ON "ComparisonResult"("comparisonId", "modelVersion");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonMember" ADD CONSTRAINT "ComparisonMember_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonMember" ADD CONSTRAINT "ComparisonMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonResult" ADD CONSTRAINT "ComparisonResult_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;
