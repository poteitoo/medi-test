# 技術調査報告: テストマネジメントシステム

**日付**: 2026-02-05
**対象**: [plan.md](./plan.md) の技術的コンテキストで「要明確化」とマークされた項目

---

## 1. Git連携パターン (テストシナリオのYAML/Markdown管理)

### Decision

**DBハイブリッド + Gitエクスポート機能**

### Rationale

- **要件分析**:
  - Constitution VI: "Test scenarios MUST be stored as YAML/Markdown files in Git for version control"
  - Feature Spec: テスト資産はリビジョン管理 (immutable snapshots)、承認ワークフロー必須
- **トレードオフ**:
  - **Full Git管理** (アプリ内でGit操作): シナリオファイルの読み書きにGit操作が必要、複雑度高、パフォーマンス懸念
  - **DB格納 + Gitエクスポート**: アプリ内ではPostgreSQLで高速CRUD、承認完了後にYAML/Markdownとしてエクスポート可能
- **選定理由**:
  - リビジョン管理と承認ワークフローはPostgreSQLで実装 (トランザクション、クエリ最適化)
  - Approved後にGit風のコミット履歴・差分表示を提供
  - 手動エクスポート機能でYAML/MarkdownファイルをGitリポジトリに保存可能 (PRレビュー、外部ツール連携)

### Implementation Plan

- PostgreSQLに `test_case_revisions`, `test_scenario_revisions` テーブルで資産保存
- 各リビジョンに `git_commit_sha` フィールド (nullableオプション、エクスポート時に記録)
- Admin機能: 「Export to Git」ボタンで選択したリビジョンをYAML/Markdown形式でダウンロード
- 将来拡張: GitHub App統合でApproved後に自動PRcreate

### Alternatives Considered

- **simple-git/isomorphic-git**: Node.jsでGit操作可能だが、パフォーマンスとエラーハンドリングが複雑
- **Git submodule**: アプリリポジトリとは別にシナリオリポジトリを管理するが、同期が煩雑

---

## 2. ORM / Query Builder選定

### Decision

**Prisma ORM**

### Rationale

- **既存プロジェクト調査**: 現在のmedi-testプロジェクトには `prisma/` ディレクトリが存在し、`PrismaClient` が使用されている (CLAUDE.mdに記載)
- **利点**:
  - Type-safe database client (TypeScript strict mode と親和性高)
  - スキーマ駆動開発 (schema.prisma → migration + TypeScript types 自動生成)
  - Effect TSと統合可能 (`Effect.tryPromise()` でPrisma操作をラップ)
  - PostgreSQL対応、複雑なクエリ (JOIN, トランザクション) をサポート
- **制約**:
  - リビジョンの不変性 (immutable) はアプリケーション層で保証 (Prismaは更新操作を提供するが、使用禁止ルールで対応)
  - 監査ログのappend-only性質はDB制約 (INSERT only, UPDATE/DELETE禁止) で担保

### Implementation Plan

- `prisma/schema.prisma` に全エンティティ定義 (TestCase, TestCaseRevision, Approval, AuditLog等)
- Infrastructure層で `PrismaTestCaseRepository` 等のAdapter実装
- Effect TS Layerで `PrismaClient` を提供 (`PrismaClientLive`)

### Alternatives Considered

- **Drizzle ORM**: 軽量、型安全だがPrismaほどエコシステムが成熟していない
- **Kysely**: SQL-first、完全な型安全性だが学習コスト高、スキーマ駆動ではない
- **生SQL**: 完全な制御だが型安全性なし、保守性低

---

## 3. OIDC認証プロバイダー

### Decision

**Supabase Auth (暫定) → 将来的にKeycloak/Auth0へ移行可能な設計**

### Rationale

- **要件**: OAuth 2.0 / OIDC, RBAC, SSO必須
- **選定理由**:
  - **Supabase Auth**: 開発初期の迅速な認証実装、無料プラン、OIDC対応、JWT with claims
  - **移行可能な設計**: Application層で `AuthService` をEffect TS Tagとして定義、Infrastructureで `SupabaseAuthAdapter` 実装
  - 将来的にKeycloak (オンプレ要件) やAuth0 (エンタープライズ) へ切り替え可能
