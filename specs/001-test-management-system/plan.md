# 実装計画: テストマネジメントシステム（統合型品質管理プラットフォーム）

**ブランチ**: `001-test-management-system` | **日付**: 2026-02-05 | **仕様**: [spec.md](./spec.md)
**入力**: `/specs/001-test-management-system/spec.md` からの機能仕様

**注意**: このテンプレートは `/speckit.plan` コマンドによって記入されます。実行ワークフローについては `.specify/templates/commands/plan.md` を参照してください。

## 概要

テストマネジメントシステムは、開発プロジェクト（Issue/PR/CI）とテスト資産（要件・テストケース・シナリオ・実行・結果・欠陥）を統合し、変更・実行・承認・監査を単一のプラットフォームで完結させるWebアプリケーションです。

**主要要件**:

- テスト資産（TestCase/Scenario/List/Mapping）の不変リビジョン管理と多段階承認ワークフロー
- リリースゲート評価とWaiver（例外承認）による品質基準の強制
- 外部Issue/PR/CI統合による開発活動との連携
- 要件トレーサビリティとカバレッジ管理
- 改ざん耐性を持つ監査ログとコンプライアンス証跡

**技術的アプローチ**:

- React Router v7 (SSR有効) + Effect TS (DI/エラーハンドリング) + Hexagonal Architecture
- PostgreSQL (テスト資産リビジョン、実行結果、監査ログ)
- 外部API統合 (Jira/GitHub/Linear) とCI結果取り込み (JUnit XML)
- SSE (Server-Sent Events) によるリアルタイム進捗更新
- OAuth 2.0 / OIDC 認証 + RBAC権限制御

## 技術的コンテキスト

**言語/バージョン**: TypeScript 5.x (strict mode), Node.js 20+
**主要な依存関係**:

- React Router v7 (SSR有効, file-based routing)
- Effect TS v3 (dependency injection, error handling)
- Tailwind CSS v4 (@theme syntax)
- Shadcn/ui + Radix UI (UI components)
- React Hook Form + Zod (validation)
- TipTap (rich text editor)

**ストレージ**:

- PostgreSQL 14+ (テスト資産リビジョン、実行結果、監査ログ、ユーザー管理)
- 要明確化: Git連携 (YAML/Markdown シナリオファイルをGitリポジトリとして管理するか、DBに格納するか)

**データベースアクセス**:

- 要明確化: ORM/Query Builder (Prisma, Drizzle ORM, Kysely, 生SQLのいずれを使用するか)

**認証/認可**:

- OAuth 2.0 / OIDC (SSO必須)
- RBAC (Admin, QA Manager, QA Engineer, Developer, PM/PO, Auditor)
- 要明確化: OIDCプロバイダー (Auth0, Keycloak, Supabase Auth, 自前実装のいずれか)

**外部API統合**:

- Jira REST API, GitHub REST/GraphQL API, Linear API (要件同期)
- Webhook受信 (Issue更新, PRマージ, CI完了)
- 要明確化: 使用するSDK (公式SDK vs カスタムHTTPクライアント)

**CI結果取り込み**:

- 要明確化: サポートするテスト結果フォーマット (JUnit XML必須、他にTAP, Mocha JSON, Jest等を追加するか)

**リアルタイム更新**:

- SSE (Server-Sent Events) でテスト進捗をクライアントにプッシュ
- 要明確化: SSE実装ライブラリ (built-in fetch, EventSource, カスタム実装)

**テスト**:

- Vitest (unit testing)
- React Testing Library (component testing)
- Playwright (E2E testing)

**対象プラットフォーム**: Webブラウザ (モダンブラウザ: Chrome 90+, Firefox 88+, Safari 14+), サーバー (Node.js 20+)
**プロジェクトタイプ**: Webアプリケーション (frontend + backend統合型 with React Router SSR)

**パフォーマンス目標**:

- 主要画面 (要件一覧, トレーサビリティ, リリースゲート) のP95レスポンスタイム < 1.5秒
- ゲート評価実行 < 1.5秒 (P95)
- 要件変更時の影響分析 < 10秒
- 同時ユーザー数 100名で劣化なし

**制約**:

- テストケース 10万件、テスト結果 1,000万件規模でパフォーマンス維持
- 監査ログ改ざん不可 (append-only, immutable)
- リビジョンは不変 (immutable)、更新は新リビジョン作成のみ
- リリースゲート違反時はリリース承認禁止 (Waiverによる解除のみ)

**規模/スコープ**:

- 6つの主要ユーザーストーリー (P1: 2, P2: 2, P3: 2)
- 45の機能要件 (FR-001 ~ FR-045)
- 25+のエンティティ (TestCase, Scenario, List, Mapping, Release, Run, Result, Approval, Waiver, AuditLog等)
- 6つのロール (Admin, QA Manager, QA Engineer, Developer, PM/PO, Auditor)

**デプロイ**:

- 要明確化: デプロイ環境 (Vercel, 自己ホスト, Docker, Kubernetes)
- SaaS想定、SSO必須、データ暗号化 (at rest / in transit)

