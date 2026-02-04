# データモデル

本サービスで扱う主要エンティティと関係を整理します。

## 主要エンティティ

Project
- 代表フィールド: `id`, `name`, `key`, `status`

Environment
- 代表フィールド: `id`, `projectId`, `name`, `type`, `status`

User
- 代表フィールド: `id`, `name`, `email`, `status`

Role
- 代表フィールド: `id`, `name`, `permissions`

Scenario
- 代表フィールド: `id`, `title`, `purpose`, `preconditions`, `steps`, `expected`, `tags`, `status`, `version`, `defaultImportance`

ScenarioVersion
- 代表フィールド: `id`, `scenarioId`, `version`, `createdAt`, `createdBy`

Release
- 代表フィールド: `id`, `projectId`, `environmentId`, `tag`, `prRefs`, `linearRefs`, `plannedAt`

TestRun
- 代表フィールド: `id`, `releaseId`, `scope`, `assignees`, `dueAt`, `status`, `completionPolicy`

TestRunItem
- 代表フィールド: `id`, `testRunId`, `scenarioId`, `required`, `importance`, `assigneeId`, `result`, `executedAt`, `notes`, `evidence`

## 代表的なステータス

Scenario.status
- `draft`, `active`, `archived`

TestRun.status
- `planned`, `in_progress`, `completed`

TestRunItem.result
- `success`, `fail`, `not_executed`

## 完了条件（例）

TestRun.completionPolicy
- 重要度別の合格条件を保持
- 例: `high` は 100% 成功、`medium` は 95% 成功、`low` は 90% 成功

## 関係

- Project は複数の Environment を持つ
- Release は Project と Environment に紐づく
- Release は複数の TestRun を持つ
- TestRun は複数の TestRunItem を持つ
- Scenario は複数の TestRunItem に参照される
- User は Role を持つ

---

## シナリオファイル構造（Git管理）

### YAML ファイル（scenario-001.yml）

```yaml
# シナリオメタデータ
id: auth-login-001
title: ユーザーログインフロー
category: authentication
tags:
  - critical
  - user-management
  - security
default_importance: high
required_by_default: true

# 前提条件
preconditions:
  - 管理者権限でログイン済み
  - テスト用データベースが初期化済み
  - テスト用ユーザー "test@example.com" が存在する

# 期待結果（簡潔な要約）
expected_results:
  - ログイン成功後、ダッシュボードにリダイレクトされる
  - セッションが作成される
  - 監査ログに記録される

# 関連情報
related_scenarios:
  - auth-logout-002
  - auth-password-reset-003
estimated_duration_minutes: 5
last_updated: "2025-01-15T10:30:00Z"
author: "yamada@example.com"
```

### Markdown ファイル（scenario-001.md）

```markdown
# ユーザーログインフロー

## 目的

ユーザーがメールアドレスとパスワードで正常にログインできることを確認する。

## 前提条件

- 管理者権限でログイン済み
- テスト用データベースが初期化済み
- テスト用ユーザー "test@example.com" が存在する

## テスト手順

1. ログインページにアクセス
   - URL: https://app.medimo.com/login
   - ページが正常に表示されることを確認

2. 認証情報を入力
   - メールアドレス: `test@example.com`
   - パスワード: `Test123!`

3. "ログイン" ボタンをクリック

4. ダッシュボードへのリダイレクトを確認
   - URL: https://app.medimo.com/dashboard
   - ユーザー名が右上に表示されることを確認

## 期待結果

- [ ] ログインページが正常に表示される
- [ ] 認証情報を入力できる
- [ ] ログインボタンがクリックできる
- [ ] ダッシュボードにリダイレクトされる（2秒以内）
- [ ] ユーザー名 "テストユーザー" が表示される
- [ ] セッション Cookie が設定される
- [ ] 監査ログに "ログイン成功" が記録される
```

### Git リポジトリ構造

