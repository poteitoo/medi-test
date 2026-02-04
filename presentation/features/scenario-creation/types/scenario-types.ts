/**
 * シナリオ作成機能の型定義
 */

/**
 * ドメインモデル: テストシナリオ
 */
export interface Scenario {
  id: string;
  title: string;
  description: string; // Markdown content
  tags: string[]; // Tag IDs or names
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

/**
 * フォーム用データ（Zod スキーマと一致）
 */
export interface ScenarioFormData {
  title: string;
  description: string;
  tags: string[];
  folderId?: string;
}

/**
 * タグ
 */
export interface Tag {
  id: string;
  name: string;
  color?: "default" | "primary" | "secondary" | "destructive" | "outline";
}

/**
 * フォルダー/グループ
 */
export interface Folder {
  id: string;
  name: string;
  icon?: string;
}
