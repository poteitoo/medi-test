import type { TestRun, Environment, Assignee } from "~/lib/schemas/test-run";

/**
 * テスト実行サマリー統計
 */
export type TestSummary = {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  inProgressRuns: number;
  averageSuccessRate: number;
  trend: {
    value: number;
    isPositive: boolean;
  };
};

/**
 * プロジェクト統計
 */
export type ProjectStat = {
  projectName: string;
  environment: "production" | "staging";
  successRate: number;
  totalRuns: number;
  lastRunDate: string;
};

/**
 * プロジェクト統計グループ
 */
export type ProjectStats = {
  production: ProjectStat[];
  staging: ProjectStat[];
};

/**
 * 期間別実行トレンド
 */
export type ExecutionTrend = {
  date: string;
  successful: number;
  failed: number;
  total: number;
};

/**
 * ダッシュボード全体のデータ
 */
export type DashboardData = {
  summary: TestSummary;
  testRuns: TestRun[];
  recentRuns: TestRun[];
  projectStats: ProjectStats;
  executionTrends: ExecutionTrend[];
};

/**
 * モック担当者データ
 */
const MOCK_ASSIGNEES: Assignee[] = [
  { id: "1", name: "田中 太郎" },
  { id: "2", name: "佐藤 花子" },
  { id: "3", name: "鈴木 一郎" },
  { id: "4", name: "高橋 美咲" },
  { id: "5", name: "伊藤 健太" },
];

/**
 * モック環境データ
 */
const MOCK_ENVIRONMENTS: Environment[] = [
  { id: "prod-1", name: "本番環境", type: "production" },
  { id: "stg-1", name: "ステージング環境", type: "staging" },
];

/**
 * モックプロジェクト名
 */
const MOCK_PROJECTS = [
  "medimo-web",
  "medimo-api",
  "medimo-admin",
  "medimo-mobile",
];

/**
 * ランダムな日付を生成（過去N日以内）
 */
function getRandomDateInPast(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

/**
 * ランダムな配列要素を取得
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * ランダムな配列要素を複数取得
 */
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * モックテスト実行データを生成
 */
function generateMockTestRun(index: number): TestRun {
  const totalItems = 10 + Math.floor(Math.random() * 40);
  const completedItems = Math.floor(Math.random() * totalItems);
  const passedItems = Math.floor(completedItems * (0.7 + Math.random() * 0.3));
  const failedItems = completedItems - passedItems;
  const successRate =
    completedItems > 0 ? Math.round((passedItems / completedItems) * 100) : 0;

  const statuses: Array<"planned" | "in_progress" | "completed" | "failed"> = [
    "in_progress",
    "completed",
    "completed",
    "completed",
    "completed",
    "failed",
  ];

  const status = index < 3 ? "in_progress" : getRandomItem(statuses);
  const startedAt = getRandomDateInPast(30);
  const completedAt =
    status === "completed" || status === "failed"
      ? getRandomDateInPast(28)
      : undefined;

  return {
    id: `run-${index + 1}`,
    title: `${getRandomItem(MOCK_PROJECTS)} テストラン #${index + 1}`,
    projectName: getRandomItem(MOCK_PROJECTS),
    environment: getRandomItem(MOCK_ENVIRONMENTS),
    status,
    successRate,
    totalItems,
    completedItems,
    passedItems,
    failedItems,
    assignees: getRandomItems(
      MOCK_ASSIGNEES,
      1 + Math.floor(Math.random() * 3),
    ),
    startedAt,
    completedAt,
  };
}

/**
 * モック実行トレンドデータを生成（過去30日間）
 */
function generateMockExecutionTrends(): ExecutionTrend[] {
  const trends: ExecutionTrend[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const successful = Math.floor(Math.random() * 10) + 5;
    const failed = Math.floor(Math.random() * 3);
    const total = successful + failed;

    trends.push({
      date: date.toISOString().split("T")[0],
      successful,
      failed,
      total,
    });
  }

  return trends;
}

/**
 * モックダッシュボードデータを生成
 */
export function getMockDashboardData(): DashboardData {
  const testRuns: TestRun[] = [];

  // 20件のテスト実行データを生成
  for (let i = 0; i < 20; i++) {
    testRuns.push(generateMockTestRun(i));
  }

  // サマリー統計を計算
  const inProgressRuns = testRuns.filter(
    (run) => run.status === "in_progress",
  ).length;
  const completedRuns = testRuns.filter(
    (run) => run.status === "completed",
  ).length;
  const failedRuns = testRuns.filter((run) => run.status === "failed").length;
  const totalSuccessRate =
    testRuns.reduce((sum, run) => sum + run.successRate, 0) / testRuns.length;

  const summary: TestSummary = {
    totalRuns: testRuns.length,
    successfulRuns: completedRuns,
    failedRuns,
    inProgressRuns,
    averageSuccessRate: Math.round(totalSuccessRate),
    trend: {
      value: 12.5,
      isPositive: true,
    },
  };

  // プロジェクト統計を生成
  const projectStats: ProjectStats = {
    production: MOCK_PROJECTS.map((projectName) => ({
      projectName,
      environment: "production" as const,
      successRate: 75 + Math.floor(Math.random() * 25),
      totalRuns: 10 + Math.floor(Math.random() * 20),
      lastRunDate: getRandomDateInPast(7),
    })),
    staging: MOCK_PROJECTS.map((projectName) => ({
      projectName,
      environment: "staging" as const,
      successRate: 70 + Math.floor(Math.random() * 30),
      totalRuns: 15 + Math.floor(Math.random() * 25),
      lastRunDate: getRandomDateInPast(5),
    })),
  };

  // 最近のテスト実行（最新10件）
  const recentRuns = [...testRuns]
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
    .slice(0, 10);

  // 実行トレンド
  const executionTrends = generateMockExecutionTrends();

  return {
    summary,
    testRuns,
    recentRuns,
    projectStats,
    executionTrends,
  };
}