- **RBAC実装**:
  - Supabase JWTの `app_metadata.roles` claimsにロール格納
  - Loaderでクレームを検証、React Router actionでRBAC enforc

ement

### Implementation Plan

- `shared/auth/application/ports/auth-service.ts`: Effect TS Tagで認証抽象化
- `shared/auth/infrastructure/supabase-auth-adapter.ts`: Supabase実装
- Middleware: React Router loaderで認証チェック、`context.auth` にユーザー情報注入
- RBAC: `requireRole(['QAManager', 'Admin'])` ヘルパー関数で権限チェック

### Alternatives Considered

- **Keycloak**: 自己ホスト、エンタープライズグレードだが初期セットアップ複雑
- **Auth0**: SaaS、豊富な機能だが有料、ロックイン懸念
- **Clerk**: 開発体験良いがOIDC標準対応が限定的

---

## 4. 外部API統合SDKs (Jira/GitHub/Linear)

### Decision

**公式SDKを優先、カスタムHTTPクライアントで補完**

### Rationale

- **Jira**: `jira-client` npm package (公式ではないがコミュニティ標準) または `axios` + Jira REST API
- **GitHub**: `@octokit/rest` (公式SDK, TypeScript対応)
- **Linear**: `@linear/sdk` (公式SDK, GraphQL)
- **選定理由**:
  - 公式SDKは型定義完備、認証・ページネーション・エラーハンドリングが標準化
  - APIバージョン変更時のメンテナンスコスト低
  - Effect TSでラップすることでテスト可能なAdapter実装

### Implementation Plan

- `presentation/features/external-integration/application/ports/`:
  - `IssueTrackerPort` (Tag) - 抽象化されたIssue操作
- `presentation/features/external-integration/infrastructure/adapters/`:
  - `JiraAdapter` (jira-client使用)
  - `GitHubAdapter` (@octokit/rest使用)
  - `LinearAdapter` (@linear/sdk使用)
- 各AdapterはEffect TS Layerとして実装、エラーを`Data.TaggedError`で統一

### Alternatives Considered

- **カスタムHTTPクライアントのみ**: 完全制御だが型安全性・保守性低、認証更新追従が手動
- **Zapier/n8n統合**: ノーコード連携だがアプリ内制御できず、リアルタイム性低

---

## 5. CI結果取り込みフォーマット

### Decision

**JUnit XML必須、追加でTAP/JSON形式サポート**

### Rationale

- **JUnit XML**: 最も広く使用されるテスト結果フォーマット (Jest, Mocha, Vitest, Playwright, pytest等が出力可能)
- **TAP (Test Anything Protocol)**: シンプル、パーサー軽量、Node.js界隈で使用
- **JSON (Jest/Mocha等)**: 構造化データ、詳細情報 (スタックトレース、タイミング) 含む
- **実装方針**:
  - JUnit XMLを最優先サポート (80%のCIツールがカバー可能)
  - TAP/JSONは将来拡張 (パーサー追加)

### Implementation Plan

- `presentation/features/test-execution/application/usecases/import-ci-results.ts`:
  - JUnit XMLパーサー (`xml2js` or `fast-xml-parser`)
  - テストケース名/ステータス/エビデンスを抽出
  - 対応する`TestRunItem`を検索し、`TestResult`を作成
- API Endpoint: `POST /api/test-runs/{runId}/import-results` (multipart/form-data for XML file)
- CLI: `medi-test import-results --run-id=xxx --file=results.xml`

### Alternatives Considered

- **GitHub Actions専用フォーマット**: ロックインリスク高、汎用性低
- **Allureレポート**: 高機能だが複雑、オーバーキル

---

## 6. SSE (Server-Sent Events) 実装ライブラリ

### Decision

**Built-in EventSource (クライアント) + Express/Fastify SSE middleware (サーバー)**

### Rationale

