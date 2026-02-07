import { z } from "zod";

/**
 * Waiver対象タイプスキーマ
 */
export const waiverTargetTypeSchema = z.enum([
  "FAIL_RESULT",
  "UNAPPROVED_REVISION",
  "UNEXECUTED_TEST",
  "OTHER",
]);

/**
 * Waiver発行スキーマ
 */
export const issueWaiverSchema = z.object({
  /**
   * リリースID
   */
  releaseId: z
    .string()
    .uuid({ message: "有効なリリースIDを指定してください" }),

  /**
   * 適用除外対象のタイプ
   */
  targetType: waiverTargetTypeSchema,

  /**
   * 適用除外対象のID（オプション）
   */
  targetId: z
    .string()
    .uuid({ message: "有効な対象IDを指定してください" })
    .optional(),

  /**
   * 適用除外の理由（必須）
   */
  reason: z
    .string()
    .min(10, { message: "理由は10文字以上で入力してください" })
    .max(1000, { message: "理由は1000文字以内で入力してください" }),

  /**
   * 有効期限
   */
  expiresAt: z.coerce.date().refine((date) => date > new Date(), {
    message: "有効期限は未来の日付である必要があります",
  }),

  /**
   * 発行者ユーザーID
   */
  issuerId: z.string().uuid({ message: "有効なユーザーIDを指定してください" }),
});

/**
 * Waiver削除スキーマ
 */
export const deleteWaiverSchema = z.object({
  /**
   * WaiverID
   */
  waiverId: z
    .string()
    .uuid({ message: "有効なWaiverIDを指定してください" }),
});

/**
 * Waiver検索スキーマ
 */
export const searchWaiversSchema = z.object({
  /**
   * リリースID
   */
  releaseId: z
    .string()
    .uuid({ message: "有効なリリースIDを指定してください" }),

  /**
   * 対象タイプフィルター（オプション）
   */
  targetType: waiverTargetTypeSchema.optional(),

  /**
   * 有効期限切れのみ表示（オプション）
   */
  expiredOnly: z.boolean().optional(),
});

/**
 * 型推論ヘルパー
 */
export type IssueWaiverInput = z.infer<typeof issueWaiverSchema>;
export type DeleteWaiverInput = z.infer<typeof deleteWaiverSchema>;
export type SearchWaiversInput = z.infer<typeof searchWaiversSchema>;
