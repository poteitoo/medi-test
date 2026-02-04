# 外部連携

medi-test は、GitHub、Linear、Slack との統合により、テスト範囲の自動提案、変更追跡、通知を実現します。すべての外部連携は Port/Adapter パターンで実装され、依存性注入により疎結合を保ちます。

---

## GitHub Integration

### 目的

- リリース候補となる PR をカスタムラベルで検出
- PR の変更ファイルリストを取得し、影響範囲を分析
- テストシナリオとの関連付けによるテスト範囲の自動提案

### Release Detection（リリース検出）

**カスタムラベル方式**:

- PR に特定のラベル（例: `release: v2.1.0`）を付与
- ラベルのパターンマッチングでリリース候補を識別
- GitHub API でクローズ済み PR を検索

### Changed Files Analysis（影響範囲分析）

**ファイルパスからカテゴリへのマッピング**:

```typescript
// 例: 変更ファイル → テストカテゴリ
const fileToCategory: Record<string, string[]> = {
  "src/auth/**": ["authentication"],
  "src/payment/**": ["payment"],
  "src/api/**": ["api", "integration"],
  "src/ui/**": ["ui"],
};
```

**マッピングロジック**:

1. PR の変更ファイルリストを取得
2. 各ファイルパスをカテゴリにマッピング
3. 該当カテゴリのシナリオを推薦リストに追加
4. 重要度と過去の失敗率でソート

### Port 定義

```typescript
// application/ports/github-client.ts
import { Context, Effect, Data } from "effect";

export class GitHubError extends Data.TaggedError("GitHubError")<{
  message: string;
  cause?: unknown;
}> {}

export interface PR {
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly labels: readonly string[];
  readonly state: "open" | "closed";
  readonly mergedAt: Date | null;
}

export interface ChangedFile {
  readonly filename: string;
  readonly status: "added" | "modified" | "removed" | "renamed";
  readonly additions: number;
  readonly deletions: number;
  readonly changes: number;
}

export class GitHubClient extends Context.Tag("@services/GitHubClient")<
  GitHubClient,
  {
    /**
     * 特定のラベルを持つ PR を取得
     */
    getPRsByLabel: (label: string) => Effect.Effect<readonly PR[], GitHubError>;

    /**
     * PR の変更ファイルリストを取得
     */
    getChangedFiles: (
      prNumber: number,
    ) => Effect.Effect<readonly ChangedFile[], GitHubError>;

    /**
     * PR の詳細情報を取得
     */
    getPR: (prNumber: number) => Effect.Effect<PR, GitHubError>;
  }
>() {}
```

### Adapter 実装（Octokit 使用）

```typescript
// infrastructure/adapters/github-adapter.ts
import { Effect, Layer, Context } from "effect";
import { Octokit } from "@octokit/rest";
import {
  GitHubClient,
  GitHubError,
  type PR,
  type ChangedFile,
} from "~/application/ports/github-client";

// Octokit インスタンスを Context として定義
export class OctokitInstance extends Context.Tag("@infra/Octokit")<
  OctokitInstance,
  Octokit
>() {}

export const GitHubClientLive = Layer.effect(
  GitHubClient,
  Effect.gen(function* () {
    const octokit = yield* OctokitInstance;

    return GitHubClient.of({
      getPRsByLabel: (label) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: () =>
              octokit.rest.pulls.list({
                owner: "medimo",
                repo: "main",
                state: "closed",
                per_page: 100,
              }),
            catch: (error) =>
              new GitHubError({
                message: "Failed to fetch PRs",
                cause: error,
              }),
          });

          // ラベルでフィルタリング
          const filtered = result.data.filter((pr) =>
            pr.labels.some(
              (l) => typeof l === "object" && l.name?.includes(label),
            ),
          );

          return filtered.map((pr) => ({
            number: pr.number,
            title: pr.title,
            body: pr.body || "",
            labels: pr.labels
              .map((l) => (typeof l === "object" ? l.name : l))
              .filter((name): name is string => name !== undefined),
            state: pr.state as "open" | "closed",
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
          }));
        }),

      getChangedFiles: (prNumber) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: () =>
              octokit.rest.pulls.listFiles({
                owner: "medimo",
                repo: "main",
                pull_number: prNumber,
                per_page: 100,
              }),
            catch: (error) =>
              new GitHubError({
                message: `Failed to fetch changed files for PR #${prNumber}`,
                cause: error,
              }),
          });

          return result.data.map((file) => ({
            filename: file.filename,
            status: file.status as "added" | "modified" | "removed" | "renamed",
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
          }));
        }),

      getPR: (prNumber) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: () =>
              octokit.rest.pulls.get({
                owner: "medimo",
                repo: "main",
                pull_number: prNumber,
              }),
            catch: (error) =>
              new GitHubError({
                message: `Failed to fetch PR #${prNumber}`,
                cause: error,
              }),
          });

          const pr = result.data;
          return {
            number: pr.number,
            title: pr.title,
            body: pr.body || "",
            labels: pr.labels
              .map((l) => (typeof l === "object" ? l.name : l))
              .filter((name): name is string => name !== undefined),
            state: pr.state as "open" | "closed",
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
          };
        }),
    });
  }),
);

