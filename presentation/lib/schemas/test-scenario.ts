import { z } from "zod";

/**
 * テストシナリオケース参照スキーマ
 */
export const testScenarioCaseRefSchema = z.object({
  /**
   * テストケースID
   */
  caseId: z
    .string()
    .uuid({ message: "有効なテストケースIDを指定してください" }),

  /**
   * リビジョン番号
   */
  revisionNumber: z
    .number()
    .int()
    .min(1, { message: "リビジョン番号は1以上である必要があります" }),

  /**
   * 実行順序
   */
  order: z
    .number()
    .int()
    .min(1, { message: "実行順序は1以上である必要があります" }),
});

/**
 * テストシナリオ作成フォームスキーマ
 */
export const createTestScenarioSchema = z.object({
  /**
   * プロジェクトID
   */
  projectId: z
    .string()
    .uuid({ message: "有効なプロジェクトIDを指定してください" }),

  /**
   * タイトル
   */
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" }),

  /**
   * 説明（オプション）
   */
  description: z
    .string()
    .max(1000, { message: "説明は1000文字以内で入力してください" })
    .optional(),

  /**
   * テストケースのリスト
   */
  testCases: z
    .array(testScenarioCaseRefSchema)
    .min(1, { message: "テストケースを1つ以上追加してください" }),

  /**
   * 作成者ユーザーID
   */
  createdBy: z.string().uuid({ message: "有効なユーザーIDを指定してください" }),
});

/**
 * テストシナリオリスト項目参照スキーマ
 */
export const testScenarioListItemRefSchema = z.object({
  /**
   * テストシナリオID
   */
  scenarioId: z
    .string()
    .uuid({ message: "有効なテストシナリオIDを指定してください" }),

  /**
   * リビジョン番号
   */
  revisionNumber: z
    .number()
    .int()
    .min(1, { message: "リビジョン番号は1以上である必要があります" }),

  /**
   * 順序
   */
  order: z
    .number()
    .int()
    .min(1, { message: "順序は1以上である必要があります" }),
});

/**
 * テストシナリオリスト作成フォームスキーマ
 */
export const createTestScenarioListSchema = z.object({
  /**
   * プロジェクトID
   */
  projectId: z
    .string()
    .uuid({ message: "有効なプロジェクトIDを指定してください" }),

  /**
   * タイトル
   */
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" }),

  /**
   * 説明（オプション）
   */
  description: z
    .string()
    .max(1000, { message: "説明は1000文字以内で入力してください" })
    .optional(),

  /**
   * テストシナリオのリスト
   */
  testScenarios: z
    .array(testScenarioListItemRefSchema)
    .min(1, { message: "テストシナリオを1つ以上追加してください" }),

  /**
   * 作成者ユーザーID
   */
  createdBy: z.string().uuid({ message: "有効なユーザーIDを指定してください" }),
});

/**
 * テストシナリオリビジョン作成スキーマ
 */
export const createTestScenarioRevisionSchema = z.object({
  /**
   * テストシナリオID
   */
  scenarioId: z
    .string()
    .uuid({ message: "有効なテストシナリオIDを指定してください" }),

  /**
   * タイトル
   */
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" }),

  /**
   * 説明（オプション）
   */
  description: z
    .string()
    .max(1000, { message: "説明は1000文字以内で入力してください" })
    .optional(),

  /**
   * テストケースのリスト
   */
  testCases: z
    .array(testScenarioCaseRefSchema)
    .min(1, { message: "テストケースを1つ以上追加してください" }),

  /**
   * 作成者ユーザーID
   */
  createdBy: z.string().uuid({ message: "有効なユーザーIDを指定してください" }),
});

/**
 * テストシナリオ更新スキーマ
 */
export const updateTestScenarioRevisionSchema = z.object({
  /**
   * リビジョンID
   */
  revisionId: z
    .string()
    .uuid({ message: "有効なリビジョンIDを指定してください" }),

  /**
   * タイトル（オプション）
   */
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" })
    .optional(),

  /**
   * 説明（オプション）
   */
  description: z
    .string()
    .max(1000, { message: "説明は1000文字以内で入力してください" })
    .optional(),

  /**
   * テストケースのリスト（オプション）
   */
  testCases: z.array(testScenarioCaseRefSchema).optional(),
});

/**
 * 型推論ヘルパー
 */
export type TestScenarioCaseRefInput = z.infer<
  typeof testScenarioCaseRefSchema
>;
export type CreateTestScenarioInput = z.infer<typeof createTestScenarioSchema>;
export type TestScenarioListItemRefInput = z.infer<
  typeof testScenarioListItemRefSchema
>;
export type CreateTestScenarioListInput = z.infer<
  typeof createTestScenarioListSchema
>;
export type CreateTestScenarioRevisionInput = z.infer<
  typeof createTestScenarioRevisionSchema
>;
export type UpdateTestScenarioRevisionInput = z.infer<
  typeof updateTestScenarioRevisionSchema
>;
