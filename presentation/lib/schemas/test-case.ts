import { z } from "zod";

/**
 * テストケース優先度スキーマ
 */
export const testCasePrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

/**
 * テストケース内容スキーマ
 */
export const testCaseContentSchema = z.object({
  /**
   * テスト手順（必須、最低1つ）
   */
  steps: z
    .array(z.string().min(1, { message: "ステップを入力してください" }))
    .min(1, { message: "テスト手順を1つ以上入力してください" }),

  /**
   * 期待結果（必須）
   */
  expected_result: z
    .string()
    .min(1, { message: "期待結果を入力してください" }),

  /**
   * 前提条件（オプション）
   */
  preconditions: z.string().optional(),

  /**
   * テストデータ（オプション）
   */
  test_data: z.string().optional(),

  /**
   * タグ（オプション）
   */
  tags: z.array(z.string()).optional(),

  /**
   * 優先度（オプション）
   */
  priority: testCasePrioritySchema.optional(),

  /**
   * テスト環境（オプション）
   */
  environment: z.string().optional(),

  /**
   * 添付ファイルURL（オプション）
   */
  attachments: z.array(z.string().url()).optional(),

  /**
   * 備考（オプション）
   */
  notes: z.string().optional(),
});

/**
 * テストケース作成フォームスキーマ
 */
export const createTestCaseSchema = z.object({
  /**
   * プロジェクトID
   */
  projectId: z.string().uuid({ message: "有効なプロジェクトIDを指定してください" }),

  /**
   * タイトル
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
   * 作成者ユーザーID
   */
  createdBy: z.string().uuid({ message: "有効なユーザーIDを指定してください" }),
});

/**
 * テストケースリビジョン作成フォームスキーマ
 */
export const createTestCaseRevisionSchema = z.object({
  /**
   * テストケースID
   */
  caseId: z.string().uuid({ message: "有効なテストケースIDを指定してください" }),

  /**
   * タイトル
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
   * 作成者ユーザーID
   */
  createdBy: z.string().uuid({ message: "有効なユーザーIDを指定してください" }),
});

/**
 * テストケース更新フォームスキーマ
 */
export const updateTestCaseRevisionSchema = z.object({
  /**
   * リビジョンID
   */
  revisionId: z.string().uuid({ message: "有効なリビジョンIDを指定してください" }),

  /**
   * タイトル（オプション）
   */
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" })
    .optional(),

  /**
   * テストケースの内容（オプション）
   */
  content: testCaseContentSchema.optional(),
});

/**
 * レビュー提出スキーマ
 */
export const submitForReviewSchema = z.object({
  /**
   * リビジョンID
   */
  revisionId: z.string().uuid({ message: "有効なリビジョンIDを指定してください" }),
});

/**
 * テストケース検索スキーマ
 */
export const searchTestCasesSchema = z.object({
  /**
   * プロジェクトID
   */
  projectId: z.string().uuid({ message: "有効なプロジェクトIDを指定してください" }),

  /**
   * ステータスフィルター（オプション）
   */
  status: z
    .enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "ARCHIVED"])
    .optional(),

  /**
   * 検索キーワード（オプション）
   */
  query: z.string().max(200).optional(),

  /**
   * タグフィルター（オプション）
   */
  tags: z.array(z.string()).optional(),

  /**
   * 優先度フィルター（オプション）
   */
  priority: testCasePrioritySchema.optional(),
});

/**
 * 型推論ヘルパー
 */
export type TestCaseContentInput = z.infer<typeof testCaseContentSchema>;
export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type CreateTestCaseRevisionInput = z.infer<
  typeof createTestCaseRevisionSchema
>;
export type UpdateTestCaseRevisionInput = z.infer<
  typeof updateTestCaseRevisionSchema
>;
export type SubmitForReviewInput = z.infer<typeof submitForReviewSchema>;
export type SearchTestCasesInput = z.infer<typeof searchTestCasesSchema>;
