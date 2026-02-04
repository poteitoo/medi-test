# コーディング規約

## 命名

- ファイル名は `kebab-case`
- 型とインターフェースは `PascalCase`
- 変数と関数は `camelCase`
- 定数は `SCREAMING_SNAKE_CASE`（グローバル）

## import の順序

1. 外部ライブラリ
2. 内部モジュール（絶対パス）
3. 相対パス

## export

- named export を使用
- default export は避ける

## Effect TS のベストプラクティス

### Effect.gen を使う

Good

```typescript
import { Effect } from "effect";

export const createScenario = (input: CreateScenarioInput) =>
  Effect.gen(function* () {
    const repo = yield* ScenarioRepository;
    return yield* repo.create(input);
  });
```

Bad

```typescript
import { Effect } from "effect";

export const createScenario = (input: CreateScenarioInput) =>
  ScenarioRepository.pipe(Effect.flatMap((repo) => repo.create(input)));
```

### Tag の命名規則

Good

```typescript
import { Context } from "effect";

export const ScenarioRepository = Context.GenericTag<ScenarioRepository>(
  "@services/ScenarioRepository",
);
```

Bad

```typescript
import { Context } from "effect";

export const ScenarioRepository =
  Context.GenericTag<ScenarioRepository>("ScenarioRepository");
```

### Layer の命名規則

Good

```typescript
import { Layer } from "effect";

export const HttpScenarioRepository = Layer.succeed(
  ScenarioRepository,
  ScenarioRepository.of({
    create: (input) => Effect.succeed({ id: "s1", ...input }),
  }),
);
```

Bad

```typescript
import { Layer } from "effect";

export const scenarioRepository = Layer.succeed(
  ScenarioRepository,
  ScenarioRepository.of({
    create: (input) => Effect.succeed({ id: "s1", ...input }),
  }),
);
```

### エラーは Data.TaggedError を使う

Good

```typescript
import { Data } from "effect";

export class DuplicateScenarioError extends Data.TaggedError(
  "DuplicateScenarioError",
)<{ title: string }> {}
```

Bad

```typescript
export class DuplicateScenarioError extends Error {
  constructor(public title: string) {
    super(`Duplicate scenario: ${title}`);
  }
}
```

## React の方針

- UI と状態は分離する
- hooks は UI 状態と adapter 呼び出しのみを担当
- adapter は Effect の実行と Layer 供給を担当

## コメント

- Why を説明し、What/How は極力避ける
