# テスト戦略

このドキュメントでは、Theta プロジェクトでのテスト戦略とテストの書き方について説明します。

## 目次

- [テスト戦略の概要](#テスト戦略の概要)
- [テストの種類](#テストの種類)
- [Domain Layer のテスト](#domain-layer-のテスト)
- [Application Layer のテスト](#application-layer-のテスト)
- [Infrastructure Layer のテスト](#infrastructure-layer-のテスト)
- [Presentation Layer のテスト](#presentation-layer-のテスト)
- [Test Layer の作成](#test-layer-の作成)
- [テストのベストプラクティス](#テストのベストプラクティス)

## テスト戦略の概要

Theta では、各レイヤーに適したテスト手法を採用しています。

```
Domain Layer        → Unit Test（純粋関数のテスト）
Application Layer   → Integration Test（Effect のテスト、Test Layer 使用）
Infrastructure Layer → Integration Test（外部依存のモック）
Presentation Layer  → Component Test（React Testing Library）
```

### テストフレームワーク

- **Vitest**: 高速なテストランナー（Vite と統合）
- **React Testing Library**: コンポーネントテスト
- **Effect Test Utils**: Effect のテストユーティリティ

### セットアップ

```bash
# テスト関連パッケージのインストール
pnpm add -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @vitest/ui
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
});
```

## テストの種類

### 1. Unit Test（単体テスト）

**対象**: Domain Layer の純粋関数

**特徴**:

- 外部依存なし
- 高速に実行
- 最も書きやすい

### 2. Integration Test（統合テスト）

**対象**: Application Layer, Infrastructure Layer

**特徴**:

- Test Layer でモックを提供
- Effect のテストユーティリティを使用
- 複数のレイヤーをまたいでテスト

### 3. Component Test（コンポーネントテスト）

**対象**: Presentation Layer

**特徴**:

- React Testing Library を使用
- ユーザーインタラクションをシミュレート
- adapter をモック

## Domain Layer のテスト

Domain Layer は純粋関数なので、最もシンプルにテストできます。

### 例: バリデーションロジックのテスト

```typescript
// domain/logic/consultation-validator.ts
export const validateConsultationDuration = (minutes: number): boolean => {
  return minutes > 0 && minutes <= 180;
};

// test/domain/logic/consultation-validator.test.ts
import { describe, it, expect } from "vitest";
import { validateConsultationDuration } from "../../../domain/logic/consultation-validator";

describe("validateConsultationDuration", () => {
  it("有効な診察時間（1〜180分）の場合、trueを返す", () => {
    expect(validateConsultationDuration(1)).toBe(true);
    expect(validateConsultationDuration(60)).toBe(true);
    expect(validateConsultationDuration(180)).toBe(true);
  });

  it("無効な診察時間（0分以下）の場合、falseを返す", () => {
    expect(validateConsultationDuration(0)).toBe(false);
    expect(validateConsultationDuration(-1)).toBe(false);
  });

  it("無効な診察時間（180分超）の場合、falseを返す", () => {
    expect(validateConsultationDuration(181)).toBe(false);
    expect(validateConsultationDuration(200)).toBe(false);
  });
});
```

### 例: 計算ロジックのテスト

```typescript
// domain/logic/consultation-calculator.ts
export const calculateEndTime = (startTime: Date, duration: number): Date => {
  return new Date(startTime.getTime() + duration * 60 * 1000);
};

// test/domain/logic/consultation-calculator.test.ts
import { describe, it, expect } from "vitest";
import { calculateEndTime } from "../../../domain/logic/consultation-calculator";

describe("calculateEndTime", () => {
  it("開始時刻と診察時間から終了時刻を計算する", () => {
    const startTime = new Date("2024-01-01T10:00:00");
    const duration = 60; // 60分

    const endTime = calculateEndTime(startTime, duration);

    expect(endTime).toEqual(new Date("2024-01-01T11:00:00"));
  });

  it("診察時間が0分の場合、開始時刻と同じ時刻を返す", () => {
    const startTime = new Date("2024-01-01T10:00:00");
    const duration = 0;

    const endTime = calculateEndTime(startTime, duration);

    expect(endTime).toEqual(startTime);
  });
});
```

## Application Layer のテスト

Application Layer では、Test Layer を使って依存性をモックします。

### Test Layer の作成

```typescript
// infrastructure/layer/test-layer.ts
import { Effect, Layer, Context } from "effect";
import { ApiClient } from "../../application/port/api-client";
import { Storage } from "../../application/port/storage";
import type { Consultation } from "../../domain/model/consultation";

// モックデータ
const mockConsultations: Record<string, Consultation> = {
  "consultation-1": {
    id: "consultation-1",
    patientId: "patient-1",
    patientName: "山田太郎",
    startTime: new Date("2024-01-01T10:00:00"),
    duration: 60,
    status: "scheduled",
  },
};

// Mock ApiClient Layer
export const MockApiClient = Layer.succeed(
  ApiClient,
  ApiClient.of({
    get: (path) =>
      Effect.sync(() => {
        const id = path.split("/").pop();
        const consultation = mockConsultations[id!];

        if (!consultation) {
          throw new Error("Not found");
        }

        return consultation;
      }),

    post: (path, body) =>
      Effect.sync(() => {
        const newConsultation = {
          ...body,
          id: `consultation-${Date.now()}`,
        };
        return newConsultation;
      }),

    put: (path, body) =>
      Effect.sync(() => {
        return { ...body, id: path.split("/").pop() };
      }),

    delete: (path) =>
      Effect.sync(() => {
        return { success: true };
      }),
  }),
);

// Mock Storage Layer
const mockStorage: Record<string, unknown> = {};

export const MockStorage = Layer.succeed(
  Storage,
  Storage.of({
    get: (key) =>
      Effect.sync(() => {
        return mockStorage[key] ?? null;
      }),

    set: (key, value) =>
      Effect.sync(() => {
        mockStorage[key] = value;
      }),

    remove: (key) =>
      Effect.sync(() => {
        delete mockStorage[key];
      }),
  }),
);

// Test Layer の合成
export const TestLayer = Layer.mergeAll(MockApiClient, MockStorage);
```

### ユースケースのテスト

```typescript
// test/application/usecase/consultation/get-consultation.test.ts
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { getConsultation } from "../../../../application/usecase/consultation/get-consultation";
import { TestLayer } from "../../../../infrastructure/layer/test-layer";

describe("getConsultation", () => {
  it("指定されたIDの診察を取得する", async () => {
    const program = getConsultation("consultation-1");

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(TestLayer)),
    );

    expect(result).toEqual({
      id: "consultation-1",
      patientId: "patient-1",
      patientName: "山田太郎",
      startTime: expect.any(Date),
      duration: 60,
      status: "scheduled",
    });
  });

  it("存在しないIDの場合、エラーを返す", async () => {
    const program = getConsultation("non-existent-id");

    await expect(
      Effect.runPromise(program.pipe(Effect.provide(TestLayer))),
    ).rejects.toThrow("Not found");
  });
});
```

### エラーハンドリングのテスト

```typescript
// test/application/usecase/consultation/create-consultation.test.ts
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { createConsultation } from "../../../../application/usecase/consultation/create-consultation";
import { TestLayer } from "../../../../infrastructure/layer/test-layer";
import { InvalidConsultationDurationError } from "../../../../domain/error/consultation-error";

describe("createConsultation", () => {
  it("有効な入力で診察を作成する", async () => {
    const input = {
      patientId: "patient-1",
      patientName: "山田太郎",
      startTime: new Date("2024-01-01T10:00:00"),
      duration: 60,
    };

    const program = createConsultation(input);

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(TestLayer)),
    );

    expect(result).toMatchObject({
      patientId: "patient-1",
      patientName: "山田太郎",
      duration: 60,
      status: "scheduled",
    });
  });

  it("無効な診察時間の場合、InvalidConsultationDurationErrorを返す", async () => {
    const input = {
      patientId: "patient-1",
      patientName: "山田太郎",
      startTime: new Date("2024-01-01T10:00:00"),
      duration: 200, // 無効な診察時間
    };

    const program = createConsultation(input);

    const result = await Effect.runPromise(
      program.pipe(
        Effect.catchTag("InvalidConsultationDurationError", (error) =>
          Effect.succeed({ error: error._tag, duration: error.duration }),
        ),
        Effect.provide(TestLayer),
      ),
    );

    expect(result).toEqual({
      error: "InvalidConsultationDurationError",
      duration: 200,
    });
  });
});
```

## Infrastructure Layer のテスト

Infrastructure Layer のテストでは、外部依存（fetch, localStorage など）をモックします。

### API クライアントのテスト

```typescript
// test/infrastructure/http/fetch-api-client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect } from "effect";
import { FetchApiClient } from "../../../infrastructure/http/fetch-api-client";
import { ApiClient } from "../../../application/port/api-client";

// global fetch のモック
global.fetch = vi.fn();

describe("FetchApiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET リクエストを実行する", async () => {
    const mockData = { id: "1", name: "Test" };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const program = Effect.gen(function* () {
      const client = yield* ApiClient;
      return yield* client.get("/test");
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(FetchApiClient)),
    );

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.any(Object),
    );
  });

  it("ネットワークエラーの場合、NetworkErrorを返す", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    const program = Effect.gen(function* () {
      const client = yield* ApiClient;
      return yield* client.get("/test");
    });

    await expect(
      Effect.runPromise(program.pipe(Effect.provide(FetchApiClient))),
    ).rejects.toThrow();
  });
});
```

### ストレージのテスト

```typescript
// test/infrastructure/storage/local-storage.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { LocalStorageService } from "../../../infrastructure/storage/local-storage";
import { Storage } from "../../../application/port/storage";

// localStorage のモック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("LocalStorageService", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("データを保存して取得できる", async () => {
    const testData = { name: "Test", value: 123 };

    const program = Effect.gen(function* () {
      const storage = yield* Storage;
      yield* storage.set("test-key", testData);
      return yield* storage.get<typeof testData>("test-key");
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LocalStorageService)),
    );

    expect(result).toEqual(testData);
  });

  it("データを削除できる", async () => {
    const program = Effect.gen(function* () {
      const storage = yield* Storage;
      yield* storage.set("test-key", "test-value");
      yield* storage.remove("test-key");
      return yield* storage.get("test-key");
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LocalStorageService)),
    );

    expect(result).toBeNull();
  });
});
```

## Presentation Layer のテスト

Presentation Layer では、React Testing Library を使ってコンポーネントをテストします。

### Hooks のテスト

```typescript
// test/presentation/features/consultation/hooks/use-consultation.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useConsultation } from "../../../../../presentation/features/consultation/hooks/use-consultation";
import * as consultationAdapter from "../../../../../presentation/features/consultation/adapters/consultation-adapter";

vi.mock(
  "../../../../../presentation/features/consultation/adapters/consultation-adapter",
);

describe("useConsultation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("診察データを取得する", async () => {
    const mockData = {
      id: "consultation-1",
      patientName: "山田太郎",
      startTime: new Date("2024-01-01T10:00:00"),
      duration: 60,
      status: "scheduled" as const,
    };

    vi.spyOn(
      consultationAdapter.consultationAdapter,
      "fetch",
    ).mockResolvedValue(mockData);

    const { result } = renderHook(() => useConsultation("consultation-1"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("エラーが発生した場合、errorにセットする", async () => {
    const error = new Error("Network error");

    vi.spyOn(
      consultationAdapter.consultationAdapter,
      "fetch",
    ).mockRejectedValue(error);

    const { result } = renderHook(() => useConsultation("consultation-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(error);
  });
});
```

### Component のテスト

```typescript
// test/presentation/features/consultation/ui/consultation-detail.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConsultationDetail } from "../../../../../presentation/features/consultation/ui/consultation-detail";
import * as useConsultationHook from "../../../../../presentation/features/consultation/hooks/use-consultation";

vi.mock("../../../../../presentation/features/consultation/hooks/use-consultation");

describe("ConsultationDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("診察データを表示する", () => {
    const mockData = {
      id: "consultation-1",
      patientName: "山田太郎",
      startTime: new Date("2024-01-01T10:00:00"),
      duration: 60,
      status: "scheduled" as const,
    };

    vi.spyOn(useConsultationHook, "useConsultation").mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ConsultationDetail id="consultation-1" />);

    expect(screen.getByText(/山田太郎/)).toBeInTheDocument();
    expect(screen.getByText(/60 分/)).toBeInTheDocument();
  });

  it("ローディング中は「読み込み中...」を表示する", () => {
    vi.spyOn(useConsultationHook, "useConsultation").mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<ConsultationDetail id="consultation-1" />);

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("エラーが発生した場合、エラーメッセージを表示する", () => {
    const error = new Error("Network error");

    vi.spyOn(useConsultationHook, "useConsultation").mockReturnValue({
      data: null,
      loading: false,
      error,
      refetch: vi.fn(),
    });

    render(<ConsultationDetail id="consultation-1" />);

    expect(screen.getByText(/エラー: Network error/)).toBeInTheDocument();
  });
});
```

## Test Layer の作成

Test Layer は、テスト用のモック実装を提供します。

### 基本的なパターン

```typescript
// infrastructure/layer/test-layer.ts
import { Effect, Layer } from "effect";
import { ApiClient } from "../../application/port/api-client";
import { Storage } from "../../application/port/storage";

// In-memory データストア
const mockData = {
  consultations: new Map<string, Consultation>(),
  patients: new Map<string, Patient>(),
};

// Mock ApiClient
export const MockApiClient = Layer.succeed(
  ApiClient,
  ApiClient.of({
    get: (path) =>
      Effect.sync(() => {
        const [resource, id] = path.split("/").slice(1);

        if (resource === "consultations") {
          const consultation = mockData.consultations.get(id);
          if (!consultation) {
            throw new Error("Consultation not found");
          }
          return consultation;
        }

        throw new Error("Unknown resource");
      }),

    post: (path, body) =>
      Effect.sync(() => {
        const resource = path.split("/")[1];

        if (resource === "consultations") {
          const id = `consultation-${Date.now()}`;
          const consultation = { ...body, id };
          mockData.consultations.set(id, consultation);
          return consultation;
        }

        throw new Error("Unknown resource");
      }),

    // put, delete も同様に実装
  }),
);

// テストデータのセットアップ用ユーティリティ
export const setupTestData = (data: {
  consultations?: Consultation[];
  patients?: Patient[];
}) => {
  if (data.consultations) {
    data.consultations.forEach((c) => mockData.consultations.set(c.id, c));
  }

  if (data.patients) {
    data.patients.forEach((p) => mockData.patients.set(p.id, p));
  }
};

// テストデータのクリア
export const clearTestData = () => {
  mockData.consultations.clear();
  mockData.patients.clear();
};
```

### テストでの使用

```typescript
// test/application/usecase/consultation/list-consultations.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { Effect } from "effect";
import { listConsultations } from "../../../../application/usecase/consultation/list-consultations";
import {
  TestLayer,
  setupTestData,
  clearTestData,
} from "../../../../infrastructure/layer/test-layer";

describe("listConsultations", () => {
  beforeEach(() => {
    clearTestData();
  });

  it("診察一覧を取得する", async () => {
    setupTestData({
      consultations: [
        {
          id: "consultation-1",
          patientName: "山田太郎",
          startTime: new Date("2024-01-01T10:00:00"),
          duration: 60,
          status: "scheduled",
        },
        {
          id: "consultation-2",
          patientName: "佐藤花子",
          startTime: new Date("2024-01-01T11:00:00"),
          duration: 30,
          status: "in-progress",
        },
      ],
    });

    const program = listConsultations();

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(TestLayer)),
    );

    expect(result).toHaveLength(2);
    expect(result[0].patientName).toBe("山田太郎");
    expect(result[1].patientName).toBe("佐藤花子");
  });
});
```

## テストのベストプラクティス

### 1. AAA パターン（Arrange-Act-Assert）

```typescript
it("診察を作成する", async () => {
  // Arrange: テストデータの準備
  const input = {
    patientName: "山田太郎",
    startTime: new Date("2024-01-01T10:00:00"),
    duration: 60,
  };

  // Act: 処理の実行
  const result = await createConsultation(input);

  // Assert: 結果の検証
  expect(result.patientName).toBe("山田太郎");
  expect(result.duration).toBe(60);
});
```

### 2. テストケースは具体的に

```typescript
✅ Good
it("無効な診察時間（181分）の場合、InvalidConsultationDurationErrorを返す", () => {
  // ...
});

❌ Bad
it("エラーケース", () => {
  // ...
});
```

### 3. テストは独立させる

```typescript
✅ Good
describe("getConsultation", () => {
  beforeEach(() => {
    clearTestData();
  });

  it("診察を取得する", () => {
    setupTestData({ consultations: [/* ... */] });
    // テスト
  });
});

❌ Bad
describe("getConsultation", () => {
  setupTestData({ consultations: [/* ... */] }); // 一度だけセットアップ

  it("診察を取得する", () => { /* ... */ });
  it("別のテスト", () => { /* ... */ }); // 前のテストに依存
});
```

### 4. モックは最小限に

```typescript
✅ Good
// Test Layer を使って依存性全体をモック
const result = await Effect.runPromise(
  program.pipe(Effect.provide(TestLayer))
);

❌ Bad
// 個別にモックを作成
vi.mock("../../../infrastructure/http/api-client");
vi.mock("../../../infrastructure/storage/local-storage");
// ...
```

## まとめ

Theta のテスト戦略のポイント：

1. **レイヤーごとに適切なテスト手法**: Domain は Unit Test、Application/Infrastructure は Integration Test、Presentation は Component Test
2. **Test Layer の活用**: Effect のテストは Test Layer で依存性をモック
3. **独立したテスト**: 各テストは独立して実行可能
4. **AAA パターン**: Arrange, Act, Assert で明確に構造化
5. **具体的なテストケース名**: 何をテストしているか明確に

テストは、リファクタリングや機能追加の安全網です。適切なテストを書いて、安心してコードを変更できる環境を作りましょう。