// Octokit インスタンスの Layer
export const OctokitLive = Layer.succeed(
  OctokitInstance,
  new Octokit({
    auth: process.env.GITHUB_TOKEN,
  }),
);

// 統合 Layer
export const GitHubLayer = GitHubClientLive.pipe(Layer.provide(OctokitLive));
```

### Use Case 実装例

```typescript
// application/usecases/release/suggest-test-scope.ts
import { Effect } from "effect";
import { GitHubClient } from "~/application/ports/github-client";
import { ScenarioRepository } from "~/application/ports/scenario-repository";

export const suggestTestScope = (releaseLabel: string) =>
  Effect.gen(function* () {
    const github = yield* GitHubClient;
    const scenarios = yield* ScenarioRepository;

    // 1. リリース PR を取得
    const prs = yield* github.getPRsByLabel(releaseLabel);

    // 2. 全 PR の変更ファイルを取得
    const allChangedFiles = yield* Effect.all(
      prs.map((pr) => github.getChangedFiles(pr.number)),
      { concurrency: 5 },
    );

    const flattenedFiles = allChangedFiles.flat();

    // 3. ファイルパスからカテゴリを抽出
    const categories = extractCategories(flattenedFiles);

    // 4. カテゴリに該当するシナリオを取得
    const suggestedScenarios = yield* scenarios.findByCategories(categories);

    // 5. 重要度と過去の失敗率でソート
    const sorted = suggestedScenarios.sort((a, b) => {
      const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aImportance = importanceOrder[a.importance];
      const bImportance = importanceOrder[b.importance];

      if (aImportance !== bImportance) {
        return aImportance - bImportance;
      }

      // 同じ重要度なら失敗率でソート
      return (b.historicalFailureRate || 0) - (a.historicalFailureRate || 0);
    });

    return {
      prs,
      changedFiles: flattenedFiles,
      categories,
      suggestedScenarios: sorted,
    };
  });

const extractCategories = (files: readonly ChangedFile[]): string[] => {
  const categorySet = new Set<string>();

  const patterns: Record<string, string[]> = {
    "src/auth/": ["authentication"],
    "src/payment/": ["payment"],
    "src/api/": ["api", "integration"],
    "src/ui/": ["ui"],
    "src/db/": ["integration", "performance"],
  };

  for (const file of files) {
    for (const [pattern, categories] of Object.entries(patterns)) {
      if (file.filename.startsWith(pattern)) {
        categories.forEach((cat) => categorySet.add(cat));
      }
    }
  }

  return Array.from(categorySet);
};
```

---

## Linear Integration

### 目的

- Issue 情報（タイトル、説明、ラベル、優先度）を取得
- 関連 PR と変更ファイルを取得
- Linear の優先度をシナリオの重要度にマッピング
- テスト範囲の自動提案を強化

### Issue Information Retrieval

**取得する情報**:

- Issue タイトルと説明
- ラベル（例: `area:auth`, `type:bug`）
- 優先度（Urgent, High, Medium, Low）
- 状態（Backlog, In Progress, Done）
- 関連 PR 番号

**優先度マッピング**:

```typescript
const linearToImportance = {
  "0": "critical", // Urgent
  "1": "high", // High
  "2": "medium", // Medium
  "3": "low", // Low
} as const;
```

### Port 定義

```typescript
// application/ports/linear-client.ts
import { Context, Effect, Data } from "effect";

export class LinearError extends Data.TaggedError("LinearError")<{
  message: string;
  cause?: unknown;
}> {}

