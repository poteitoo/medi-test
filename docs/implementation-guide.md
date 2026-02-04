# 実装ガイド

このドキュメントでは、medi-test プロジェクトでの実装の具体例とステップバイステップガイドを提供します。

## 目次

- [新機能追加の流れ](#新機能追加の流れ)
- [Domain Layer の実装](#domain-layer-の実装)
- [Application Layer の実装](#application-layer-の実装)
- [Infrastructure Layer の実装](#infrastructure-layer-の実装)
- [Presentation Layer の実装](#presentation-layer-の実装)
- [エンドツーエンドの例](#エンドツーエンドの例)

## 新機能追加の流れ

新しい機能を追加する際の推奨フローです。

### ステップ1: ドメインモデルの定義

まず、ビジネスロジックを表現するドメインモデルを定義します。

```typescript
// domain/models/test-run.ts
import { Data } from "effect";

export class TestRun extends Data.Class<{
  readonly id: string;
  readonly title: string;
  readonly releaseId: string;
  readonly status: TestRunStatus;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
}> {}

export type TestRunStatus = "pending" | "in_progress" | "completed" | "blocked";
```

### ステップ2: ドメインロジックの実装

純粋な関数でビジネスルールを実装します。

```typescript
// domain/logic/scenario-validator.ts
export const validateScenarioCategory = (category: string): boolean => {
  const validCategories = [
    "authentication",
    "payment",
    "ui",
    "api",
    "integration",
    "performance",
  ];
  return validCategories.includes(category);
};

export const validateScenarioId = (id: string): boolean => {
  return /^[a-z0-9-]+$/.test(id);
};
```

### ステップ3: Port（インターフェース）の定義

必要な外部依存を抽象化します。

```typescript
// application/ports/git-repository.ts
import { Context, Effect } from "effect";
import { GitError } from "~/domain/errors/git-errors";

export interface GitRepository {
  getScenario: (scenarioId: string) => Effect.Effect<Scenario, GitError>;
  commitFiles: (
    files: Array<{ path: string; content: string }>,
  ) => Effect.Effect<void, GitError>;
  getCurrentCommit: () => Effect.Effect<string, GitError>;
}

export const GitRepository = Context.GenericTag<GitRepository>(
  "@services/GitRepository",
);
```

### ステップ4: ユースケースの実装

Effect を使ってユースケースを組み立てます。

```typescript
// application/usecases/scenario/create-scenario.ts
import { Effect } from "effect";
import { GitRepository } from "~/application/ports/git-repository";
import {
  validateScenarioCategory,
  validateScenarioId,
} from "~/domain/logic/scenario-validator";
import {
  InvalidScenarioCategoryError,
  InvalidScenarioIdError,
} from "~/domain/errors/scenario-errors";

export const createScenario = (input: CreateScenarioInput) =>
  Effect.gen(function* () {
    // バリデーション
    if (!validateScenarioId(input.id)) {
      return yield* Effect.fail(new InvalidScenarioIdError({ id: input.id }));
    }

    if (!validateScenarioCategory(input.category)) {
      return yield* Effect.fail(
        new InvalidScenarioCategoryError({ category: input.category }),
      );
    }

    // Git リポジトリに保存
    const gitRepo = yield* GitRepository;
    const yamlContent = yield* generateScenarioYAML(input);
    const markdownContent = yield* generateScenarioMarkdown(input);

    yield* gitRepo.commitFiles([
      { path: `scenarios/${input.id}.yml`, content: yamlContent },
      { path: `scenarios/${input.id}.md`, content: markdownContent },
    ]);

    const version = yield* gitRepo.getCurrentCommit();

    return { id: input.id, version };
  });
```

### ステップ5: Infrastructure の実装

Port の具体的な実装を提供します。

```typescript
// infrastructure/adapters/git-adapter.ts
import { Effect, Layer } from "effect";
import { simpleGit } from "simple-git";
import { GitRepository } from "~/application/ports/git-repository";
import { GitError } from "~/domain/errors/git-errors";

export const GitRepositoryLive = Layer.effect(
  GitRepository,
  Effect.gen(function* () {
    const git = simpleGit(process.env.SCENARIOS_REPO_PATH);

    return GitRepository.of({
      getScenario: (scenarioId) =>
        Effect.tryPromise({
          try: async () => {
            const yamlContent = await git.show([
              `HEAD:scenarios/${scenarioId}.yml`,
            ]);
            const markdownContent = await git.show([
              `HEAD:scenarios/${scenarioId}.md`,
            ]);
            return { yaml: yamlContent, markdown: markdownContent };
          },
          catch: (error) =>
            new GitError({ message: "Failed to get scenario", cause: error }),
        }),

      commitFiles: (files) =>
        Effect.tryPromise({
          try: async () => {
            for (const file of files) {
              await fs.writeFile(file.path, file.content);
              await git.add(file.path);
            }
            await git.commit(`Add/update scenarios`);
            await git.push();
          },
          catch: (error) =>
            new GitError({ message: "Failed to commit files", cause: error }),
        }),

      getCurrentCommit: () =>
        Effect.tryPromise({
          try: async () => {
            const result = await git.revparse(["HEAD"]);
            return result.trim();
          },
          catch: (error) =>
            new GitError({
              message: "Failed to get current commit",
              cause: error,
            }),
        }),
    });
  }),
);
```

### ステップ6: Presentation の実装

adapter, hooks, コンポーネントを実装します。

```typescript
// presentation/features/scenario/adapters/scenario-adapter.ts
import { Effect } from "effect";
import { createScenario } from "~/application/usecases/scenario/create-scenario";
import { AppLayer } from "~/infrastructure/layers/app-layer";

export const scenarioAdapter = {
  create: (input: CreateScenarioInput) =>
    Effect.runPromise(
      createScenario(input).pipe(Effect.provide(AppLayer))
    ),
};

// presentation/features/scenario/hooks/use-create-scenario.ts
import { useState } from "react";
import { scenarioAdapter } from "../adapters/scenario-adapter";

export const useCreateScenario = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: CreateScenarioInput) => {
    setLoading(true);
    setError(null);
    try {
      return await scenarioAdapter.create(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
};

// presentation/features/scenario/ui/scenario-form.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createScenarioSchema } from "~/lib/schemas/scenario";

export const ScenarioForm = () => {
  const { create, loading } = useCreateScenario();
  const form = useForm({
    resolver: zodResolver(createScenarioSchema)
  });

  const onSubmit = async (data: FormData) => {
    await create({
      id: data.id,
      title: data.title,
      category: data.category,
      tags: data.tags,
      importance: data.importance
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
};
```

## Domain Layer の実装

### エンティティの定義（Effect Data.Class）

```typescript
// domain/models/scenario.ts
import { Data } from "effect";

export class Scenario extends Data.Class<{
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly importance: Importance;
  readonly version: string; // Git commit SHA
}> {}

export type Importance = "low" | "medium" | "high" | "critical";

export interface TestRunItem {
  readonly id: string;
  readonly name: string;
  readonly dateOfBirth: Date;
  readonly phoneNumber: string;
  readonly email: string | null;
}

// 値オブジェクトの例
export interface PatientName {
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
}

export const createPatientName = (
  firstName: string,
  lastName: string,
): PatientName => ({
  firstName,
  lastName,
  fullName: `${lastName} ${firstName}`,
});
```

### ドメインロジックの実装

```typescript
// domain/logic/patient-age-calculator.ts
export const calculateAge = (
  dateOfBirth: Date,
  referenceDate: Date = new Date(),
): number => {
  const age = referenceDate.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = referenceDate.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && referenceDate.getDate() < dateOfBirth.getDate())
  ) {
    return age - 1;
  }

  return age;
};

export const isMinor = (dateOfBirth: Date): boolean => {
  return calculateAge(dateOfBirth) < 18;
};
```

### ドメインエラーの定義

```typescript
// domain/error/patient-error.ts
import { Data } from "effect";

export class PatientNotFoundError extends Data.TaggedError(
  "PatientNotFoundError",
)<{
  id: string;
}> {}

export class InvalidPatientAgeError extends Data.TaggedError(
  "InvalidPatientAgeError",
)<{
  age: number;
  minAge: number;
}> {}
```

## Application Layer の実装

### Port（Tag）の定義

```typescript
// application/port/storage.ts
import { Context, Effect } from "effect";
import type { StorageError } from "../../shared/error/storage-error";

export interface Storage {
  get: <T>(key: string) => Effect.Effect<T | null, StorageError>;
  set: <T>(key: string, value: T) => Effect.Effect<void, StorageError>;
  remove: (key: string) => Effect.Effect<void, StorageError>;
}

export const Storage = Context.GenericTag<Storage>("@services/Storage");
```

### ユースケースの実装

```typescript
// application/usecase/patient/register-patient.ts
import { Effect } from "effect";
import { ApiClient } from "../../port/api-client";
import { Storage } from "../../port/storage";
import { isMinor } from "../../../domain/logic/patient-age-calculator";
import { InvalidPatientAgeError } from "../../../domain/error/patient-error";
import type { Patient } from "../../../domain/model/patient";

export interface RegisterPatientInput {
  name: string;
  dateOfBirth: Date;
  phoneNumber: string;
  email: string | null;
}

export const registerPatient = (input: RegisterPatientInput) =>
  Effect.gen(function* () {
    // ドメインバリデーション
    if (isMinor(input.dateOfBirth)) {
      return yield* Effect.fail(
        new InvalidPatientAgeError({
          age: calculateAge(input.dateOfBirth),
          minAge: 18,
        }),
      );
    }

    // 依存性の取得
    const client = yield* ApiClient;
    const storage = yield* Storage;

    // API 呼び出し
    const patient = yield* client.post<Patient, RegisterPatientInput>(
      "/patients",
      input,
    );

    // ストレージに保存
    yield* storage.set(`patient:${patient.id}`, patient);

    return patient;
  });
```

### 複数ユースケースの組み合わせ

```typescript
// application/usecase/composite/schedule-consultation-with-patient.ts
import { Effect } from "effect";
import { registerPatient } from "../patient/register-patient";
import { createConsultation } from "../consultation/create-consultation";
import type { RegisterPatientInput } from "../patient/register-patient";
import type { CreateConsultationInput } from "../consultation/create-consultation";

export interface ScheduleConsultationWithPatientInput {
  patient: RegisterPatientInput;
  consultation: Omit<CreateConsultationInput, "patientId">;
}

export const scheduleConsultationWithPatient = (
  input: ScheduleConsultationWithPatientInput,
) =>
  Effect.gen(function* () {
    // 1. 患者を登録
    const patient = yield* registerPatient(input.patient);

    // 2. 診察をスケジュール
    const consultation = yield* createConsultation({
      ...input.consultation,
      patientId: patient.id,
      patientName: patient.name,
    });

    return { patient, consultation };
  });
```

## Infrastructure Layer の実装

### API クライアントの実装

```typescript
// infrastructure/http/fetch-api-client.ts
import { Effect, Layer } from "effect";
import { ApiClient } from "../../application/port/api-client";
import { NetworkError } from "../../shared/error/network-error";
import { ENV } from "../../shared/config/env";

const fetchWithAuth = async (path: string, options?: RequestInit) => {
  const token = localStorage.getItem("auth_token");

  const response = await fetch(`${ENV.API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const FetchApiClient = Layer.succeed(
  ApiClient,
  ApiClient.of({
    get: (path) =>
      Effect.tryPromise({
        try: () => fetchWithAuth(path),
        catch: (error) => new NetworkError({ cause: error }),
      }),

    post: (path, body) =>
      Effect.tryPromise({
        try: () =>
          fetchWithAuth(path, {
            method: "POST",
            body: JSON.stringify(body),
          }),
        catch: (error) => new NetworkError({ cause: error }),
      }),

    put: (path, body) =>
      Effect.tryPromise({
        try: () =>
          fetchWithAuth(path, {
            method: "PUT",
            body: JSON.stringify(body),
          }),
        catch: (error) => new NetworkError({ cause: error }),
      }),

    delete: (path) =>
      Effect.tryPromise({
        try: () =>
          fetchWithAuth(path, {
            method: "DELETE",
          }),
        catch: (error) => new NetworkError({ cause: error }),
      }),
  }),
);
```

### ストレージの実装

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

### Layer の合成

```typescript
// infrastructure/layer/browser-layer.ts
import { Layer } from "effect";
import { FetchApiClient } from "../http/fetch-api-client";
import { LocalStorageService } from "../storage/local-storage";
import { BrowserClockService } from "../device/clock";
import { BrowserNotificationService } from "../device/notification";

export const BrowserLayer = Layer.mergeAll(
  FetchApiClient,
  LocalStorageService,
  BrowserClockService,
  BrowserNotificationService,
);
```

## Presentation Layer の実装

### Adapter の実装

```typescript
// presentation/features/patient/adapters/patient-adapter.ts
import { Effect } from "effect";
import { registerPatient } from "../../../../application/usecase/patient/register-patient";
import { searchPatients } from "../../../../application/usecase/patient/search-patients";
import { BrowserLayer } from "../../../../infrastructure/layer/browser-layer";
import type { RegisterPatientInput } from "../../../../application/usecase/patient/register-patient";

export const patientAdapter = {
  register: (input: RegisterPatientInput) =>
    Effect.runPromise(
      registerPatient(input).pipe(
        Effect.catchTags({
          InvalidPatientAgeError: (error) =>
            Effect.succeed({
              success: false,
              error: `患者は${error.minAge}歳以上である必要があります（現在: ${error.age}歳）`,
            }),
          NetworkError: () =>
            Effect.succeed({
              success: false,
              error: "ネットワークエラーが発生しました",
            }),
        }),
        Effect.provide(BrowserLayer),
      ),
    ),

  search: (query: string) =>
    Effect.runPromise(searchPatients(query).pipe(Effect.provide(BrowserLayer))),
};
```

### Hooks の実装

```typescript
// presentation/features/patient/hooks/use-register-patient.ts
import { useState } from "react";
import { patientAdapter } from "../adapters/patient-adapter";
import type { RegisterPatientInput } from "../../../../application/usecase/patient/register-patient";
import type { Patient } from "../../../../domain/model/patient";

export const useRegisterPatient = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (input: RegisterPatientInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await patientAdapter.register(input);

      if ("error" in result) {
        setError(result.error);
        return null;
      }

      return result as Patient;
    } catch (err) {
      setError("予期しないエラーが発生しました");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
};
```

### Component の実装

```typescript
// presentation/features/patient/ui/patient-registration-form.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegisterPatient } from "../hooks/use-register-patient";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Form, FormField, FormItem, FormLabel } from "../../../components/ui/form";

const schema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  dateOfBirth: z.date({
    required_error: "生年月日を入力してください",
  }),
  phoneNumber: z.string().regex(/^\d{10,11}$/, "正しい電話番号を入力してください"),
  email: z.string().email("正しいメールアドレスを入力してください").nullable(),
});

type FormData = z.infer<typeof schema>;

export const PatientRegistrationForm = () => {
  const { register, loading, error } = useRegisterPatient();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const patient = await register(data);

    if (patient) {
      alert(`患者 ${patient.name} を登録しました`);
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名前</FormLabel>
              <Input {...field} placeholder="山田 太郎" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>生年月日</FormLabel>
              <Input type="date" {...field} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電話番号</FormLabel>
              <Input {...field} placeholder="09012345678" />
            </FormItem>
          )}
        />

        {error && <div className="text-red-500">{error}</div>}

        <Button type="submit" disabled={loading}>
          {loading ? "登録中..." : "患者を登録"}
        </Button>
      </form>
    </Form>
  );
};
```

## エンドツーエンドの例

診察予約機能の実装例を、すべてのレイヤーを通して見ていきます。

### 1. Domain Layer

```typescript
// domain/model/consultation.ts
export interface Consultation {
  readonly id: string;
  readonly patientId: string;
  readonly patientName: string;
  readonly startTime: Date;
  readonly duration: number;
  readonly status: ConsultationStatus;
}

export type ConsultationStatus = "scheduled" | "in-progress" | "completed";

// domain/logic/consultation-validator.ts
export const validateConsultationDuration = (minutes: number): boolean => {
  return minutes > 0 && minutes <= 180;
};

// domain/error/consultation-error.ts
export class InvalidConsultationDurationError extends Data.TaggedError(
  "InvalidConsultationDurationError",
)<{ duration: number }> {}
```

### 2. Application Layer

```typescript
// application/usecase/consultation/create-consultation.ts
import { Effect } from "effect";
import { ApiClient } from "../../port/api-client";
import { validateConsultationDuration } from "../../../domain/logic/consultation-validator";
import { InvalidConsultationDurationError } from "../../../domain/error/consultation-error";

export interface CreateConsultationInput {
  patientId: string;
  patientName: string;
  startTime: Date;
  duration: number;
}

export const createConsultation = (input: CreateConsultationInput) =>
  Effect.gen(function* () {
    if (!validateConsultationDuration(input.duration)) {
      return yield* Effect.fail(
        new InvalidConsultationDurationError({ duration: input.duration }),
      );
    }

    const client = yield* ApiClient;
    const consultation = yield* client.post("/consultations", {
      ...input,
      status: "scheduled",
    });

    return consultation;
  });
```

### 3. Infrastructure Layer

```typescript
// infrastructure/http/fetch-api-client.ts（前述のコードを使用）
// infrastructure/layer/browser-layer.ts（前述のコードを使用）
```

### 4. Presentation Layer

```typescript
// presentation/features/consultation/adapters/consultation-adapter.ts
import { Effect } from "effect";
import { createConsultation } from "../../../../application/usecase/consultation/create-consultation";
import { BrowserLayer } from "../../../../infrastructure/layer/browser-layer";

export const consultationAdapter = {
  create: (input: CreateConsultationInput) =>
    Effect.runPromise(
      createConsultation(input).pipe(
        Effect.catchTags({
          InvalidConsultationDurationError: (error) =>
            Effect.succeed({
              success: false,
              error: `診察時間は1〜180分の範囲で指定してください（指定: ${error.duration}分）`,
            }),
          NetworkError: () =>
            Effect.succeed({
              success: false,
              error: "ネットワークエラーが発生しました",
            }),
        }),
        Effect.provide(BrowserLayer)
      )
    ),
};

// presentation/features/consultation/hooks/use-create-consultation.ts
import { useState } from "react";
import { consultationAdapter } from "../adapters/consultation-adapter";

export const useCreateConsultation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: CreateConsultationInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await consultationAdapter.create(input);

      if ("error" in result) {
        setError(result.error);
        return null;
      }

      return result;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
};

// presentation/features/consultation/ui/consultation-form.tsx
import { useCreateConsultation } from "../hooks/use-create-consultation";

export const ConsultationForm = () => {
  const { create, loading, error } = useCreateConsultation();

  const onSubmit = async (data: FormData) => {
    const consultation = await create({
      patientId: data.patientId,
      patientName: data.patientName,
      startTime: new Date(data.startTime),
      duration: Number(data.duration),
    });

    if (consultation) {
      alert("診察を予約しました");
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {/* フォームフィールド */}
      {error && <div className="text-red-500">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? "予約中..." : "診察を予約"}
      </button>
    </form>
  );
};
```

## まとめ

実装のポイントをまとめます：

1. **ドメインファースト**: まずドメインモデルとロジックを定義
2. **Port/Adapter**: インターフェースと実装を分離
3. **Effect で組み立て**: ユースケースは Effect.gen で記述
4. **エラーハンドリング**: catchTag/catchTags で型安全にエラーを処理
5. **レイヤーの分離**: adapter と hooks の役割を明確に分担

次は [コーディング規約](coding-standards.md) で、命名規則やベストプラクティスを確認しましょう。
