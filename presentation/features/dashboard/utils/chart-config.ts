import type { ChartConfig } from "~/components/ui/chart";

/**
 * 成功率チャート設定（円グラフ）
 */
export const successRateChartConfig = {
  passed: {
    label: "成功",
    color: "hsl(142, 76%, 36%)",
  },
  failed: {
    label: "失敗",
    color: "hsl(0, 84%, 60%)",
  },
  pending: {
    label: "保留中",
    color: "hsl(215, 20%, 65%)",
  },
} satisfies ChartConfig;

/**
 * 実行トレンドチャート設定（棒グラフ）
 */
export const executionTrendChartConfig = {
  successful: {
    label: "成功",
    color: "hsl(142, 76%, 36%)",
  },
  failed: {
    label: "失敗",
    color: "hsl(0, 84%, 60%)",
  },
  total: {
    label: "合計",
    color: "hsl(215, 25%, 27%)",
  },
} satisfies ChartConfig;

/**
 * プロジェクト統計チャート設定（横棒グラフ）
 */
export const projectStatsChartConfig = {
  successRate: {
    label: "成功率",
    color: "hsl(215, 25%, 27%)",
  },
} satisfies ChartConfig;

/**
 * 成功率に応じた色を取得
 */
export function getSuccessRateColor(successRate: number): string {
  if (successRate >= 80) {
    return "hsl(142, 76%, 36%)"; // 緑
  }
  if (successRate >= 50) {
    return "hsl(45, 93%, 47%)"; // 黄色
  }
  return "hsl(0, 84%, 60%)"; // 赤
}

/**
 * 成功率に応じたヘルスステータスを取得
 */
export function getHealthStatus(
  successRate: number,
): "excellent" | "good" | "warning" | "critical" {
  if (successRate >= 90) return "excellent";
  if (successRate >= 80) return "good";
  if (successRate >= 50) return "warning";
  return "critical";
}

/**
 * パーセンテージをフォーマット
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * 日付を相対的な形式でフォーマット（例: "2日前"）
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "今日";
  }
  if (diffInDays === 1) {
    return "昨日";
  }
  if (diffInDays < 7) {
    return `${diffInDays}日前`;
  }
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}週間前`;
  }
  const months = Math.floor(diffInDays / 30);
  return `${months}ヶ月前`;
}

/**
 * 日時を短い形式でフォーマット（例: "2024/01/15 14:30"）
 */
export function formatShortDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}
