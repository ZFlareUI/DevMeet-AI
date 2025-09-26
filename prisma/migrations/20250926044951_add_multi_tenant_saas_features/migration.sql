/*
  Warnings:

  - Added the required column `organizationId` to the `assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `github_analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `interviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `uploaded_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logo" TEXT,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "planLimits" TEXT NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trialEndsAt" DATETIME,
    "stripeCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usage_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interviewId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "technicalScore" REAL NOT NULL,
    "communicationScore" REAL NOT NULL,
    "problemSolvingScore" REAL NOT NULL,
    "cultureScore" REAL NOT NULL,
    "overallScore" REAL NOT NULL,
    "feedback" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assessments_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assessments_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assessments_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assessments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_assessments" ("assessorId", "candidateId", "communicationScore", "createdAt", "cultureScore", "feedback", "id", "interviewId", "overallScore", "problemSolvingScore", "recommendation", "strengths", "technicalScore", "updatedAt", "weaknesses") SELECT "assessorId", "candidateId", "communicationScore", "createdAt", "cultureScore", "feedback", "id", "interviewId", "overallScore", "problemSolvingScore", "recommendation", "strengths", "technicalScore", "updatedAt", "weaknesses" FROM "assessments";
DROP TABLE "assessments";
ALTER TABLE "new_assessments" RENAME TO "assessments";
CREATE TABLE "new_candidates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "githubUsername" TEXT,
    "githubUrl" TEXT,
    "resume" TEXT,
    "coverLetter" TEXT,
    "position" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "candidates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_candidates" ("coverLetter", "createdAt", "createdBy", "email", "experience", "githubUrl", "githubUsername", "id", "name", "phone", "position", "resume", "skills", "status", "updatedAt", "userId") SELECT "coverLetter", "createdAt", "createdBy", "email", "experience", "githubUrl", "githubUsername", "id", "name", "phone", "position", "resume", "skills", "status", "updatedAt", "userId" FROM "candidates";
DROP TABLE "candidates";
ALTER TABLE "new_candidates" RENAME TO "candidates";
CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");
CREATE TABLE "new_github_analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileData" TEXT NOT NULL,
    "repositories" TEXT NOT NULL,
    "contributions" TEXT NOT NULL,
    "languageStats" TEXT NOT NULL,
    "activityScore" REAL NOT NULL,
    "codeQualityScore" REAL NOT NULL,
    "collaborationScore" REAL NOT NULL,
    "consistencyScore" REAL NOT NULL,
    "overallScore" REAL NOT NULL,
    "insights" TEXT NOT NULL,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "github_analysis_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "github_analysis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_github_analysis" ("activityScore", "analyzedAt", "candidateId", "codeQualityScore", "collaborationScore", "consistencyScore", "contributions", "id", "insights", "languageStats", "overallScore", "profileData", "repositories", "username") SELECT "activityScore", "analyzedAt", "candidateId", "codeQualityScore", "collaborationScore", "consistencyScore", "contributions", "id", "insights", "languageStats", "overallScore", "profileData", "repositories", "username" FROM "github_analysis";
DROP TABLE "github_analysis";
ALTER TABLE "new_github_analysis" RENAME TO "github_analysis";
CREATE TABLE "new_interviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "candidateId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "duration" INTEGER,
    "aiPersonality" TEXT NOT NULL DEFAULT 'professional',
    "techStack" TEXT NOT NULL,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'intermediate',
    "questions" TEXT NOT NULL,
    "notes" TEXT,
    "score" REAL,
    "recommendation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "interviews_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "interviews_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "interviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_interviews" ("aiPersonality", "candidateId", "completedAt", "createdAt", "description", "difficultyLevel", "duration", "id", "interviewerId", "notes", "questions", "recommendation", "scheduledAt", "score", "startedAt", "status", "techStack", "title", "type", "updatedAt") SELECT "aiPersonality", "candidateId", "completedAt", "createdAt", "description", "difficultyLevel", "duration", "id", "interviewerId", "notes", "questions", "recommendation", "scheduledAt", "score", "startedAt", "status", "techStack", "title", "type", "updatedAt" FROM "interviews";
DROP TABLE "interviews";
ALTER TABLE "new_interviews" RENAME TO "interviews";
CREATE TABLE "new_uploaded_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "candidateId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "uploaded_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "uploaded_files_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "uploaded_files_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_uploaded_files" ("candidateId", "createdAt", "filePath", "fileSize", "filename", "id", "mimeType", "originalName", "type", "updatedAt", "uploadedBy") SELECT "candidateId", "createdAt", "filePath", "fileSize", "filename", "id", "mimeType", "originalName", "type", "updatedAt", "uploadedBy" FROM "uploaded_files";
DROP TABLE "uploaded_files";
ALTER TABLE "new_uploaded_files" RENAME TO "uploaded_files";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "company" TEXT,
    "position" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_users" ("company", "createdAt", "email", "emailVerified", "id", "image", "isActive", "lastLoginAt", "name", "password", "position", "role", "updatedAt") SELECT "company", "createdAt", "email", "emailVerified", "id", "image", "isActive", "lastLoginAt", "name", "password", "position", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "organizations"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripeCustomerId_key" ON "organizations"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_organizationId_email_key" ON "invitations"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "usage_metrics_organizationId_metricType_period_date_key" ON "usage_metrics"("organizationId", "metricType", "period", "date");
