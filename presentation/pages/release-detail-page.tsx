import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { ReleaseLayer } from "~/features/release-gate/infrastructure/layers/release-layer";
import { ReleaseRepository } from "~/features/release-gate/application/ports/release-repository";
import { evaluateGate } from "~/features/release-gate/application/usecases/evaluate-gate";
import { GateEvaluation } from "~/features/release-gate/ui/components/gate-evaluation";
import { WaiverForm } from "~/features/release-gate/ui/components/waiver-form";
import type { Release } from "~/features/release-gate/domain/models/release";
import type { GateEvaluationResult } from "~/features/release-gate/application/ports/gate-evaluation-service";
import { RELEASE_STATUS_LABELS } from "~/features/release-gate/domain/models/release-status";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

/**
 * Loader: リリース詳細とゲート評価を取得
 */
export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { releaseId } = params;

    if (!releaseId) {
      return data({ error: "releaseId is required" }, { status: 400 });
    }

    const program = Effect.gen(function* () {
      const releaseRepo = yield* ReleaseRepository;
      const release = yield* releaseRepo.findById(releaseId);

      // ゲート評価（EXECUTING または GATE_CHECK の場合のみ）
      let evaluation = null;
      if (
        release.status === "EXECUTING" ||
        release.status === "GATE_CHECK" ||
        release.status === "APPROVED_FOR_RELEASE"
      ) {
        evaluation = yield* evaluateGate({ releaseId });
      }

      return { release, evaluation };
    }).pipe(Effect.provide(ReleaseLayer));

    const result = await Effect.runPromise(program);

    return data(result);
  } catch (error) {
    console.error("Failed to load release:", error);
    return data(
      {
        error: "Failed to load release",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * ReleaseDetailPage
 *
 * リリース詳細ページ
 */
export default function ReleaseDetailPage() {
  const { release, evaluation } = useLoaderData<{
    release: Release;
    evaluation: GateEvaluationResult | null;
  }>();
  const navigate = useNavigate();
  const [showWaiverForm, setShowWaiverForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      // TODO: 実装 - approveRelease API呼び出し
      const response = await fetch(
        `/api/releases/${release.id}/gate-evaluation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
            approverId: "current-user-id", // TODO: 実際のユーザーIDを取得
            comment: "ゲート条件を全て満たしているため承認します",
          }),
        },
      );

      if (response.ok) {
        navigate(0); // Reload page
      }
    } catch (error) {
      console.error("Failed to approve release:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueWaiver = () => {
    setShowWaiverForm(true);
  };

  const handleWaiverSubmit = async (data: {
    targetType: string;
    targetId?: string;
    reason: string;
    expiresAt: Date;
  }) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/releases/${release.id}/waivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          issuerId: "current-user-id", // TODO: 実際のユーザーIDを取得
        }),
      });

      if (response.ok) {
        setShowWaiverForm(false);
        navigate(0); // Reload page
      }
    } catch (error) {
      console.error("Failed to issue waiver:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Release Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`/releases?projectId=${release.projectId}`)
              }
            >
              ← 戻る
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{release.name}</h1>
          {release.description && (
            <p className="text-muted-foreground">{release.description}</p>
          )}
        </div>
        <Badge>{RELEASE_STATUS_LABELS[release.status]}</Badge>
      </div>

      {/* Release Info */}
      <Card>
        <CardHeader>
          <CardTitle>リリース情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">リリースID</p>
              <p className="text-sm text-muted-foreground">{release.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium">ステータス</p>
              <p className="text-sm text-muted-foreground">
                {RELEASE_STATUS_LABELS[release.status]}
              </p>
            </div>
            {release.buildRef && (
              <div>
                <p className="text-sm font-medium">ビルド参照</p>
                <code className="text-sm text-muted-foreground">
                  {release.buildRef}
                </code>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">作成日時</p>
              <p className="text-sm text-muted-foreground">
                {new Date(release.createdAt).toLocaleString("ja-JP")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gate Evaluation */}
      {evaluation && (
        <GateEvaluation
          evaluation={evaluation}
          onApprove={
            release.status === "GATE_CHECK" ? handleApprove : undefined
          }
          onIssueWaiver={handleIssueWaiver}
          loading={loading}
        />
      )}

      {/* Waiver Form */}
      {showWaiverForm && (
        <WaiverForm
          releaseId={release.id}
          onSubmit={handleWaiverSubmit}
          onCancel={() => setShowWaiverForm(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
