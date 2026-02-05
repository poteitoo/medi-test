import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import type { ChartConfig } from "~/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, XCircle, Clock, PlayCircle } from "lucide-react";
import { StatCard } from "./stat-card";
import {
  executionTrendChartConfig,
  successRateChartConfig,
} from "../utils/chart-config";
import type { TestSummary, ExecutionTrend } from "../types/dashboard";

interface TestSummaryCardProps {
  summary: TestSummary;
  executionTrends: ExecutionTrend[];
}

export function TestSummaryCard({
  summary,
  executionTrends,
}: TestSummaryCardProps) {
  // 円グラフ用のデータ
  const pieData = [
    {
      name: "passed",
      value: summary.successfulRuns,
      fill: successRateChartConfig.passed.color,
    },
    {
      name: "failed",
      value: summary.failedRuns,
      fill: successRateChartConfig.failed.color,
    },
    {
      name: "pending",
      value: summary.inProgressRuns,
      fill: successRateChartConfig.pending.color,
    },
  ];

  // 期間別のトレンドデータをフィルタリング
  const getLast7Days = () => executionTrends.slice(-7);
  const getLast30Days = () => executionTrends;
  const getLast90Days = () => executionTrends; // モックデータは30日分のみだが、実装上は90日対応

  return (
    <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">テスト実行サマリー</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 上段: 円グラフと統計カード */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側: 成功率円グラフ */}
          <div className="flex flex-col items-center justify-center">
            <ChartContainer
              config={successRateChartConfig}
              className="h-chart w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-4 text-center">
              <p className="text-4xl font-bold">
                {summary.averageSuccessRate}%
              </p>
              <p className="text-sm text-muted-foreground">平均成功率</p>
            </div>
          </div>

          {/* 右側: 統計カード */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="総実行数"
              value={summary.totalRuns}
              icon={PlayCircle}
              trend={summary.trend}
              gradientClass="gradient-primary"
            />
            <StatCard
              title="成功"
              value={summary.successfulRuns}
              icon={CheckCircle2}
              gradientClass="gradient-success"
            />
            <StatCard
              title="失敗"
              value={summary.failedRuns}
              icon={XCircle}
              gradientClass="gradient-error"
            />
            <StatCard
              title="実行中"
              value={summary.inProgressRuns}
              icon={Clock}
              gradientClass="gradient-warning"
            />
          </div>
        </div>

        {/* 下段: 期間別実行トレンド */}
        <div className="mt-6">
          <Tabs defaultValue="7days" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-widget-lg">
              <TabsTrigger value="7days">7日間</TabsTrigger>
              <TabsTrigger value="30days">30日間</TabsTrigger>
              <TabsTrigger value="90days">90日間</TabsTrigger>
            </TabsList>

            <TabsContent value="7days" className="mt-4">
              <ExecutionTrendChart data={getLast7Days()} />
            </TabsContent>

            <TabsContent value="30days" className="mt-4">
              <ExecutionTrendChart data={getLast30Days()} />
            </TabsContent>

            <TabsContent value="90days" className="mt-4">
              <ExecutionTrendChart data={getLast90Days()} />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutionTrendChart({ data }: { data: ExecutionTrend[] }) {
  // 日付フォーマット（MM/DD形式）
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return {
      ...item,
      displayDate: `${month}/${day}`,
    };
  });

  return (
    <ChartContainer
      config={executionTrendChartConfig}
      className="h-chart-md w-full"
    >
      <BarChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="displayDate"
          tickLine={false}
          axisLine={false}
          className="text-xs"
        />
        <YAxis tickLine={false} axisLine={false} className="text-xs" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="successful"
          fill={executionTrendChartConfig.successful.color}
          radius={[4, 4, 0, 0]}
          stackId="a"
        />
        <Bar
          dataKey="failed"
          fill={executionTrendChartConfig.failed.color}
          radius={[4, 4, 0, 0]}
          stackId="a"
        />
      </BarChart>
    </ChartContainer>
  );
}
