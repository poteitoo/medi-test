import { z } from "zod";

/**
 * 共通バリデーションスキーマ
 *
 * アプリケーション全体で再利用可能なZodスキーマ定義
 */

/**
 * UUID検証スキーマ
 */
export const uuidSchema = z
  .string()
  .uuid({ message: "有効なUUIDを入力してください" });

/**
 * メールアドレス検証スキーマ
 */
export const emailSchema = z
  .string()
  .email({ message: "有効なメールアドレスを入力してください" })
  .min(1, { message: "メールアドレスを入力してください" });

/**
 * スラッグ検証スキーマ（URL用の識別子）
 *
 * 小文字英数字とハイフンのみ許可
 */
export const slugSchema = z
  .string()
  .min(1, { message: "スラッグを入力してください" })
  .max(100, { message: "スラッグは100文字以内で入力してください" })
  .regex(/^[a-z0-9-]+$/, {
    message: "スラッグは小文字英数字とハイフンのみ使用できます",
  });

/**
 * 名前検証スキーマ（組織名、プロジェクト名など）
 */
export const nameSchema = z
  .string()
  .min(1, { message: "名前を入力してください" })
  .max(200, { message: "名前は200文字以内で入力してください" });

/**
 * 説明文検証スキーマ
 */
export const descriptionSchema = z
  .string()
  .max(1000, { message: "説明は1000文字以内で入力してください" })
  .optional();

/**
 * URL検証スキーマ
 */
export const urlSchema = z
  .string()
  .url({ message: "有効なURLを入力してください" })
  .optional()
  .or(z.literal(""));

/**
 * ページネーションパラメータスキーマ
 */
export const paginationSchema = z.object({
  /**
   * ページ番号（1から始まる）
   */
  page: z.coerce
    .number()
    .int()
    .min(1, { message: "ページ番号は1以上である必要があります" })
    .default(1),

  /**
   * 1ページあたりの件数
   */
  perPage: z.coerce
    .number()
    .int()
    .min(1, { message: "1ページあたりの件数は1以上である必要があります" })
    .max(100, {
      message: "1ページあたりの件数は100以下である必要があります",
    })
    .default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * ソートパラメータスキーマ
 */
export const sortSchema = z.object({
  /**
   * ソート対象のフィールド
   */
  sortBy: z.string().optional(),

  /**
   * ソート順序（昇順/降順）
   */
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type SortParams = z.infer<typeof sortSchema>;

/**
 * 検索パラメータスキーマ
 */
export const searchSchema = z.object({
  /**
   * 検索キーワード
   */
  q: z
    .string()
    .max(200, { message: "検索キーワードは200文字以内で入力してください" })
    .optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;

/**
 * 日付範囲フィルタスキーマ
 */
export const dateRangeSchema = z.object({
  /**
   * 開始日
   */
  startDate: z.coerce.date().optional(),

  /**
   * 終了日
   */
  endDate: z.coerce.date().optional(),
});

export type DateRangeParams = z.infer<typeof dateRangeSchema>;
