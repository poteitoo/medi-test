# レポート生成

medi-test は、テストラン結果を **HTML（Web表示）** と **CSV/Excel（データ分析用）** で出力します。

---

## レポートタイプ

| タイプ           | 用途                         | 生成方法                    | ストレージ   |
| ---------------- | ---------------------------- | --------------------------- | ------------ |
| **HTML Report**  | Web表示、ダッシュボード      | 動的生成（React Component） | 保存しない   |
| **CSV Export**   | Excel分析、監査証跡          | On-demand                   | ダウンロード |
| **Excel Export** | リッチなレポート（将来対応） | On-demand                   | ダウンロード |

---

## HTML Report

### 目的

- ダッシュボードでの閲覧
- インタラクティブなチャート
- フィルタリングとソート
- 証跡（スクリーンショット、ログ）の表示

### レポートデータ集約

```typescript
// application/usecases/report/generate-test-run-report.ts
import { Effect } from "effect";
import { TestRunRepository } from "~/application/ports/test-run-repository";

export const generateTestRunReport = (testRunId: string) =>
  Effect.gen(function* () {
    const repo = yield* TestRunRepository;

    // 1. テストラン基本情報
    const testRun = yield* repo.findById(testRunId);

    // 2. すべてのテストアイテム
    const items = yield* repo.findItems(testRunId);

    // 3. 統計情報を計算
    const stats = calculateStats(items);

    return {
      testRun,
      items,
      stats,
    };
  });

const calculateStats = (items: TestRunItem[]) => {
  const total = items.length;
  const success = items.filter((i) => i.result === "success").length;
  const fail = items.filter((i) => i.result === "fail").length;
  const notExecuted = items.filter((i) => i.result === "not_executed").length;
  const blocked = items.filter((i) => i.result === "blocked").length;

  const executed = success + fail + blocked;
  const passRate = executed > 0 ? (success / executed) * 100 : 0;

  // 重要度別の統計
  const byImportance = groupBy(items, "importance");
  const byCategory = groupBy(items, "category");

  return {
    total,
    success,
    fail,
    notExecuted,
    blocked,
    executed,
    passRate: parseFloat(passRate.toFixed(1)),
    byImportance,
    byCategory,
  };
};

const groupBy = <T extends Record<string, any>>(
  items: T[],
  key: keyof T,
): Record<string, { total: number; success: number; fail: number }> => {
  const grouped: Record<string, T[]> = {};

  for (const item of items) {
    const value = item[key] as string;
    if (!grouped[value]) {
      grouped[value] = [];
    }
    grouped[value].push(item);
  }

  return Object.fromEntries(
    Object.entries(grouped).map(([key, items]) => [
      key,
      {
        total: items.length,
        success: items.filter((i) => i.result === "success").length,
        fail: items.filter((i) => i.result === "fail").length,
      },
    ]),
  );
};
```

### React Component

```typescript
// presentation/features/report/ui/test-run-report.tsx
import { useLoaderData } from "react-router";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";

export default function TestRunReport() {
  const { testRun, items, stats } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <ReportHeader testRun={testRun} />

      {/* 統計サマリー */}
      <ReportStats stats={stats} />

      {/* 合格率チャート */}
      <PassRateChart stats={stats} />

      {/* 重要度別の結果 */}
      <ImportanceBreakdown stats={stats} />

      {/* テストアイテム一覧 */}
      <TestItemsTable items={items} />
    </div>
  );
}

const ReportHeader = ({ testRun }) => (
  <Card className="p-6">
    <h1 className="text-2xl font-bold">{testRun.title}</h1>
    <p className="text-gray-600 mt-2">{testRun.description}</p>
    <div className="mt-4 flex gap-4 text-sm">
      <span>作成日: {formatDate(testRun.createdAt)}</span>
      <span>完了日: {formatDate(testRun.completedAt)}</span>
      <Badge>{testRun.status}</Badge>
    </div>
  </Card>
);

const ReportStats = ({ stats }) => (
  <div className="grid grid-cols-4 gap-4">
    <StatCard title="合計" value={stats.total} />
    <StatCard title="成功" value={stats.success} color="green" />
    <StatCard title="失敗" value={stats.fail} color="red" />
    <StatCard title="未実施" value={stats.notExecuted} color="gray" />
  </div>
);
```

