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

## Styling ガイドライン

### Tailwind CSS の使用方針

#### 基本原則

1. **任意の値は原則禁止**
   - `h-[500px]`, `w-[300px]` などは使用しない
   - Tailwindの標準スケールまたはカスタムプロパティを使用

2. **インラインスタイルは避ける**
   - `style={{ height: '200px' }}` は使用しない
   - Tailwindクラスで表現できない場合はカスタムプロパティを追加

3. **セマンティックファースト**
   - 意図が明確なクラス名を優先 (`h-full`, `min-h-screen`)

#### サイズ指定のベストプラクティス

**✅ Good:**

```tsx
// Tailwindの標準スケール
<div className="h-64 w-96" />

// カスタムプロパティ
<ChartContainer className="h-chart w-full" />

// セマンティック
<div className="min-h-screen" />

// Flexbox自動調整
<div className="flex-1" />
```

**❌ Bad:**

```tsx
// 任意の値
<div className="h-[500px] w-[300px]" />

// インラインスタイル
<div style={{ height: '200px' }} />

// 計算された値
<div className="h-[calc(100vh-200px)]" />
```

#### カスタムプロパティの追加方法

新しいサイズが必要な場合:

1. **app/app.cssの@theme inlineセクションに追加**

   ```css
   @theme inline {
     --height-my-component: 350px;
   }
   ```

2. **Tailwindクラスとして使用**

   ```tsx
   <div className="h-my-component" />
   ```

3. **命名規則:**
   - `--height-*` : 高さ
   - `--width-*` : 幅
   - `--size-*` : 正方形 (height = width)
   - 用途が明確な名前を使用 (例: `--height-chart-lg`)

#### コンポーネント別ガイドライン

**Charts (Recharts):**

```tsx
// ChartContainerのデフォルトはaspect-videoを持つ
// 固定高さが必要な場合のみh-chart-*を指定
<ChartContainer className="h-chart w-full">
```

**TextEditor (TipTap):**

```tsx
// app.cssの.tiptapクラスで統一
// 個別のminHeightプロパティは使用しない
<TextEditor /> // デフォルトでmin-h-editor-minが適用される
```

**Tables:**

```tsx
// カラム幅はTailwindの標準スケールを優先
<TableHead className="w-24">  // 96px
<TableHead className="w-32">  // 128px
```

**Modals/Dialogs:**

```tsx
// ビューポート単位はカスタムプロパティ経由
<DialogContent className="max-h-viewport-lg">
```

### shadcn/ui コンポーネントの取り扱い

**基本方針:**

- アップストリームのコードはできるだけ維持
- プロジェクト固有の修正のみ実施
- 更新時に上流の変更を確認

**修正が推奨される場合:**

- ビジネスロジックに直結するコンポーネント
- プロジェクト全体で頻繁に使用される値

**修正を避けるべき場合:**

- 汎用的なユーティリティコンポーネント
- 一度だけ使用される値
- アップデートの頻度が高いコンポーネント
