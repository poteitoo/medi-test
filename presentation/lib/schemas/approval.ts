import { z } from "zod";
import { uuidSchema } from "~/lib/schemas/common";

/**
 * 承認オブジェクトタイプスキーマ
 */
export const approvalObjectTypeSchema = z.enum(
  [
    "CASE_REVISION",
    "SCENARIO_REVISION",
    "LIST_REVISION",
    "MAPPING_REVISION",
    "WORKFLOW_REVISION",
    "RELEASE",
    "WAIVER",
  ],
  {
    errorMap: () => ({ message: "有効なオブジェクトタイプを選択してください" }),
  },
);

/**
 * 承認決定スキーマ
 */
export const approvalDecisionSchema = z.enum(["APPROVED", "REJECTED"], {
  errorMap: () => ({ message: "有効な承認決定を選択してください" }),
});

/**
 * 証拠リンクスキーマ
 */
export const evidenceLinkSchema = z.object({
  /**
   * リンクURL
   */
  url: z.string().url({ message: "有効なURLを入力してください" }),

  /**
   * リンクタイトル（1〜200文字）
   */
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" }),
});

/**
 * 承認作成スキーマ
 *
 * 新規承認（承認または却下）を作成する際のバリデーションに使用します。
 *
 * @example
 * ```tsx
 * // Client-side validation
 * const form = useForm({
 *   resolver: zodResolver(createApprovalSchema),
 * });
 *
 * // Server-side validation
 * export async function action({ request }: ActionFunctionArgs) {
 *   const body = await request.json();
 *   const validation = createApprovalSchema.safeParse(body);
 *   if (!validation.success) {
 *     return data({ errors: validation.error.flatten() }, { status: 400 });
 *   }
 * }
 * ```
 */
export const createApprovalSchema = z.object({
  /**
   * 承認対象のオブジェクトタイプ
   */
  objectType: approvalObjectTypeSchema,

  /**
   * 承認対象のオブジェクトID
   */
  objectId: uuidSchema,

  /**
   * 承認ステップ（デフォルト: 1）
   */
  step: z
    .number()
    .int({ message: "ステップは整数である必要があります" })
    .positive({ message: "ステップは1以上である必要があります" })
    .default(1),

  /**
   * 承認決定（承認または却下）
   */
  decision: approvalDecisionSchema,

  /**
   * 承認者ユーザーID
   */
  approverId: uuidSchema,

  /**
   * コメント（却下の場合は必須、1〜2000文字）
   */
  comment: z
    .string()
    .min(1, { message: "コメントを入力してください" })
    .max(2000, { message: "コメントは2000文字以内で入力してください" })
    .optional(),

  /**
   * 証拠リンク配列（オプション、最大10個）
   */
  evidenceLinks: z
    .array(evidenceLinkSchema)
    .max(10, { message: "証拠リンクは最大10個まで登録できます" })
    .optional(),
});

/**
 * リビジョン承認スキーマ
 *
 * テストケースリビジョンを承認する際のバリデーションに使用します。
 * createApprovalSchemaの簡易版で、リビジョンIDのみを受け取ります。
 *
 * @example
 * ```tsx
 * export async function action({ request }: ActionFunctionArgs) {
 *   const body = await request.json();
 *   const validation = approveRevisionSchema.safeParse(body);
 *   // ...
 * }
 * ```
 */
export const approveRevisionSchema = z.object({
  /**
   * リビジョンID
   */
  revisionId: uuidSchema,

  /**
   * 承認者ユーザーID
   */
  approverId: uuidSchema,

  /**
   * 承認ステップ（オプション、デフォルト: 1）
   */
  step: z
    .number()
    .int({ message: "ステップは整数である必要があります" })
    .positive({ message: "ステップは1以上である必要があります" })
    .optional(),

  /**
   * コメント（オプション、1〜2000文字）
   */
  comment: z
    .string()
    .min(1, { message: "コメントを入力してください" })
    .max(2000, { message: "コメントは2000文字以内で入力してください" })
    .optional(),

  /**
   * 証拠リンク配列（オプション、最大10個）
   */
  evidenceLinks: z
    .array(evidenceLinkSchema)
    .max(10, { message: "証拠リンクは最大10個まで登録できます" })
    .optional(),
});

/**
 * リビジョン却下スキーマ
 *
 * テストケースリビジョンを却下する際のバリデーションに使用します。
 * 却下の場合はコメントが必須です。
 *
 * @example
 * ```tsx
 * export async function action({ request }: ActionFunctionArgs) {
 *   const body = await request.json();
 *   const validation = rejectRevisionSchema.safeParse(body);
 *   // ...
 * }
 * ```
 */
export const rejectRevisionSchema = z.object({
  /**
   * リビジョンID
   */
  revisionId: uuidSchema,

  /**
   * 承認者ユーザーID
   */
  approverId: uuidSchema,

  /**
   * 承認ステップ（オプション、デフォルト: 1）
   */
  step: z
    .number()
    .int({ message: "ステップは整数である必要があります" })
    .positive({ message: "ステップは1以上である必要があります" })
    .optional(),

  /**
   * コメント（必須、1〜2000文字）
   */
  comment: z
    .string()
    .min(1, { message: "却下理由のコメントを入力してください" })
    .max(2000, { message: "コメントは2000文字以内で入力してください" }),

  /**
   * 証拠リンク配列（オプション、最大10個）
   */
  evidenceLinks: z
    .array(evidenceLinkSchema)
    .max(10, { message: "証拠リンクは最大10個まで登録できます" })
    .optional(),
});

/**
 * 承認履歴取得クエリパラメータスキーマ
 */
export const getApprovalsQuerySchema = z.object({
  /**
   * 承認対象のオブジェクトタイプ
   */
  objectType: approvalObjectTypeSchema,

  /**
   * 承認対象のオブジェクトID
   */
  objectId: uuidSchema,

  /**
   * 取得する最大件数（オプション、1〜100）
   */
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20),

  /**
   * スキップする件数（オプション、0以上）
   */
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
});

/**
 * 型推論ヘルパー
 */
export type ApprovalObjectType = z.infer<typeof approvalObjectTypeSchema>;
export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;
export type EvidenceLink = z.infer<typeof evidenceLinkSchema>;
export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;
export type ApproveRevisionInput = z.infer<typeof approveRevisionSchema>;
export type RejectRevisionInput = z.infer<typeof rejectRevisionSchema>;
export type GetApprovalsQuery = z.infer<typeof getApprovalsQuerySchema>;
