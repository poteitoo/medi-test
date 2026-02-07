import { useState } from "react";
import { WAIVER_TARGET_TYPE_LABELS } from "../../domain/models/waiver";
import type { WaiverTargetType } from "../../domain/models/waiver";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type WaiverFormProps = {
  readonly releaseId: string;
  readonly onSubmit: (data: {
    targetType: WaiverTargetType;
    targetId?: string;
    reason: string;
    expiresAt: Date;
  }) => void;
  readonly onCancel?: () => void;
  readonly loading?: boolean;
};

/**
 * WaiverForm Component
 *
 * Waiver発行フォーム
 */
export function WaiverForm({
  releaseId,
  onSubmit,
  onCancel,
  loading,
}: WaiverFormProps) {
  const [targetType, setTargetType] = useState<WaiverTargetType>("OTHER");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim() || !expiresAt) {
      return;
    }

    onSubmit({
      targetType,
      targetId: targetId.trim() || undefined,
      reason: reason.trim(),
      expiresAt: new Date(expiresAt),
    });
  };

  // Default to 30 days from now
  const defaultExpiresAt = new Date();
  defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 30);
  const defaultExpiresAtStr = defaultExpiresAt.toISOString().split("T")[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waiver発行</CardTitle>
        <CardDescription>
          ゲート条件違反に対してWaiverを発行します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetType">対象タイプ</Label>
            <Select
              value={targetType}
              onValueChange={(value) => setTargetType(value as WaiverTargetType)}
            >
              <SelectTrigger id="targetType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WAIVER_TARGET_TYPE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetId">対象ID（オプション）</Label>
            <Input
              id="targetId"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="TestResult ID、Revision ID等"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">理由（必須）</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Waiverを発行する理由を入力してください（10文字以上）"
              rows={4}
              required
              minLength={10}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/1000文字
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">有効期限</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt || defaultExpiresAtStr}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                キャンセル
              </Button>
            )}
            <Button type="submit" disabled={loading || reason.length < 10}>
              {loading ? "発行中..." : "Waiverを発行"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