---

## CSV Export

### 目的

- Excel でのデータ分析
- 監査証跡として保存
- 他システムへのデータ連携

### CSV生成

```typescript
// infrastructure/adapters/csv-exporter.ts
import { Effect, Layer } from "effect";
import { stringify } from "csv-stringify/sync";
import { CSVExporter } from "~/application/ports/csv-exporter";
import { TestRunRepository } from "~/application/ports/test-run-repository";

export const CSVExporterLive = Layer.effect(
  CSVExporter,
  Effect.gen(function* () {
    const repo = yield* TestRunRepository;

    return CSVExporter.of({
      exportTestRun: (testRunId) =>
        Effect.gen(function* () {
          const testRun = yield* repo.findById(testRunId);
          const items = yield* repo.findItems(testRunId);

          // CSV行データ
          const rows = items.map((item) => ({
            TestRunID: testRunId,
            TestRunTitle: testRun.title,
            ScenarioID: item.scenarioId,
            ScenarioTitle: item.scenarioTitle,
            Category: item.category,
            Importance: item.importance,
            Required: item.required ? "必須" : "任意",
            Result: formatResult(item.result),
            ExecutedBy: item.executedBy?.name || "未実施",
            ExecutedAt: item.executedAt?.toISOString() || "",
            DurationSeconds: item.executionDurationSeconds || 0,
            Evidence: item.evidence ? "あり" : "なし",
            Notes: item.notes || "",
          }));

          // CSV文字列に変換
          const csv = stringify(rows, {
            header: true,
            bom: true, // UTF-8 BOM (Excel互換)
            columns: [
              "TestRunID",
              "TestRunTitle",
              "ScenarioID",
              "ScenarioTitle",
              "Category",
              "Importance",
              "Required",
              "Result",
              "ExecutedBy",
              "ExecutedAt",
              "DurationSeconds",
              "Evidence",
              "Notes",
            ],
          });

          return csv;
        }),
    });
  }),
);

const formatResult = (result: string | null): string => {
  const map: Record<string, string> = {
    success: "成功",
    fail: "失敗",
    not_executed: "未実施",
    blocked: "ブロック",
    skipped: "スキップ",
  };
  return result ? map[result] || result : "未実施";
};
```

### ダウンロードエンドポイント

```typescript
// app/routes/api.test-runs.$id.export.csv.ts
import type { LoaderFunctionArgs } from "react-router";
import { exportTestRunCSV } from "~/application/usecases/report/export-test-run-csv";
import { AppLayer } from "~/infrastructure/layers/app-layer";
import { Effect } from "effect";

export async function loader({ params }: LoaderFunctionArgs) {
  const testRunId = params.id!;

  const program = exportTestRunCSV(testRunId).pipe(Effect.provide(AppLayer));

  const csv = await Effect.runPromise(program);

  const filename = `test-run-${testRunId}-${new Date().toISOString().split("T")[0]}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

### フロントエンドでのダウンロード

```typescript
// presentation/features/report/ui/export-button.tsx
export const ExportButton = ({ testRunId }: { testRunId: string }) => {
  const handleExport = () => {
    window.location.href = `/api/test-runs/${testRunId}/export/csv`;
  };

  return (
    <Button onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      CSV エクスポート
    </Button>
  );
};
```

---

## Excel Export（将来対応）

### 目的

- リッチなレポート（複数シート、グラフ、書式設定）
- 経営層向けのサマリーレポート

### 実装方針

**ライブラリ**: `exceljs`

