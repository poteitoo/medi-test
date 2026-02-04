import { z } from "zod";

/**
 * シナリオ作成フォームのバリデーションスキーマ
 */
export const scenarioSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルを入力してください")
    .max(200, "タイトルは200文字以内で入力してください"),
  description: z
    .string()
    .max(10000, "説明は10000文字以内で入力してください"),
  tags: z.array(z.string()).max(5, "タグは最大5個まで選択できます"),
  folderId: z.string().optional(),
});

export type ScenarioFormData = z.infer<typeof scenarioSchema>;
