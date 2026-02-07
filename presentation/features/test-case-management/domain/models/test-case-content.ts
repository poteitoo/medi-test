import { Data } from "effect";

/**
 * テストケースの優先度
 */
export type TestCasePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * TestCaseContent ドメインモデル
 *
 * テストケースの実際の内容を表現するドメインモデル
 * JSONBとして保存される
 */
export class TestCaseContent extends Data.Class<{
  /**
   * テスト手順（ステップのリスト）
   */
  readonly steps: readonly string[];

  /**
   * 期待結果
   */
  readonly expected_result: string;

  /**
   * 前提条件（オプション）
   */
  readonly preconditions?: string;

  /**
   * テストデータ（オプション）
   */
  readonly test_data?: string;

  /**
   * タグ（カテゴリ、機能名など）
   */
  readonly tags?: readonly string[];

  /**
   * 優先度
   */
  readonly priority?: TestCasePriority;

  /**
   * テスト環境
   */
  readonly environment?: string;

  /**
   * 添付ファイルURL（オプション）
   */
  readonly attachments?: readonly string[];

  /**
   * 備考・メモ（オプション）
   */
  readonly notes?: string;
}> {}

/**
 * 空のテストケース内容を生成
 */
export const emptyTestCaseContent = (): TestCaseContent =>
  new TestCaseContent({
    steps: [],
    expected_result: "",
    tags: [],
  });

/**
 * テストケース内容のバリデーション
 */
export const validateTestCaseContent = (
  content: TestCaseContent,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (content.steps.length === 0) {
    errors.push("テスト手順を1つ以上入力してください");
  }

  if (!content.expected_result.trim()) {
    errors.push("期待結果を入力してください");
  }

  if (content.steps.some((step) => !step.trim())) {
    errors.push("空のテスト手順があります");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
