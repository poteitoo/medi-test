import type {
  Tag,
  Folder,
  Scenario,
  ScenarioFormData,
} from "~/features/scenario-creation/types/scenario-types";

/**
 * 事前定義タグ（10個）
 */
export const MOCK_TAGS: Tag[] = [
  { id: "1", name: "認証", color: "primary" },
  { id: "2", name: "決済", color: "secondary" },
  { id: "3", name: "UI", color: "outline" },
  { id: "4", name: "API", color: "primary" },
  { id: "5", name: "パフォーマンス", color: "secondary" },
  { id: "6", name: "セキュリティ", color: "destructive" },
  { id: "7", name: "回帰テスト", color: "outline" },
  { id: "8", name: "新機能", color: "primary" },
  { id: "9", name: "バグ修正", color: "secondary" },
  { id: "10", name: "リファクタリング", color: "outline" },
];

/**
 * フォルダー（6個）
 */
export const MOCK_FOLDERS: Folder[] = [
  { id: "1", name: "ログイン機能", icon: "🔐" },
  { id: "2", name: "ユーザー管理", icon: "👤" },
  { id: "3", name: "決済フロー", icon: "💳" },
  { id: "4", name: "レポート", icon: "📊" },
  { id: "5", name: "設定", icon: "⚙️" },
  { id: "6", name: "その他", icon: "📁" },
];

/**
 * モックAPI: シナリオを作成
 */
export async function createScenarioMock(
  data: ScenarioFormData,
): Promise<Scenario> {
  // API 呼び出しをシミュレート（1秒待機）
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 5% の確率でエラーをシミュレート（テスト用）
  if (Math.random() < 0.05) {
    throw new Error("シナリオの作成に失敗しました。もう一度お試しください。");
  }

  const scenario: Scenario = {
    id: `scenario-${Date.now()}`,
    ...data,
    description: data.description || "",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "current-user-id",
  };

  console.log("Created scenario (mock):", scenario);
  return scenario;
}
