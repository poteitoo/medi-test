import { Link } from "react-router";
import type { Release } from "../../domain/models/release";
import { RELEASE_STATUS_LABELS } from "../../domain/models/release-status";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type ReleaseListProps = {
  readonly releases: readonly Release[];
  readonly onCreateNew?: () => void;
};

/**
 * ReleaseList Component
 *
 * リリース一覧を表示するコンポーネント
 */
export function ReleaseList({ releases, onCreateNew }: ReleaseListProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "secondary";
      case "EXECUTING":
        return "default";
      case "GATE_CHECK":
        return "outline";
      case "APPROVED_FOR_RELEASE":
        return "default";
      case "RELEASED":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">リリース</h2>
          <p className="text-muted-foreground">プロジェクトのリリース一覧</p>
        </div>
        {onCreateNew && <Button onClick={onCreateNew}>新規リリース作成</Button>}
      </div>

      {releases.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              リリースがありません
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {releases.map((release) => (
            <Link key={release.id} to={`/releases/${release.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{release.name}</CardTitle>
                      {release.description && (
                        <CardDescription>{release.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant={getStatusBadgeVariant(release.status)}>
                      {RELEASE_STATUS_LABELS[release.status]}
                    </Badge>
                  </div>
                </CardHeader>
                {release.buildRef && (
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>ビルド:</span>
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        {release.buildRef}
                      </code>
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
