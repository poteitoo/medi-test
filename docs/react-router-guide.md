# React Router v7 入門

このドキュメントでは、React Router v7 の基本概念と medi-test プロジェクトでの使い方について説明します。

## 目次

- [React Router v7 とは](#react-router-v7-とは)
- [基本概念](#基本概念)
- [ルートモジュール API](#ルートモジュール-api)
- [データローディング（loader / clientLoader）](#データローディングloader--clientloader)
- [データ変更（action / clientAction）](#データ変更action--clientaction)
- [メタデータとヘッダー（meta / headers / links）](#メタデータとヘッダーmeta--headers--links)
- [エラーハンドリング（ErrorBoundary）](#エラーハンドリングerrorboundary)
- [再検証制御（shouldRevalidate）](#再検証制御shouldrevalidate)
- [React Hooks](#react-hooks)
- [medi-test での使用パターン](#medi-test-での使用パターン)

## React Router v7 とは

React Router v7 は、React アプリケーションのための最新のルーティングフレームワークです。主な特徴：

1. **SSR（サーバーサイドレンダリング）対応**: loader と clientLoader による柔軟なデータフェッチ
2. **型安全**: TypeScript による完全な型サポート
3. **ファイルベースルーティング**: routes.ts による宣言的なルート定義
4. **データ変更の自動再検証**: action 実行後に自動的に loader が再実行される
5. **段階的な移行**: v6 からのスムーズなアップグレードパス

**v7 の主な変更点:**

- パッケージの統合: `react-router` に統合（`react-router-dom` 不要）
- Framework Mode のサポート強化
- clientLoader / clientAction による柔軟なデータ戦略
- HydrateFallback によるハイドレーション最適化

## 基本概念

### ルートモジュールとは

React Router v7 では、各ルートは**ルートモジュール**として定義されます。ルートモジュールは、以下の要素をエクスポートできます：

- **Component**: ルートの UI を描画する React コンポーネント
- **loader / clientLoader**: データをロードする関数
- **action / clientAction**: データを変更する関数
- **meta**: ページのメタデータを定義する関数
- **headers**: HTTP ヘッダーを定義する関数
- **links**: `<link>` タグを定義する関数
- **ErrorBoundary**: エラー発生時の UI
- **HydrateFallback**: ハイドレーション中の UI
- **shouldRevalidate**: 再検証のタイミングを制御する関数

### ルート定義

```typescript
// app/routes.ts
import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("../presentation/pages/home-page.tsx"),
  route("login", "../presentation/pages/login-page.tsx"),
  route("dashboard", "../presentation/pages/dashboard-page.tsx"),
  route("scenarios/:id", "../presentation/pages/scenario-detail-page.tsx"),
] satisfies RouteConfig;
```

**ポイント:**

- `index()`: インデックスルート（`/`）
- `route(path, file)`: 通常のルート
- パスパラメータ: `:id` のような動的セグメント
- ファイルパスは `app/` からの相対パス

## ルートモジュール API

### Component（デフォルトエクスポート）

ルートの UI を描画する React コンポーネントです。

```typescript
// presentation/pages/dashboard-page.tsx
import { useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard-page";

export default function DashboardPage() {
  const data = useLoaderData<Route.LoaderData>();

  return (
    <div>
      <h1>ダッシュボード</h1>
      <p>ようこそ、{data.userName}さん</p>
    </div>
  );
}
```

**ポイント:**

- デフォルトエクスポートで定義
- `useLoaderData` で loader から渡されたデータを取得
- `Route.LoaderData` 型で型安全にアクセス

## データローディング（loader / clientLoader）

### loader（サーバーサイド）

`loader` は、サーバーサイドでデータをフェッチする関数です。SSR や初回ページロード時に実行されます。

```typescript
// presentation/pages/scenario-detail-page.tsx
import type { Route } from "./+types/scenario-detail-page";
import { getScenario } from "~/application/usecases/scenario/get-scenario";
import { AppLayer } from "~/infrastructure/layers/app-layer";
import { Effect } from "effect";

export async function loader({ params }: Route.LoaderArgs) {
  // Effect Program を実行
  const scenario = await Effect.runPromise(
    getScenario(params.id).pipe(Effect.provide(AppLayer)),
  );

  return { scenario };
}
```

**ポイント:**

- `LoaderArgs` には `params`, `request`, `context` が含まれる
- 非同期関数として定義
- 返り値は自動的にシリアライズされてクライアントに送信
- 型安全: `Route.LoaderArgs` と `Route.LoaderData` で型定義

### clientLoader（クライアントサイド）

`clientLoader` は、ブラウザ上でデータをフェッチする関数です。クライアント側のナビゲーション時に実行されます。

```typescript
// presentation/pages/dashboard-page.tsx
import type { Route } from "./+types/dashboard-page";
import { getDashboardData } from "~/application/usecases/dashboard/get-dashboard-data";
import { BrowserLayer } from "~/infrastructure/layers/browser-layer";
import { Effect } from "effect";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  // ブラウザ専用の Effect Layer を使用
  const data = await Effect.runPromise(
    getDashboardData().pipe(Effect.provide(BrowserLayer)),
  );

  return { data };
}
```

**ポイント:**

- クライアント側でのみ実行される
- localStorage や IndexedDB など、ブラウザ API を直接使用可能
- SSR 時には実行されない

### loader と clientLoader の併用

両方を定義すると、SSR では `loader`、クライアント側ナビゲーションでは `clientLoader` が使用されます。

```typescript
// presentation/pages/scenario-list-page.tsx
import type { Route } from "./+types/scenario-list-page";

// SSR / 初回ページロード用
export async function loader({ request }: Route.LoaderArgs) {
  const scenarios = await fetchScenariosFromServer();
  return { scenarios };
}

// クライアント側ナビゲーション用
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  // キャッシュがあればそれを使用、なければサーバーの loader を実行
  const cached = await getCachedScenarios();
  if (cached) {
    return { scenarios: cached };
  }

  // serverLoader() でサーバーの loader を呼び出すことも可能
  return await serverLoader();
}
```

**ポイント:**

- `serverLoader()` で明示的にサーバーの loader を呼び出せる
- クライアント側でキャッシュ戦略を実装可能

### HydrateFallback（ハイドレーション中の UI）

`clientLoader` が hydrate オプションを使用する場合、`HydrateFallback` でローディング UI を表示できます。

```typescript
// presentation/pages/dashboard-page.tsx
import type { Route } from "./+types/dashboard-page";

export async function clientLoader() {
  const data = await fetchLocalData();
  return { data };
}

// ハイドレーション時に実行するよう指定
clientLoader.hydrate = true as const;

// ハイドレーション中に表示される UI
export function HydrateFallback() {
  return <div>ダッシュボードを読み込み中...</div>;
}

export default function DashboardPage() {
  const { data } = useLoaderData<Route.LoaderData>();
  return <div>{data.summary}</div>;
}
```

**ポイント:**

- `clientLoader.hydrate = true` で初回ハイドレーション時にも実行
- `HydrateFallback` でローディング状態を表示

## データ変更（action / clientAction）

### action（サーバーサイド）

`action` は、サーバーサイドでデータを変更する関数です。`<Form>` や `useFetcher` から呼び出されます。

```typescript
// presentation/pages/scenario-creation-page.tsx
import { redirect } from "react-router";
import type { Route } from "./+types/scenario-creation-page";
import { createScenario } from "~/application/usecases/scenario/create-scenario";
import { AppLayer } from "~/infrastructure/layers/app-layer";
import { Effect } from "effect";
import { scenarioSchema } from "~/lib/schemas/scenario";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // バリデーション
  const validation = scenarioSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  // Effect Program を実行
  const result = await Effect.runPromise(
    createScenario(validation.data).pipe(
      Effect.catchTags({
        InvalidScenarioCategoryError: (error) =>
          Effect.succeed({
            success: false,
            errors: { category: [`カテゴリ "${error.category}" は無効です`] },
          }),
      }),
      Effect.provide(AppLayer),
    ),
  );

  if (!result.success) {
    return result;
  }

  // 成功したらリダイレクト
  return redirect(`/scenarios/${result.id}`);
}
```

**ポイント:**

- `ActionArgs` には `params`, `request`, `context` が含まれる
- フォームデータは `request.formData()` で取得
- バリデーションエラーはオブジェクトで返す
- `redirect()` で別ページへ遷移
- action 実行後、すべての loader が自動的に再実行される（**再検証**）

### Form コンポーネントでの使用

```typescript
// presentation/features/scenario-creation/scenario-creation-form.tsx
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export function ScenarioCreationForm() {
  return (
    <Form method="post">
      <Input name="title" placeholder="シナリオタイトル" required />
      <Input name="category" placeholder="カテゴリ" required />
      <Button type="submit">作成</Button>
    </Form>
  );
}
```

**ポイント:**

- `<Form method="post">` で action を呼び出す
- `name` 属性が formData のキーになる
- 送信中は自動的にナビゲーション状態が更新される（`useNavigation` で取得可能）

### clientAction（クライアントサイド）

`clientAction` は、ブラウザ上でデータを変更する関数です。サーバーに送信せずクライアント側で完結する処理に使用します。

```typescript
// presentation/pages/settings-page.tsx
import type { Route } from "./+types/settings-page";
import { saveToLocalStorage } from "~/lib/utils/storage";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const theme = formData.get("theme") as string;

  // localStorage に保存
  saveToLocalStorage("theme", theme);

  return { success: true };
}
```

**ポイント:**

- `clientAction` が定義されている場合、`action` より優先される
- サーバーリクエストを送信したくない場合に使用
- localStorage など、ブラウザ専用 API を使用可能

### action と clientAction の併用

```typescript
// presentation/pages/test-run-page.tsx
import type { Route } from "./+types/test-run-page";

// サーバー側でデータベースに保存
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await saveTestRunToDatabase(formData);
  return { success: true };
}

// クライアント側でキャッシュを更新 + サーバーに送信
export async function clientAction({
  request,
  serverAction,
}: Route.ClientActionArgs) {
  const formData = await request.formData();

  // ローカルキャッシュを先に更新（楽観的更新）
  updateLocalCache(formData);

  // サーバーに送信
  const result = await serverAction();

  return result;
}
```

**ポイント:**

- `serverAction()` でサーバーの action を呼び出せる
- 楽観的更新（Optimistic Update）を実装可能

## メタデータとヘッダー（meta / headers / links）

### meta（ページメタデータ）

`meta` 関数は、ページの `<title>` や `<meta>` タグを定義します。

```typescript
// presentation/pages/scenario-detail-page.tsx
import type { Route } from "./+types/scenario-detail-page";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.scenario) {
    return [{ title: "シナリオが見つかりません | medi-test" }];
  }

  return [
    { title: `${data.scenario.title} | medi-test` },
    { name: "description", content: data.scenario.description },
    { property: "og:title", content: data.scenario.title },
    { property: "og:description", content: data.scenario.description },
  ];
}
```

**ポイント:**

- `MetaArgs` には `data`, `params`, `location`, `matches` が含まれる
- `data` は loader の返り値
- 配列で複数のメタタグを返す

### headers（HTTP ヘッダー）

`headers` 関数は、SSR 時の HTTP レスポンスヘッダーを定義します。

```typescript
// presentation/pages/api-data-page.tsx
import type { Route } from "./+types/api-data-page";

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return {
    "Cache-Control": "public, max-age=300",
    "X-Custom-Header": loaderHeaders.get("X-API-Version") || "v1",
  };
}
```

**ポイント:**

- `HeadersArgs` には `loaderHeaders`, `parentHeaders`, `actionHeaders` が含まれる
- loader が返したヘッダーを `loaderHeaders` で取得可能
- サーバーサイドでのみ有効

### links（外部リソース）

`links` 関数は、`<link>` タグを定義します（CSS、フォント、アイコンなど）。

```typescript
// presentation/pages/rich-editor-page.tsx
import type { Route } from "./+types/rich-editor-page";

export function links(): Route.LinkDescriptors {
  return [
    { rel: "stylesheet", href: "/styles/tiptap-editor.css" },
    {
      rel: "preload",
      href: "/fonts/editor-font.woff2",
      as: "font",
      type: "font/woff2",
    },
  ];
}
```

**ポイント:**

- CSS や フォントのプリロードに使用
- ルートごとに必要なリソースを宣言的に定義

## エラーハンドリング（ErrorBoundary）

### ErrorBoundary コンポーネント

`ErrorBoundary` は、ルートモジュール内でエラーが発生した際に表示される UI です。

```typescript
// presentation/pages/scenario-detail-page.tsx
import { isRouteErrorResponse, useRouteError } from "react-router";
import type { Route } from "./+types/scenario-detail-page";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div>
          <h1>404 - シナリオが見つかりません</h1>
          <p>指定されたシナリオ ID は存在しません。</p>
        </div>
      );
    }

    return (
      <div>
        <h1>エラー {error.status}</h1>
        <p>{error.statusText}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>予期しないエラーが発生しました</h1>
      <p>{error instanceof Error ? error.message : "不明なエラー"}</p>
    </div>
  );
}
```

**ポイント:**

- `useRouteError()` でエラーオブジェクトを取得
- `isRouteErrorResponse()` で HTTP エラーかどうか判定
- loader, action, コンポーネント内のエラーすべてをキャッチ

### loader でエラーを throw する

```typescript
// presentation/pages/scenario-detail-page.tsx
import { data as jsonData } from "react-router";
import type { Route } from "./+types/scenario-detail-page";

export async function loader({ params }: Route.LoaderArgs) {
  const scenario = await getScenario(params.id);

  if (!scenario) {
    // 404 エラーを throw
    throw jsonData({ message: "Scenario not found" }, { status: 404 });
  }

  return { scenario };
}
```

**ポイント:**

- `data()` 関数（または `json()`）で HTTP ステータスコードを指定
- `throw` すると ErrorBoundary がレンダリングされる

## 再検証制御（shouldRevalidate）

### shouldRevalidate 関数

`shouldRevalidate` は、loader を再実行するかどうかを制御する関数です。デフォルトでは、action 実行後やナビゲーション時に自動的に再検証されます。

```typescript
// presentation/pages/scenario-list-page.tsx
import type { Route } from "./+types/scenario-list-page";

export function shouldRevalidate({
  actionStatus,
  defaultShouldRevalidate,
}: Route.ShouldRevalidateArgs) {
  // action が成功した場合のみ再検証
  if (actionStatus && actionStatus >= 200 && actionStatus < 300) {
    return true;
  }

  // それ以外はデフォルトの動作に従う
  return defaultShouldRevalidate;
}
```

**ポイント:**

- `ShouldRevalidateArgs` には `actionStatus`, `currentUrl`, `nextUrl`, `formMethod`, `defaultShouldRevalidate` が含まれる
- `true` を返すと loader が再実行される
- `false` を返すと loader はスキップされる
- パフォーマンス最適化に有用

### 再検証のタイミング

React Router v7 では、以下のタイミングで loader が再実行されます：

1. **action 実行後**: すべての loader が再実行される（デフォルト）
2. **ナビゲーション時**: ルートが変わると新しいルートの loader が実行される
3. **手動再検証**: `useRevalidator()` を使って明示的に再検証を要求

```typescript
import { useRevalidator } from "react-router";

function MyComponent() {
  const revalidator = useRevalidator();

  const handleRefresh = () => {
    // すべての loader を再実行
    revalidator.revalidate();
  };

  return <button onClick={handleRefresh}>最新の状態に更新</button>;
}
```

## React Hooks

### useLoaderData

`loader` から返されたデータを取得します。

```typescript
import { useLoaderData } from "react-router";
import type { Route } from "./+types/scenario-list-page";

export default function ScenarioListPage() {
  const { scenarios } = useLoaderData<Route.LoaderData>();

  return (
    <ul>
      {scenarios.map((scenario) => (
        <li key={scenario.id}>{scenario.title}</li>
      ))}
    </ul>
  );
}
```

### useActionData

`action` から返されたデータを取得します。主にバリデーションエラーの表示に使用します。

```typescript
import { useActionData } from "react-router";
import type { Route } from "./+types/scenario-creation-page";

export default function ScenarioCreationPage() {
  const actionData = useActionData<Route.ActionData>();

  return (
    <Form method="post">
      <Input name="title" />
      {actionData?.errors?.title && (
        <p className="text-red-500">{actionData.errors.title[0]}</p>
      )}
      <Button type="submit">作成</Button>
    </Form>
  );
}
```

### useNavigation

現在のナビゲーション状態を取得します。フォーム送信中やページ遷移中の UI に使用します。

```typescript
import { useNavigation } from "react-router";

export default function MyPage() {
  const navigation = useNavigation();

  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";

  return (
    <Form method="post">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "送信中..." : "送信"}
      </Button>
    </Form>
  );
}
```

**ポイント:**

- `navigation.state`: `"idle" | "submitting" | "loading"`
- `navigation.formData`: 送信中のフォームデータ
- `navigation.location`: 遷移先の location

### useFetcher

ナビゲーションせずに loader / action を呼び出します。

```typescript
import { useFetcher } from "react-router";

export function LikeButton({ scenarioId }: { scenarioId: string }) {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action="/api/like">
      <input type="hidden" name="scenarioId" value={scenarioId} />
      <button type="submit" disabled={fetcher.state === "submitting"}>
        {fetcher.state === "submitting" ? "送信中..." : "いいね"}
      </button>
    </fetcher.Form>
  );
}
```

**ポイント:**

- `fetcher.Form`: ナビゲーションしない Form
- `fetcher.load()`: loader を呼び出す
- `fetcher.submit()`: action を呼び出す
- `fetcher.data`: loader / action の返り値
- `fetcher.state`: `"idle" | "submitting" | "loading"`

### useParams

URL パラメータを取得します。

```typescript
import { useParams } from "react-router";

export default function ScenarioDetailPage() {
  const params = useParams<{ id: string }>();

  return <h1>シナリオ ID: {params.id}</h1>;
}
```

### useSearchParams

URL クエリパラメータを取得・更新します。

```typescript
import { useSearchParams } from "react-router";

export default function ScenarioListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "all";

  const handleFilterChange = (newCategory: string) => {
    setSearchParams({ category: newCategory });
  };

  return (
    <div>
      <button onClick={() => handleFilterChange("authentication")}>
        認証
      </button>
      <button onClick={() => handleFilterChange("payment")}>決済</button>
    </div>
  );
}
```

## medi-test での使用パターン

### パターン1: シナリオ一覧ページ（loader のみ）

```typescript
// presentation/pages/scenario-list-page.tsx
import { useLoaderData } from "react-router";
import type { Route } from "./+types/scenario-list-page";
import { listScenarios } from "~/application/usecases/scenario/list-scenarios";
import { AppLayer } from "~/infrastructure/layers/app-layer";
import { Effect } from "effect";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") || undefined;

  const scenarios = await Effect.runPromise(
    listScenarios({ category }).pipe(Effect.provide(AppLayer))
  );

  return { scenarios };
}

export function meta(): Route.MetaDescriptors {
  return [{ title: "シナリオ一覧 | medi-test" }];
}

export default function ScenarioListPage() {
  const { scenarios } = useLoaderData<Route.LoaderData>();

  return (
    <div>
      <h1>シナリオ一覧</h1>
      <ul>
        {scenarios.map((scenario) => (
          <li key={scenario.id}>
            <a href={`/scenarios/${scenario.id}`}>{scenario.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### パターン2: シナリオ作成ページ（action + バリデーション）

```typescript
// presentation/pages/scenario-creation-page.tsx
import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/scenario-creation-page";
import { createScenario } from "~/application/usecases/scenario/create-scenario";
import { scenarioSchema } from "~/lib/schemas/scenario";
import { AppLayer } from "~/infrastructure/layers/app-layer";
import { Effect } from "effect";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // Zod でバリデーション
  const validation = scenarioSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  // Effect Program を実行
  const result = await Effect.runPromise(
    createScenario(validation.data).pipe(
      Effect.catchTags({
        InvalidScenarioCategoryError: (error) =>
          Effect.succeed({
            success: false,
            errors: {
              category: [`カテゴリ "${error.category}" は無効です`],
            },
          }),
        GitError: () =>
          Effect.succeed({
            success: false,
            errors: {
              _form: ["Git リポジトリへのアクセスに失敗しました"],
            },
          }),
      }),
      Effect.provide(AppLayer)
    )
  );

  if (!result.success) {
    return result;
  }

  // 成功したら詳細ページへリダイレクト
  return redirect(`/scenarios/${result.id}`);
}

export default function ScenarioCreationPage() {
  const actionData = useActionData<Route.ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <h1>シナリオを作成</h1>

      <Form method="post">
        <div>
          <label htmlFor="title">タイトル</label>
          <Input id="title" name="title" required />
          {actionData?.errors?.title && (
            <p className="text-red-500">{actionData.errors.title[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="category">カテゴリ</label>
          <Input id="category" name="category" required />
          {actionData?.errors?.category && (
            <p className="text-red-500">{actionData.errors.category[0]}</p>
          )}
        </div>

        {actionData?.errors?._form && (
          <p className="text-red-500">{actionData.errors._form[0]}</p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "作成中..." : "作成"}
        </Button>
      </Form>
    </div>
  );
}
```

### パターン3: テストラン詳細ページ（loader + SSE 連携）

```typescript
// presentation/pages/test-run-detail-page.tsx
import { useLoaderData, useRevalidator } from "react-router";
import { useEffect } from "react";
import type { Route } from "./+types/test-run-detail-page";
import { getTestRun } from "~/application/usecases/test-run/get-test-run";
import { AppLayer } from "~/infrastructure/layers/app-layer";
import { Effect } from "effect";

export async function loader({ params }: Route.LoaderArgs) {
  const testRun = await Effect.runPromise(
    getTestRun(params.id).pipe(Effect.provide(AppLayer))
  );

  return { testRun };
}

export function meta({ data }: Route.MetaArgs) {
  return [
    {
      title: data?.testRun
        ? `${data.testRun.name} | medi-test`
        : "テストラン | medi-test",
    },
  ];
}

export default function TestRunDetailPage() {
  const { testRun } = useLoaderData<Route.LoaderData>();
  const revalidator = useRevalidator();

  // SSE でリアルタイム更新を受け取る
  useEffect(() => {
    const eventSource = new EventSource(`/api/test-runs/${testRun.id}/events`);

    eventSource.addEventListener("test-result-updated", () => {
      // データが更新されたら再検証
      revalidator.revalidate();
    });

    return () => {
      eventSource.close();
    };
  }, [testRun.id, revalidator]);

  return (
    <div>
      <h1>{testRun.name}</h1>
      <p>ステータス: {testRun.status}</p>
      <p>進捗: {testRun.progress}%</p>
    </div>
  );
}
```

### パターン4: 楽観的更新（clientAction + serverAction）

```typescript
// presentation/pages/test-result-page.tsx
import { Form, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/test-result-page";
import { updateTestResult } from "~/application/usecases/test-run/update-test-result";
import { AppLayer } from "~/infrastructure/layers/app-layer";
import { Effect } from "effect";

export async function loader({ params }: Route.LoaderArgs) {
  const testResult = await fetchTestResult(params.id);
  return { testResult };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const resultId = formData.get("resultId") as string;
  const status = formData.get("status") as string;

  await Effect.runPromise(
    updateTestResult(resultId, status).pipe(Effect.provide(AppLayer))
  );

  return { success: true };
}

export async function clientAction({
  request,
  serverAction,
}: Route.ClientActionArgs) {
  const formData = await request.formData();
  const resultId = formData.get("resultId") as string;
  const status = formData.get("status") as string;

  // ローカルキャッシュを先に更新（楽観的更新）
  updateLocalCache(resultId, status);

  // サーバーに送信（バックグラウンド）
  serverAction().catch(() => {
    // 失敗したらロールバック
    revertLocalCache(resultId);
  });

  return { success: true };
}

export default function TestResultPage() {
  const { testResult } = useLoaderData<Route.LoaderData>();
  const navigation = useNavigation();

  return (
    <div>
      <h1>テスト結果: {testResult.scenarioTitle}</h1>
      <p>現在のステータス: {testResult.status}</p>

      <Form method="post">
        <input type="hidden" name="resultId" value={testResult.id} />
        <button name="status" value="passed">
          合格
        </button>
        <button name="status" value="failed">
          不合格
        </button>
      </Form>
    </div>
  );
}
```

### パターン5: データのプリフェッチ（PrefetchPageLinks）

```typescript
// presentation/pages/dashboard-page.tsx
import { Link } from "react-router";
import { PrefetchPageLinks } from "react-router";

export default function DashboardPage() {
  return (
    <div>
      <h1>ダッシュボード</h1>

      {/* ホバー時にシナリオ一覧のデータをプリフェッチ */}
      <Link to="/scenarios" prefetch="intent">
        <PrefetchPageLinks page="/scenarios" />
        シナリオ一覧を見る
      </Link>
    </div>
  );
}
```

**ポイント:**

- `prefetch="intent"`: ホバー時にプリフェッチ
- `prefetch="render"`: レンダリング時にプリフェッチ
- `prefetch="none"`: プリフェッチしない（デフォルト）

## まとめ

React Router v7 の基本的な使い方をまとめます：

### データローディング

- **loader**: サーバーサイドデータフェッチ（SSR / 初回ロード）
- **clientLoader**: クライアントサイドデータフェッチ（ナビゲーション時）
- **HydrateFallback**: ハイドレーション中の UI

### データ変更

- **action**: サーバーサイドデータ変更
- **clientAction**: クライアントサイドデータ変更
- **Form**: 宣言的なフォーム送信
- **useFetcher**: ナビゲーションしないデータ変更

### メタデータ

- **meta**: `<title>`, `<meta>` タグの定義
- **headers**: HTTP レスポンスヘッダーの定義
- **links**: `<link>` タグの定義

### エラーハンドリング

- **ErrorBoundary**: エラー時の UI
- **useRouteError**: エラーオブジェクトの取得

### 再検証制御

- **shouldRevalidate**: loader の再実行タイミングを制御
- **useRevalidator**: 手動で再検証を要求

### React Hooks

- **useLoaderData**: loader のデータ取得
- **useActionData**: action の結果取得
- **useNavigation**: ナビゲーション状態の取得
- **useFetcher**: ナビゲーションしないデータ操作
- **useParams**: URL パラメータの取得
- **useSearchParams**: クエリパラメータの取得・更新

### medi-test での使用方針

1. **Effect TS との統合**: loader / action 内で Effect Program を実行
2. **型安全**: `Route.LoaderData`, `Route.ActionArgs` で型定義
3. **SSR 対応**: loader でサーバーサイドレンダリング
4. **リアルタイム更新**: SSE + `useRevalidator()` で自動更新
5. **楽観的更新**: clientAction でローカル先行更新 + serverAction で同期

次は [実装ガイド](implementation-guide.md) で、実際の機能実装例を見ていきましょう。

## Sources

- [React Router - Actions](https://reactrouter.com/start/framework/actions)
- [React Router - Route Module](https://reactrouter.com/start/framework/route-module)
- [React Router - Data Loading](https://reactrouter.com/start/framework/data-loading)
- [React Router - Client Data](https://reactrouter.com/how-to/client-data)
- [React Router - Error Boundaries](https://reactrouter.com/how-to/error-boundary)
- [React Router - shouldRevalidate](https://reactrouter.com/en/main/route/should-revalidate)
- [React Router - LoaderFunction API Reference](https://api.reactrouter.com/v7/types/react_router.LoaderFunction.html)
- [Remix - clientLoader Documentation](https://v2.remix.run/docs/route/client-loader/)
