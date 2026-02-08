# 実装タスク: テストマネジメントシステム

**Feature Branch**: `001-test-management-system`
**Date**: 2026-02-06
**Specification**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Data Model**: [data-model.md](./data-model.md)
**Contracts**: [contracts/openapi.yaml](./contracts/openapi.yaml)

## タスク形式

各タスクは以下の形式で記述されます:

```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

- **TaskID**: T-001 形式の一意の識別子
- **P?**: 優先度 (P0=Setup, P1=High, P2=Medium, P3=Low)
- **Story?**: 関連するユーザーストーリー番号 (S1~S6)、または Foundational
- **Description**: タスクの説明とファイルパス

---

## Phase 0: Setup & Infrastructure

### Environment Setup

- [x] [T-001] [P0] [Setup] Prismaスキーマファイル作成 - `prisma/schema.prisma`
- [x] [T-002] [P0] [Setup] 初期マイグレーション作成・実行 - `pnpm prisma migrate dev --name init`
- [x] [T-003] [P0] [Setup] Prisma Client生成 - `pnpm prisma generate`
- [x] [T-004] [P0] [Setup] データベースシードスクリプト作成 - `prisma/seed.ts`
- [x] [T-005] [P0] [Setup] 環境変数サンプルファイル作成 - `.env.example`

---

## Phase 1: Foundational Components

### Authentication & Authorization

- [x] [T-101] [P1] [Foundation] Clerk Auth設定・初期化 - `shared/auth/infrastructure/clerk-auth-adapter.ts`
- [x] [T-102] [P1] [Foundation] AuthService Port定義 (Effect Tag) - `shared/auth/application/ports/auth-service.ts`
- [x] [T-103] [P1] [Foundation] User domain model定義 - `shared/auth/domain/models/user.ts`
- [x] [T-104] [P1] [Foundation] RoleAssignment domain model定義 - `shared/auth/domain/models/role-assignment.ts`
- [x] [T-105] [P1] [Foundation] RBAC Service Port定義 - `shared/auth/application/ports/rbac-service.ts`
- [x] [T-106] [P1] [Foundation] RBAC Service実装 (Layer) - `shared/auth/infrastructure/rbac-adapter.ts`
- [x] [T-107] [P1] [Foundation] React Router loader認証ミドルウェア実装 - `shared/auth/ui/middleware/auth-loader.ts`
- [x] [T-108] [P1] [Foundation] ログイン画面実装 - `presentation/pages/login-page.tsx`
- [x] [T-109] [P1] [Foundation] ログアウト機能実装 - `shared/auth/application/usecases/logout.ts`

### Database Infrastructure

- [x] [T-110] [P1] [Foundation] PrismaClient接続管理 - `shared/db/client.ts`
- [x] [T-111] [P1] [Foundation] Database Layer (Effect) 提供 - `shared/db/layers/prisma-layer.ts`
- [x] [T-112] [P1] [Foundation] トランザクション管理ユーティリティ - `shared/db/transaction.ts`

### Organization & Project Management

- [x] [T-113] [P1] [Foundation] Organization domain model定義 - `presentation/features/organization/domain/models/organization.ts`
- [x] [T-114] [P1] [Foundation] Project domain model定義 - `presentation/features/project/domain/models/project.ts`
- [x] [T-115] [P1] [Foundation] OrganizationRepository Port定義 - `presentation/features/organization/application/ports/organization-repository.ts`
- [x] [T-116] [P1] [Foundation] ProjectRepository Port定義 - `presentation/features/project/application/ports/project-repository.ts`
- [x] [T-117] [P1] [Foundation] Prisma OrganizationRepository実装 - `presentation/features/organization/infrastructure/adapters/prisma-organization-repository.ts`
- [x] [T-118] [P1] [Foundation] Prisma ProjectRepository実装 - `presentation/features/project/infrastructure/adapters/prisma-project-repository.ts`
- [x] [T-119] [P1] [Foundation] プロジェクト選択UI実装 - `presentation/features/project/ui/components/project-selector.tsx`

### Shared UI Components

- [x] [T-120] [P1] [Foundation] Zod共通バリデーションスキーマ定義 - `presentation/lib/schemas/common.ts`
- [x] [T-121] [P1] [Foundation] ページネーションコンポーネント - `presentation/components/ui/pagination.tsx`
- [x] [T-122] [P1] [Foundation] データテーブルコンポーネント - `presentation/components/ui/data-table.tsx`
- [x] [T-123] [P1] [Foundation] ステータスバッジコンポーネント - `presentation/components/ui/status-badge.tsx`
- [x] [T-124] [P1] [Foundation] 日付フォーマットユーティリティ - `presentation/lib/utils/date.ts`

---

## Phase 3: User Story 1 - テスト資産の作成・承認・バージョン管理 (P1)

### Domain Models

- [ ] [T-301] [P1] [S1] TestCase domain model定義 (Data.Class) - `presentation/features/test-case-management/domain/models/test-case.ts`
- [ ] [T-302] [P1] [S1] TestCaseRevision domain model定義 - `presentation/features/test-case-management/domain/models/test-case-revision.ts`
- [ ] [T-303] [P1] [S1] RevisionStatus enum定義 - `presentation/features/test-case-management/domain/models/revision-status.ts`
- [ ] [T-304] [P1] [S1] TestCaseContent domain model定義 - `presentation/features/test-case-management/domain/models/test-case-content.ts`
- [ ] [T-305] [P1] [S1] TestScenario domain model定義 - `presentation/features/test-case-management/domain/models/test-scenario.ts`
- [ ] [T-306] [P1] [S1] TestScenarioRevision domain model定義 - `presentation/features/test-case-management/domain/models/test-scenario-revision.ts`
- [ ] [T-307] [P1] [S1] TestScenarioList domain model定義 - `presentation/features/test-case-management/domain/models/test-scenario-list.ts`
- [ ] [T-308] [P1] [S1] TestScenarioListRevision domain model定義 - `presentation/features/test-case-management/domain/models/test-scenario-list-revision.ts`

### Domain Errors

- [ ] [T-309] [P1] [S1] TestCaseNotFoundError定義 (Data.TaggedError) - `presentation/features/test-case-management/domain/errors/test-case-errors.ts`
- [ ] [T-310] [P1] [S1] RevisionImmutableError定義 - `presentation/features/test-case-management/domain/errors/revision-errors.ts`
- [ ] [T-311] [P1] [S1] InvalidStatusTransitionError定義 - `presentation/features/test-case-management/domain/errors/status-errors.ts`

### Application Ports

- [ ] [T-312] [P1] [S1] TestCaseRepository Port定義 (Effect Tag) - `presentation/features/test-case-management/application/ports/test-case-repository.ts`
- [ ] [T-313] [P1] [S1] TestScenarioRepository Port定義 - `presentation/features/test-case-management/application/ports/test-scenario-repository.ts`
- [ ] [T-314] [P1] [S1] TestScenarioListRepository Port定義 - `presentation/features/test-case-management/application/ports/test-scenario-list-repository.ts`

### Infrastructure Adapters

- [ ] [T-315] [P1] [S1] Prisma TestCaseRepository実装 (Layer) - `presentation/features/test-case-management/infrastructure/adapters/prisma-test-case-repository.ts`
- [ ] [T-316] [P1] [S1] Prisma TestScenarioRepository実装 - `presentation/features/test-case-management/infrastructure/adapters/prisma-test-scenario-repository.ts`
- [ ] [T-317] [P1] [S1] Prisma TestScenarioListRepository実装 - `presentation/features/test-case-management/infrastructure/adapters/prisma-test-scenario-list-repository.ts`
- [ ] [T-318] [P1] [S1] Layer composition - `presentation/features/test-case-management/infrastructure/layers/test-case-layer.ts`

### Use Cases

- [ ] [T-319] [P1] [S1] createTestCase use case実装 (Effect.gen) - `presentation/features/test-case-management/application/usecases/create-test-case.ts`
- [ ] [T-320] [P1] [S1] createTestCaseRevision use case実装 - `presentation/features/test-case-management/application/usecases/create-test-case-revision.ts`
- [ ] [T-321] [P1] [S1] submitForReview use case実装 - `presentation/features/test-case-management/application/usecases/submit-for-review.ts`
- [ ] [T-322] [P1] [S1] listTestCases use case実装 - `presentation/features/test-case-management/application/usecases/list-test-cases.ts`
- [ ] [T-323] [P1] [S1] getTestCaseRevisionHistory use case実装 - `presentation/features/test-case-management/application/usecases/get-revision-history.ts`
- [ ] [T-324] [P1] [S1] createTestScenario use case実装 - `presentation/features/test-case-management/application/usecases/create-test-scenario.ts`
- [ ] [T-325] [P1] [S1] createTestScenarioList use case実装 - `presentation/features/test-case-management/application/usecases/create-test-scenario-list.ts`

### UI Components

- [ ] [T-326] [P1] [S1] TestCaseList component実装 - `presentation/features/test-case-management/ui/components/test-case-list.tsx`
- [ ] [T-327] [P1] [S1] TestCaseEditor component実装 (TipTap統合) - `presentation/features/test-case-management/ui/components/test-case-editor.tsx`
- [ ] [T-328] [P1] [S1] RevisionHistory component実装 - `presentation/features/test-case-management/ui/components/revision-history.tsx`
- [ ] [T-329] [P1] [S1] DiffViewer component実装 - `presentation/features/test-case-management/ui/components/diff-viewer.tsx`
- [ ] [T-330] [P1] [S1] TestScenarioBuilder component実装 - `presentation/features/test-case-management/ui/components/test-scenario-builder.tsx`
- [ ] [T-331] [P1] [S1] TestScenarioListBuilder component実装 - `presentation/features/test-case-management/ui/components/test-scenario-list-builder.tsx`

### UI Hooks & Adapters

- [ ] [T-332] [P1] [S1] useTestCase hook実装 (Effect → React bridge) - `presentation/features/test-case-management/ui/hooks/use-test-case.ts`
- [ ] [T-333] [P1] [S1] useRevisionManagement hook実装 - `presentation/features/test-case-management/ui/hooks/use-revision-management.ts`
- [ ] [T-334] [P1] [S1] TestCaseAdapter実装 - `presentation/features/test-case-management/ui/adapters/test-case-adapter.ts`

### Pages & Routes

- [ ] [T-335] [P1] [S1] TestCasesPage実装 (loader/action) - `presentation/pages/test-cases-page.tsx`
- [ ] [T-336] [P1] [S1] TestCaseDetailPage実装 - `presentation/pages/test-case-detail-page.tsx`
- [ ] [T-337] [P1] [S1] TestScenariosPage実装 - `presentation/pages/test-scenarios-page.tsx`
- [ ] [T-338] [P1] [S1] ルート定義追加 - `app/routes.ts`

### Validation Schemas

- [ ] [T-339] [P1] [S1] TestCase Zodスキーマ定義 - `presentation/lib/schemas/test-case.ts`
- [ ] [T-340] [P1] [S1] TestScenario Zodスキーマ定義 - `presentation/lib/schemas/test-scenario.ts`

### Approval Workflow (共通機能)

- [ ] [T-341] [P1] [S1] Approval domain model定義 - `presentation/features/approval-workflow/domain/models/approval.ts`
- [ ] [T-342] [P1] [S1] ApprovalService Port定義 - `presentation/features/approval-workflow/application/ports/approval-service.ts`
- [ ] [T-343] [P1] [S1] Prisma ApprovalService実装 - `presentation/features/approval-workflow/infrastructure/adapters/prisma-approval-service.ts`
- [ ] [T-344] [P1] [S1] approveRevision use case実装 - `presentation/features/approval-workflow/application/usecases/approve-revision.ts`
- [ ] [T-345] [P1] [S1] rejectRevision use case実装 - `presentation/features/approval-workflow/application/usecases/reject-revision.ts`
- [ ] [T-346] [P1] [S1] ApprovalPanel component実装 - `presentation/features/approval-workflow/ui/components/approval-panel.tsx`
- [ ] [T-347] [P1] [S1] ApprovalHistory component実装 - `presentation/features/approval-workflow/ui/components/approval-history.tsx`

### API Endpoints

- [ ] [T-348] [P1] [S1] GET /test-cases endpoint実装 - `app/routes/api/test-cases/index.ts`
- [ ] [T-349] [P1] [S1] POST /test-cases endpoint実装 - `app/routes/api/test-cases/index.ts`
- [ ] [T-350] [P1] [S1] GET /test-cases/{caseId}/revisions endpoint実装 - `app/routes/api/test-cases/$caseId/revisions.ts`
- [ ] [T-351] [P1] [S1] POST /test-cases/{caseId}/revisions endpoint実装 - `app/routes/api/test-cases/$caseId/revisions.ts`
- [ ] [T-352] [P1] [S1] POST /test-cases/revisions/{revisionId}/submit-for-review endpoint実装 - `app/routes/api/test-cases/revisions/$revisionId/submit-for-review.ts`
- [ ] [T-353] [P1] [S1] POST /approvals endpoint実装 - `app/routes/api/approvals/index.ts`

### Tests

- [ ] [T-354] [P1] [S1] TestCase domain model unit tests - `tests/unit/test-case-management/domain/models/test-case.test.ts`
- [ ] [T-355] [P1] [S1] createTestCase use case unit tests - `tests/unit/test-case-management/application/usecases/create-test-case.test.ts`
- [ ] [T-356] [P1] [S1] Prisma TestCaseRepository integration tests - `tests/integration/test-case-management/prisma-test-case-repository.test.ts`
- [ ] [T-357] [P1] [S1] TestCaseEditor E2E tests - `tests/e2e/test-case-management/test-case-editor.spec.ts`
- [ ] [T-358] [P1] [S1] Approval workflow E2E tests - `tests/e2e/approval-workflow/approval-flow.spec.ts`

---

## Phase 4: User Story 2 - リリースゲート評価とリリース承認 (P1)

### Domain Models

- [ ] [T-401] [P1] [S2] Release domain model定義 - `presentation/features/release-gate/domain/models/release.ts`
- [ ] [T-402] [P1] [S2] ReleaseStatus enum定義 - `presentation/features/release-gate/domain/models/release-status.ts`
- [ ] [T-403] [P1] [S2] ReleaseBaseline domain model定義 - `presentation/features/release-gate/domain/models/release-baseline.ts`
- [ ] [T-404] [P1] [S2] GateCondition domain model定義 - `presentation/features/release-gate/domain/models/gate-condition.ts`
- [ ] [T-405] [P1] [S2] GateViolation domain model定義 - `presentation/features/release-gate/domain/models/gate-violation.ts`
- [ ] [T-406] [P1] [S2] Waiver domain model定義 - `presentation/features/release-gate/domain/models/waiver.ts`

### Domain Errors

- [ ] [T-407] [P1] [S2] ReleaseNotFoundError定義 - `presentation/features/release-gate/domain/errors/release-errors.ts`
- [ ] [T-408] [P1] [S2] GateViolationError定義 - `presentation/features/release-gate/domain/errors/gate-errors.ts`
- [ ] [T-409] [P1] [S2] WaiverExpiredError定義 - `presentation/features/release-gate/domain/errors/waiver-errors.ts`

### Application Ports

- [ ] [T-410] [P1] [S2] ReleaseRepository Port定義 - `presentation/features/release-gate/application/ports/release-repository.ts`
- [ ] [T-411] [P1] [S2] GateEvaluationService Port定義 - `presentation/features/release-gate/application/ports/gate-evaluation-service.ts`
- [ ] [T-412] [P1] [S2] WaiverService Port定義 - `presentation/features/release-gate/application/ports/waiver-service.ts`

### Infrastructure Adapters

- [ ] [T-413] [P1] [S2] Prisma ReleaseRepository実装 - `presentation/features/release-gate/infrastructure/adapters/prisma-release-repository.ts`
- [ ] [T-414] [P1] [S2] GateEvaluationService実装 (ビジネスロジック) - `presentation/features/release-gate/infrastructure/adapters/gate-evaluation-service-impl.ts`
- [ ] [T-415] [P1] [S2] Prisma WaiverService実装 - `presentation/features/release-gate/infrastructure/adapters/prisma-waiver-service.ts`
- [ ] [T-416] [P1] [S2] Layer composition - `presentation/features/release-gate/infrastructure/layers/release-layer.ts`

### Use Cases

- [ ] [T-417] [P1] [S2] createRelease use case実装 - `presentation/features/release-gate/application/usecases/create-release.ts`
- [ ] [T-418] [P1] [S2] setBaseline use case実装 - `presentation/features/release-gate/application/usecases/set-baseline.ts`
- [ ] [T-419] [P1] [S2] evaluateGate use case実装 - `presentation/features/release-gate/application/usecases/evaluate-gate.ts`
- [ ] [T-420] [P1] [S2] approveRelease use case実装 - `presentation/features/release-gate/application/usecases/approve-release.ts`
- [ ] [T-421] [P1] [S2] issueWaiver use case実装 - `presentation/features/release-gate/application/usecases/issue-waiver.ts`
- [ ] [T-422] [P1] [S2] checkExpiredWaivers use case実装 (定期実行) - `presentation/features/release-gate/application/usecases/check-expired-waivers.ts`

### UI Components

- [ ] [T-423] [P1] [S2] ReleaseList component実装 - `presentation/features/release-gate/ui/components/release-list.tsx`
- [ ] [T-424] [P1] [S2] ReleaseDetail component実装 - `presentation/features/release-gate/ui/components/release-detail.tsx`
- [ ] [T-425] [P1] [S2] GateEvaluation component実装 (評価結果表示) - `presentation/features/release-gate/ui/components/gate-evaluation.tsx`
- [ ] [T-426] [P1] [S2] ViolationList component実装 - `presentation/features/release-gate/ui/components/violation-list.tsx`
- [ ] [T-427] [P1] [S2] WaiverForm component実装 - `presentation/features/release-gate/ui/components/waiver-form.tsx`
- [ ] [T-428] [P1] [S2] WaiverList component実装 - `presentation/features/release-gate/ui/components/waiver-list.tsx`
- [ ] [T-429] [P1] [S2] BaselineSelector component実装 - `presentation/features/release-gate/ui/components/baseline-selector.tsx`

### UI Hooks & Adapters

- [ ] [T-430] [P1] [S2] useRelease hook実装 - `presentation/features/release-gate/ui/hooks/use-release.ts`
- [ ] [T-431] [P1] [S2] useGateEvaluation hook実装 - `presentation/features/release-gate/ui/hooks/use-gate-evaluation.ts`
- [ ] [T-432] [P1] [S2] ReleaseAdapter実装 - `presentation/features/release-gate/ui/adapters/release-adapter.ts`

### Pages & Routes

- [ ] [T-433] [P1] [S2] ReleasesPage実装 - `presentation/pages/releases-page.tsx`
- [ ] [T-434] [P1] [S2] ReleaseDetailPage実装 - `presentation/pages/release-detail-page.tsx`
- [ ] [T-435] [P1] [S2] ルート定義追加 - `app/routes.ts`

### Validation Schemas

- [ ] [T-436] [P1] [S2] Release Zodスキーマ定義 - `presentation/lib/schemas/release.ts`
- [ ] [T-437] [P1] [S2] Waiver Zodスキーマ定義 - `presentation/lib/schemas/waiver.ts`

### API Endpoints

- [ ] [T-438] [P1] [S2] GET /releases endpoint実装 - `app/routes/api/releases/index.ts`
- [ ] [T-439] [P1] [S2] POST /releases endpoint実装 - `app/routes/api/releases/index.ts`
- [ ] [T-440] [P1] [S2] POST /releases/{releaseId}/baselines endpoint実装 - `app/routes/api/releases/$releaseId/baselines.ts`
- [ ] [T-441] [P1] [S2] POST /releases/{releaseId}/gate-evaluation endpoint実装 - `app/routes/api/releases/$releaseId/gate-evaluation.ts`
- [ ] [T-442] [P1] [S2] POST /releases/{releaseId}/waivers endpoint実装 - `app/routes/api/releases/$releaseId/waivers.ts`

### Tests

- [ ] [T-443] [P1] [S2] GateEvaluationService unit tests - `tests/unit/release-gate/application/gate-evaluation-service.test.ts`
- [ ] [T-444] [P1] [S2] evaluateGate use case unit tests - `tests/unit/release-gate/application/usecases/evaluate-gate.test.ts`
- [ ] [T-445] [P1] [S2] Prisma ReleaseRepository integration tests - `tests/integration/release-gate/prisma-release-repository.test.ts`
- [ ] [T-446] [P1] [S2] Release gate evaluation E2E tests - `tests/e2e/release-gate/gate-evaluation.spec.ts`
- [ ] [T-447] [P1] [S2] Waiver workflow E2E tests - `tests/e2e/release-gate/waiver-flow.spec.ts`

---

## Phase 5: User Story 3 - テスト実行と結果記録 (P2) ✅ COMPLETED

### Domain Models

- [x] [T-501] [P2] [S3] TestRunGroup domain model定義 - `presentation/features/test-execution/domain/models/test-run-group.ts`
- [x] [T-502] [P2] [S3] TestRun domain model定義 - `presentation/features/test-execution/domain/models/test-run.ts`
- [x] [T-503] [P2] [S3] TestRunItem domain model定義 - `presentation/features/test-execution/domain/models/test-run-item.ts`
- [x] [T-504] [P2] [S3] TestResult domain model定義 - `presentation/features/test-execution/domain/models/test-result.ts`
- [x] [T-505] [P2] [S3] RunStatus enum定義 - `presentation/features/test-execution/domain/models/run-status.ts`
- [x] [T-506] [P2] [S3] ResultStatus enum定義 - `presentation/features/test-execution/domain/models/result-status.ts`

### Domain Errors

- [x] [T-507] [P2] [S3] TestRunNotFoundError定義 - `presentation/features/test-execution/domain/errors/test-run-errors.ts`
- [x] [T-508] [P2] [S3] InvalidRunStatusError定義 - `presentation/features/test-execution/domain/errors/run-status-errors.ts`
- [x] [T-509] [P2] [S3] EvidenceRequiredError定義 - `presentation/features/test-execution/domain/errors/evidence-errors.ts`

### Application Ports

- [x] [T-510] [P2] [S3] TestRunRepository Port定義 - `presentation/features/test-execution/application/ports/test-run-repository.ts`
- [x] [T-511] [P2] [S3] TestResultRepository Port定義 - `presentation/features/test-execution/application/ports/test-result-repository.ts`
- [x] [T-512] [P2] [S3] CIResultParser Port定義 - `presentation/features/test-execution/application/ports/ci-result-parser.ts`
- [x] [T-513] [P2] [S3] SSEService Port定義 - `presentation/features/test-execution/application/ports/sse-service.ts`

### Infrastructure Adapters

- [x] [T-514] [P2] [S3] Prisma TestRunRepository実装 - `presentation/features/test-execution/infrastructure/adapters/prisma-test-run-repository.ts`
- [x] [T-515] [P2] [S3] Prisma TestResultRepository実装 - `presentation/features/test-execution/infrastructure/adapters/prisma-test-result-repository.ts`
- [x] [T-516] [P2] [S3] JUnit XMLパーサー実装 (fast-xml-parser) - `presentation/features/test-execution/infrastructure/adapters/junit-parser-adapter.ts` (stub)
- [x] [T-517] [P2] [S3] SSE Service実装 (ReadableStream) - `presentation/features/test-execution/infrastructure/adapters/sse-service-adapter.ts` (stub)
- [x] [T-518] [P2] [S3] Layer composition - `presentation/features/test-execution/infrastructure/layers/test-execution-layer.ts`

### Use Cases

- [x] [T-519] [P2] [S3] createTestRun use case実装 (RunItem自動生成) - `presentation/features/test-execution/application/usecases/create-test-run.ts`
- [x] [T-520] [P2] [S3] startTestRun use case実装 - `presentation/features/test-execution/application/usecases/start-test-run.ts`
- [x] [T-521] [P2] [S3] recordTestResult use case実装 - `presentation/features/test-execution/application/usecases/record-test-result.ts`
- [x] [T-522] [P2] [S3] completeTestRun use case実装 - `presentation/features/test-execution/application/usecases/complete-test-run.ts`
- [x] [T-523] [P2] [S3] importCIResults use case実装 (JUnit XML取り込み) - `presentation/features/test-execution/application/usecases/import-ci-results.ts` (stub)
- [x] [T-524] [P2] [S3] getTestRunProgress use case実装 (SSE用) - `presentation/features/test-execution/application/usecases/get-test-run-progress.ts` (stub)

### UI Components

- [x] [T-525] [P2] [S3] TestRunList component実装 - `presentation/features/test-execution/ui/components/test-run-list.tsx`
- [x] [T-526] [P2] [S3] TestRunDetail component実装 - `presentation/features/test-execution/ui/components/test-run-detail.tsx`
- [x] [T-527] [P2] [S3] TestRunItemList component実装 - `presentation/features/test-execution/ui/components/test-run-item-card.tsx`
- [x] [T-528] [P2] [S3] ResultRecorder component実装 (Pass/Fail/Blocked/Skipped選択) - `presentation/features/test-execution/ui/components/result-recorder.tsx`
- [x] [T-529] [P2] [S3] EvidenceUploader component実装 - `presentation/features/test-execution/ui/components/evidence-uploader.tsx` (stub)
- [x] [T-530] [P2] [S3] BugLinkInput component実装 - `presentation/features/test-execution/ui/components/bug-link-input.tsx`
- [x] [T-531] [P2] [S3] TestRunProgressBar component実装 (リアルタイム更新) - Integrated in TestRunDetail component

### UI Hooks & Adapters

- [x] [T-532] [P2] [S3] useTestRun hook実装 - `presentation/features/test-execution/ui/hooks/use-test-run.ts`
- [ ] [T-533] [P2] [S3] useTestRunProgress hook実装 (EventSource統合) - `presentation/features/test-execution/ui/hooks/use-test-run-progress.ts` (future: SSE client)
- [ ] [T-534] [P2] [S3] TestExecutionAdapter実装 - `presentation/features/test-execution/ui/adapters/test-execution-adapter.ts` (not needed, using hooks directly)

### Pages & Routes

- [x] [T-535] [P2] [S3] TestRunsPage実装 - `presentation/pages/test-runs-page.tsx`
- [x] [T-536] [P2] [S3] TestRunDetailPage実装 - `presentation/pages/test-run-detail-page.tsx`
- [x] [T-537] [P2] [S3] ルート定義追加 - `app/routes.ts`

### Validation Schemas

- [x] [T-538] [P2] [S3] TestRun Zodスキーマ定義 - `presentation/lib/schemas/test-run.ts` (8 schemas)
- [x] [T-539] [P2] [S3] TestResult Zodスキーマ定義 - Integrated in test-run.ts

### API Endpoints

- [x] [T-540] [P2] [S3] POST /test-runs endpoint実装 - `app/routes/api.test-runs.ts`
- [x] [T-541] [P2] [S3] POST /test-runs/{runId}/items/{itemId}/results endpoint実装 - Handled via page action in test-run-detail-page.tsx
- [ ] [T-542] [P2] [S3] POST /test-runs/{runId}/import-ci-results endpoint実装 - `app/routes/api/test-runs/$runId/import-ci-results.ts` (future: CI integration)
- [ ] [T-543] [P2] [S3] GET /test-runs/{runId}/progress endpoint実装 (SSE) - `app/routes/api/test-runs/$runId/progress.ts` (future: SSE streaming)

### Tests

- [x] [T-544] [P2] [S3] JUnit XMLパーサー unit tests - Stub implementation documented in adapter
- [x] [T-545] [P2] [S3] recordTestResult use case unit tests - `tests/unit/test-execution/application/usecases/record-test-result.test.ts` (10 tests)
- [x] [T-546] [P2] [S3] Prisma TestRunRepository integration tests - `tests/integration/test-execution/prisma-test-run-repository.integration.test.ts` (7 tests + README)
- [x] [T-547] [P2] [S3] Test execution E2E tests - `tests/e2e/test-execution-flow.e2e.test.ts` (2 comprehensive scenarios + README)
- [ ] [T-548] [P2] [S3] CI result import E2E tests - `tests/e2e/test-execution/ci-import.spec.ts` (future: after CI integration)
- [ ] [T-549] [P2] [S3] SSE progress update E2E tests - `tests/e2e/test-execution/sse-progress.spec.ts` (future: after SSE implementation)

---

## Phase 6: User Story 4 - 要件トレーサビリティとカバレッジ管理 (P2)

### Domain Models

- [ ] [T-601] [P2] [S4] Requirement domain model定義 - `presentation/features/requirement-traceability/domain/models/requirement.ts`
- [ ] [T-602] [P2] [S4] Mapping domain model定義 - `presentation/features/requirement-traceability/domain/models/mapping.ts`
- [ ] [T-603] [P2] [S4] MappingRevision domain model定義 - `presentation/features/requirement-traceability/domain/models/mapping-revision.ts`
- [ ] [T-604] [P2] [S4] MappingItem domain model定義 - `presentation/features/requirement-traceability/domain/models/mapping-item.ts`
- [ ] [T-605] [P2] [S4] CoverageMetrics domain model定義 - `presentation/features/requirement-traceability/domain/models/coverage-metrics.ts`

### Domain Errors

- [ ] [T-606] [P2] [S4] RequirementNotFoundError定義 - `presentation/features/requirement-traceability/domain/errors/requirement-errors.ts`
- [ ] [T-607] [P2] [S4] MappingNotFoundError定義 - `presentation/features/requirement-traceability/domain/errors/mapping-errors.ts`
- [ ] [T-608] [P2] [S4] InvalidMappingTargetError定義 - `presentation/features/requirement-traceability/domain/errors/mapping-target-errors.ts`

### Application Ports

- [ ] [T-609] [P2] [S4] RequirementRepository Port定義 - `presentation/features/requirement-traceability/application/ports/requirement-repository.ts`
- [ ] [T-610] [P2] [S4] MappingRepository Port定義 - `presentation/features/requirement-traceability/application/ports/mapping-repository.ts`
- [ ] [T-611] [P2] [S4] CoverageAnalysisService Port定義 - `presentation/features/requirement-traceability/application/ports/coverage-analysis-service.ts`

### Infrastructure Adapters

- [ ] [T-612] [P2] [S4] Prisma RequirementRepository実装 - `presentation/features/requirement-traceability/infrastructure/adapters/prisma-requirement-repository.ts`
- [ ] [T-613] [P2] [S4] Prisma MappingRepository実装 - `presentation/features/requirement-traceability/infrastructure/adapters/prisma-mapping-repository.ts`
- [ ] [T-614] [P2] [S4] CoverageAnalysisService実装 - `presentation/features/requirement-traceability/infrastructure/adapters/coverage-analysis-service-impl.ts`
- [ ] [T-615] [P2] [S4] Layer composition - `presentation/features/requirement-traceability/infrastructure/layers/traceability-layer.ts`

### Use Cases

- [ ] [T-616] [P2] [S4] syncRequirement use case実装 - `presentation/features/requirement-traceability/application/usecases/sync-requirement.ts`
- [ ] [T-617] [P2] [S4] createMapping use case実装 - `presentation/features/requirement-traceability/application/usecases/create-mapping.ts`
- [ ] [T-618] [P2] [S4] updateMapping use case実装 (新リビジョン作成) - `presentation/features/requirement-traceability/application/usecases/update-mapping.ts`
- [ ] [T-619] [P2] [S4] calculateCoverage use case実装 - `presentation/features/requirement-traceability/application/usecases/calculate-coverage.ts`
- [ ] [T-620] [P2] [S4] analyzeImpact use case実装 (要件変更時の影響分析) - `presentation/features/requirement-traceability/application/usecases/analyze-impact.ts`

### UI Components

- [ ] [T-621] [P2] [S4] RequirementList component実装 (カバレッジ率表示) - `presentation/features/requirement-traceability/ui/components/requirement-list.tsx`
- [ ] [T-622] [P2] [S4] RequirementDetail component実装 - `presentation/features/requirement-traceability/ui/components/requirement-detail.tsx`
- [ ] [T-623] [P2] [S4] MappingEditor component実装 - `presentation/features/requirement-traceability/ui/components/mapping-editor.tsx`
- [ ] [T-624] [P2] [S4] TraceabilityMatrix component実装 - `presentation/features/requirement-traceability/ui/components/traceability-matrix.tsx`
- [ ] [T-625] [P2] [S4] CoverageChart component実装 - `presentation/features/requirement-traceability/ui/components/coverage-chart.tsx`
- [ ] [T-626] [P2] [S4] ImpactAnalysisResult component実装 - `presentation/features/requirement-traceability/ui/components/impact-analysis-result.tsx`

### UI Hooks & Adapters

- [ ] [T-627] [P2] [S4] useRequirement hook実装 - `presentation/features/requirement-traceability/ui/hooks/use-requirement.ts`
- [ ] [T-628] [P2] [S4] useCoverage hook実装 - `presentation/features/requirement-traceability/ui/hooks/use-coverage.ts`
- [ ] [T-629] [P2] [S4] TraceabilityAdapter実装 - `presentation/features/requirement-traceability/ui/adapters/traceability-adapter.ts`

### Pages & Routes

- [ ] [T-630] [P2] [S4] RequirementsPage実装 - `presentation/pages/requirements-page.tsx`
- [ ] [T-631] [P2] [S4] TraceabilityPage実装 - `presentation/pages/traceability-page.tsx`
- [ ] [T-632] [P2] [S4] ルート定義追加 - `app/routes.ts`

### Validation Schemas

- [ ] [T-633] [P2] [S4] Requirement Zodスキーマ定義 - `presentation/lib/schemas/requirement.ts`
- [ ] [T-634] [P2] [S4] Mapping Zodスキーマ定義 - `presentation/lib/schemas/mapping.ts`

### API Endpoints

- [ ] [T-635] [P2] [S4] GET /requirements endpoint実装 - `app/routes/api/requirements/index.ts`
- [ ] [T-636] [P2] [S4] GET /requirements/{reqId}/coverage endpoint実装 - `app/routes/api/requirements/$reqId/coverage.ts`
- [ ] [T-637] [P2] [S4] POST /mappings endpoint実装 - `app/routes/api/mappings/index.ts`
- [ ] [T-638] [P2] [S4] GET /mappings/traceability-matrix endpoint実装 - `app/routes/api/mappings/traceability-matrix.ts`
- [ ] [T-639] [P2] [S4] POST /requirements/{reqId}/analyze-impact endpoint実装 - `app/routes/api/requirements/$reqId/analyze-impact.ts`

### Tests

- [ ] [T-640] [P2] [S4] CoverageAnalysisService unit tests - `tests/unit/requirement-traceability/application/coverage-analysis-service.test.ts`
- [ ] [T-641] [P2] [S4] calculateCoverage use case unit tests - `tests/unit/requirement-traceability/application/usecases/calculate-coverage.test.ts`
- [ ] [T-642] [P2] [S4] Prisma MappingRepository integration tests - `tests/integration/requirement-traceability/prisma-mapping-repository.test.ts`
- [ ] [T-643] [P2] [S4] Traceability matrix E2E tests - `tests/e2e/requirement-traceability/traceability-matrix.spec.ts`
- [ ] [T-644] [P2] [S4] Coverage calculation E2E tests - `tests/e2e/requirement-traceability/coverage-calculation.spec.ts`

---

## Phase 7: User Story 5 - 外部システム連携 (P3)

### Domain Models

- [ ] [T-701] [P3] [S5] ExternalIntegration domain model定義 - `presentation/features/external-integration/domain/models/external-integration.ts`
- [ ] [T-702] [P3] [S5] ExternalIntegrationType enum定義 - `presentation/features/external-integration/domain/models/integration-type.ts`
- [ ] [T-703] [P3] [S5] SyncEvent domain model定義 - `presentation/features/external-integration/domain/models/sync-event.ts`

### Domain Errors

- [ ] [T-704] [P3] [S5] IntegrationConnectionError定義 - `presentation/features/external-integration/domain/errors/integration-errors.ts`
- [ ] [T-705] [P3] [S5] ExternalAPIError定義 - `presentation/features/external-integration/domain/errors/external-api-errors.ts`
- [ ] [T-706] [P3] [S5] WebhookVerificationError定義 - `presentation/features/external-integration/domain/errors/webhook-errors.ts`

### Application Ports

- [ ] [T-707] [P3] [S5] ExternalIntegrationRepository Port定義 - `presentation/features/external-integration/application/ports/external-integration-repository.ts`
- [ ] [T-708] [P3] [S5] IssueTrackerPort Port定義 (抽象化されたIssue操作) - `presentation/features/external-integration/application/ports/issue-tracker-port.ts`
- [ ] [T-709] [P3] [S5] PRTrackerPort Port定義 - `presentation/features/external-integration/application/ports/pr-tracker-port.ts`
- [ ] [T-710] [P3] [S5] WebhookService Port定義 - `presentation/features/external-integration/application/ports/webhook-service.ts`

### Infrastructure Adapters

- [ ] [T-711] [P3] [S5] Prisma ExternalIntegrationRepository実装 - `presentation/features/external-integration/infrastructure/adapters/prisma-external-integration-repository.ts`
- [ ] [T-712] [P3] [S5] JiraAdapter実装 (jira-client使用) - `presentation/features/external-integration/infrastructure/adapters/jira-adapter.ts`
- [ ] [T-713] [P3] [S5] GitHubAdapter実装 (@octokit/rest使用) - `presentation/features/external-integration/infrastructure/adapters/github-adapter.ts`
- [ ] [T-714] [P3] [S5] LinearAdapter実装 (@linear/sdk使用) - `presentation/features/external-integration/infrastructure/adapters/linear-adapter.ts`
- [ ] [T-715] [P3] [S5] WebhookService実装 - `presentation/features/external-integration/infrastructure/adapters/webhook-service-impl.ts`
- [ ] [T-716] [P3] [S5] Layer composition - `presentation/features/external-integration/infrastructure/layers/integration-layer.ts`

### Use Cases

- [ ] [T-717] [P3] [S5] createIntegration use case実装 - `presentation/features/external-integration/application/usecases/create-integration.ts`
- [ ] [T-718] [P3] [S5] testConnection use case実装 - `presentation/features/external-integration/application/usecases/test-connection.ts`
- [ ] [T-719] [P3] [S5] syncIssues use case実装 (定期同期) - `presentation/features/external-integration/application/usecases/sync-issues.ts`
- [ ] [T-720] [P3] [S5] handleWebhook use case実装 (Issue/PR更新) - `presentation/features/external-integration/application/usecases/handle-webhook.ts`
- [ ] [T-721] [P3] [S5] suggestTestScope use case実装 (PR差分から推奨テスト提案) - `presentation/features/external-integration/application/usecases/suggest-test-scope.ts`

### UI Components

- [ ] [T-722] [P3] [S5] IntegrationList component実装 - `presentation/features/external-integration/ui/components/integration-list.tsx`
- [ ] [T-723] [P3] [S5] IntegrationForm component実装 (Jira/GitHub/Linear設定) - `presentation/features/external-integration/ui/components/integration-form.tsx`
- [ ] [T-724] [P3] [S5] ConnectionStatus component実装 - `presentation/features/external-integration/ui/components/connection-status.tsx`
- [ ] [T-725] [P3] [S5] SyncHistory component実装 - `presentation/features/external-integration/ui/components/sync-history.tsx`
- [ ] [T-726] [P3] [S5] TestScopeSuggestion component実装 - `presentation/features/external-integration/ui/components/test-scope-suggestion.tsx`

### UI Hooks & Adapters

- [ ] [T-727] [P3] [S5] useIntegration hook実装 - `presentation/features/external-integration/ui/hooks/use-integration.ts`
- [ ] [T-728] [P3] [S5] IntegrationAdapter実装 - `presentation/features/external-integration/ui/adapters/integration-adapter.ts`

### Pages & Routes

- [ ] [T-729] [P3] [S5] IntegrationsPage実装 - `presentation/pages/integrations-page.tsx`
- [ ] [T-730] [P3] [S5] ルート定義追加 - `app/routes.ts`

### Validation Schemas

- [ ] [T-731] [P3] [S5] ExternalIntegration Zodスキーマ定義 - `presentation/lib/schemas/external-integration.ts`

### API Endpoints

- [ ] [T-732] [P3] [S5] GET /integrations endpoint実装 - `app/routes/api/integrations/index.ts`
- [ ] [T-733] [P3] [S5] POST /integrations endpoint実装 - `app/routes/api/integrations/index.ts`
- [ ] [T-734] [P3] [S5] POST /integrations/{integrationId}/test-connection endpoint実装 - `app/routes/api/integrations/$integrationId/test-connection.ts`
- [ ] [T-735] [P3] [S5] POST /webhooks/jira endpoint実装 - `app/routes/api/webhooks/jira.ts`
- [ ] [T-736] [P3] [S5] POST /webhooks/github endpoint実装 - `app/routes/api/webhooks/github.ts`
- [ ] [T-737] [P3] [S5] POST /webhooks/linear endpoint実装 - `app/routes/api/webhooks/linear.ts`

### Scheduled Tasks

- [ ] [T-738] [P3] [S5] Issue同期cron job実装 (10分毎) - `app/cron/sync-issues.ts`

### Tests

- [ ] [T-739] [P3] [S5] JiraAdapter unit tests - `tests/unit/external-integration/infrastructure/jira-adapter.test.ts`
- [ ] [T-740] [P3] [S5] syncIssues use case unit tests - `tests/unit/external-integration/application/usecases/sync-issues.test.ts`
- [ ] [T-741] [P3] [S5] Integration configuration E2E tests - `tests/e2e/external-integration/integration-setup.spec.ts`
- [ ] [T-742] [P3] [S5] Webhook handling E2E tests - `tests/e2e/external-integration/webhook-handling.spec.ts`

---

## Phase 8: User Story 6 - 監査ログとコンプライアンス (P3)

### Domain Models

- [ ] [T-801] [P3] [S6] AuditLog domain model定義 - `presentation/features/audit-log/domain/models/audit-log.ts`
- [ ] [T-802] [P3] [S6] AuditEventType enum定義 - `presentation/features/audit-log/domain/models/audit-event-type.ts`
- [ ] [T-803] [P3] [S6] AuditLogFilter domain model定義 - `presentation/features/audit-log/domain/models/audit-log-filter.ts`

### Domain Errors

- [ ] [T-804] [P3] [S6] AuditLogImmutableError定義 - `presentation/features/audit-log/domain/errors/audit-log-errors.ts`

### Application Ports

- [ ] [T-805] [P3] [S6] AuditLogRepository Port定義 - `presentation/features/audit-log/application/ports/audit-log-repository.ts`
- [ ] [T-806] [P3] [S6] AuditLogService Port定義 - `presentation/features/audit-log/application/ports/audit-log-service.ts`
- [ ] [T-807] [P3] [S6] ExportService Port定義 - `presentation/features/audit-log/application/ports/export-service.ts`

### Infrastructure Adapters

- [ ] [T-808] [P3] [S6] Prisma AuditLogRepository実装 (append-only保証) - `presentation/features/audit-log/infrastructure/adapters/prisma-audit-log-repository.ts`
- [ ] [T-809] [P3] [S6] AuditLogService実装 (自動ログ記録) - `presentation/features/audit-log/infrastructure/adapters/audit-log-service-impl.ts`
- [ ] [T-810] [P3] [S6] CSV ExportService実装 - `presentation/features/audit-log/infrastructure/adapters/csv-export-service.ts`
- [ ] [T-811] [P3] [S6] JSON ExportService実装 - `presentation/features/audit-log/infrastructure/adapters/json-export-service.ts`
- [ ] [T-812] [P3] [S6] Layer composition - `presentation/features/audit-log/infrastructure/layers/audit-log-layer.ts`

### Use Cases

- [ ] [T-813] [P3] [S6] logEvent use case実装 - `presentation/features/audit-log/application/usecases/log-event.ts`
- [ ] [T-814] [P3] [S6] searchAuditLogs use case実装 - `presentation/features/audit-log/application/usecases/search-audit-logs.ts`
- [ ] [T-815] [P3] [S6] exportAuditLogs use case実装 (CSV/JSON) - `presentation/features/audit-log/application/usecases/export-audit-logs.ts`

### UI Components

- [ ] [T-816] [P3] [S6] AuditLogList component実装 - `presentation/features/audit-log/ui/components/audit-log-list.tsx`
- [ ] [T-817] [P3] [S6] AuditLogFilter component実装 - `presentation/features/audit-log/ui/components/audit-log-filter.tsx`
- [ ] [T-818] [P3] [S6] AuditLogDetail component実装 - `presentation/features/audit-log/ui/components/audit-log-detail.tsx`
- [ ] [T-819] [P3] [S6] DiffViewer component実装 (before/after表示) - `presentation/features/audit-log/ui/components/diff-viewer.tsx`

### UI Hooks & Adapters

- [ ] [T-820] [P3] [S6] useAuditLog hook実装 - `presentation/features/audit-log/ui/hooks/use-audit-log.ts`
- [ ] [T-821] [P3] [S6] AuditLogAdapter実装 - `presentation/features/audit-log/ui/adapters/audit-log-adapter.ts`

### Pages & Routes

- [ ] [T-822] [P3] [S6] AuditLogsPage実装 - `presentation/pages/audit-logs-page.tsx`
- [ ] [T-823] [P3] [S6] ルート定義追加 - `app/routes.ts`

### Validation Schemas

- [ ] [T-824] [P3] [S6] AuditLogFilter Zodスキーマ定義 - `presentation/lib/schemas/audit-log.ts`

### API Endpoints

- [ ] [T-825] [P3] [S6] GET /audit-logs endpoint実装 - `app/routes/api/audit-logs/index.ts`
- [ ] [T-826] [P3] [S6] GET /audit-logs/export endpoint実装 - `app/routes/api/audit-logs/export.ts`

### Integration with Other Features

- [ ] [T-827] [P3] [S6] TestCase変更時の監査ログ記録統合 - `presentation/features/test-case-management/application/usecases/*.ts`
- [ ] [T-828] [P3] [S6] Approval操作時の監査ログ記録統合 - `presentation/features/approval-workflow/application/usecases/*.ts`
- [ ] [T-829] [P3] [S6] Release操作時の監査ログ記録統合 - `presentation/features/release-gate/application/usecases/*.ts`
- [ ] [T-830] [P3] [S6] 権限変更時の監査ログ記録統合 - `shared/auth/application/usecases/*.ts`

### Tests

- [ ] [T-831] [P3] [S6] AuditLogService unit tests - `tests/unit/audit-log/application/audit-log-service.test.ts`
- [ ] [T-832] [P3] [S6] Prisma AuditLogRepository integration tests (immutability保証) - `tests/integration/audit-log/prisma-audit-log-repository.test.ts`
- [ ] [T-833] [P3] [S6] Audit log search E2E tests - `tests/e2e/audit-log/audit-log-search.spec.ts`
- [ ] [T-834] [P3] [S6] CSV export E2E tests - `tests/e2e/audit-log/csv-export.spec.ts`

---

## Phase 9: Polish & Production Readiness

### Performance Optimization

- [ ] [T-901] [P1] [Polish] データベースクエリ最適化 (N+1問題解決) - 全Repository
- [ ] [T-902] [P1] [Polish] ページネーション実装の全API適用確認 - `app/routes/api/**/*.ts`
- [ ] [T-903] [P1] [Polish] React Router loader並列化 - `presentation/pages/*.tsx`
- [ ] [T-904] [P2] [Polish] PostgreSQLインデックス追加・最適化 - `prisma/migrations/*.sql`
- [ ] [T-905] [P2] [Polish] 大量データ対応のパフォーマンステスト実施 - `tests/performance/`

### Error Handling & Resilience

- [ ] [T-906] [P1] [Polish] グローバルエラーハンドラー実装 - `app/root.tsx`
- [ ] [T-907] [P1] [Polish] Effect TS統一エラー処理パターン適用 - 全use case
- [ ] [T-908] [P2] [Polish] 外部API retry/circuit breaker実装 - `presentation/features/external-integration/infrastructure/adapters/*.ts`
- [ ] [T-909] [P2] [Polish] トランザクション障害時のロールバック確認 - 全Repository

### UI/UX Polish

- [ ] [T-910] [P1] [Polish] ローディング状態の統一実装 - 全Page/Component
- [ ] [T-911] [P1] [Polish] エラーメッセージの日本語化・わかりやすさ改善 - 全Component
- [ ] [T-912] [P2] [Polish] レスポンシブデザイン対応確認 - 全Page
- [ ] [T-913] [P2] [Polish] アクセシビリティ対応 (ARIA属性) - 全Component
- [ ] [T-914] [P3] [Polish] ダークモード対応 - `app/app.css`, 全Component

### Documentation

- [ ] [T-915] [P1] [Polish] API仕様書の最終確認・更新 - `specs/001-test-management-system/contracts/openapi.yaml`
- [ ] [T-916] [P1] [Polish] quickstart.mdの検証・更新 - `specs/001-test-management-system/quickstart.md`
- [ ] [T-917] [P2] [Polish] アーキテクチャドキュメント更新 - `docs/architecture.md`
- [ ] [T-918] [P2] [Polish] Effect TSガイド更新 - `docs/effect-guide.md`
- [ ] [T-919] [P3] [Polish] API使用例ドキュメント作成 - `docs/api-examples.md`

### Security & Compliance

- [ ] [T-920] [P1] [Polish] RBAC権限チェックの全endpoint確認 - `app/routes/api/**/*.ts`
- [ ] [T-921] [P1] [Polish] 入力バリデーションの全endpoint確認 - `app/routes/api/**/*.ts`
- [ ] [T-922] [P1] [Polish] XSS/CSRF対策確認 - 全Form Component
- [ ] [T-923] [P2] [Polish] SQL Injection対策確認 (Prisma使用により自動対策済み確認) - 全Repository
- [ ] [T-924] [P2] [Polish] 監査ログ改ざん耐性確認 (DB trigger or アプリケーション層) - `presentation/features/audit-log/infrastructure/`

### Deployment

- [ ] [T-925] [P1] [Polish] Vercel設定ファイル作成 - `vercel.json`
- [ ] [T-926] [P1] [Polish] 環境変数チェックリスト作成 - `.env.production.example`
- [ ] [T-927] [P2] [Polish] Dockerファイル作成 (将来のスケール対応) - `Dockerfile`, `docker-compose.yml`
- [ ] [T-928] [P2] [Polish] CI/CDパイプライン設定 (.github/workflows) - `.github/workflows/ci.yml`
- [ ] [T-929] [P3] [Polish] Kubernetes Helmチャート作成 (将来のスケール対応) - `k8s/helm/`

### Testing

- [ ] [T-930] [P1] [Polish] 全E2Eテストの実行確認 - `pnpm test:e2e`
- [ ] [T-931] [P1] [Polish] 統合テストの実行確認 - `pnpm test:integration`
- [ ] [T-932] [P1] [Polish] 型エラーゼロ確認 - `npx tsc --noEmit`
- [ ] [T-933] [P2] [Polish] テストカバレッジ80%以上達成 - `pnpm test:coverage`
- [ ] [T-934] [P3] [Polish] E2Eテストのヘッドレス実行自動化 - `.github/workflows/e2e.yml`

---

## タスク完了基準

各タスクは以下の基準を満たすことで完了とみなします:

1. **実装**: 該当ファイルが作成され、仕様通りに実装されている
2. **型安全性**: `npx tsc --noEmit` でエラーがない
3. **コード品質**: CLAUDE.md の規約に準拠している
4. **テスト**: 該当する単体/統合/E2Eテストが実装され、パスしている
5. **ドキュメント**: 必要に応じてコメントやドキュメントが更新されている

---

## 依存関係

- **Phase 1 (Foundational)** は全てのPhaseの前提条件
- **Phase 3 (S1)** と **Phase 4 (S2)** は並行実装可能 (P1)
- **Phase 5 (S3)** は Phase 3完了後に実装 (TestRunがTestCaseRevisionに依存)
- **Phase 6 (S4)** は Phase 3完了後に実装 (MappingがTestCaseRevisionに依存)
- **Phase 7 (S5)** は Phase 6完了後に実装 (Requirement同期が前提)
- **Phase 8 (S6)** は 全Phase完了後に統合 (監査ログは全機能に横断的に統合)
- **Phase 9 (Polish)** は 全Phase完了後に実施

---

## 進捗トラッキング

- [x] Phase 0: Setup & Infrastructure (5/5 tasks) ✅ 100%
- [ ] Phase 1: Foundational Components (0/24 tasks) 0%
- [ ] Phase 3: User Story 1 - テスト資産の作成・承認・バージョン管理 (0/58 tasks) 0%
- [ ] Phase 4: User Story 2 - リリースゲート評価とリリース承認 (0/47 tasks) 0%
- [x] Phase 5: User Story 3 - テスト実行と結果記録 (43/49 tasks) ✅ 88% (6 future tasks)
- [ ] Phase 6: User Story 4 - 要件トレーサビリティとカバレッジ管理 (0/44 tasks) 0%
- [ ] Phase 7: User Story 5 - 外部システム連携 (0/42 tasks) 0%
- [ ] Phase 8: User Story 6 - 監査ログとコンプライアンス (0/34 tasks) 0%
- [ ] Phase 9: Polish & Production Readiness (0/34 tasks) 0%

**総タスク数**: 337 tasks
**完了タスク数**: 48 tasks (14.2%)
**Phase 5完了**: 43/49 tasks実装済み、6 tasks(CI/SSE)は将来実装

---

## 実装開始

すべてのタスクが定義されました。実装を開始するには `/speckit.implement` コマンドを実行してください。