export interface LinearIssue {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly labels: readonly string[];
  readonly priority: 0 | 1 | 2 | 3; // 0=Urgent, 1=High, 2=Medium, 3=Low
  readonly state: string;
  readonly relatedPRs: readonly number[];
}

export class LinearClient extends Context.Tag("@services/LinearClient")<
  LinearClient,
  {
    /**
     * Issue ID から詳細情報を取得
     */
    getIssue: (issueId: string) => Effect.Effect<LinearIssue, LinearError>;

    /**
     * 複数の Issue を一括取得
     */
    getIssues: (
      issueIds: readonly string[],
    ) => Effect.Effect<readonly LinearIssue[], LinearError>;
  }
>() {}
```

### Adapter 実装（GraphQL）

```typescript
// infrastructure/adapters/linear-adapter.ts
import { Effect, Layer } from "effect";
import { LinearClient } from "@linear/sdk";
import {
  LinearClient as LinearClientPort,
  LinearError,
  type LinearIssue,
} from "~/application/ports/linear-client";

export const LinearClientLive = Layer.effect(
  LinearClientPort,
  Effect.gen(function* () {
    const client = new LinearClient({
      apiKey: process.env.LINEAR_API_KEY,
    });

    return LinearClientPort.of({
      getIssue: (issueId) =>
        Effect.gen(function* () {
          const issue = yield* Effect.tryPromise({
            try: async () => {
              const result = await client.issue(issueId);
              if (!result) {
                throw new Error(`Issue ${issueId} not found`);
              }
              return result;
            },
            catch: (error) =>
              new LinearError({
                message: `Failed to fetch issue ${issueId}`,
                cause: error,
              }),
          });

          // ラベルを取得
          const labels = yield* Effect.tryPromise({
            try: () => issue.labels(),
            catch: () => new LinearError({ message: "Failed to fetch labels" }),
          });

          // 関連 PR を抽出（Issue の説明から GitHub PR 番号を抽出）
          const prNumbers = extractPRNumbers(issue.description || "");

          return {
            id: issue.id,
            title: issue.title,
            description: issue.description || "",
            labels: labels.nodes.map((l) => l.name),
            priority: issue.priority || 3,
            state: (await issue.state)?.name || "Unknown",
            relatedPRs: prNumbers,
          };
        }),

      getIssues: (issueIds) =>
        Effect.gen(function* () {
          return yield* Effect.all(
            issueIds.map((id) => LinearClientPort.getIssue(id)),
            { concurrency: 5 },
          );
        }),
    });
  }),
);

// GitHub PR 番号を抽出（例: "#123", "PR #456"）
const extractPRNumbers = (text: string): number[] => {
  const regex = /#(\d+)/g;
  const matches = [...text.matchAll(regex)];
  return matches.map((m) => parseInt(m[1], 10));
};
```

### Use Case 統合例

```typescript
// application/usecases/release/enrich-test-scope-with-linear.ts
import { Effect } from "effect";
import { LinearClient } from "~/application/ports/linear-client";
import { GitHubClient } from "~/application/ports/github-client";

export const enrichTestScopeWithLinear = (linearIssueIds: readonly string[]) =>
  Effect.gen(function* () {
    const linear = yield* LinearClient;
    const github = yield* GitHubClient;

    // 1. Linear から Issue 情報を取得
    const issues = yield* linear.getIssues(linearIssueIds);

    // 2. Issue に関連する PR の変更ファイルを取得
    const prNumbers = issues.flatMap((issue) => issue.relatedPRs);
    const changedFilesPerPR = yield* Effect.all(
      prNumbers.map((prNum) => github.getChangedFiles(prNum)),
      { concurrency: 5 },
    );

    const allChangedFiles = changedFilesPerPR.flat();

    // 3. Linear のラベルからカテゴリを抽出
    const categories = extractCategoriesFromLabels(
      issues.flatMap((issue) => issue.labels),
    );

    // 4. Linear の優先度から重要度を決定
    const importanceLevels = issues.map((issue) => ({
      issueId: issue.id,
      importance: mapPriorityToImportance(issue.priority),
    }));

    return {
      issues,
      changedFiles: allChangedFiles,
      categories,
      importanceLevels,
    };
  });

const extractCategoriesFromLabels = (labels: readonly string[]): string[] => {
  const categoryMap: Record<string, string> = {
    "area:auth": "authentication",
    "area:payment": "payment",
    "area:api": "api",
    "area:ui": "ui",
  };

  return labels
    .map((label) => categoryMap[label])
    .filter((cat): cat is string => cat !== undefined);
};

