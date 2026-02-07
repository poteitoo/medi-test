import { useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, GitBranch, Edit, Send } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { TestCaseEditor } from "~/features/test-case-management/ui/components/test-case-editor";
import { RevisionHistory } from "~/features/test-case-management/ui/components/revision-history";
import { DiffViewer } from "~/features/test-case-management/ui/components/diff-viewer";
import { useTestCaseDetail } from "~/features/test-case-management/ui/hooks/use-test-case";
import { useRevisionManagement } from "~/features/test-case-management/ui/hooks/use-revision-management";
import { TestCaseStatusBadge } from "~/components/ui/status-badge";
import type { TestCaseContent } from "~/features/test-case-management/domain/models/test-case-content";

/**
 * テストケース詳細ページ
 *
 * テストケースの詳細情報、リビジョン履歴、差分表示を行う
 */
export default function TestCaseDetailPage() {
  const { caseId } = useParams();
  const { revisions, isLoading, error, reload } = useTestCaseDetail(
    caseId || "",
  );
  const { submitReview, isSubmitting } = useRevisionManagement();

  const [selectedRevisionId, setSelectedRevisionId] = useState<
    string | undefined
  >();
  const [compareRevisionId, setCompareRevisionId] = useState<
    string | undefined
  >();

  const latestRevision = revisions[0];
  const selectedRevision =
    revisions.find((r) => r.id === selectedRevisionId) || latestRevision;
  const compareRevision = revisions.find((r) => r.id === compareRevisionId);

  const handleSubmitForReview = async () => {
    if (!latestRevision) return;

    try {
      await submitReview(latestRevision.id);
      reload();
    } catch (err) {
      console.error("レビュー提出エラー:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error || !latestRevision) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-800">
            {error?.message || "テストケースが見つかりません"}
          </p>
          <Link to="/test-cases">
            <Button variant="outline" className="mt-4">
              一覧に戻る
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <Link
          to="/test-cases"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          テストケース一覧に戻る
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold">{latestRevision.title}</h1>
              <TestCaseStatusBadge status={latestRevision.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Rev {latestRevision.rev}</span>
              <span>作成者: {latestRevision.createdBy}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {latestRevision.status === "DRAFT" && (
              <Button onClick={handleSubmitForReview} disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                レビューに提出
              </Button>
            )}
            <Link to={`/test-cases/${caseId}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* タブ */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">内容</TabsTrigger>
          <TabsTrigger value="history">
            <GitBranch className="mr-2 h-4 w-4" />
            履歴 ({revisions.length})
          </TabsTrigger>
          {compareRevision && <TabsTrigger value="diff">差分表示</TabsTrigger>}
        </TabsList>

        {/* 内容タブ */}
        <TabsContent value="content">
          <div className="rounded-lg border bg-card p-6">
            <TestCaseEditor
              title={selectedRevision.title}
              content={selectedRevision.content}
              onTitleChange={() => {}}
              onContentChange={() => {}}
              readOnly
            />
          </div>
        </TabsContent>

        {/* 履歴タブ */}
        <TabsContent value="history">
          <div className="grid gap-6 lg:grid-cols-2">
            <RevisionHistory
              revisions={revisions}
              selectedRevisionId={selectedRevisionId}
              onRevisionSelect={setSelectedRevisionId}
            />

            {selectedRevision && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Rev {selectedRevision.rev} の内容
                  </h3>
                  {selectedRevisionId &&
                    selectedRevisionId !== latestRevision.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompareRevisionId(selectedRevisionId)}
                      >
                        最新版と比較
                      </Button>
                    )}
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <TestCaseEditor
                    title={selectedRevision.title}
                    content={selectedRevision.content}
                    onTitleChange={() => {}}
                    onContentChange={() => {}}
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 差分タブ */}
        {compareRevision && (
          <TabsContent value="diff">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">リビジョン間の差分</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompareRevisionId(undefined)}
                >
                  比較を終了
                </Button>
              </div>
              <DiffViewer
                oldRevision={compareRevision}
                newRevision={latestRevision}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