## 規約チェック

_ゲート: フェーズ0の調査前に合格する必要があります。フェーズ1の設計後に再チェックしてください。_

### 必須原則の適合性

#### ✅ I. Hexagonal Architecture (Ports & Adapters)

- **適合状況**: PASS (設計時適用)
- **計画**:
  - テスト資産管理、承認ワークフロー、外部API統合を複雑な機能として実装
  - 各機能に `ui/`, `application/`, `domain/`, `infrastructure/` 構造を適用
  - Application層でPortsをEffect TS Tagとして定義 (例: `TestCaseRepository`, `ApprovalWorkflowService`, `ExternalIssueTrackerPort`)
  - Infrastructure層でAdaptersをEffect TS Layerとして実装 (例: `PostgresTestCaseRepository`, `HttpJiraAdapter`)
  - Presentation層はApplication層のみに依存、Infrastructureへの直接依存を禁止

#### ✅ II. Effect TS Dependency Injection

- **適合状況**: PASS (設計時適用)
- **計画**:
  - すべての外部依存 (PostgreSQL, 外部API, SSE) をEffect TS Tagで抽象化
  - `Effect.gen()` + `yield*` 構文で非同期処理を記述
  - エラー型は `Data.TaggedError` を継承 (例: `TestCaseNotFoundError`, `ApprovalRejectedError`)
  - ドメインモデルは `Data.Class` を使用 (例: `TestCaseRevision`, `Approval`)

#### ✅ III. Type Safety & Immutability

- **適合状況**: PASS
- **チェックポイント**:
  - TypeScript strict mode有効
  - `any`, `let`, 無保護な`as`の使用禁止
  - 相対importの禁止、path aliasの使用必須 (`~/`, `@app/*`)
  - `npx tsc --noEmit` がpre-commitで必須

#### ✅ IV. Japanese-First UI Language

- **適合状況**: PASS
- **計画**: すべてのUI要素、エラーメッセージ、バリデーションメッセージを日本語で記述

#### ✅ V. Server-Side Rendering & Progressive Enhancement

- **適合状況**: PASS
- **計画**:
  - React Router v7 SSR有効
  - 主要画面で`loader`関数を実装 (要件一覧、テストケース一覧、リリースゲート等)
  - Form submissionは`<Form>`コンポーネント + `action`関数で実装
  - Zod schemaでclient/server双方向バリデーション

#### ⚠️ VI. Git-Based Scenario Management

- **適合状況**: NEEDS CLARIFICATION
- **仕様要件**: テストシナリオをYAML/MarkdownでGit管理、実行結果はPostgreSQL
- **未決定事項**:
  - Gitリポジトリの管理方法 (アプリケーション内でGit操作するか、外部ツール連携か)
  - シナリオファイルの格納場所 (アプリケーションリポジトリ内、別リポジトリ、DBに格納してGitエクスポート機能提供)
- **調査必要**: Phase 0でGit連携パターンとライブラリ選定を実施

### ゲート評価結果

**Phase 0 (調査前) ゲート**: ⚠️ CONDITIONAL PASS

- 5つの必須原則は設計方針としてPASS
- 1つの原則 (Git-Based Scenario Management) は調査で明確化が必要
- 調査完了後、Phase 1設計前に再評価

**アクションアイテム**:

1. Phase 0でGit連携パターンを調査・決定
2. Phase 1設計時に選定したパターンを反映
3. Phase 1完了後、規約適合性を再チェック

## プロジェクト構造

### ドキュメント（この機能）

```text
specs/[###-feature]/
├── plan.md              # このファイル (/speckit.plan コマンド出力)
├── research.md          # フェーズ0の出力 (/speckit.plan コマンド)
├── data-model.md        # フェーズ1の出力 (/speckit.plan コマンド)
├── quickstart.md        # フェーズ1の出力 (/speckit.plan コマンド)
├── contracts/           # フェーズ1の出力 (/speckit.plan コマンド)
└── tasks.md             # フェーズ2の出力 (/speckit.tasks コマンド - /speckit.planでは作成されない)
```

### ソースコード（リポジトリルート）

**構造の決定**: React Router v7統合型Webアプリケーション (SSR有効)

