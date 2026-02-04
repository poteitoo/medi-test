import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { projectStatsChartConfig, getSuccessRateColor, getHealthStatus } from "../utils/chart-config";
import type { ProjectStats } from "../types/dashboard";

interface ProjectStatsCardProps {
  stats: ProjectStats;
}

const healthStatusConfig = {
  excellent: { label: "優秀", color: "bg-green-500" },
  good: { label: "良好", color: "bg-green-400" },
  warning: { label: "警告", color: "bg-yellow-500" },
  critical: { label: "危険", color: "bg-red-500" },
};

export function ProjectStatsCard({ stats }: ProjectStatsCardProps) {
  return (
    <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">プロジェクト/環境統計</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="staging" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="staging">ステージング</TabsTrigger>
            <TabsTrigger value="production">本番環境</TabsTrigger>
          </TabsList>

          <TabsContent value="staging" className="mt-4 space-y-4">
            <EnvironmentStats data={stats.staging} environment="staging" />
          </TabsContent>

          <TabsContent value="production" className="mt-4 space-y-4">
            <EnvironmentStats data={stats.production} environment="production" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EnvironmentStats({
  data,
  environment,
}: {
  data: ProjectStats["staging"];
  environment: "staging" | "production";
}) {
  // チャート用のデータを変換
  const chartData = data.map((stat) => ({
    name: stat.projectName,
    successRate: stat.successRate,
    totalRuns: stat.totalRuns,
    fill: getSuccessRateColor(stat.successRate),
  }));

  return (
    <div className="space-y-4">
      {/* プロジェクトリスト */}
      <div className="space-y-2">
        {data.map((stat) => {
          const healthStatus = getHealthStatus(stat.successRate);
          const healthConfig = healthStatusConfig[healthStatus];

          return (
            <div
              key={stat.projectName}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`h-2 w-2 rounded-full ${healthConfig.color}`} />
                <div>
                  <p className="font-medium">{stat.projectName}</p>
                  <p className="text-xs text-muted-foreground">
                    {stat.totalRuns} 回実行
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={
                    stat.successRate >= 80
                      ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                      : stat.successRate >= 50
                        ? "border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300"
                        : "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
                  }
                >
                  {healthConfig.label}
                </Badge>
                <div className="text-right">
                  <p className="text-lg font-bold">{stat.successRate}%</p>
                  <p className="text-xs text-muted-foreground">成功率</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 横棒グラフ */}
      <div className="mt-6">
        <h4 className="text-sm font-medium mb-3">プロジェクト別成功率比較</h4>
        <ChartContainer config={projectStatsChartConfig} className="h-[200px] w-full">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={100}
              className="text-xs"
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value, name) => {
                if (name === "successRate") {
                  return [`${value}%`, "成功率"];
                }
                return [value, name];
              }}
            />
            <Bar dataKey="successRate" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