- **クライアント**: ブラウザ標準の `EventSource` API使用 (ポリフィル不要、シンプル)
- **サーバー**: React Router v7 (Vite-based) で `Response.body` にストリーム書き込み
- **選定理由**:
  - 追加ライブラリ不要、軽量
  - Effect TSでラップ可能 (`Effect.async` でイベントストリームを管理)
  - テスト実行進捗のリアルタイム更新に最適 (一方向通信、Reconnect自動)

### Implementation Plan

- **Server**:
  - `app/routes/api/test-runs/$runId/progress.ts`: loader関数で SSE endpointを実装
  - `Response` の `body` に `ReadableStream` を返し、進捗イベントを送信
  - PostgreSQLの `LISTEN/NOTIFY` または定期ポーリングで進捗検知
- **Client**:
  - `presentation/features/test-execution/ui/hooks/use-test-run-progress.ts`:
    - `EventSource` でSSE接続、進捗イベントをReact stateに反映
    - Unmount時にクリーンアップ

### Alternatives Considered

- **Socket.io**: 双方向通信可能だが複雑、オーバーヘッド大、SSEで十分
- **WebSocket**: 双方向だがSSEの一方向通信で要件満たせる、軽量な選択肢

---

## 7. デプロイ環境

### Decision

**Vercel (初期) → Docker/Kubernetes (スケール時)**

### Rationale

- **Vercel**:
  - React Router v7公式推奨、SSR自動最適化
  - PostgreSQLは外部 (Supabase, Neon, Railway等) で提供
  - CI/CDゼロコンフィグ、プレビュー環境自動生成
  - 無料プランで開発環境十分、Pro planでProduction対応
- **移行計画**:
  - スケール要件 (100+同時ユーザー、大量データ) が顕在化したらDocker化
  - Kubernetes (GKE, EKS, AKS) で水平スケール
  - PostgreSQLをManaged DB (AWS RDS, Google Cloud SQL) に移行

### Implementation Plan

- **Phase 1** (Vercel):
  - `vercel.json` で環境変数設定
  - Supabase PostgreSQLまたはNeonでDB提供
  - `DATABASE_URL`, `OIDC_CLIENT_ID` 等を環境変数で注入
- **Phase 2** (Docker):
  - `Dockerfile` でNode.js 20+ Alpineイメージ、multistage build
  - `docker-compose.yml` でPostgreSQL + アプリをローカル開発
  - Kubernetes HelmチャートでProduction deploymentを定義

### Alternatives Considered

- **Netlify**: SSR対応限定的、React Router v7との統合が弱い
- **Railway/Render**: 簡単だがVercelほどReact Routerに最適化されていない
- **自己ホストVM**: 初期コスト高、運用負荷大

---

## 8. その他の技術選定

### 8.1 Form Validation

- **Decision**: React Hook Form + Zod (client), Zod (server)
- **既存利用**: プロジェクトですでに使用中
- **利点**: 双方向バリデーション、型安全、React Router actionと統合容易

### 8.2 Rich Text Editor

- **Decision**: TipTap
- **既存利用**: プロジェクトですでに使用中 (`presentation/features/text-editor/`)
- **利点**: カスタマイズ可能、Markdown出力対応、音声入力統合済み

### 8.3 UI Components

- **Decision**: Shadcn/ui + Radix UI
- **既存利用**: プロジェクトですでに使用中 (`presentation/components/ui/`)
- **利点**: アクセシブル、カスタマイズ容易、Tailwind CSS統合

---

## まとめ

すべての「要明確化」項目について技術選定を完了しました。選定基準は以下の通りです:

1. **Constitution準拠**: Hexagonal Architecture, Effect TS DI, Type Safety
2. **既存スタック活用**: Prisma, TipTap, Shadcn/ui等、プロジェクトで実績あり
3. **段階的移行**: 初期はSimple (Vercel, Supabase)、スケール時にEnterprise (Kubernetes, Keycloak) へ移行可能
4. **テスト容易性**: Effect TSでラップすることでモックテスト可能なAdapter設計

次のPhase 1 (Design & Contracts) で、これらの技術選定を反映したデータモデルとAPI contractsを生成します。