```text
app/                          # React Router設定
├── routes.ts                 # ルート定義 (file-based routing)
├── root.tsx                  # ルートレイアウト
└── app.css                   # Tailwind v4グローバルスタイル (@theme)

presentation/                 # Presentation層 (React components, hooks, adapters)
├── components/
│   ├── ui/                   # Shadcn/ui components (Button, Input, Form等)
│   └── hooks/                # 共有Reactフック (use-mobile.ts等)
├── features/                 # 機能モジュール (UI + ビジネスロジック)
│   ├── test-case-management/ # テストケース管理 (複雑な機能: DDD構造)
│   │   ├── ui/               # React層
│   │   │   ├── components/   # TestCaseList, TestCaseEditor, RevisionHistory等
│   │   │   ├── hooks/        # useTestCase.ts, useRevisionManagement.ts
│   │   │   └── adapters/     # Effect → React bridge
│   │   ├── application/
│   │   │   ├── ports/        # Tag定義 (TestCaseRepository, ApprovalService等)
│   │   │   └── usecases/     # createTestCase.ts, submitForReview.ts等
│   │   ├── domain/
│   │   │   ├── models/       # TestCase, TestCaseRevision, RevisionStatus等
│   │   │   └── errors/       # TestCaseNotFoundError等
│   │   └── infrastructure/
│   │       ├── adapters/     # PostgresTestCaseRepository等
│   │       └── layers/       # Layer composition
│   ├── approval-workflow/    # 承認ワークフロー (複雑な機能: DDD構造)
│   │   └── [上記と同じ構造]
│   ├── release-gate/         # リリースゲート評価 (複雑な機能: DDD構造)
│   │   └── [上記と同じ構造]
│   ├── test-execution/       # テスト実行と結果記録 (複雑な機能: DDD構造)
│   │   └── [上記と同じ構造]
│   ├── requirement-traceability/ # 要件トレーサビリティ (複雑な機能: DDD構造)
│   │   └── [上記と同じ構造]
│   ├── external-integration/ # 外部システム連携 (複雑な機能: DDD構造)
│   │   └── [上記と同じ構造]
│   └── audit-log/            # 監査ログ (複雑な機能: DDD構造)
│       └── [上記と同じ構造]
├── pages/                    # ルートレベルコンポーネント (thin, 機能を組み合わせる)
│   ├── home-page.tsx
│   ├── test-cases-page.tsx
│   ├── releases-page.tsx
│   └── audit-logs-page.tsx
└── lib/                      # 共有ユーティリティ、Zodスキーマ
    ├── utils.ts              # cn() utility
    └── schemas/

shared/                       # 共有ドメインロジック (複数機能で使用)
├── auth/                     # 認証・認可
│   ├── application/ports/    # AuthService, RBACService等
│   ├── domain/models/        # User, Role, Permission等
│   └── infrastructure/       # OIDCAuthAdapter等
└── db/                       # データベース接続・マイグレーション
    ├── client.ts             # PostgreSQLクライアント
    ├── schema.ts             # データベーススキーマ定義
    └── migrations/           # マイグレーションファイル

docs/                         # アーキテクチャドキュメント
├── architecture.md
├── effect-guide.md
├── implementation-guide.md
├── coding-standards.md
└── testing.md

tests/                        # テスト
├── unit/                     # ユニットテスト (Vitest)
├── integration/              # 統合テスト (Vitest + TestContainers)
└── e2e/                      # E2Eテスト (Playwright)
```

**アーキテクチャの特徴**:

- **React Router v7統合型**: app/ディレクトリでルート定義、SSR有効
- **Presentation層分離**: presentation/以下にReactコンポーネントとEffect Adapter
- **複雑な機能のDDD構造**: 各機能内でui/application/domain/infrastructure分離
- **Hexagonal Architecture**: Application層でPorts (Tag) 定義、Infrastructure層でAdapters (Layer) 実装
- **Shared層**: 認証・DB等、複数機能で共有するドメインロジック

## Phase 1完了後の規約チェック再評価

### 必須原則の適合性 (最終確認)

#### ✅ I. Hexagonal Architecture (Ports & Adapters)

- **実装確認**: PASS
- **データモデル**: Prismaスキーマで全エンティティ定義完了
- **Ports定義予定**:
  - `TestCaseRepository`, `ApprovalService`, `ExternalIssueTrackerPort`, `SSEService` 等
- **Adapters実装予定**:
  - `PostgresTestCaseRepository`, `HttpJiraAdapter`, `SupabaseAuthAdapter` 等

#### ✅ II. Effect TS Dependency Injection

- **実装確認**: PASS
- **設計**: すべての外部依存をEffect TS Tagで抽象化、Layerで実装提供

#### ✅ III. Type Safety & Immutability

- **実装確認**: PASS
- **Prismaスキーマ**: 型安全なデータベースアクセス
- **Effect TS Models**: `Data.Class` for immutability

#### ✅ IV. Japanese-First UI Language

- **実装確認**: PASS
- **OpenAPI仕様書**: 日本語で記述

#### ✅ V. Server-Side Rendering & Progressive Enhancement

- **実装確認**: PASS
- **React Router v7 SSR**: loader/action functions for server-side ops

#### ✅ VI. Git-Based Scenario Management

- **実装確認**: PASS (research完了)
- **決定**: DBハイブリッド + Gitエクスポート機能
- **実装**: PostgreSQLでリビジョン管理、Approved後にYAML/Markdownエクスポート可能

### 最終ゲート評価結果: ✅ PASS

すべての必須原則に適合した設計が完了しました。Phase 2 (Tasks生成) へ進む準備が整いました。

---

## 複雑性の追跡

> **規約チェックに正当化が必要な違反がある場合のみ記入**

_違反なし。すべてのConstitution原則に準拠。_
