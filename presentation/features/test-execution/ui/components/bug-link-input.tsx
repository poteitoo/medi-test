import { useState, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type BugLink = {
  readonly url: string;
  readonly title: string;
  readonly severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
};

type BugLinkInputProps = {
  readonly onLinksChange: (links: readonly BugLink[]) => void;
  readonly maxLinks?: number;
  readonly existingLinks?: readonly BugLink[];
  readonly required?: boolean;
};

const SEVERITY_OPTIONS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "致命的",
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

const SEVERITY_VARIANTS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 hover:bg-red-200",
  HIGH: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  LOW: "bg-blue-100 text-blue-800 hover:bg-blue-200",
};

/**
 * BugLinkInput Component
 *
 * テスト結果に関連するバグトラッキングシステムのリンクを入力するコンポーネント
 *
 * @remarks
 * - 複数のバグリンクを登録可能
 * - 各リンクに重要度（CRITICAL/HIGH/MEDIUM/LOW）を設定可能
 * - URLとタイトルは必須、重要度はオプション
 * - FAIL または BLOCKED 結果の場合は required=true を推奨
 */
export function BugLinkInput({
  onLinksChange,
  maxLinks = 5,
  existingLinks = [],
  required = false,
}: BugLinkInputProps) {
  const [links, setLinks] = useState<readonly BugLink[]>(existingLinks);
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentSeverity, setCurrentSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddLink = useCallback(() => {
    setError(null);

    // Validation
    if (!currentUrl.trim()) {
      setError("URLを入力してください");
      return;
    }

    if (!validateUrl(currentUrl)) {
      setError("有効なURLを入力してください");
      return;
    }

    if (!currentTitle.trim()) {
      setError("タイトルを入力してください");
      return;
    }

    if (links.length >= maxLinks) {
      setError(`最大${maxLinks}件までリンクを追加できます`);
      return;
    }

    const newLink: BugLink = {
      url: currentUrl.trim(),
      title: currentTitle.trim(),
      severity: currentSeverity,
    };

    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    onLinksChange(updatedLinks);

    // Clear form
    setCurrentUrl("");
    setCurrentTitle("");
    setCurrentSeverity(undefined);
  }, [currentUrl, currentTitle, currentSeverity, links, maxLinks, onLinksChange]);

  const handleRemoveLink = useCallback(
    (index: number) => {
      const updatedLinks = links.filter((_, i) => i !== index);
      setLinks(updatedLinks);
      onLinksChange(updatedLinks);
    },
    [links, onLinksChange],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          バグリンク
          {required && <span className="ml-1 text-destructive">*</span>}
        </CardTitle>
        <CardDescription>
          関連するバグトラッキングシステムのリンクを追加（最大{maxLinks}件）
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Link Form */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="bug-url">URL</Label>
            <Input
              id="bug-url"
              type="url"
              placeholder="https://your-tracker.com/issue/123"
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              disabled={links.length >= maxLinks}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-title">タイトル</Label>
            <Input
              id="bug-title"
              type="text"
              placeholder="ログイン画面でエラーが発生する"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              disabled={links.length >= maxLinks}
            />
          </div>

          <div className="space-y-2">
            <Label>重要度（オプション）</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SEVERITY_OPTIONS.map((severity) => (
                <Button
                  key={severity}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    currentSeverity === severity && SEVERITY_VARIANTS[severity],
                  )}
                  onClick={() => setCurrentSeverity(currentSeverity === severity ? undefined : severity)}
                  disabled={links.length >= maxLinks}
                >
                  {SEVERITY_LABELS[severity]}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="button"
            onClick={handleAddLink}
            disabled={links.length >= maxLinks}
            className="w-full"
          >
            リンクを追加
          </Button>
        </div>

        {/* Link List */}
        {links.length > 0 && (
          <div className="space-y-2">
            <Label>追加済みバグリンク ({links.length}/{maxLinks})</Label>
            <div className="space-y-2">
              {links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {link.severity && (
                        <Badge
                          variant="outline"
                          className={cn("text-xs", SEVERITY_VARIANTS[link.severity])}
                        >
                          {SEVERITY_LABELS[link.severity]}
                        </Badge>
                      )}
                      <p className="text-sm font-medium">{link.title}</p>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-muted-foreground hover:underline"
                    >
                      {link.url}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLink(index)}
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {required && links.length === 0 && (
          <p className="text-sm text-muted-foreground">
            ℹ️ FAIL または BLOCKED の場合、バグリンクの追加を推奨します
          </p>
        )}
      </CardContent>
    </Card>
  );
}
