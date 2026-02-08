import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Empty } from "~/components/ui/empty";
import {
  RevisionStatusLabels,
  getStatusBadgeColor,
} from "../../domain/models/revision-status";
import { Clock, User, FileText } from "lucide-react";
import { cn } from "~/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export type RevisionHistoryProps = {
  readonly revisions: readonly TestCaseRevision[];
  readonly onSelectRevision?: (revision: TestCaseRevision) => void;
};

/**
 * リビジョン履歴タイムラインコンポーネント
 *
 * テストケースのリビジョン履歴をタイムライン形式で表示します。
 *
 * @example
 * ```tsx
 * <RevisionHistory
 *   revisions={revisions}
 *   onSelectRevision={(revision) => console.log(revision.id)}
 * />
 * ```
 */
export function RevisionHistory({
  revisions,
  onSelectRevision,
}: RevisionHistoryProps) {
  // 空の状態
  if (revisions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>リビジョン履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <div className="text-center">
              <h3 className="font-semibold">リビジョン履歴がありません</h3>
              <p className="text-sm text-muted-foreground">
                テストケースのリビジョンが作成されると表示されます
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
        <CardTitle>リビジョン履歴</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-chart-md">
          <div className="space-y-4">
            {revisions.map((revision, index) => {
              const isLatest = index === 0;
              const relativeTime = formatDistanceToNow(
                new Date(revision.createdAt),
                {
                  addSuffix: true,
                  locale: ja,
                },
              );

              return (
                <div key={revision.id}>
                  <div
                    className={cn(
                      "relative rounded-lg border p-4 transition-colors",
                      onSelectRevision && "cursor-pointer hover:bg-muted/50",
                      isLatest && "border-primary",
                    )}
                    onClick={() => onSelectRevision?.(revision)}
                  >
                    {/* リビジョン番号とステータス */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={isLatest ? "default" : "outline"}>
                          rev.{revision.rev}
                        </Badge>
                        <Badge
                          className={cn(
                            "border-0",
                            getStatusBadgeColor(revision.status),
                          )}
                        >
                          {RevisionStatusLabels[revision.status]}
                        </Badge>
                      </div>
                      {isLatest && (
                        <span className="text-xs font-medium text-primary">
                          最新
                        </span>
                      )}
                    </div>

                    {/* タイトル */}
                    <h4 className="mb-2 font-medium">{revision.title}</h4>

                    {/* 作成理由 */}
                    {revision.reason && (
                      <div className="mb-2 flex items-start gap-2 text-sm text-muted-foreground">
                        <FileText className="mt-0.5 size-4 shrink-0" />
                        <span>{revision.reason}</span>
                      </div>
                    )}

                    {/* メタ情報 */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="size-3" />
                        <span>{revision.createdBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>{relativeTime}</span>
                      </div>
                      <span className="text-muted-foreground/70">
                        {new Date(revision.createdAt).toLocaleDateString(
                          "ja-JP",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>

                    {/* 選択ボタン */}
                    {onSelectRevision && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRevision(revision);
                        }}
                      >
                        詳細を表示
                      </Button>
                    )}
                  </div>

                  {/* セパレーター（最後の要素以外） */}
                  {index < revisions.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
