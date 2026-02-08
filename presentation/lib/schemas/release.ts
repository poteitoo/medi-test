import { z } from "zod";

/**
 * リリースステータススキーマ
 */
export const releaseStatusSchema = z.enum([
  "PLANNING",
  "EXECUTING",
  "GATE_CHECK",
  "APPROVED_FOR_RELEASE",
  "RELEASED",
]);

/**
 * リリース作成スキーマ
 */
export const createReleaseSchema = z.object({
  /**
   * プロジェクトID
   */
  projectId: z
    .string()
    .uuid({ message: "有効なプロジェクトIDを指定してください" }),

  /**
   * リリース名
   */
  name: z
    .string()
    .min(1, { message: "リリース名を入力してください" })
    .max(100, { message: "リリース名は100文字以内で入力してください" }),

  /**
   * リリース説明（オプション）
   */
  description: z
    .string()
    .max(500, { message: "説明は500文字以内で入力してください" })
    .optional(),

  /**
   * ビルド参照（オプション）
   */
  buildRef: z
    .string()
    .max(100, { message: "ビルド参照は100文字以内で入力してください" })
    .optional(),
});

/**
 * リリースベースライン設定スキーマ
 */
export const setBaselineSchema = z.object({
  /**
   * リリースID
   */
  releaseId: z.string().uuid({ message: "有効なリリースIDを指定してください" }),

  /**
   * ソーステストシナリオリストリビジョンID
   */
  sourceListRevisionId: z
    .string()
    .uuid({ message: "有効なリストリビジョンIDを指定してください" }),

  /**
   * 作成者ユーザーID
   */
  createdBy: z.string().uuid({ message: "有効なユーザーIDを指定してください" }),
});

/**
 * ゲート評価スキーマ
 */
export const evaluateGateSchema = z.object({
  /**
   * リリースID
   */
  releaseId: z.string().uuid({ message: "有効なリリースIDを指定してください" }),
});

/**
 * リリース承認スキーマ
 */
export const approveReleaseSchema = z.object({
  /**
   * リリースID
   */
  releaseId: z.string().uuid({ message: "有効なリリースIDを指定してください" }),

  /**
   * 承認者ユーザーID
   */
  approverId: z
    .string()
    .uuid({ message: "有効なユーザーIDを指定してください" }),

  /**
   * コメント（オプション）
   */
  comment: z
    .string()
    .max(500, { message: "コメントは500文字以内で入力してください" })
    .optional(),
});

/**
 * リリースステータス更新スキーマ
 */
export const updateReleaseStatusSchema = z.object({
  /**
   * リリースID
   */
  releaseId: z.string().uuid({ message: "有効なリリースIDを指定してください" }),

  /**
   * 新しいステータス
   */
  status: releaseStatusSchema,
});

/**
 * リリース検索スキーマ
 */
export const searchReleasesSchema = z.object({
  /**
   * プロジェクトID
   */
  projectId: z
    .string()
    .uuid({ message: "有効なプロジェクトIDを指定してください" }),

  /**
   * ステータスフィルター（オプション）
   */
  status: releaseStatusSchema.optional(),

  /**
   * 検索キーワード（オプション）
   */
  query: z.string().max(200).optional(),
});

/**
 * 型推論ヘルパー
 */
export type CreateReleaseInput = z.infer<typeof createReleaseSchema>;
export type SetBaselineInput = z.infer<typeof setBaselineSchema>;
export type EvaluateGateInput = z.infer<typeof evaluateGateSchema>;
export type ApproveReleaseInput = z.infer<typeof approveReleaseSchema>;
export type UpdateReleaseStatusInput = z.infer<
  typeof updateReleaseStatusSchema
>;
export type SearchReleasesInput = z.infer<typeof searchReleasesSchema>;
