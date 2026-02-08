import { z } from "zod";
import { uuidSchema } from "~/lib/schemas/common";

/**
 * テストステップスキーマ
 *
 * テストケース内の個別実行ステップを検証します。
 *
 * @example
 * ```tsx
 * import { useForm } from "react-hook-form";
 * import { zodResolver } from "@hookform/resolvers/zod";
 *
 * const form = useForm({
 *   resolver: zodResolver(testStepSchema),
 *   defaultValues: {
 *     stepNumber: 1,
 *     action: "",
 *     expectedOutcome: "",
 *   },
 * });
 * ```
 */
export const testStepSchema = z.object({
  /**
   * ステップ番号（1以上の正の整数）
   */
  stepNumber: z
    .number()
    .int({ message: "ステップ番号は整数である必要があります" })
    .positive({ message: "ステップ番号は1以上である必要があります" }),

  /**
   * 実行アクション（1〜1000文字）
   */
  action: z
    .string()
    .min(1, { message: "実行アクションを入力してください" })
    .max(1000, { message: "実行アクションは1000文字以内で入力してください" }),

  /**
   * 期待される結果（1〜2000文字）
   */
  expectedOutcome: z
    .string()
    .min(1, { message: "期待される結果を入力してください" })
    .max(2000, {
      message: "期待される結果は2000文字以内で入力してください",
    }),
});

/**
 * テストケース優先度列挙型
 */
export const testCasePrioritySchema = z.enum(
  ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  {
    errorMap: () => ({ message: "有効な優先度を選択してください" }),
  },
);

/**
 * テストケース内容スキーマ
 *
 * テストケースの本体（手順、期待結果、メタデータ）を検証します。
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: zodResolver(testCaseContentSchema),
 *   defaultValues: {
 *     steps: [{ stepNumber: 1, action: "", expectedOutcome: "" }],
 *     expectedResult: "",
 *     tags: [],
 *     priority: "MEDIUM",
 *     environment: "staging",
 *   },
 * });
 * ```
 */
export const testCaseContentSchema = z.object({
  /**
   * テスト手順（最低1つ必須）
   */
  steps: z
    .array(testStepSchema)
    .min(1, { message: "テスト手順を1つ以上追加してください" }),

  /**
   * 期待結果（1〜5000文字）
   */
  expectedResult: z
    .string()
    .min(1, { message: "期待結果を入力してください" })
    .max(5000, { message: "期待結果は5000文字以内で入力してください" }),

  /**
   * タグ（最大20個）
   */
  tags: z
    .array(z.string().min(1, { message: "タグを入力してください" }))
    .max(20, { message: "タグは最大20個まで登録できます" }),

  /**
   * 優先度
   */
  priority: testCasePrioritySchema,

  /**
   * テスト環境（最大200文字）
   */
  environment: z
    .string()
    .min(1, { message: "テスト環境を入力してください" })
    .max(200, { message: "テスト環境は200文字以内で入力してください" }),

  /**
   * 前提条件（オプション）
   */
  preconditions: z.string().optional(),

  /**
   * テストデータ（オプション）
   */
  testData: z.string().optional(),

  /**
   * 添付ファイルURL（オプション）
   */
  attachments: z.array(z.string().url()).optional(),

  /**
   * 備考・メモ（オプション）
   */
  notes: z.string().optional(),
});

/**
 * テストケース作成スキーマ
 *
 * 新規テストケース作成時のバリデーションに使用します。
 * クライアント（React Hook Form）とサーバー（React Router action）の両方で使用可能です。
 *
 * @example
 * ```tsx
 * // Client-side validation
 * const form = useForm({
 *   resolver: zodResolver(createTestCaseSchema),
 * });
 *
 * // Server-side validation
 * export async function action({ request }: ActionFunctionArgs) {
 *   const formData = await request.formData();
 *   const data = Object.fromEntries(formData);
 *   const validation = createTestCaseSchema.safeParse(data);
 *   if (!validation.success) {
 *     return data({ errors: validation.error.flatten() }, { status: 400 });
 *   }
 * }
 * ```
 */
export const createTestCaseSchema = z.object({
  /**
   * プロジェクトID
   */
  projectId: uuidSchema,

  /**
   * 作成者ユーザーID
   */
  createdBy: uuidSchema,

  /**
   * テストケースタイトル（1〜200文字）
   */
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" }),

  /**
   * テストケースの内容
   */
  content: testCaseContentSchema,

  /**
   * 作成理由（オプション、1〜1000文字）
   */
  reason: z
    .string()
    .min(1, { message: "作成理由を入力してください" })
    .max(1000, { message: "作成理由は1000文字以内で入力してください" })
    .optional(),
});

/**
 * テストケースリビジョン作成スキーマ
 *
 * 既存テストケースの新リビジョン作成時のバリデーションに使用します。
 * リビジョンでは変更理由が必須です。
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: zodResolver(createTestCaseRevisionSchema),
 * });
 * ```
 */
export const createTestCaseRevisionSchema = z.object({
  /**
   * テストケースID（stable_id）
   */
  caseId: uuidSchema,

  /**
   * テストケースタイトル（1〜200文字）
   */
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" }),

  /**
   * テストケースの内容
   */
  content: testCaseContentSchema,

  /**
   * 変更理由（リビジョンでは必須、1〜1000文字）
   */
  reason: z
    .string()
    .min(1, { message: "変更理由を入力してください" })
    .max(1000, { message: "変更理由は1000文字以内で入力してください" }),

  /**
   * 作成者ユーザーID
   */
  createdBy: uuidSchema,
});

/**
 * レビュー提出スキーマ
 *
 * リビジョンを承認申請する際のバリデーションに使用します。
 *
 * @example
 * ```tsx
 * export async function action({ request }: ActionFunctionArgs) {
 *   const formData = await request.formData();
 *   const validation = submitForReviewSchema.safeParse(Object.fromEntries(formData));
 *   // ...
 * }
 * ```
 */
export const submitForReviewSchema = z.object({
  /**
   * リビジョンID
   */
  revisionId: uuidSchema,

  /**
   * 提出者ユーザーID
   */
  submittedBy: uuidSchema,
});

/**
 * リビジョンステータス更新スキーマ
 *
 * リビジョンのステータス変更時のバリデーションに使用します。
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: zodResolver(updateRevisionStatusSchema),
 * });
 * ```
 */
export const updateRevisionStatusSchema = z.object({
  /**
   * リビジョンID
   */
  revisionId: uuidSchema,

  /**
   * ステータス
   */
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "DEPRECATED"], {
    errorMap: () => ({ message: "有効なステータスを選択してください" }),
  }),

  /**
   * 更新者ユーザーID
   */
  updatedBy: uuidSchema,
});

/**
 * 型推論ヘルパー
 */
export type TestStep = z.infer<typeof testStepSchema>;
export type TestCasePriority = z.infer<typeof testCasePrioritySchema>;
export type TestCaseContent = z.infer<typeof testCaseContentSchema>;
export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type CreateTestCaseRevisionInput = z.infer<
  typeof createTestCaseRevisionSchema
>;
export type SubmitForReviewInput = z.infer<typeof submitForReviewSchema>;
export type UpdateRevisionStatusInput = z.infer<
  typeof updateRevisionStatusSchema
>;