```typescript
// infrastructure/adapters/excel-exporter.ts (将来実装)
import { Workbook } from "exceljs";

export const exportToExcel = async (testRunId: string) => {
  const workbook = new Workbook();

  // シート1: サマリー
  const summarySheet = workbook.addWorksheet("サマリー");
  summarySheet.columns = [
    { header: "項目", key: "item", width: 20 },
    { header: "値", key: "value", width: 15 },
  ];
  summarySheet.addRows([
    { item: "合計テスト数", value: 50 },
    { item: "成功", value: 45 },
    { item: "失敗", value: 3 },
    { item: "合格率", value: "93.8%" },
  ]);

  // シート2: 詳細結果
  const detailSheet = workbook.addWorksheet("詳細結果");
  detailSheet.columns = [
    { header: "シナリオID", key: "scenarioId", width: 20 },
    { header: "タイトル", key: "title", width: 30 },
    { header: "結果", key: "result", width: 10 },
  ];

  // Excel ファイルをバッファに変換
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
```

---

## レポートスケジューリング（将来対応）

### 自動レポート生成

**ユースケース**:

- 毎日AM9時に前日のテスト結果をメール送信
- 毎週月曜日に週次サマリーを Slack に投稿

### 実装方針

**Cron Job**: Node.js の `node-cron` または GitHub Actions

```typescript
// application/usecases/report/schedule-daily-report.ts
import cron from "node-cron";
import { Effect } from "effect";
import { EmailService } from "~/application/ports/email-service";
import { generateDailyReport } from "./generate-daily-report";

export const scheduleDailyReport = (projectId: string, recipients: string[]) =>
  Effect.gen(function* () {
    const emailer = yield* EmailService;

    // 毎日AM9時に実行
    cron.schedule("0 9 * * *", async () => {
      const program = Effect.gen(function* () {
        const report = yield* generateDailyReport(projectId);
        const html = yield* renderReportHTML(report);

        yield* emailer.send({
          to: recipients,
          subject: `日次テストレポート - ${new Date().toLocaleDateString("ja-JP")}`,
          html,
        });
      }).pipe(Effect.provide(AppLayer));

      await Effect.runPromise(program);
    });
  });
```

---

## パフォーマンス最適化

### 1. レポートデータのキャッシュ

**問題**: 大規模なテストラン（数千シナリオ）の集計が遅い

**解決策**: PostgreSQL Materialized View

```sql
CREATE MATERIALIZED VIEW test_run_stats AS
SELECT
  test_run_id,
  COUNT(*) AS total,
  SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) AS success,
  SUM(CASE WHEN result = 'fail' THEN 1 ELSE 0 END) AS fail,
  SUM(CASE WHEN result = 'not_executed' THEN 1 ELSE 0 END) AS not_executed,
  ROUND(
    100.0 * SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) /
    NULLIF(SUM(CASE WHEN result IN ('success', 'fail', 'blocked') THEN 1 ELSE 0 END), 0),
    1
  ) AS pass_rate
FROM test_run_items
GROUP BY test_run_id;

-- 更新（テストラン完了時）
REFRESH MATERIALIZED VIEW test_run_stats;
```

### 2. CSV生成の非同期化

**問題**: 大規模なCSVエクスポートがタイムアウト

**解決策**: バックグラウンドジョブ

```typescript
// application/usecases/report/export-test-run-async.ts
export const exportTestRunAsync = (testRunId: string, userId: string) =>
  Effect.gen(function* () {
    const jobQueue = yield* JobQueue;

    // ジョブをキューに追加
    const jobId = yield* jobQueue.enqueue({
      type: "csv_export",
      testRunId,
      userId,
    });

    // ジョブIDを返す（クライアントはポーリングで進捗確認）
    return { jobId, status: "queued" };
  });
```

---

## 関連ドキュメント

- [データモデル](data-model.md) - TestRun、TestRunItem エンティティ
- [アーキテクチャ](architecture.md) - レポート生成のアーキテクチャ
- [実装ガイド](implementation-guide.md) - Effect TS での実装パターン
