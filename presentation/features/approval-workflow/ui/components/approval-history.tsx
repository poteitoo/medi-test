import { Check, X, User, Clock, MessageSquare } from "lucide-react";
import { formatDateTime } from "~/lib/utils/date";
import type { Approval } from "../../domain/models/approval";
import { APPROVAL_ACTION_LABELS } from "../../domain/models/approval";

/**
 * ApprovalHistoryのProps
 */
type ApprovalHistoryProps = {
  /**
   * 承認履歴のリスト
   */
  approvals: readonly Approval[];

  /**
   * 読み込み中フラグ
   */
  isLoading?: boolean;

  /**
   * 空の場合のメッセージ
   */
  emptyMessage?: string;
};

/**
 * ApprovalHistoryコンポーネント
 *
 * オブジェクトの承認・却下履歴を表示する
 */
export function ApprovalHistory({
  approvals,
  isLoading = false,
  emptyMessage = "承認履歴がありません",
}: ApprovalHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
        <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">承認履歴</h3>

      <div className="space-y-3">
        {approvals.map((approval) => {
          const isApproved = approval.decision === "APPROVED";

          return (
            <div
              key={approval.id}
              className={`rounded-lg border p-4 ${
                isApproved
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              {/* ヘッダー: アクションとユーザー */}
              <div className="mb-2 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  {isApproved ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
                      <X className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div>
                    <div
                      className={`font-semibold ${
                        isApproved ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {APPROVAL_ACTION_LABELS[approval.decision]}
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-sm ${
                        isApproved ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>{approval.approverId}</span>
                    </div>
                  </div>
                </div>

                {/* 日時 */}
                <div
                  className={`flex items-center gap-1.5 text-sm ${
                    isApproved ? "text-green-700" : "text-red-700"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDateTime(approval.timestamp)}</span>
                </div>
              </div>

              {/* コメント */}
              {approval.comment && (
                <div
                  className={`mt-3 rounded border p-3 text-sm ${
                    isApproved
                      ? "border-green-200 bg-white text-green-900"
                      : "border-red-200 bg-white text-red-900"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    コメント
                  </div>
                  <p className="whitespace-pre-wrap">{approval.comment}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
