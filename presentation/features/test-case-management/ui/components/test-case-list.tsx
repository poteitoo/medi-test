import { useState } from "react";
import type { TestCase } from "../../domain/models/test-case";
import type { TestCaseWithLatestRevision } from "../../application/usecases/list-test-cases";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Empty } from "~/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { RevisionStatusLabels } from "../../domain/models/revision-status";
import { Search } from "lucide-react";
import { cn } from "~/lib/utils";

export type TestCaseListProps = {
  readonly testCases: readonly (TestCase | TestCaseWithLatestRevision)[];
  readonly onSelect?: (testCase: TestCase | TestCaseWithLatestRevision) => void;
  readonly loading?: boolean;
};

/**
 * テストケース一覧表示コンポーネント
 *
 * テストケースをDataTableで表示し、検索/フィルタリング、行選択をサポートします。
 *
 * @example
 * ```tsx
 * <TestCaseList
 *   testCases={testCases}
 *   onSelect={(testCase) => console.log(testCase.id)}
 *   loading={false}
 * />
 * ```
 */
export function TestCaseList({
  testCases,
  onSelect,
  loading = false,
}: TestCaseListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // 検索フィルタリング
  const filteredTestCases = testCases.filter((item) => {
    if (!searchQuery.trim()) return true;

    const hasLatestRevision = "latestRevision" in item;
    const testCase = hasLatestRevision ? item.testCase : item;
    const title = hasLatestRevision ? (item.latestRevision?.title ?? "") : "";

    return (
      testCase.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // ローディング状態
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>テストケース一覧</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // 空の状態
  if (testCases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>テストケース一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <div className="text-center">
              <h3 className="font-semibold">テストケースがありません</h3>
              <p className="text-sm text-muted-foreground">
                新しいテストケースを作成してください
              </p>
            </div>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>テストケース一覧</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="タイトルまたはIDで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredTestCases.length === 0 ? (
          <Empty>
            <div className="text-center">
              <h3 className="font-semibold">検索結果がありません</h3>
              <p className="text-sm text-muted-foreground">
                検索条件を変更してください
              </p>
            </div>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>タイトル</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>作成日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTestCases.map((item) => {
                  const hasLatestRevision = "latestRevision" in item;
                  const testCase = hasLatestRevision ? item.testCase : item;
                  const latestRevision = hasLatestRevision
                    ? item.latestRevision
                    : null;

                  return (
                    <TableRow
                      key={testCase.id}
                      className={cn(
                        onSelect && "cursor-pointer hover:bg-muted/50",
                      )}
                      onClick={() => onSelect?.(item)}
                    >
                      <TableCell className="font-mono text-xs">
                        {testCase.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {latestRevision?.title ?? "（タイトルなし）"}
                      </TableCell>
                      <TableCell>
                        {latestRevision ? (
                          <Badge variant="outline">
                            {RevisionStatusLabels[latestRevision.status]}
                          </Badge>
                        ) : (
                          <Badge variant="outline">リビジョンなし</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(testCase.createdAt).toLocaleDateString(
                          "ja-JP",
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
