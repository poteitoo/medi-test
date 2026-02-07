import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import type { RevisionStatus } from "~/features/test-case-management/domain/models/revision-status";

/**
 * ApprovalPanelのProps
 */
type ApprovalPanelProps = {
  /**
   * リビジョンID
   */
  revisionId: string;

  /**
   * 現在のステータス
   */
  currentStatus: RevisionStatus;

  /**
   * 承認時のコールバック
   */
  onApprove: (revisionId: string, comment?: string) => Promise<void>;

  /**
   * 却下時のコールバック
   */
  onReject: (revisionId: string, comment: string) => Promise<void>;

  /**
   * 処理中フラグ
   */
  isSubmitting?: boolean;
};

/**
 * ApprovalPanelコンポーネント
 *
 * リビジョンの承認・却下を行うUI
 */
export function ApprovalPanel({
  revisionId,
  currentStatus,
  onApprove,
  onReject,
  isSubmitting = false,
}: ApprovalPanelProps) {
  const [comment, setComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // 承認待ち以外は操作不可
  const canApprove = currentStatus === "IN_REVIEW";

  const handleApprove = async () => {
    try {
      await onApprove(revisionId, comment || undefined);
      setComment("");
    } catch (error) {
      console.error("承認エラー:", error);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      alert("却下理由を入力してください");
      return;
    }

    try {
      await onReject(revisionId, comment);
      setComment("");
      setShowRejectForm(false);
    } catch (error) {
      console.error("却下エラー:", error);
    }
  };

  if (!canApprove) {
    return (
      <div className="rounded-lg border bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">
          このリビジョンは承認・却下できません（ステータス: {currentStatus}）
        </p>
      </div>
    );
  }

  if (showRejectForm) {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold">却下理由を入力</h3>
          <p className="text-sm text-muted-foreground">
            却下する理由を具体的に記入してください
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reject-comment">却下理由（必須）</Label>
          <Textarea
            id="reject-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="例: テスト手順が不明確です。ステップ3の操作内容を詳しく記述してください。"
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting || !comment.trim()}
          >
            <X className="mr-2 h-4 w-4" />
            却下する
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowRejectForm(false);
              setComment("");
            }}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div>
        <h3 className="mb-2 text-lg font-semibold">承認・却下</h3>
        <p className="text-sm text-muted-foreground">
          このリビジョンをレビューして承認または却下してください
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approval-comment">コメント（オプション）</Label>
        <Textarea
          id="approval-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="承認時のコメントを入力（省略可）"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          onClick={handleApprove}
          disabled={isSubmitting}
        >
          <Check className="mr-2 h-4 w-4" />
          承認する
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowRejectForm(true)}
          disabled={isSubmitting}
        >
          <X className="mr-2 h-4 w-4" />
          却下する
        </Button>
      </div>
    </div>
  );
}
