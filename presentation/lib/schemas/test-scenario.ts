import { z } from "zod";
import { uuidSchema } from "~/lib/schemas/common";

/**
 * テストシナリオ項目スキーマ
 *
 * シナリオ内の個別テストケースリビジョン参照を検証します。
 *
 * @example
 * ```tsx
 * import { useForm } from "react-hook-form";
 * import { zodResolver } from "@hookform/resolvers/zod";
 *
 * const form = useForm({
 *   resolver: zodResolver(testScenarioItemSchema),
 *   defaultValues: {
 *     caseRevisionId: "",
 *     order: 1,
 *     optionalFlag: false,
 *   },
 * });
 * ```
 */
export const testScenarioItemSchema = z.object({
  /**
   * テストケースリビジョンID
   */
  caseRevisionId: uuidSchema,

  /**
   * 実行順序（1以上の正の整数）
   */
  order: z
    .number()
    .int({ message: "実行順序は整数である必要があります" })
    .positive({ message: "実行順序は1以上である必要があります" }),

  /**
   * 任意フラグ（必須/任意を示す）
   */
  optionalFlag: z.boolean(),

  /**
   * 備考（オプション、最大500文字）
   */
  note: z
    .string()
    .max(500, { message: "備考は500文字以内で入力してください" })
    .optional(),
});

/**
 * テストシナリオ作成スキーマ
 *
 * 新規テストシナリオ作成時のバリデーションに使用します。
 * クライアント（React Hook Form）とサーバー（React Router action）の両方で使用可能です。
 *
 * @example
 * ```tsx
 * // Client-side validation
 * const form = useForm({
 *   resolver: zodResolver(createTestScenarioSchema),
 * });
 *
 * // Server-side validation
 * export async function action({ request }: ActionFunctionArgs) {
 *   const formData = await request.formData();
 *   const validation = createTestScenarioSchema.safeParse(JSON.parse(formData.get("data")));
 *   if (!validation.success) {
 *     return data({ errors: validation.error.flatten() }, { status: 400 });
 *   }
 * }
 * ```
 */
export const createTestScenarioSchema = z.object({
  /**
   * プロジェクトID
   */
  projectId: uuidSchema,

  /**
   * 作成者ユーザーID
   */
  createdBy: uuidSchema,

  /**
   * シナリオタイトル（1〜200文字）
   */
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" }),

  /**
   * 説明（オプション、最大2000文字）
   */
  description: z
    .string()
    .max(2000, { message: "説明は2000文字以内で入力してください" })
    .optional(),

  /**
   * テストケース項目リスト（最低1つ必須）
   */
  items: z
    .array(testScenarioItemSchema)
    .min(1, { message: "テストケースを1つ以上追加してください" }),

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
 * シナリオリスト項目インクルードルールスキーマ
 *
 * シナリオ実行時のフィルタリングルールを定義します。
 */
export const includeRuleSchema = z.object({
  /**
   * インクルードタイプ
   * - FULL: 全ケース実行
   * - REQUIRED_ONLY: 必須ケースのみ実行
   */
  type: z.enum(["FULL", "REQUIRED_ONLY"], {
    errorMap: () => ({
      message: "有効なインクルードタイプを選択してください",
    }),
  }),
});

/**
 * テストシナリオリスト項目スキーマ
 *
 * シナリオリスト内の個別シナリオリビジョン参照を検証します。
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: zodResolver(testScenarioListItemSchema),
 *   defaultValues: {
 *     scenarioRevisionId: "",
 *     order: 1,
 *     includeRule: { type: "FULL" },
 *   },
 * });
 * ```
 */
export const testScenarioListItemSchema = z.object({
  /**
   * テストシナリオリビジョンID
   */
  scenarioRevisionId: uuidSchema,

  /**
   * 実行順序（1以上の正の整数）
   */
  order: z
    .number()
    .int({ message: "実行順序は整数である必要があります" })
    .positive({ message: "実行順序は1以上である必要があります" }),

  /**
   * インクルードルール（オプション）
   */
  includeRule: includeRuleSchema.optional(),

  /**
   * 備考（オプション、最大500文字）
   */
  note: z
    .string()
    .max(500, { message: "備考は500文字以内で入力してください" })
    .optional(),
});

/**
 * テストシナリオリスト作成スキーマ
 *
 * 新規シナリオリスト作成時のバリデーションに使用します。
 * クライアント（React Hook Form）とサーバー（React Router action）の両方で使用可能です。
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: zodResolver(createTestScenarioListSchema),
 * });
 * ```
 */
export const createTestScenarioListSchema = z.object({
  /**
   * プロジェクトID
   */
  projectId: uuidSchema,

  /**
   * 作成者ユーザーID
   */
  createdBy: uuidSchema,

  /**
   * リストタイトル（1〜200文字）
   */
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" }),

  /**
   * 説明（オプション、最大2000文字）
   */
  description: z
    .string()
    .max(2000, { message: "説明は2000文字以内で入力してください" })
    .optional(),

  /**
   * シナリオ項目リスト（最低1つ必須）
   */
  items: z
    .array(testScenarioListItemSchema)
    .min(1, { message: "テストシナリオを1つ以上追加してください" }),

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
 * 型推論ヘルパー
 */
export type TestScenarioItem = z.infer<typeof testScenarioItemSchema>;
export type CreateTestScenarioInput = z.infer<typeof createTestScenarioSchema>;
export type IncludeRule = z.infer<typeof includeRuleSchema>;
export type TestScenarioListItem = z.infer<typeof testScenarioListItemSchema>;
export type CreateTestScenarioListInput = z.infer<
  typeof createTestScenarioListSchema
>;