```
medi-test-scenarios/
├── projects/
│   ├── medimo-web/
│   │   ├── production/
│   │   │   ├── auth/
│   │   │   │   ├── login-001.yml
│   │   │   │   ├── login-001.md
│   │   │   │   ├── logout-002.yml
│   │   │   │   └── logout-002.md
│   │   │   ├── payment/
│   │   │   └── ui/
│   │   └── staging/
│   └── medimo-api/
└── templates/
    ├── scenario-template.yml
    └── scenario-template.md
```

**詳細**: [ストレージアーキテクチャ](storage-architecture.md)

---

## 証跡データ構造（JSONB）

TestRunItem.evidence カラムは JSONB 型で、以下の構造を持ちます。

### Evidence スキーマ

```typescript
interface Evidence {
  screenshots?: Array<{
    url: string;              // S3 URL or Base64
    timestamp: string;        // ISO 8601
    caption: string;
  }>;
  logs?: Array<{
    level: "info" | "error" | "warning";
    message: string;
    timestamp: string;
  }>;
  browserInfo?: {
    userAgent: string;
    viewport: string;         // "1920x1080"
    browser: string;          // "Chrome 120"
  };
  notes?: string;             // 自由記述
  attachments?: Array<{
    filename: string;
    url: string;
    mimeType: string;
  }>;
}
```

### Evidence 例

```json
{
  "screenshots": [
    {
      "url": "s3://medi-test-evidence/2025-01-15/abc123.png",
      "timestamp": "2025-01-15T10:35:00Z",
      "caption": "ログイン画面"
    },
    {
      "url": "s3://medi-test-evidence/2025-01-15/def456.png",
      "timestamp": "2025-01-15T10:35:05Z",
      "caption": "ダッシュボード表示"
    }
  ],
  "logs": [
    {
      "level": "info",
      "message": "Login successful",
      "timestamp": "2025-01-15T10:35:03Z"
    },
    {
      "level": "error",
      "message": "Session creation failed",
      "timestamp": "2025-01-15T10:35:04Z"
    }
  ],
  "browserInfo": {
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "viewport": "1920x1080",
    "browser": "Chrome 120.0.6099.129"
  },
  "notes": "セッション作成に5秒以上かかった。パフォーマンス要調査。"
}
```

### PostgreSQL でのクエリ例

```sql
-- スクリーンショットを持つテストアイテムを検索
SELECT *
FROM test_run_items
WHERE evidence->'screenshots' IS NOT NULL
  AND jsonb_array_length(evidence->'screenshots') > 0;

-- エラーログを持つテストアイテムを検索
SELECT *
FROM test_run_items
WHERE evidence @> '{"logs": [{"level": "error"}]}'::jsonb;

-- 特定のブラウザで実行されたテストを検索
SELECT *
FROM test_run_items
WHERE evidence->'browserInfo'->>'browser' LIKE 'Chrome%';
```

---

## エンティティ詳細

### TestRun

```sql
CREATE TABLE test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES releases(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  scope JSONB NOT NULL,  -- シナリオリストと Git commit SHA
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  completion_policy JSONB NOT NULL,
  assigned_to UUID[] REFERENCES users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**scope カラム例**:
```json
{
  "git_repository": "https://github.com/medimo/scenarios",
  "git_commit": "a1b2c3d4e5f6...",
  "scenarios": [
    {
      "scenario_id": "auth-login-001",
      "scenario_version": "a1b2c3d4e5f6",
      "required": true,
      "importance": "high"
    }
  ]
}
```

**completion_policy カラム例**:
```json
{
  "critical": { "pass_rate": 100, "required_count": "all" },
  "high": { "pass_rate": 95 },
  "medium": { "pass_rate": 80 },
  "low": { "pass_rate": 50 }
}
```

### TestRunItem

```sql
CREATE TABLE test_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  scenario_id VARCHAR(100) NOT NULL,
  scenario_version VARCHAR(100) NOT NULL,  -- Git commit SHA
  scenario_title VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  importance VARCHAR(20) NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  result VARCHAR(50),  -- success, fail, not_executed, blocked, skipped
  evidence JSONB,
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES users(id),
  execution_duration_seconds INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 関連ドキュメント

- [ストレージアーキテクチャ](storage-architecture.md) - Git + PostgreSQL の詳細
- [ワークフロー](workflows.md) - エンティティのライフサイクル
