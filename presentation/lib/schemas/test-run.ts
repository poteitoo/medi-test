import { z } from "zod";

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
 * テスト実行ステータス
 */
export const testRunStatusSchema = z.enum([
  "planned",
  "in_progress",
  "completed",
  "failed",
]);

export type TestRunStatus = z.infer<typeof testRunStatusSchema>;

/**
 * テスト実行情報
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
  startedAt: z.string(), // ISO 8601 date string
  completedAt: z.string().optional(),
});

export type TestRun = z.infer<typeof testRunSchema>;

/**
 * 個別テストケース
 */
export const testRunItemSchema = z.object({
  id: z.string(),
  testRunId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "passed", "failed", "skipped"]),
  assignee: assigneeSchema.optional(),
  executedAt: z.string().optional(),
  duration: z.number().optional(), // 実行時間（秒）
});

export type TestRunItem = z.infer<typeof testRunItemSchema>;