const mapPriorityToImportance = (priority: 0 | 1 | 2 | 3): string => {
  const map = { 0: "critical", 1: "high", 2: "medium", 3: "low" } as const;
  return map[priority];
};
```

---

## Slack Notifications

### 目的

- テストラン開始、完了、失敗時の通知
- 承認待ちテストランの通知
- テスト結果サマリーの共有

### 通知トリガー

| イベント                | タイミング                             | 対象                   |
| ----------------------- | -------------------------------------- | ---------------------- |
| **テストラン開始**      | テストラン作成時                       | 実行者、承認者         |
| **テストラン完了**      | すべてのテスト完了時                   | 実行者、承認者、閲覧者 |
| **Critical テスト失敗** | Critical シナリオ失敗時                | 全員（即時通知）       |
| **承認待ち**            | 完了条件を満たし承認待ち状態になった時 | 承認者                 |
| **承認完了**            | 承認者が承認した時                     | 実行者、閲覧者         |

### メッセージフォーマット

**テストラン完了通知**:

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "✅ *テストラン完了: Release v2.1.0*"
      }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*成功:* 45/50" },
        { "type": "mrkdwn", "text": "*失敗:* 3/50" },
        { "type": "mrkdwn", "text": "*未実施:* 2/50" },
        { "type": "mrkdwn", "text": "*合格率:* 93.8%" }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*実行者:* 山田太郎\n*完了日時:* 2025-01-15 14:30"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "レポートを表示" },
          "url": "https://medi-test.example.com/test-runs/abc123"
        }
      ]
    }
  ]
}
```

**Critical テスト失敗通知**:

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "🚨 *Critical テスト失敗*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*シナリオ:* ユーザーログインフロー\n*カテゴリ:* authentication\n*実行者:* 山田太郎\n*失敗時刻:* 2025-01-15 14:25"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*失敗理由:*\nセッション作成に失敗しました。バックエンドがタイムアウトしました。"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "詳細を確認" },
          "url": "https://medi-test.example.com/test-runs/abc123/items/xyz789",
          "style": "danger"
        }
      ]
    }
  ]
}
```

### Port 定義

```typescript
// application/ports/slack-notifier.ts
import { Context, Effect, Data } from "effect";

export class SlackError extends Data.TaggedError("SlackError")<{
  message: string;
  cause?: unknown;
}> {}

export interface SlackMessage {
  readonly blocks: readonly unknown[];
}

export class SlackNotifier extends Context.Tag("@services/SlackNotifier")<
  SlackNotifier,
  {
    /**
     * Slack にメッセージを送信
     */
    sendMessage: (message: SlackMessage) => Effect.Effect<void, SlackError>;

    /**
     * テストラン完了通知
     */
    notifyTestRunCompleted: (
      testRunId: string,
    ) => Effect.Effect<void, SlackError>;

    /**
     * Critical テスト失敗通知
     */
    notifyCriticalTestFailed: (
      testRunId: string,
      itemId: string,
    ) => Effect.Effect<void, SlackError>;
  }
>() {}
```

### Adapter 実装（Webhook）

```typescript
// infrastructure/adapters/slack-adapter.ts
import { Effect, Layer, Context } from "effect";
import {
  SlackNotifier,
  SlackError,
  type SlackMessage,
} from "~/application/ports/slack-notifier";
import { TestRunRepository } from "~/application/ports/test-run-repository";

export class SlackWebhookURL extends Context.Tag("@config/SlackWebhookURL")<
  SlackWebhookURL,
  string
>() {}

