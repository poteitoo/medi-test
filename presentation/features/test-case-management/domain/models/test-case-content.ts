import { Data } from "effect";

/**
 * テストステップ - テストケース内の1つの実行手順
 *
 * 各ステップは番号付けされ、実行すべき操作と期待される結果を含みます。
 */
export class TestStep extends Data.Class<{
  /**
   * ステップ番号（1から始まる連番）
   */
  readonly stepNumber: number;

  /**
   * 実行する操作・アクション
   *
   * 例: "ログインボタンをクリックする"
   */
  readonly action: string;

  /**
   * このステップで期待される結果
   *
   * 例: "ダッシュボード画面が表示される"
   */
  readonly expectedOutcome: string;
}> {
  /**
   * ステップの表示用テキストを取得
   *
   * @returns "ステップ1: アクション → 期待結果" の形式
   */
  getDisplayText(): string {
    return `ステップ${this.stepNumber}: ${this.action} → ${this.expectedOutcome}`;
  }

  /**
   * ステップが有効かどうかを検証
   *
   * @returns 有効な場合はtrue
   */
  isValid(): boolean {
    return (
      this.stepNumber > 0 &&
      this.action.trim().length > 0 &&
      this.expectedOutcome.trim().length > 0
    );
  }
}

/**
 * テストケースの優先度
 *
 * - LOW: 低優先度
 * - MEDIUM: 中優先度
 * - HIGH: 高優先度
 * - CRITICAL: 緊急・重要
 */
export const TestCasePriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export type TestCasePriority =
  (typeof TestCasePriority)[keyof typeof TestCasePriority];

/**
 * 優先度の日本語ラベル
 */
export const TestCasePriorityLabels: Record<TestCasePriority, string> = {
  [TestCasePriority.LOW]: "低",
  [TestCasePriority.MEDIUM]: "中",
  [TestCasePriority.HIGH]: "高",
  [TestCasePriority.CRITICAL]: "緊急",
};

/**
 * TestCaseContent - テストケースの内容
 *
 * テストケースの実際の内容（手順、期待結果など）を表現するドメインモデル。
 * データベースではJSONBとして保存されます。
 */
export class TestCaseContent extends Data.Class<{
  /**
   * テスト手順（ステップのリスト）
   */
  readonly steps: readonly TestStep[];

  /**
   * 最終的な期待結果
   *
   * 全ステップを実行した後に得られるべき最終的な結果
   */
  readonly expectedResult: string;

  /**
   * タグ（カテゴリ、機能名など）
   */
  readonly tags: readonly string[];

  /**
   * 優先度
   */
  readonly priority: TestCasePriority;

  /**
   * テスト環境
   *
   * 例: "staging", "production", "localhost"
   */
  readonly environment: string;

  /**
   * 前提条件（オプション）
   */
  readonly preconditions?: string;

  /**
   * テストデータ（オプション）
   */
  readonly testData?: string;

  /**
   * 添付ファイルURL（オプション）
   */
  readonly attachments?: readonly string[];

  /**
   * 備考・メモ（オプション）
   */
  readonly notes?: string;
}> {
  /**
   * 総ステップ数を取得
   */
  getTotalSteps(): number {
    return this.steps.length;
  }

  /**
   * 無効なステップがあるかチェック
   */
  hasInvalidSteps(): boolean {
    return this.steps.some((step) => !step.isValid());
  }

  /**
   * 特定のタグが含まれているかチェック
   */
  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }
}

/**
 * 空のテストケース内容を生成
 *
 * @returns 初期値が設定されたTestCaseContent
 */
export const emptyTestCaseContent = (): TestCaseContent =>
  new TestCaseContent({
    steps: [],
    expectedResult: "",
    tags: [],
    priority: TestCasePriority.MEDIUM,
    environment: "staging",
  });

/**
 * テストケース内容のバリデーション結果
 */
export type ValidationResult = {
  readonly valid: boolean;
  readonly errors: readonly string[];
};

/**
 * テストケース内容のバリデーション
 *
 * @param content - 検証するテストケース内容
 * @returns バリデーション結果
 */
export const validateTestCaseContent = (
  content: TestCaseContent,
): ValidationResult => {
  const errors: string[] = [];

  if (content.steps.length === 0) {
    errors.push("テスト手順を1つ以上入力してください");
  }

  if (!content.expectedResult.trim()) {
    errors.push("期待結果を入力してください");
  }

  if (content.hasInvalidSteps()) {
    errors.push("無効なテスト手順があります");
  }

  // ステップ番号の連番チェック
  const stepNumbers = content.steps.map((step) => step.stepNumber);
  const expectedNumbers = Array.from(
    { length: content.steps.length },
    (_, i) => i + 1,
  );
  if (JSON.stringify(stepNumbers) !== JSON.stringify(expectedNumbers)) {
    errors.push("ステップ番号が連番になっていません");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
