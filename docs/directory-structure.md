# ディレクトリ構造

このドキュメントでは、Theta プロジェクトの詳細なディレクトリ構造とファイル配置ルールについて説明します。

## 目次

- [全体構造](#全体構造)
- [Domain Layer](#domain-layer)
- [Application Layer](#application-layer)
- [Infrastructure Layer](#infrastructure-layer)
- [Presentation Layer](#presentation-layer)
- [Shared](#shared)
- [App](#app)
- [Test](#test)
- [ファイル命名規則](#ファイル命名規則)

## 全体構造

```
theta/
├── domain/                    # ドメイン層
│   ├── model/                 # エンティティ、値オブジェクト
│   ├── logic/                 # 純粋なビジネスロジック
│   └── error/                 # ドメイン固有のエラー
├── application/               # アプリケーション層
│   ├── usecase/               # ユースケース
│   │   ├── consultation/      # 機能ごとにディレクトリ分割
│   │   ├── patient/
│   │   └── composite/         # 複数ユースケースの組み合わせ
│   └── port/                  # インターフェース定義（Tag）
├── infrastructure/            # インフラストラクチャ層
│   ├── http/                  # API クライアント実装
│   ├── storage/               # ストレージ実装
│   ├── device/                # デバイス API 実装
│   └── layer/                 # Layer の合成
├── presentation/              # プレゼンテーション層
│   ├── features/              # 機能単位の再利用可能なコンポーネント群
│   │   └── <feature>/
│   │       ├── ui/            # React コンポーネント
│   │       ├── hooks/         # UI 状態管理
│   │       └── adapters/      # usecase 呼び出し
│   ├── pages/                 # ページコンポーネント（ルーティング対象）
│   ├── components/            # 共通 UI コンポーネント
│   └── styles/                # グローバルスタイル
├── shared/                    # 共有コード
│   ├── config/                # 設定値
│   ├── logging/               # ロギング
│   ├── error/                 # 技術的エラー
│   └── types/                 # 共通型定義
├── app/                       # React Router 設定
│   ├── routes.ts              # ルート定義
│   └── root.tsx               # ルートコンポーネント
└── test/                      # テストコード
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
```

## Domain Layer

Domain Layer は、ビジネスルールを表現する純粋な TypeScript コードです。外部依存を持たず、Effect を使用しません。

```
domain/
├── model/
│   ├── consultation.ts        # Consultation エンティティ
│   ├── patient.ts             # Patient エンティティ
│   └── value-objects/         # 値オブジェクト
│       ├── duration.ts
│       └── patient-name.ts
├── logic/
│   ├── consultation-validator.ts  # 診察バリデーション
│   ├── time-calculator.ts         # 時間計算
│   └── patient-formatter.ts       # 患者情報フォーマット
└── error/
    ├── consultation-error.ts      # 診察関連エラー
    └── patient-error.ts           # 患者関連エラー
```

### model/

エンティティと値オブジェクトを定義します。

```typescript
// domain/model/consultation.ts
export interface Consultation {
  readonly id: string;
  readonly patientName: string;
  readonly startTime: Date;
  readonly duration: number;
  readonly status: ConsultationStatus;
}

export type ConsultationStatus = "scheduled" | "in-progress" | "completed";
```

### logic/

純粋な値変換とビジネスルール検証を行います。

```typescript
// domain/logic/consultation-validator.ts
export const validateConsultationDuration = (minutes: number): boolean => {
  return minutes > 0 && minutes <= 180;
};

export const isConsultationOverlapping = (
  consultation1: Consultation,
  consultation2: Consultation,
): boolean => {
  // 純粋な計算ロジック
  const end1 = calculateEndTime(
    consultation1.startTime,
    consultation1.duration,
  );
  const end2 = calculateEndTime(
    consultation2.startTime,
    consultation2.duration,
  );
  return consultation1.startTime < end2 && consultation2.startTime < end1;
};
```

### error/

ドメイン固有のエラーを定義します。

```typescript
// domain/error/consultation-error.ts
import { Data } from "effect";

export class InvalidConsultationDurationError extends Data.TaggedError(
  "InvalidConsultationDurationError",
)<{
  duration: number;
}> {}

export class ConsultationOverlapError extends Data.TaggedError(
  "ConsultationOverlapError",
)<{
  existingConsultationId: string;
}> {}
```

## Application Layer

Application Layer は、ユースケースを実装し、Port（インターフェース）を定義します。Effect を使用します。

```
application/
├── usecase/
│   ├── consultation/
│   │   ├── create-consultation.ts       # 診察作成
│   │   ├── get-consultation.ts          # 診察取得
│   │   ├── update-consultation.ts       # 診察更新
│   │   └── list-consultations.ts        # 診察一覧
│   ├── patient/
│   │   ├── register-patient.ts          # 患者登録
│   │   └── search-patients.ts           # 患者検索
│   └── composite/
│       └── complete-consultation-flow.ts # 複数ユースケース組み合わせ
└── port/
    ├── api-client.ts            # API クライアント Port
    ├── storage.ts               # ストレージ Port
    ├── clock.ts                 # 時計 Port
    └── notification.ts          # 通知 Port
```

### usecase/

ユースケースを実装します。機能ごとにディレクトリを分割します。

```typescript
// application/usecase/consultation/get-consultation.ts
import { Effect } from "effect";
import { ApiClient } from "../../port/api-client";
import type { Consultation } from "../../../domain/model/consultation";
import { ConsultationNotFoundError } from "../../../domain/error/consultation-error";

export const getConsultation = (id: string) =>
  Effect.gen(function* () {
    const client = yield* ApiClient;
    const consultation = yield* client.get<Consultation>(
      `/consultations/${id}`,
    );

    if (!consultation) {
      return yield* Effect.fail(new ConsultationNotFoundError({ id }));
    }

    return consultation;
  });
```

### usecase/composite/

複数のユースケースを組み合わせた複雑なワークフローを配置します。

```typescript
// application/usecase/composite/complete-consultation-flow.ts
import { Effect } from "effect";
import { getConsultation } from "../consultation/get-consultation";
import { updateConsultation } from "../consultation/update-consultation";
import { sendNotification } from "../notification/send-notification";

export const completeConsultationFlow = (consultationId: string) =>
  Effect.gen(function* () {
    // 1. 診察情報取得
    const consultation = yield* getConsultation(consultationId);

    // 2. ステータス更新
    const updated = yield* updateConsultation(consultationId, {
      status: "completed",
    });

    // 3. 通知送信
    yield* sendNotification({
      type: "consultation-completed",
      patientName: consultation.patientName,
    });

    return updated;
  });
```

### port/

外部依存のインターフェース（Tag）を定義します。

```typescript
// application/port/api-client.ts
import { Context, Effect } from "effect";
import type { NetworkError } from "../../shared/error/network-error";

export interface ApiClient {
  get: <T>(path: string) => Effect.Effect<T, NetworkError>;
  post: <T, B>(path: string, body: B) => Effect.Effect<T, NetworkError>;
  put: <T, B>(path: string, body: B) => Effect.Effect<T, NetworkError>;
  delete: <T>(path: string) => Effect.Effect<T, NetworkError>;
}

export const ApiClient = Context.GenericTag<ApiClient>("@services/ApiClient");
```

## Infrastructure Layer

Infrastructure Layer は、Port の実装を提供し、外部システムと統合します。

```
infrastructure/
├── http/
│   ├── fetch-api-client.ts          # fetch ベースの API クライアント
│   ├── axios-api-client.ts          # axios ベースの API クライアント（代替実装）
│   └── interceptors/
│       ├── auth-interceptor.ts      # 認証インターセプター
│       └── error-interceptor.ts     # エラーインターセプター
├── storage/
│   ├── local-storage.ts             # localStorage 実装
│   ├── indexed-db.ts                # IndexedDB 実装
│   └── session-storage.ts           # sessionStorage 実装
├── device/
│   ├── clock.ts                     # 時計実装
│   ├── media-devices.ts             # MediaDevices 実装
│   └── network-status.ts            # ネットワーク状態実装
└── layer/
    ├── browser-layer.ts             # ブラウザ環境用 Layer
    ├── test-layer.ts                # テスト用 Layer
    └── mock-layer.ts                # モック用 Layer
```

### http/

API クライアントの実装を提供します。

```typescript
// infrastructure/http/fetch-api-client.ts
import { Effect, Layer } from "effect";
import { ApiClient } from "../../application/port/api-client";
import { NetworkError } from "../../shared/error/network-error";

const API_BASE_URL = "https://api.example.com";

export const FetchApiClient = Layer.succeed(
  ApiClient,
  ApiClient.of({
    get: (path) =>
      Effect.tryPromise({
        try: () =>
          fetch(`${API_BASE_URL}${path}`, {
            headers: {
              "Content-Type": "application/json",
            },
          }).then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
          }),
        catch: (error) => new NetworkError({ cause: error }),
      }),

    post: (path, body) =>
      Effect.tryPromise({
        try: () =>
          fetch(`${API_BASE_URL}${path}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }).then((response) => response.json()),
        catch: (error) => new NetworkError({ cause: error }),
      }),

    // put, delete も同様に実装
  }),
);
```

### storage/

ストレージの実装を提供します。

```typescript
// infrastructure/storage/local-storage.ts
import { Effect, Layer } from "effect";
import { Storage } from "../../application/port/storage";
import { StorageError } from "../../shared/error/storage-error";

export const LocalStorageService = Layer.succeed(
  Storage,
  Storage.of({
    get: (key) =>
      Effect.try({
        try: () => {
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        catch: (error) => new StorageError({ cause: error }),
      }),

    set: (key, value) =>
      Effect.try({
        try: () => {
          localStorage.setItem(key, JSON.stringify(value));
        },
        catch: (error) => new StorageError({ cause: error }),
      }),

    remove: (key) =>
      Effect.try({
        try: () => {
          localStorage.removeItem(key);
        },
        catch: (error) => new StorageError({ cause: error }),
      }),
  }),
);
```

### layer/

複数の実装を束ねて、アプリケーション全体で使用する Layer を提供します。

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

## Presentation Layer

Presentation Layer は、UI の表示とユーザーインタラクションを担当します。

```
presentation/
├── features/                  # 機能単位の再利用可能なコンポーネント群
│   ├── consultation/
│   │   ├── ui/
│   │   │   ├── consultation-card.tsx         # 診察カードコンポーネント
│   │   │   ├── consultation-list.tsx         # 診察一覧コンポーネント
│   │   │   ├── consultation-detail.tsx       # 診察詳細コンポーネント
│   │   │   └── consultation-form.tsx         # 診察フォームコンポーネント
│   │   ├── hooks/
│   │   │   ├── use-consultation.ts           # 診察取得 hook
│   │   │   ├── use-consultation-list.ts      # 診察一覧 hook
│   │   │   └── use-consultation-form.ts      # 診察フォーム hook
│   │   └── adapters/
│   │       └── consultation-adapter.ts       # 診察関連 adapter
│   └── patient/
│       ├── ui/
│       │   ├── patient-card.tsx
│       │   └── patient-info.tsx
│       ├── hooks/
│       │   └── use-patient.ts
│       └── adapters/
│           └── patient-adapter.ts
├── pages/                     # ページコンポーネント（ルーティング対象）
│   ├── dashboard-page.tsx             # ダッシュボード
│   ├── consultation-list-page.tsx     # 診察一覧ページ
│   ├── consultation-detail-page.tsx   # 診察詳細ページ
│   ├── patient-list-page.tsx          # 患者一覧ページ
│   └── patient-detail-page.tsx        # 患者詳細ページ
├── components/                # 共通 UI コンポーネント
│   ├── ui/                    # Radix UI などの基本コンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── dialog.tsx
│   ├── form/                  # フォーム関連コンポーネント
│   │   ├── form-field.tsx
│   │   └── form-error.tsx
│   └── layout/                # レイアウトコンポーネント
│       ├── header.tsx
│       └── sidebar.tsx
└── styles/
    └── globals.css
```

### features と pages の役割分担

| 項目         | features/                        | pages/                                |
| ------------ | -------------------------------- | ------------------------------------- |
| 役割         | 再利用可能な機能単位             | 実際のページ（ルーティング対象）      |
| 責務         | 特定ドメインのUI・ロジック       | 複数featuresの組み合わせ              |
| 使用場所     | pages/や他のfeaturesから使われる | app/routes.tsから参照される           |
| ルーティング | 知らない                         | React Routerのパラメータを扱う        |
| 例           | ConsultationCard, PatientForm    | ConsultationDetailPage, DashboardPage |

### features/<feature>/ui/

React コンポーネントを配置します。表示のみに専念します。

```typescript
// presentation/features/consultation/ui/consultation-detail.tsx
import { useConsultation } from "../hooks/use-consultation";

interface ConsultationDetailProps {
  id: string;
}

export const ConsultationDetail = ({ id }: ConsultationDetailProps) => {
  const { data, loading, error } = useConsultation(id);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;
  if (!data) return <div>診察が見つかりません</div>;

  return (
    <div>
      <h1>{data.patientName} の診察</h1>
      <p>開始時刻: {data.startTime.toLocaleString()}</p>
      <p>診察時間: {data.duration} 分</p>
      <p>ステータス: {data.status}</p>
    </div>
  );
};
```

### features/<feature>/hooks/

UI の状態管理を行います。React の状態管理機能（useState, useReducer など）を使用します。

```typescript
// presentation/features/consultation/hooks/use-consultation.ts
import { useState, useEffect } from "react";
import { consultationAdapter } from "../adapters/consultation-adapter";
import type { Consultation } from "../../../../domain/model/consultation";

export const useConsultation = (id: string) => {
  const [data, setData] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    consultationAdapter
      .fetch(id)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  const refetch = () => {
    setLoading(true);
    consultationAdapter
      .fetch(id)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  return { data, loading, error, refetch };
};
```

### features/<feature>/adapters/

ユースケースを呼び出し、Effect を Promise に変換します。

```typescript
// presentation/features/consultation/adapters/consultation-adapter.ts
import { Effect } from "effect";
import { getConsultation } from "../../../../application/usecase/consultation/get-consultation";
import { updateConsultation } from "../../../../application/usecase/consultation/update-consultation";
import { BrowserLayer } from "../../../../infrastructure/layer/browser-layer";
import type { UpdateConsultationInput } from "../../../../application/usecase/consultation/update-consultation";

export const consultationAdapter = {
  fetch: (id: string) =>
    Effect.runPromise(getConsultation(id).pipe(Effect.provide(BrowserLayer))),

  update: (id: string, data: UpdateConsultationInput) =>
    Effect.runPromise(
      updateConsultation(id, data).pipe(Effect.provide(BrowserLayer)),
    ),
};
```

### pages/

ページコンポーネントを配置します。React Router のルーティング対象となり、複数の features を組み合わせます。

```typescript
// presentation/pages/consultation-detail-page.tsx
import { useParams } from "react-router";
import { ConsultationDetail } from "../features/consultation/ui/consultation-detail";
import { PatientInfo } from "../features/patient/ui/patient-info";
import { useConsultation } from "../features/consultation/hooks/use-consultation";

export const ConsultationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useConsultation(id!);

  if (loading) return <div>読み込み中...</div>;
  if (!data) return <div>診察が見つかりません</div>;

  return (
    <div className="container">
      <ConsultationDetail consultation={data} />
      <PatientInfo patientId={data.patientId} />
    </div>
  );
};

// presentation/pages/dashboard-page.tsx
import { RecentConsultations } from "../features/consultation/ui/recent-consultations";
import { PatientList } from "../features/patient/ui/patient-list";
import { Statistics } from "../features/statistics/ui/statistics";

export const DashboardPage = () => {
  return (
    <div className="dashboard">
      <h1>ダッシュボード</h1>
      <Statistics />
      <div className="grid grid-cols-2 gap-4">
        <RecentConsultations />
        <PatientList />
      </div>
    </div>
  );
};
```

**ポイント:**

- React Router のパラメータ（`useParams`）を扱う
- 複数の features を組み合わせてページを構成
- features は再利用可能に保つ

## Shared

共通で使用されるコードを配置します。

```
shared/
├── config/
│   ├── env.ts                 # 環境変数
│   └── constants.ts           # 定数
├── logging/
│   └── logger.ts              # ロガー
├── error/
│   ├── network-error.ts       # ネットワークエラー
│   ├── validation-error.ts    # バリデーションエラー
│   └── storage-error.ts       # ストレージエラー
└── types/
    └── common.ts              # 共通型定義
```

### config/

アプリケーション全体で使用する設定値を定義します。

```typescript
// shared/config/env.ts
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
} as const;
```

### error/

技術的・汎用的なエラーを定義します。

```typescript
// shared/error/network-error.ts
import { Data } from "effect";

export class NetworkError extends Data.TaggedError("NetworkError")<{
  cause: unknown;
}> {}
```

## App

React Router の設定とルートコンポーネントを配置します。

```
app/
├── routes.ts                  # ルート定義
└── root.tsx                   # ルートコンポーネント
```

### routes.ts

React Router のルート定義を行います。pages/ のページコンポーネントを参照します。

```typescript
// app/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";

export default [
  {
    path: "/",
    file: "./presentation/pages/dashboard-page.tsx",
  },
  {
    path: "/consultations",
    file: "./presentation/pages/consultation-list-page.tsx",
  },
  {
    path: "/consultations/:id",
    file: "./presentation/pages/consultation-detail-page.tsx",
  },
  {
    path: "/patients",
    file: "./presentation/pages/patient-list-page.tsx",
  },
  {
    path: "/patients/:id",
    file: "./presentation/pages/patient-detail-page.tsx",
  },
] satisfies RouteConfig;
```

**ポイント:**

- ルートは presentation/pages/ のページコンポーネントを参照
- pages/ のコンポーネントが features/ を組み合わせてページを構成
- React Router が自動的に依存性注入（DI）を行う

## Test

テストコードを配置します。src/ と同じ構造を持ちます。

```
test/
├── domain/
│   ├── logic/
│   │   └── consultation-validator.test.ts
│   └── model/
│       └── consultation.test.ts
├── application/
│   └── usecase/
│       └── consultation/
│           └── get-consultation.test.ts
├── infrastructure/
│   ├── http/
│   │   └── fetch-api-client.test.ts
│   └── storage/
│       └── local-storage.test.ts
└── presentation/
    └── features/
        └── consultation/
            ├── hooks/
            │   └── use-consultation.test.ts
            └── ui/
                └── consultation-detail.test.tsx
```

## ファイル命名規則

### ファイル名

- **kebab-case を使用**: `consultation-validator.ts`, `api-client.ts`
- **コンポーネントは PascalCase でも可**: `ConsultationDetail.tsx` または `consultation-detail.tsx`

### 型定義

- **interface は PascalCase**: `Consultation`, `ApiClient`
- **type alias は PascalCase**: `ConsultationStatus`

### 関数

- **camelCase を使用**: `validateConsultationDuration`, `getConsultation`

### 定数

- **SCREAMING_SNAKE_CASE を使用**: `API_BASE_URL`, `MAX_DURATION`

### ディレクトリ

- **kebab-case を使用**: `consultation/`, `api-client/`, `use-consultation/`

## まとめ

Theta のディレクトリ構造は、以下の原則に基づいています：

1. **レイヤーごとに明確に分離**: domain, application, infrastructure, presentation
2. **機能ごとにディレクトリ分割**: consultation, patient など
3. **features と pages の役割分担**: features は再利用可能な機能単位、pages はルーティング対象のページ
4. **責務の明確化**: ui（表示）、hooks（状態）、adapters（ユースケース呼び出し）
5. **テストコードも同じ構造**: 対応するテストを見つけやすい

次は [Effect TS 入門](effect-guide.md) で、Effect TS の基本的な使い方を学びましょう。
