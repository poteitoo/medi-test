import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { TestRunStatusBadge } from "./test-run-status-badge";
import { formatShortDateTime } from "../utils/chart-config";
import type { TestRun } from "~/lib/schemas/test-run";

interface RecentTestHistoryTableProps {
  testRuns: TestRun[];
}

export function RecentTestHistoryTable({
  testRuns,
}: RecentTestHistoryTableProps) {
  return (
    <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">最近のテスト履歴</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ラン ID</TableHead>
                <TableHead>プロジェクト</TableHead>
                <TableHead>環境</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">成功率</TableHead>
                <TableHead>実行日時</TableHead>
                <TableHead>担当者</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testRuns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    テスト履歴がありません
                  </TableCell>
                </TableRow>
              ) : (
                testRuns.map((run) => (
                  <TableRow
                    key={run.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <TableCell className="font-mono text-xs">
                      {run.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{run.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {run.projectName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          run.environment.type === "production"
                            ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
                            : "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                        }
                      >
                        {run.environment.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TestRunStatusBadge status={run.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium">{run.successRate}%</span>
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                            style={{ width: `${run.successRate}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatShortDateTime(run.startedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {run.assignees.slice(0, 3).map((assignee) => (
                          <Avatar
                            key={assignee.id}
                            className="h-6 w-6 border-2 border-background"
                          >
                            <AvatarFallback className="text-xs bg-primary/10">
                              {assignee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {run.assignees.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{run.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
