import { z } from "zod";

/**
 * テスト結果ステータススキーマ
 */
export const resultStatusSchema = z.enum(["PASS", "FAIL", "BLOCKED", "SKIPPED"]);

/**
 * エビデンススキーマ
 */
export const evidenceSchema = z.object({
  /**
   * ログ（オプション）
   */
  logs: z.string().optional(),

  /**
   * スクリーンショットURL（オプション）
   */
  screenshots: z.array(z.string().url()).optional(),

  /**
   * リンク（オプション）
   */
  links: z.array(z.string().url()).optional(),
});

/**
 * バグリンクスキーマ
 */
export const bugLinkSchema = z.object({
  /**
   * バグトラッキングURL
   */
  url: z.string().url({ message: "有効なURLを入力してください" }),

  /**
   * バグタイトル
   */
  title: z.string().min(1, { message: "タイトルを入力してください" }),

  /**
   * 重要度（オプション）
   */
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
});

/**
 * テスト結果記録スキーマ
 */
export const recordTestResultSchema = z.object({
  /**
   * テストランID
   */
  runId: z.string().uuid({ message: "有効なテストランIDを指定してください" }),

  /**
   * テストランアイテムID
   */
  runItemId: z
    .string()
    .uuid({ message: "有効なテストランアイテムIDを指定してください" }),

  /**
   * 結果ステータス
   */
  status: resultStatusSchema,

  /**
   * エビデンス（オプション）
   */
  evidence: evidenceSchema.optional(),

  /**
   * バグリンク（オプション）
   */
  bugLinks: z.array(bugLinkSchema).optional(),

  /**
   * 実行者ユーザーID
   */
  executedBy: z
    .string()
    .uuid({ message: "有効なユーザーIDを指定してください" }),
});

/**
 * 型推論ヘルパー
 */
export type RecordTestResultInput = z.infer<typeof recordTestResultSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type BugLink = z.infer<typeof bugLinkSchema>;