export const SlackNotifierLive = Layer.effect(
  SlackNotifier,
  Effect.gen(function* () {
    const webhookURL = yield* SlackWebhookURL;
    const testRunRepo = yield* TestRunRepository;

    return SlackNotifier.of({
      sendMessage: (message) =>
        Effect.tryPromise({
          try: () =>
            fetch(webhookURL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(message),
            }),
          catch: (error) =>
            new SlackError({
              message: "Failed to send Slack message",
              cause: error,
            }),
        }).pipe(Effect.asVoid),

      notifyTestRunCompleted: (testRunId) =>
        Effect.gen(function* () {
          const testRun = yield* testRunRepo.findById(testRunId);
          const items = yield* testRunRepo.findItems(testRunId);

          const successCount = items.filter(
            (i) => i.result === "success",
          ).length;
          const failCount = items.filter((i) => i.result === "fail").length;
          const notExecutedCount = items.filter(
            (i) => i.result === "not_executed",
          ).length;
          const passRate = ((successCount / items.length) * 100).toFixed(1);

          const message: SlackMessage = {
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `✅ *テストラン完了: ${testRun.title}*`,
                },
              },
              {
                type: "section",
                fields: [
                  {
                    type: "mrkdwn",
                    text: `*成功:* ${successCount}/${items.length}`,
                  },
                  {
                    type: "mrkdwn",
                    text: `*失敗:* ${failCount}/${items.length}`,
                  },
                  {
                    type: "mrkdwn",
                    text: `*未実施:* ${notExecutedCount}/${items.length}`,
                  },
                  { type: "mrkdwn", text: `*合格率:* ${passRate}%` },
                ],
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: { type: "plain_text", text: "レポートを表示" },
                    url: `${process.env.APP_URL}/test-runs/${testRunId}`,
                  },
                ],
              },
            ],
          };

          yield* SlackNotifier.sendMessage(message);
        }),

      notifyCriticalTestFailed: (testRunId, itemId) =>
        Effect.gen(function* () {
          const item = yield* testRunRepo.findItem(testRunId, itemId);

          const message: SlackMessage = {
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "🚨 *Critical テスト失敗*",
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*シナリオ:* ${item.scenarioTitle}\n*カテゴリ:* ${item.category}\n*実行者:* ${item.executedBy?.name || "Unknown"}`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*失敗理由:*\n${item.notes || "詳細なし"}`,
                },
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: { type: "plain_text", text: "詳細を確認" },
                    url: `${process.env.APP_URL}/test-runs/${testRunId}/items/${itemId}`,
                    style: "danger",
                  },
                ],
              },
            ],
          };

          yield* SlackNotifier.sendMessage(message);
        }),
    });
  }),
);
```

---

## Layer 統合

すべての外部連携を1つの Layer にまとめる:

```typescript
// infrastructure/layers/integrations-layer.ts
import { Layer } from "effect";
import { GitHubLayer } from "../adapters/github-adapter";
import { LinearClientLive } from "../adapters/linear-adapter";
import { SlackNotifierLive, SlackWebhookURL } from "../adapters/slack-adapter";

export const IntegrationsLayer = Layer.mergeAll(
  GitHubLayer,
  LinearClientLive,
  SlackNotifierLive,
).pipe(
  Layer.provide(Layer.succeed(SlackWebhookURL, process.env.SLACK_WEBHOOK_URL!)),
);
```

---

## Use Case での統合例

```typescript
// application/usecases/test-run/complete-test-run.ts
import { Effect } from "effect";
import { TestRunRepository } from "~/application/ports/test-run-repository";
import { SlackNotifier } from "~/application/ports/slack-notifier";

export const completeTestRun = (testRunId: string) =>
  Effect.gen(function* () {
    const repo = yield* TestRunRepository;
    const slack = yield* SlackNotifier;

    // 1. テストランのステータスを完了に更新
    yield* repo.updateStatus(testRunId, "completed");

    // 2. Slack 通知を送信
    yield* slack.notifyTestRunCompleted(testRunId);

    // 3. 完了したテストランを返す
    return yield* repo.findById(testRunId);
  });
```

---

## 環境変数設定

```bash
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
APP_URL=https://medi-test.example.com
```

---

## セキュリティ考慮事項

1. **API キーの管理**
   - 環境変数で管理（`.env` はバージョン管理に含めない）
   - Docker Secrets または AWS Secrets Manager で暗号化

2. **Webhook URL の保護**
   - Slack Webhook URL は秘密情報として扱う
   - ログに出力しない

3. **レート制限**
   - GitHub API: 5000 requests/hour（認証済み）
   - Linear API: レート制限あり（具体的な値は公式ドキュメント参照）
   - Slack Webhook: 1 message/second

4. **エラーハンドリング**
   - API エラーは Effect の型システムで明示的に扱う
   - リトライロジック（Effect.retry）を適用

---

## 関連ドキュメント

- [アーキテクチャ](architecture.md) - Port/Adapter パターンの詳細
- [実装ガイド](implementation-guide.md) - Effect TS の実装パターン
- [ワークフロー](workflows.md) - テスト範囲自動提案のフロー
