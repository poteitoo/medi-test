import { z } from "zod";

/**
 * RunStatus スキーマ（実際のドメインモデルに合わせる）
 */
export const runStatusSchema = z.enum(["ASSIGNED", "IN_PROGRESS", "COMPLETED"]);

/**
 * RunGroupStatus スキーマ
 */
export const runGroupStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
]);

/**
 * テストラン作成スキーマ
 */
export const createTestRunSchema = z.object({
  runGroupId: z.string().uuid({
    message: "有効なラングループIDを指定してください",
  }),
  assigneeUserId: z.string().uuid({
    message: "有効な担当者ユーザーIDを指定してください",
  }),
  sourceListRevisionId: z.string().uuid({
    message: "有効なテストシナリオリストリビジョンIDを指定してください",
  }),
  buildRef: z.string().min(1, "ビルド参照を入力してください").optional(),
});

export type CreateTestRunInput = z.infer<typeof createTestRunSchema>;

/**
 * テストラン更新スキーマ
 */
export const updateTestRunStatusSchema = z.object({
  status: runStatusSchema,
});

export type UpdateTestRunStatusInput = z.infer<
  typeof updateTestRunStatusSchema
>;

/**
 * テストラン開始スキーマ
 */
export const startTestRunSchema = z.object({
  runId: z.string().uuid({
    message: "有効なテストランIDを指定してください",
  }),
});

export type StartTestRunInput = z.infer<typeof startTestRunSchema>;

/**
 * テストラン完了スキーマ
 */
export const completeTestRunSchema = z.object({
  runId: z.string().uuid({
    message: "有効なテストランIDを指定してください",
  }),
  force: z.boolean().optional().default(false),
});

export type CompleteTestRunInput = z.infer<typeof completeTestRunSchema>;

/**
 * テストラングループ作成スキーマ
 */
export const createTestRunGroupSchema = z.object({
  releaseId: z.string().uuid({
    message: "有効なリリースIDを指定してください",
  }),
  environmentType: z.enum(["STAGING", "PRODUCTION"]),
  scheduledStartDate: z
    .string()
    .datetime({
      message: "有効な日時を指定してください (ISO 8601形式)",
    })
    .optional(),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .optional(),
});

export type CreateTestRunGroupInput = z.infer<typeof createTestRunGroupSchema>;

/**
 * テストラングループ更新スキーマ
 */
export const updateTestRunGroupSchema = z.object({
  status: runGroupStatusSchema.optional(),
  scheduledStartDate: z
    .string()
    .datetime({
      message: "有効な日時を指定してください (ISO 8601形式)",
    })
    .optional(),
  actualStartDate: z
    .string()
    .datetime({
      message: "有効な日時を指定してください (ISO 8601形式)",
    })
    .optional(),
  actualEndDate: z
    .string()
    .datetime({
      message: "有効な日時を指定してください (ISO 8601形式)",
    })
    .optional(),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .optional(),
});

export type UpdateTestRunGroupInput = z.infer<typeof updateTestRunGroupSchema>;

/**
 * テストランクエリパラメータスキーマ
 */
export const testRunQuerySchema = z.object({
  runGroupId: z.string().uuid().optional(),
  releaseId: z.string().uuid().optional(),
  status: runStatusSchema.optional(),
  assigneeUserId: z.string().uuid().optional(),
});

export type TestRunQueryParams = z.infer<typeof testRunQuerySchema>;

// ============================================================================
// Backward compatibility types for dashboard (legacy)
// ============================================================================

/**
 * 環境タイプ（本番環境 or ステージング環境）
 */
export const environmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["production", "staging"]),
});

export type Environment = z.infer<typeof environmentSchema>;

/**
 * 担当者情報
 */
export const assigneeSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
});

export type Assignee = z.infer<typeof assigneeSchema>;

/**
 * テスト実行ステータス（legacy）
 */
export const testRunStatusSchema = z.enum([
  "planned",
  "in_progress",
  "completed",
  "failed",
]);

export type TestRunStatus = z.infer<typeof testRunStatusSchema>;

/**
 * テスト実行情報（legacy - dashboard用）
 */
export const testRunSchema = z.object({
  id: z.string(),
  title: z.string(),
  projectName: z.string(),
  environment: environmentSchema,
  status: testRunStatusSchema,
  successRate: z.number().min(0).max(100),
  totalItems: z.number().int().min(0),
  completedItems: z.number().int().min(0),
  passedItems: z.number().int().min(0),
  failedItems: z.number().int().min(0),
  assignees: z.array(assigneeSchema),
  startedAt: z.string(),
  completedAt: z.string().optional(),
});

export type TestRun = z.infer<typeof testRunSchema>;

/**
 * 個別テストケース（legacy - dashboard用）
 */
export const testRunItemSchema = z.object({
  id: z.string(),
  testRunId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "passed", "failed", "skipped"]),
  assignee: assigneeSchema.optional(),
  executedAt: z.string().optional(),
  duration: z.number().optional(),
});

export type TestRunItem = z.infer<typeof testRunItemSchema>;
