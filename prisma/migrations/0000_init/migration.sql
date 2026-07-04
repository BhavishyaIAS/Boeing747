-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('STUDENT', 'FACULTY', 'CONTENT_EDITOR', 'REVIEWER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('SUBJECT', 'UNIT', 'THEME', 'SUB_THEME', 'MICRO_THEME', 'CONCEPT');

-- CreateEnum
CREATE TYPE "NodeLinkType" AS ENUM ('RELATED', 'PREREQUISITE', 'CONTEMPORARY_LINKAGE', 'VALUE_ADDITION', 'CROSS_REFERENCE');

-- CreateEnum
CREATE TYPE "NodeProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'REVISED', 'MASTERED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('NOTE', 'MICRO_TOPIC', 'MODEL_ANSWER', 'FAQ', 'EDITORIAL', 'QUESTION', 'REFERENCE', 'VISUAL', 'VIDEO', 'FLASHCARD', 'CURRENT_AFFAIR');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('MCQ', 'DESCRIPTIVE');

-- CreateEnum
CREATE TYPE "ExamStage" AS ENUM ('PRELIMS', 'MAINS', 'INTERVIEW');

-- CreateEnum
CREATE TYPE "ReferenceKind" AS ENUM ('JUDGMENT', 'SCHEME', 'REPORT', 'ACT', 'ARTICLE', 'STATISTIC', 'COMMITTEE');

-- CreateEnum
CREATE TYPE "VisualKind" AS ENUM ('FLOWCHART', 'MIND_MAP', 'DIAGRAM', 'INFOGRAPHIC', 'TABLE', 'MAP');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'SVG', 'PDF', 'DOC', 'OTHER');

-- CreateEnum
CREATE TYPE "CaCadence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "CaRegion" AS ENUM ('ANDHRA_PRADESH', 'NATIONAL', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "TestKind" AS ENUM ('TOPIC', 'SUBJECT', 'FULL', 'PREVIOUS_PAPER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookmarkTarget" AS ENUM ('NODE', 'CONTENT');

-- CreateEnum
CREATE TYPE "AwCadence" AS ENUM ('DAILY', 'WEEKLY', 'TOPIC');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'UNDER_EVALUATION', 'EVALUATED', 'RETURNED');

-- CreateTable
CREATE TABLE "exam" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "primaryExamId" UUID,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
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

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "key" "RoleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_role" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "examId" UUID,
    "grantedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID,
    "examId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_node" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "parentId" UUID,
    "type" "NodeType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "examAngle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "syllabus_node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_closure" (
    "ancestorId" UUID NOT NULL,
    "descendantId" UUID NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "syllabus_closure_pkey" PRIMARY KEY ("ancestorId","descendantId")
);

