import { useState } from "react";
import { Check, X, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import type { RevisionStatus } from "~/features/test-case-management/domain/models/revision-status";
import type { EvidenceLink } from "../../domain/models/approval";

/**
 * ApprovalPanelのProps
 */
type ApprovalPanelProps = {
  /**
   * オブジェクトタイプ
   */
  objectType?: string;

  /**
   * オブジェクトID
   */
  objectId: string;

  /**
   * 現在のステップ
   */
  currentStep?: number;

  /**
   * 現在のステータス
   */
  currentStatus?: RevisionStatus;

  /**
   * 承認時のコールバック
   */
  onApprove: (data: {
    objectId: string;
    comment?: string;
    evidenceLinks?: EvidenceLink[];
  }) => Promise<void>;

  /**
   * 却下時のコールバック
   */
  onReject: (data: {
    objectId: string;
    comment: string;
    evidenceLinks?: EvidenceLink[];
  }) => Promise<void>;

  /**
   * 無効化フラグ
   */
  disabled?: boolean;
};

/**
 * ApprovalPanelコンポーネント
 *
 * @description
 * リビジョンの承認・却下を行うUIコンポーネントです。
 * コメントと証拠リンクを入力できます。
 */
export function ApprovalPanel({
  objectId,
  currentStatus,
  onApprove,
  onReject,
  disabled = false,
}: ApprovalPanelProps) {
  const [comment, setComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [evidenceLinks, setEvidenceLinks] = useState<EvidenceLink[]>([]);

  // 承認待ち以外は操作不可
  const canApprove = currentStatus === "IN_REVIEW";
  const isDisabled = disabled || !canApprove;

  const handleApprove = async () => {
    try {
      await onApprove({
        objectId,
        comment: comment || undefined,
        evidenceLinks: evidenceLinks.length > 0 ? evidenceLinks : undefined,
      });
      setComment("");
      setEvidenceLinks([]);
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
      await onReject({
        objectId,
        comment,
        evidenceLinks: evidenceLinks.length > 0 ? evidenceLinks : undefined,
      });
      setComment("");
      setEvidenceLinks([]);
      setShowRejectForm(false);
    } catch (error) {
      console.error("却下エラー:", error);
    }
  };

  const addEvidenceLink = () => {
    setEvidenceLinks([...evidenceLinks, { url: "", title: "" }]);
  };

  const removeEvidenceLink = (index: number) => {
    setEvidenceLinks(evidenceLinks.filter((_, i) => i !== index));
  };

  const updateEvidenceLink = (
    index: number,
    field: keyof EvidenceLink,
    value: string,
  ) => {
    const updated = [...evidenceLinks];
    updated[index] = { ...updated[index], [field]: value };
    setEvidenceLinks(updated);
  };

  if (!canApprove) {
    return (
      <div className="rounded-lg border bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">
          このリビジョンは承認・却下できません
          {currentStatus && `（ステータス: ${currentStatus}）`}
        </p>
      </div>
    );
  }

  if (showRejectForm) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">却下理由を入力</h3>
          <p className="text-sm text-muted-foreground">
            却下する理由を具体的に記入してください
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reject-comment">却下理由（必須）</Label>
            <Textarea
              id="reject-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="例: テスト手順が不明確です。ステップ3の操作内容を詳しく記述してください。"
              rows={4}
              disabled={isDisabled}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>証拠リンク（オプション）</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEvidenceLink}
                disabled={isDisabled}
              >
                <Plus className="mr-2 h-4 w-4" />
                追加
              </Button>
            </div>

            {evidenceLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) =>
                    updateEvidenceLink(index, "url", e.target.value)
                  }
                  disabled={isDisabled}
                  className="flex-1"
                />
                <Input
                  placeholder="タイトル"
                  value={link.title}
                  onChange={(e) =>
                    updateEvidenceLink(index, "title", e.target.value)
                  }
                  disabled={isDisabled}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEvidenceLink(index)}
                  disabled={isDisabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isDisabled || !comment.trim()}
            >
              <X className="mr-2 h-4 w-4" />
              却下する
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectForm(false);
                setComment("");
                setEvidenceLinks([]);
              }}
              disabled={isDisabled}
            >
              キャンセル
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">承認・却下</h3>
        <p className="text-sm text-muted-foreground">
          このリビジョンをレビューして承認または却下してください
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="approval-comment">コメント（オプション）</Label>
          <Textarea
            id="approval-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="承認時のコメントを入力（省略可）"
            rows={3}
            disabled={isDisabled}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>証拠リンク（オプション）</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEvidenceLink}
              disabled={isDisabled}
            >
              <Plus className="mr-2 h-4 w-4" />
              追加
            </Button>
          </div>

          {evidenceLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="URL"
                value={link.url}
                onChange={(e) =>
                  updateEvidenceLink(index, "url", e.target.value)
                }
                disabled={isDisabled}
                className="flex-1"
              />
              <Input
                placeholder="タイトル"
                value={link.title}
                onChange={(e) =>
                  updateEvidenceLink(index, "title", e.target.value)
                }
                disabled={isDisabled}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeEvidenceLink(index)}
                disabled={isDisabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={handleApprove}
            disabled={isDisabled}
          >
            <Check className="mr-2 h-4 w-4" />
            承認する
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejectForm(true)}
            disabled={isDisabled}
          >
            <X className="mr-2 h-4 w-4" />
            却下する
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
