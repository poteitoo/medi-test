# Effect TS 入門

このドキュメントでは、Effect TS の基本概念と medi-test プロジェクトでの使い方について説明します。

## 目次

- [Effect TS とは](#effect-ts-とは)
- [基本概念](#基本概念)
- [Tag（インターフェース）](#tagインターフェース)
- [Layer（実装の提供）](#layer実装の提供)
- [Effect Program の実行](#effect-program-の実行)
- [エラーハンドリング](#エラーハンドリング)
- [medi-test での使用パターン](#medi-test-での使用パターン)

## Effect TS とは

Effect TS は、TypeScript で関数型プログラミングの強力な概念を実現するライブラリです。主な特徴：

1. **型安全な依存性注入**: Tag と Layer によるコンパイル時の型チェック
2. **明示的なエラーハンドリング**: Effect 型でエラーパスを型レベルで表現
3. **合成可能性**: 小さな Effect を組み合わせて複雑なロジックを構築
4. **テスタビリティ**: Layer の差し替えによる柔軟なテスト

## 基本概念

### Effect 型

Effect は、副作用を伴う計算を表現する型です。

```typescript
Effect<Success, Error, Requirements>;
```

- **Success**: 成功時の戻り値の型
- **Error**: 失敗時のエラーの型
- **Requirements**: この Effect が実行に必要とする依存性の型

#### 例

```typescript
import { Effect } from "effect";

// 成功: string, エラー: never, 依存: なし
const simple: Effect.Effect<string, never, never> = Effect.succeed("Hello");

// 成功: number, エラー: Error, 依存: なし
const withError: Effect.Effect<number, Error, never> = Effect.fail(
  new Error("Something went wrong"),
);

// 成功: User, エラー: NetworkError, 依存: ApiClient
const withDeps: Effect.Effect<User, NetworkError, ApiClient> = Effect.gen(
  function* () {
    const client = yield* ApiClient;
    const user = yield* client.get<User>("/users/1");
    return user;
  },
);
```

### Effect.gen（ジェネレーター構文）

Effect.gen は、async/await のような書き心地で Effect Program を記述できる構文です。

```typescript
import { Effect } from "effect";

// async/await 風の書き方
const program = Effect.gen(function* () {
  const x = yield* Effect.succeed(10);
  const y = yield* Effect.succeed(20);
  return x + y; // 30
});
```

**重要**: `yield*` を使って Effect を"実行"します（実際には合成しているだけで、まだ実行されていません）。

## Tag（インターフェース）

Tag は、依存性のインターフェースを定義する仕組みです。

### Tag の定義

```typescript
// application/port/api-client.ts
import { Context, Effect } from "effect";
import type { NetworkError } from "../../shared/error/network-error";

// インターフェースの定義
export interface ApiClient {
  get: <T>(path: string) => Effect.Effect<T, NetworkError>;
  post: <T, B>(path: string, body: B) => Effect.Effect<T, NetworkError>;
}

// Tag の作成
export const ApiClient = Context.GenericTag<ApiClient>("@services/ApiClient");
```

**ポイント:**

- `Context.GenericTag` で Tag を作成
- 文字列は一意の識別子（通常は `@services/名前` のような形式）
- Tag は型とランタイム値の両方を提供

### Tag の使用

```typescript
// application/usecases/scenario/get-scenario.ts
import { Effect } from "effect";
import { GitRepository } from "~/application/ports/git-repository";

export const getScenario = (scenarioId: string) =>
  Effect.gen(function* () {
    // Tag から実装を取得
    const gitRepo = yield* GitRepository;

    // 実装のメソッドを呼び出す
    const scenario = yield* gitRepo.getScenario(scenarioId);

    return scenario;
  });
```

**ポイント:**

- `yield* ApiClient` で実装を取得
- この時点では、どの実装が注入されるかは不明
- 実装は Layer で提供される

## Layer（実装の提供）

Layer は、Tag に対する実装を提供する仕組みです。

### Layer の作成

```typescript
// infrastructure/http/fetch-api-client.ts
import { Effect, Layer } from "effect";
import { ApiClient } from "../../application/port/api-client";
import { NetworkError } from "../../shared/error/network-error";

const API_BASE_URL = "https://api.example.com";

export const FetchApiClient = Layer.succeed(
  ApiClient, // 提供する Tag
  ApiClient.of({
    // Tag の実装
    get: (path) =>
      Effect.tryPromise({
        try: () => fetch(`${API_BASE_URL}${path}`).then((r) => r.json()),
        catch: (error) => new NetworkError({ cause: error }),
      }),

    post: (path, body) =>
      Effect.tryPromise({
        try: () =>
          fetch(`${API_BASE_URL}${path}`, {
            method: "POST",
            body: JSON.stringify(body),
          }).then((r) => r.json()),
        catch: (error) => new NetworkError({ cause: error }),
      }),
  }),
);
```

**ポイント:**

- `Layer.succeed` で即座に利用可能な Layer を作成
- `Effect.tryPromise` で Promise を Effect に変換
- エラー型を明示的に指定

### Layer の合成

複数の Layer を組み合わせて、アプリケーション全体で使用する Layer を作成します。

```typescript
// infrastructure/layer/browser-layer.ts
import { Layer } from "effect";
import { FetchApiClient } from "../http/fetch-api-client";
import { LocalStorageService } from "../storage/local-storage";
import { BrowserClockService } from "../device/clock";

export const BrowserLayer = Layer.mergeAll(
  FetchApiClient,
  LocalStorageService,
  BrowserClockService,
);
```

**ポイント:**

- `Layer.mergeAll` で複数の Layer を結合
- この Layer を提供すれば、ApiClient, Storage, Clock すべてが利用可能

## Effect Program の実行

Effect Program を実行するには、`Effect.runPromise` または `Effect.runSync` を使用します。

### Effect.runPromise

非同期の Effect を Promise として実行します。

```typescript
import { Effect } from "effect";
import { getTestRun } from "~/application/usecases/test-run/get-test-run";
import { AppLayer } from "~/infrastructure/layers/app-layer";

const program = getTestRun("test-run-123");

// Layer を提供して実行
Effect.runPromise(program.pipe(Effect.provide(AppLayer)))
  .then((testRun) => {
    console.log("取得成功:", testRun);
  })
  .catch((error) => {
    console.error("エラー:", error);
  });
```

**ポイント:**

- `Effect.provide` で Layer を提供
- `Effect.runPromise` で Promise に変換
- 通常の Promise として `.then()`, `.catch()` が使える

### medi-test での使用例（Adapter パターン）

Presentation Layer では、adapter を使って Effect を実行します。

```typescript
// presentation/features/test-run/adapters/test-run-adapter.ts
import { Effect } from "effect";
import { getTestRun } from "~/application/usecases/test-run/get-test-run";
import { AppLayer } from "~/infrastructure/layers/app-layer";

export const testRunAdapter = {
  fetch: (id: string) =>
    Effect.runPromise(getTestRun(id).pipe(Effect.provide(AppLayer))),
};
```

## エラーハンドリング

Effect TS では、エラーを型レベルで表現し、明示的に処理します。

### エラーの定義

```typescript
// domain/errors/scenario-errors.ts
import { Data } from "effect";

export class ScenarioNotFoundError extends Data.TaggedError(
  "ScenarioNotFoundError",
)<{
  scenarioId: string;
}> {}

export class InvalidScenarioCategoryError extends Data.TaggedError(
  "InvalidScenarioCategoryError",
)<{
  category: string;
}> {}
```

**ポイント:**

- `Data.TaggedError` でエラークラスを作成
- タグ（文字列）で識別可能
- 追加データを持てる

### エラーの発生

```typescript
// application/usecases/scenario/get-scenario.ts
import { Effect } from "effect";
import { ScenarioNotFoundError } from "~/domain/errors/scenario-errors";
import { GitRepository } from "~/application/ports/git-repository";

export const getScenario = (scenarioId: string) =>
  Effect.gen(function* () {
    const gitRepo = yield* GitRepository;
    const scenario = yield* gitRepo.getScenario(scenarioId);

    if (!scenario) {
      // エラーを発生させる
      return yield* Effect.fail(new ScenarioNotFoundError({ scenarioId }));
    }

    return scenario;
  });
```

### エラーのキャッチ

```typescript
// エラーをキャッチして処理
const program = getScenario("auth-login-001").pipe(
  Effect.catchTag("ScenarioNotFoundError", (error) =>
    Effect.succeed({
      success: false,
      message: `シナリオID ${error.scenarioId} が見つかりません`,
    }),
  ),
);
```

**ポイント:**

- `Effect.catchTag` で特定のエラーをキャッチ
- タグ（文字列）で識別
- 型安全：エラーの型が推論される

### 複数のエラーをキャッチ

```typescript
const program = getScenario("auth-login-001").pipe(
  Effect.catchTags({
    ScenarioNotFoundError: (error) =>
      Effect.succeed({
        success: false,
        message: `シナリオID ${error.scenarioId} が見つかりません`,
      }),
    GitError: (error) =>
      Effect.succeed({
        success: false,
        message: "Git リポジトリへのアクセスに失敗しました",
      }),
  }),
);
```

## medi-test での使用パターン

### パターン1: ユースケースの実装

```typescript
// application/usecases/scenario/create-scenario.ts
import { Effect } from "effect";
import { GitRepository } from "~/application/ports/git-repository";
import { validateScenarioCategory } from "~/domain/logic/scenario-validator";
import { InvalidScenarioCategoryError } from "~/domain/errors/scenario-errors";

export interface CreateScenarioInput {
  id: string;
  title: string;
  category: string;
  tags: string[];
  importance: string;
}

export const createScenario = (input: CreateScenarioInput) =>
  Effect.gen(function* () {
    // ドメインバリデーション
    if (!validateScenarioCategory(input.category)) {
      return yield* Effect.fail(
        new InvalidScenarioCategoryError({ category: input.category }),
      );
    }

    // 依存性の取得
    const gitRepo = yield* GitRepository;

    // YAML と Markdown ファイルを生成
    const yamlContent = yield* generateScenarioYAML(input);
    const markdownContent = yield* generateScenarioMarkdown(input);

    // Git にコミット
    yield* gitRepo.commitFiles([
      { path: `scenarios/${input.id}.yml`, content: yamlContent },
      { path: `scenarios/${input.id}.md`, content: markdownContent }
    ]);

    const version = yield* gitRepo.getCurrentCommit();

    return { id: input.id, version };
  });
```

### パターン2: 複数のユースケースの組み合わせ

```typescript
// application/usecases/test-run/complete-test-run.ts
import { Effect } from "effect";
import { getTestRun } from "./get-test-run";
import { updateTestRunStatus } from "./update-test-run-status";
import { SlackNotifier } from "~/application/ports/slack-notifier";

export const completeTestRun = (testRunId: string) =>
  Effect.gen(function* () {
    // 1. テストラン取得
    const testRun = yield* getTestRun(testRunId);

    // 2. ステータス更新
    const updated = yield* updateTestRunStatus(testRunId, "completed");

    // 3. Slack 通知送信（エラーがあっても続行）
    const slack = yield* SlackNotifier;
    yield* slack.notifyTestRunCompleted(testRunId).pipe(
      Effect.catchAll(() => Effect.succeed(undefined)), // エラーを無視
    );

    return updated;
  });
```

### パターン3: Presentation Layer での使用

```typescript
// presentation/features/scenario/adapters/scenario-adapter.ts
import { Effect } from "effect";
import { createScenario } from "~/application/usecases/scenario/create-scenario";
import { AppLayer } from "~/infrastructure/layers/app-layer";

export const createScenarioWithErrorHandling = (
  input: CreateScenarioInput,
) => {
  return Effect.runPromise(
    createScenario(input).pipe(
      Effect.catchTags({
        InvalidScenarioCategoryError: (error) =>
          Effect.succeed({
            success: false,
            error: `カテゴリ "${error.category}" は無効です。有効なカテゴリを選択してください。`,
          }),
        GitError: (error) =>
          Effect.succeed({
            success: false,
            error: "Git リポジトリへのアクセスに失敗しました",
          }),
      }),
      Effect.provide(AppLayer),
    ),
  );
};
```

## まとめ

Effect TS の基本的な使い方をまとめます：

1. **Tag**: インターフェースを定義（`Context.GenericTag`）
2. **Layer**: 実装を提供（`Layer.succeed`, `Layer.mergeAll`）
3. **Effect.gen**: async/await 風の構文で Effect を組み立て
4. **Effect.provide**: Layer を提供
5. **Effect.runPromise**: Effect を Promise として実行
6. **Effect.catchTag/catchTags**: エラーを型安全にキャッチ

次は [実装ガイド](implementation-guide.md) で、実際の実装例を見ていきましょう。