-- CreateTable
CREATE TABLE "node_link" (
    "id" UUID NOT NULL,
    "fromNodeId" UUID NOT NULL,
    "toNodeId" UUID NOT NULL,
    "type" "NodeLinkType" NOT NULL,
    "note" TEXT,

    CONSTRAINT "node_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "term" TEXT NOT NULL,

    CONSTRAINT "keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_keyword" (
    "nodeId" UUID NOT NULL,
    "keywordId" UUID NOT NULL,

    CONSTRAINT "node_keyword_pkey" PRIMARY KEY ("nodeId","keywordId")
);

-- CreateTable
CREATE TABLE "content_item" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" UUID,
    "authorId" UUID NOT NULL,
    "difficulty" "Difficulty",
    "readingTimeSeconds" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "content_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_version" (
    "id" UUID NOT NULL,
    "contentItemId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "body" JSONB NOT NULL DEFAULT '{}',
    "plainText" TEXT,
    "changeNote" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_node" (
    "contentItemId" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'RELATED',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "content_node_pkey" PRIMARY KEY ("contentItemId","nodeId")
);

-- CreateTable
CREATE TABLE "question" (
    "contentItemId" UUID NOT NULL,
    "kind" "QuestionKind" NOT NULL,
    "stage" "ExamStage" NOT NULL,
    "isPyq" BOOLEAN NOT NULL DEFAULT false,
    "year" INTEGER,
    "paper" TEXT,
    "marks" DECIMAL(5,2),
    "source" TEXT,
    "explanation" JSONB,
    "modelAnswerItemId" UUID,

    CONSTRAINT "question_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "question_option" (
    "id" UUID NOT NULL,
    "questionItemId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_entity" (
    "contentItemId" UUID NOT NULL,
    "kind" "ReferenceKind" NOT NULL,
    "citation" TEXT,
    "authority" TEXT,
    "year" INTEGER,
    "sourceUrl" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "reference_entity_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "visual" (
    "contentItemId" UUID NOT NULL,
    "kind" "VisualKind" NOT NULL,
    "mediaAssetId" UUID,
    "spec" JSONB,

    CONSTRAINT "visual_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "video" (
    "contentItemId" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'YOUTUBE',
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "durationSeconds" INTEGER,

    CONSTRAINT "video_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "video_timestamp" (
    "id" UUID NOT NULL,
    "videoItemId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "video_timestamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard" (
    "contentItemId" UUID NOT NULL,
    "front" JSONB NOT NULL,
    "back" JSONB NOT NULL,
    "deckId" UUID,

    CONSTRAINT "flashcard_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "flashcard_deck" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" UUID,

    CONSTRAINT "flashcard_deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_affair" (
    "contentItemId" UUID NOT NULL,
    "cadence" "CaCadence" NOT NULL,
    "region" "CaRegion" NOT NULL,
    "category" TEXT,
    "publishDate" DATE NOT NULL,

    CONSTRAINT "current_affair_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "media_asset" (
    "id" UUID NOT NULL,
    "examId" UUID,
    "kind" "MediaKind" NOT NULL,
    "s3Key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT,
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_media" (
    "contentItemId" UUID NOT NULL,
    "mediaAssetId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'INLINE',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "content_media_pkey" PRIMARY KEY ("contentItemId","mediaAssetId")
);

-- CreateTable
CREATE TABLE "content_review" (
    "id" UUID NOT NULL,
    "contentItemId" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_node_progress" (
    "userId" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "status" "NodeProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitedAt" TIMESTAMP(3),
    "nextRevisionAt" TIMESTAMP(3),

    CONSTRAINT "user_node_progress_pkey" PRIMARY KEY ("userId","nodeId")
);

-- CreateTable
CREATE TABLE "reading_history" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contentItemId" UUID NOT NULL,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "nodeId" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "study_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmark" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetType" "BookmarkTarget" NOT NULL,
    "nodeId" UUID,
    "contentItemId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "highlight" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contentItemId" UUID NOT NULL,
    "versionId" UUID,
    "range" JSONB NOT NULL,
    "color" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievement" (
    "userId" UUID NOT NULL,
    "achievementId" UUID NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievement_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateTable
CREATE TABLE "test" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "kind" "TestKind" NOT NULL,
    "title" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "marksPerQuestion" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "negativeMark" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_question" (
    "testId" UUID NOT NULL,
    "questionItemId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "marks" DECIMAL(5,2),

    CONSTRAINT "test_question_pkey" PRIMARY KEY ("testId","questionItemId")
);

-- CreateTable
CREATE TABLE "test_attempt" (
    "id" UUID NOT NULL,
    "testId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "score" DECIMAL(7,2),
    "totalMarks" DECIMAL(7,2),
    "durationSeconds" INTEGER,

    CONSTRAINT "test_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_answer" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "questionItemId" UUID NOT NULL,
    "selectedOptionId" UUID,
    "isCorrect" BOOLEAN,
    "marksAwarded" DECIMAL(5,2),
    "timeSpentSeconds" INTEGER,

    CONSTRAINT "test_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_prompt" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "questionItemId" UUID,
    "cadence" "AwCadence" NOT NULL,
    "prompt" JSONB NOT NULL DEFAULT '{}',
    "publishDate" DATE NOT NULL,
    "createdById" UUID NOT NULL,

    CONSTRAINT "answer_prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_submission" (
    "id" UUID NOT NULL,
    "promptId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mediaAssetId" UUID,
    "textBody" JSONB,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_evaluation" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "evaluatorId" UUID NOT NULL,
    "rubricScores" JSONB NOT NULL DEFAULT '{}',
    "totalScore" DECIMAL(5,2),
    "comments" JSONB,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_key_key" ON "exam"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_providerAccountId_key" ON "account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_identifier_token_key" ON "verification_token"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "role_key_key" ON "role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permission_key_key" ON "permission"("key");

-- CreateIndex
CREATE INDEX "role_permission_permissionId_idx" ON "role_permission"("permissionId");

-- CreateIndex
CREATE INDEX "user_role_roleId_idx" ON "user_role"("roleId");

-- CreateIndex
CREATE INDEX "audit_log_targetType_targetId_createdAt_idx" ON "audit_log"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");

-- CreateIndex
CREATE INDEX "notification_userId_createdAt_idx" ON "notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "syllabus_node_examId_parentId_orderIndex_idx" ON "syllabus_node"("examId", "parentId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "syllabus_node_examId_parentId_slug_key" ON "syllabus_node"("examId", "parentId", "slug");

-- CreateIndex
CREATE INDEX "syllabus_closure_descendantId_depth_idx" ON "syllabus_closure"("descendantId", "depth");

-- CreateIndex
CREATE INDEX "node_link_toNodeId_type_idx" ON "node_link"("toNodeId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "node_link_fromNodeId_toNodeId_type_key" ON "node_link"("fromNodeId", "toNodeId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "keyword_examId_term_key" ON "keyword"("examId", "term");

-- CreateIndex
CREATE INDEX "node_keyword_keywordId_idx" ON "node_keyword"("keywordId");

-- CreateIndex
CREATE UNIQUE INDEX "content_item_currentVersionId_key" ON "content_item"("currentVersionId");

-- CreateIndex
CREATE INDEX "content_item_examId_type_status_publishedAt_idx" ON "content_item"("examId", "type", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_item_examId_type_slug_key" ON "content_item"("examId", "type", "slug");

-- CreateIndex
CREATE INDEX "content_version_contentItemId_versionNumber_idx" ON "content_version"("contentItemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "content_version_contentItemId_versionNumber_key" ON "content_version"("contentItemId", "versionNumber");

-- CreateIndex
CREATE INDEX "content_node_nodeId_relationType_idx" ON "content_node"("nodeId", "relationType");

-- CreateIndex
CREATE INDEX "question_stage_isPyq_year_idx" ON "question"("stage", "isPyq", "year");

-- CreateIndex
CREATE INDEX "question_option_questionItemId_idx" ON "question_option"("questionItemId");

-- CreateIndex
CREATE INDEX "video_timestamp_videoItemId_idx" ON "video_timestamp"("videoItemId");

-- CreateIndex
CREATE INDEX "current_affair_cadence_publishDate_idx" ON "current_affair"("cadence", "publishDate");

-- CreateIndex
CREATE INDEX "current_affair_region_idx" ON "current_affair"("region");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_s3Key_key" ON "media_asset"("s3Key");

-- CreateIndex
CREATE INDEX "media_asset_checksum_idx" ON "media_asset"("checksum");

-- CreateIndex
CREATE INDEX "content_media_mediaAssetId_idx" ON "content_media"("mediaAssetId");

-- CreateIndex
CREATE INDEX "content_review_contentItemId_idx" ON "content_review"("contentItemId");

-- CreateIndex
CREATE INDEX "user_node_progress_userId_status_idx" ON "user_node_progress"("userId", "status");

-- CreateIndex
CREATE INDEX "user_node_progress_userId_nextRevisionAt_idx" ON "user_node_progress"("userId", "nextRevisionAt");

-- CreateIndex
CREATE INDEX "reading_history_userId_readAt_idx" ON "reading_history"("userId", "readAt");

-- CreateIndex
CREATE INDEX "study_session_userId_idx" ON "study_session"("userId");

-- CreateIndex
CREATE INDEX "bookmark_userId_idx" ON "bookmark"("userId");

-- CreateIndex
CREATE INDEX "highlight_userId_idx" ON "highlight"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_key_key" ON "achievement"("key");

-- CreateIndex
CREATE INDEX "user_achievement_achievementId_idx" ON "user_achievement"("achievementId");

-- CreateIndex
CREATE INDEX "test_examId_kind_status_idx" ON "test"("examId", "kind", "status");

-- CreateIndex
CREATE INDEX "test_question_questionItemId_idx" ON "test_question"("questionItemId");

-- CreateIndex
CREATE INDEX "test_attempt_testId_score_idx" ON "test_attempt"("testId", "score");

-- CreateIndex
CREATE INDEX "test_attempt_userId_submittedAt_idx" ON "test_attempt"("userId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "test_answer_attemptId_questionItemId_key" ON "test_answer"("attemptId", "questionItemId");

-- CreateIndex
CREATE INDEX "answer_prompt_examId_publishDate_idx" ON "answer_prompt"("examId", "publishDate");

-- CreateIndex
CREATE INDEX "answer_submission_userId_idx" ON "answer_submission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "answer_evaluation_submissionId_key" ON "answer_evaluation"("submissionId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_primaryExamId_fkey" FOREIGN KEY ("primaryExamId") REFERENCES "exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_node" ADD CONSTRAINT "syllabus_node_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_node" ADD CONSTRAINT "syllabus_node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "syllabus_node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_closure" ADD CONSTRAINT "syllabus_closure_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "syllabus_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_closure" ADD CONSTRAINT "syllabus_closure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "syllabus_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_link" ADD CONSTRAINT "node_link_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "syllabus_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_link" ADD CONSTRAINT "node_link_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "syllabus_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword" ADD CONSTRAINT "keyword_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_keyword" ADD CONSTRAINT "node_keyword_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "syllabus_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_keyword" ADD CONSTRAINT "node_keyword_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_item" ADD CONSTRAINT "content_item_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_item" ADD CONSTRAINT "content_item_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_item" ADD CONSTRAINT "content_item_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "content_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_version" ADD CONSTRAINT "content_version_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_version" ADD CONSTRAINT "content_version_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_node" ADD CONSTRAINT "content_node_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_node" ADD CONSTRAINT "content_node_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "syllabus_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_modelAnswerItemId_fkey" FOREIGN KEY ("modelAnswerItemId") REFERENCES "content_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_option" ADD CONSTRAINT "question_option_questionItemId_fkey" FOREIGN KEY ("questionItemId") REFERENCES "question"("contentItemId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_entity" ADD CONSTRAINT "reference_entity_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visual" ADD CONSTRAINT "visual_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visual" ADD CONSTRAINT "visual_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_timestamp" ADD CONSTRAINT "video_timestamp_videoItemId_fkey" FOREIGN KEY ("videoItemId") REFERENCES "video"("contentItemId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "flashcard_deck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_deck" ADD CONSTRAINT "flashcard_deck_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_deck" ADD CONSTRAINT "flashcard_deck_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "current_affair" ADD CONSTRAINT "current_affair_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_review" ADD CONSTRAINT "content_review_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_review" ADD CONSTRAINT "content_review_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "content_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_review" ADD CONSTRAINT "content_review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_node_progress" ADD CONSTRAINT "user_node_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_node_progress" ADD CONSTRAINT "user_node_progress_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "syllabus_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_session" ADD CONSTRAINT "study_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_session" ADD CONSTRAINT "study_session_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "syllabus_node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "syllabus_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlight" ADD CONSTRAINT "highlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlight" ADD CONSTRAINT "highlight_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlight" ADD CONSTRAINT "highlight_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "content_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievement" ADD CONSTRAINT "user_achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievement" ADD CONSTRAINT "user_achievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test" ADD CONSTRAINT "test_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test" ADD CONSTRAINT "test_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_question" ADD CONSTRAINT "test_question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_question" ADD CONSTRAINT "test_question_questionItemId_fkey" FOREIGN KEY ("questionItemId") REFERENCES "question"("contentItemId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempt" ADD CONSTRAINT "test_attempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempt" ADD CONSTRAINT "test_attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_answer" ADD CONSTRAINT "test_answer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_answer" ADD CONSTRAINT "test_answer_questionItemId_fkey" FOREIGN KEY ("questionItemId") REFERENCES "question"("contentItemId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_answer" ADD CONSTRAINT "test_answer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "question_option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_prompt" ADD CONSTRAINT "answer_prompt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_prompt" ADD CONSTRAINT "answer_prompt_questionItemId_fkey" FOREIGN KEY ("questionItemId") REFERENCES "question"("contentItemId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_prompt" ADD CONSTRAINT "answer_prompt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_submission" ADD CONSTRAINT "answer_submission_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "answer_prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_submission" ADD CONSTRAINT "answer_submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_submission" ADD CONSTRAINT "answer_submission_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_evaluation" ADD CONSTRAINT "answer_evaluation_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "answer_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_evaluation" ADD CONSTRAINT "answer_evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

