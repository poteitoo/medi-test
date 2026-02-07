/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `organization_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "project_id" TEXT,
    "role" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoleAssignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoleAssignment_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoleAssignment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExternalIntegration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ExternalIntegration_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "url" TEXT,
    "metadata" JSONB NOT NULL,
    "synced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Requirement_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestCase_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestCaseRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "case_stable_id" TEXT NOT NULL,
    "rev" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "diff" JSONB,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestCaseRevision_case_stable_id_fkey" FOREIGN KEY ("case_stable_id") REFERENCES "TestCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestCaseRevision_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestScenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestScenario_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestScenarioRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenario_stable_id" TEXT NOT NULL,
    "rev" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "diff" JSONB,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestScenarioRevision_scenario_stable_id_fkey" FOREIGN KEY ("scenario_stable_id") REFERENCES "TestScenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestScenarioRevision_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestScenarioItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenario_revision_id" TEXT NOT NULL,
    "case_revision_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "optional_flag" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    CONSTRAINT "TestScenarioItem_scenario_revision_id_fkey" FOREIGN KEY ("scenario_revision_id") REFERENCES "TestScenarioRevision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestScenarioItem_case_revision_id_fkey" FOREIGN KEY ("case_revision_id") REFERENCES "TestCaseRevision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestScenarioList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestScenarioList_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestScenarioListRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "list_stable_id" TEXT NOT NULL,
    "rev" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "diff" JSONB,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestScenarioListRevision_list_stable_id_fkey" FOREIGN KEY ("list_stable_id") REFERENCES "TestScenarioList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestScenarioListRevision_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestScenarioListItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "list_revision_id" TEXT NOT NULL,
    "scenario_revision_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "include_rule" JSONB,
    CONSTRAINT "TestScenarioListItem_list_revision_id_fkey" FOREIGN KEY ("list_revision_id") REFERENCES "TestScenarioListRevision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestScenarioListItem_scenario_revision_id_fkey" FOREIGN KEY ("scenario_revision_id") REFERENCES "TestScenarioRevision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mapping_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MappingRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mapping_stable_id" TEXT NOT NULL,
    "rev" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "diff" JSONB,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MappingRevision_mapping_stable_id_fkey" FOREIGN KEY ("mapping_stable_id") REFERENCES "Mapping" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MappingRevision_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MappingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mapping_revision_id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_revision_id" TEXT NOT NULL,
    CONSTRAINT "MappingItem_mapping_revision_id_fkey" FOREIGN KEY ("mapping_revision_id") REFERENCES "MappingRevision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MappingItem_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "Requirement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowDefinition_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflow_stable_id" TEXT NOT NULL,
    "rev" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "config" JSONB NOT NULL,
    "diff" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowRevision_workflow_stable_id_fkey" FOREIGN KEY ("workflow_stable_id") REFERENCES "WorkflowDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowRevision_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "build_ref" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Release_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReleaseBaseline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "release_id" TEXT NOT NULL,
    "source_list_revision_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReleaseBaseline_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReleaseBaseline_source_list_revision_id_fkey" FOREIGN KEY ("source_list_revision_id") REFERENCES "TestScenarioListRevision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestRunGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "release_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "TestRunGroup_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "run_group_id" TEXT NOT NULL,
    "assignee_user_id" TEXT NOT NULL,
    "source_list_revision_id" TEXT NOT NULL,
    "build_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "TestRun_run_group_id_fkey" FOREIGN KEY ("run_group_id") REFERENCES "TestRunGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestRun_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TestRun_source_list_revision_id_fkey" FOREIGN KEY ("source_list_revision_id") REFERENCES "TestScenarioListRevision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestRunItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "run_id" TEXT NOT NULL,
    "case_revision_id" TEXT NOT NULL,
    "origin_scenario_revision_id" TEXT,
    "order" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestRunItem_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "TestRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestRunItem_case_revision_id_fkey" FOREIGN KEY ("case_revision_id") REFERENCES "TestCaseRevision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "run_item_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "evidence" JSONB,
    "bug_links" JSONB,
    "executed_by" TEXT NOT NULL,
    "executed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestResult_run_item_id_fkey" FOREIGN KEY ("run_item_id") REFERENCES "TestRunItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestResult_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "object_type" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "decision" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "comment" TEXT,
    "evidence_links" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Approval_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Approval_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Approval_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "TestCaseRevision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Approval_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "TestScenarioRevision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Approval_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "TestScenarioListRevision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Approval_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "MappingRevision" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Waiver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "release_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "reason" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "issuer_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Waiver_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Waiver_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_type" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "oidc_sub" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "User_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("email", "id", "name") SELECT "email", "id", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_organization_id_idx" ON "User"("organization_id");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_oidc_sub_idx" ON "User"("oidc_sub");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Project_organization_id_idx" ON "Project"("organization_id");

-- CreateIndex
CREATE INDEX "Project_slug_idx" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organization_id_slug_key" ON "Project"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "RoleAssignment_user_id_idx" ON "RoleAssignment"("user_id");

-- CreateIndex
CREATE INDEX "RoleAssignment_organization_id_idx" ON "RoleAssignment"("organization_id");

-- CreateIndex
CREATE INDEX "RoleAssignment_project_id_idx" ON "RoleAssignment"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_user_id_organization_id_project_id_role_key" ON "RoleAssignment"("user_id", "organization_id", "project_id", "role");

-- CreateIndex
CREATE INDEX "ExternalIntegration_project_id_idx" ON "ExternalIntegration"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIntegration_project_id_source_type_key" ON "ExternalIntegration"("project_id", "source_type");

-- CreateIndex
CREATE INDEX "Requirement_project_id_idx" ON "Requirement"("project_id");

-- CreateIndex
CREATE INDEX "Requirement_external_id_idx" ON "Requirement"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "Requirement_project_id_source_external_id_key" ON "Requirement"("project_id", "source", "external_id");

-- CreateIndex
CREATE INDEX "TestCase_project_id_idx" ON "TestCase"("project_id");

-- CreateIndex
CREATE INDEX "TestCaseRevision_case_stable_id_idx" ON "TestCaseRevision"("case_stable_id");

-- CreateIndex
CREATE INDEX "TestCaseRevision_status_idx" ON "TestCaseRevision"("status");

-- CreateIndex
CREATE INDEX "TestCaseRevision_created_by_idx" ON "TestCaseRevision"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "TestCaseRevision_case_stable_id_rev_key" ON "TestCaseRevision"("case_stable_id", "rev");

-- CreateIndex
CREATE INDEX "TestScenario_project_id_idx" ON "TestScenario"("project_id");

-- CreateIndex
CREATE INDEX "TestScenarioRevision_scenario_stable_id_idx" ON "TestScenarioRevision"("scenario_stable_id");

-- CreateIndex
CREATE INDEX "TestScenarioRevision_status_idx" ON "TestScenarioRevision"("status");

-- CreateIndex
CREATE INDEX "TestScenarioRevision_created_by_idx" ON "TestScenarioRevision"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "TestScenarioRevision_scenario_stable_id_rev_key" ON "TestScenarioRevision"("scenario_stable_id", "rev");

-- CreateIndex
CREATE INDEX "TestScenarioItem_scenario_revision_id_idx" ON "TestScenarioItem"("scenario_revision_id");

-- CreateIndex
CREATE INDEX "TestScenarioItem_case_revision_id_idx" ON "TestScenarioItem"("case_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "TestScenarioItem_scenario_revision_id_order_key" ON "TestScenarioItem"("scenario_revision_id", "order");

-- CreateIndex
CREATE INDEX "TestScenarioList_project_id_idx" ON "TestScenarioList"("project_id");

-- CreateIndex
CREATE INDEX "TestScenarioListRevision_list_stable_id_idx" ON "TestScenarioListRevision"("list_stable_id");

-- CreateIndex
CREATE INDEX "TestScenarioListRevision_status_idx" ON "TestScenarioListRevision"("status");

-- CreateIndex
CREATE INDEX "TestScenarioListRevision_created_by_idx" ON "TestScenarioListRevision"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "TestScenarioListRevision_list_stable_id_rev_key" ON "TestScenarioListRevision"("list_stable_id", "rev");

-- CreateIndex
CREATE INDEX "TestScenarioListItem_list_revision_id_idx" ON "TestScenarioListItem"("list_revision_id");

-- CreateIndex
CREATE INDEX "TestScenarioListItem_scenario_revision_id_idx" ON "TestScenarioListItem"("scenario_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "TestScenarioListItem_list_revision_id_order_key" ON "TestScenarioListItem"("list_revision_id", "order");

-- CreateIndex
CREATE INDEX "Mapping_project_id_idx" ON "Mapping"("project_id");

-- CreateIndex
CREATE INDEX "MappingRevision_mapping_stable_id_idx" ON "MappingRevision"("mapping_stable_id");

-- CreateIndex
CREATE INDEX "MappingRevision_status_idx" ON "MappingRevision"("status");

-- CreateIndex
CREATE INDEX "MappingRevision_created_by_idx" ON "MappingRevision"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "MappingRevision_mapping_stable_id_rev_key" ON "MappingRevision"("mapping_stable_id", "rev");

-- CreateIndex
CREATE INDEX "MappingItem_mapping_revision_id_idx" ON "MappingItem"("mapping_revision_id");

-- CreateIndex
CREATE INDEX "MappingItem_requirement_id_idx" ON "MappingItem"("requirement_id");

-- CreateIndex
CREATE INDEX "MappingItem_target_revision_id_idx" ON "MappingItem"("target_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "MappingItem_mapping_revision_id_requirement_id_target_revision_id_key" ON "MappingItem"("mapping_revision_id", "requirement_id", "target_revision_id");

-- CreateIndex
CREATE INDEX "WorkflowDefinition_project_id_idx" ON "WorkflowDefinition"("project_id");

-- CreateIndex
CREATE INDEX "WorkflowRevision_workflow_stable_id_idx" ON "WorkflowRevision"("workflow_stable_id");

-- CreateIndex
CREATE INDEX "WorkflowRevision_status_idx" ON "WorkflowRevision"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowRevision_workflow_stable_id_rev_key" ON "WorkflowRevision"("workflow_stable_id", "rev");

-- CreateIndex
CREATE INDEX "Release_project_id_idx" ON "Release"("project_id");

-- CreateIndex
CREATE INDEX "Release_status_idx" ON "Release"("status");

-- CreateIndex
CREATE INDEX "ReleaseBaseline_release_id_idx" ON "ReleaseBaseline"("release_id");

-- CreateIndex
CREATE INDEX "ReleaseBaseline_source_list_revision_id_idx" ON "ReleaseBaseline"("source_list_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseBaseline_release_id_source_list_revision_id_key" ON "ReleaseBaseline"("release_id", "source_list_revision_id");

-- CreateIndex
CREATE INDEX "TestRunGroup_release_id_idx" ON "TestRunGroup"("release_id");

-- CreateIndex
CREATE INDEX "TestRunGroup_status_idx" ON "TestRunGroup"("status");

-- CreateIndex
CREATE INDEX "TestRun_run_group_id_idx" ON "TestRun"("run_group_id");

-- CreateIndex
CREATE INDEX "TestRun_assignee_user_id_idx" ON "TestRun"("assignee_user_id");

-- CreateIndex
CREATE INDEX "TestRun_status_idx" ON "TestRun"("status");

-- CreateIndex
CREATE INDEX "TestRunItem_run_id_idx" ON "TestRunItem"("run_id");

-- CreateIndex
CREATE INDEX "TestRunItem_case_revision_id_idx" ON "TestRunItem"("case_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "TestRunItem_run_id_order_key" ON "TestRunItem"("run_id", "order");

-- CreateIndex
CREATE INDEX "TestResult_run_item_id_idx" ON "TestResult"("run_item_id");

-- CreateIndex
CREATE INDEX "TestResult_status_idx" ON "TestResult"("status");

-- CreateIndex
CREATE INDEX "TestResult_executed_by_idx" ON "TestResult"("executed_by");

-- CreateIndex
CREATE INDEX "TestResult_executed_at_idx" ON "TestResult"("executed_at");

-- CreateIndex
CREATE INDEX "Approval_object_type_object_id_idx" ON "Approval"("object_type", "object_id");

-- CreateIndex
CREATE INDEX "Approval_approver_id_idx" ON "Approval"("approver_id");

-- CreateIndex
CREATE INDEX "Approval_timestamp_idx" ON "Approval"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_object_type_object_id_step_approver_id_key" ON "Approval"("object_type", "object_id", "step", "approver_id");

-- CreateIndex
CREATE INDEX "Waiver_release_id_idx" ON "Waiver"("release_id");

-- CreateIndex
CREATE INDEX "Waiver_expires_at_idx" ON "Waiver"("expires_at");

-- CreateIndex
CREATE INDEX "Waiver_issuer_id_idx" ON "Waiver"("issuer_id");

-- CreateIndex
CREATE INDEX "AuditLog_actor_id_idx" ON "AuditLog"("actor_id");

-- CreateIndex
CREATE INDEX "AuditLog_object_type_object_id_idx" ON "AuditLog"("object_type", "object_id");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
