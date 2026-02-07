import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
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
import type {
  TestCaseContent,
  TestCasePriority,
} from "../../domain/models/test-case-content";

/**
 * テストケースエディターのProps
 */
type TestCaseEditorProps = {
  /**
   * タイトル
   */
  title: string;

  /**
   * テストケースの内容
   */
  content: TestCaseContent;

  /**
   * タイトル変更時のコールバック
   */
  onTitleChange: (title: string) => void;

  /**
   * 内容変更時のコールバック
   */
  onContentChange: (content: TestCaseContent) => void;

  /**
   * 読み取り専用モード
   */
  readOnly?: boolean;
};

/**
 * テストケースエディターコンポーネント
 *
 * テストケースの内容を編集するためのフォーム
 */
export function TestCaseEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  readOnly = false,
}: TestCaseEditorProps) {
  const [steps, setSteps] = useState<readonly string[]>(content.steps);

  const handleAddStep = () => {
    const newSteps = [...steps, ""];
    setSteps(newSteps);
    onContentChange({ ...content, steps: newSteps });
  };

  const handleUpdateStep = (index: number, value: string) => {
    const newSteps = steps.map((step, i) => (i === index ? value : step));
    setSteps(newSteps);
    onContentChange({ ...content, steps: newSteps });
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    onContentChange({ ...content, steps: newSteps });
  };

  return (
    <div className="space-y-6">
      {/* タイトル */}
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="テストケースのタイトルを入力"
          disabled={readOnly}
          className="text-lg font-semibold"
        />
      </div>

      {/* 前提条件 */}
      <div className="space-y-2">
        <Label htmlFor="preconditions">前提条件（オプション）</Label>
        <Textarea
          id="preconditions"
          value={content.preconditions ?? ""}
          onChange={(e) =>
            onContentChange({ ...content, preconditions: e.target.value })
          }
          placeholder="テスト実行前の前提条件を記述"
          disabled={readOnly}
          rows={3}
        />
      </div>

      {/* テスト手順 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>テスト手順</Label>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStep}
            >
              <Plus className="mr-1 h-4 w-4" />
              ステップを追加
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <span className="min-w-[2rem] text-sm font-medium text-muted-foreground">
                  {index + 1}.
                </span>
              </div>
              <Input
                value={step}
                onChange={(e) => handleUpdateStep(index, e.target.value)}
                placeholder={`ステップ ${index + 1} を入力`}
                disabled={readOnly}
                className="flex-1"
              />
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveStep(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {steps.length === 0 && (
          <p className="text-sm text-muted-foreground">
            テスト手順を追加してください
          </p>
        )}
      </div>

      {/* 期待結果 */}
      <div className="space-y-2">
        <Label htmlFor="expected-result">期待結果</Label>
        <Textarea
          id="expected-result"
          value={content.expected_result}
          onChange={(e) =>
            onContentChange({ ...content, expected_result: e.target.value })
          }
          placeholder="テスト実行後の期待される結果を記述"
          disabled={readOnly}
          rows={3}
        />
      </div>

      {/* テストデータ */}
      <div className="space-y-2">
        <Label htmlFor="test-data">テストデータ（オプション）</Label>
        <Textarea
          id="test-data"
          value={content.test_data ?? ""}
          onChange={(e) =>
            onContentChange({ ...content, test_data: e.target.value })
          }
          placeholder="テストに使用するデータを記述"
          disabled={readOnly}
          rows={3}
        />
      </div>

      {/* 優先度と環境 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 優先度 */}
        <div className="space-y-2">
          <Label htmlFor="priority">優先度</Label>
          <Select
            value={content.priority ?? "MEDIUM"}
            onValueChange={(value) =>
              onContentChange({
                ...content,
                priority: value as TestCasePriority,
              })
            }
            disabled={readOnly}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="優先度を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">低</SelectItem>
              <SelectItem value="MEDIUM">中</SelectItem>
              <SelectItem value="HIGH">高</SelectItem>
              <SelectItem value="CRITICAL">緊急</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* テスト環境 */}
        <div className="space-y-2">
          <Label htmlFor="environment">テスト環境（オプション）</Label>
          <Input
            id="environment"
            value={content.environment ?? ""}
            onChange={(e) =>
              onContentChange({ ...content, environment: e.target.value })
            }
            placeholder="例: staging, production"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* タグ */}
      <div className="space-y-2">
        <Label htmlFor="tags">タグ（カンマ区切り）</Label>
        <Input
          id="tags"
          value={content.tags?.join(", ") ?? ""}
          onChange={(e) =>
            onContentChange({
              ...content,
              tags: e.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
          placeholder="例: 認証, 重要, API"
          disabled={readOnly}
        />
      </div>

      {/* 備考 */}
      <div className="space-y-2">
        <Label htmlFor="notes">備考（オプション）</Label>
        <Textarea
          id="notes"
          value={content.notes ?? ""}
          onChange={(e) =>
            onContentChange({ ...content, notes: e.target.value })
          }
          placeholder="追加のメモや注意事項"
          disabled={readOnly}
          rows={3}
        />
      </div>
    </div>
  );
}
