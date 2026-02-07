import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { TestScenarioCaseRef } from "../../domain/models/test-scenario-revision";

/**
 * テストシナリオビルダーのProps
 */
type TestScenarioBuilderProps = {
  /**
   * シナリオタイトル
   */
  title: string;

  /**
   * シナリオ説明
   */
  description?: string;

  /**
   * テストケースのリスト
   */
  testCases: readonly TestScenarioCaseRef[];

  /**
   * タイトル変更時のコールバック
   */
  onTitleChange: (title: string) => void;

  /**
   * 説明変更時のコールバック
   */
  onDescriptionChange: (description: string) => void;

  /**
   * テストケース追加時のコールバック
   */
  onAddTestCase: (testCase: TestScenarioCaseRef) => void;

  /**
   * テストケース削除時のコールバック
   */
  onRemoveTestCase: (index: number) => void;

  /**
   * テストケース順序変更時のコールバック
   */
  onReorderTestCases: (testCases: readonly TestScenarioCaseRef[]) => void;

  /**
   * 読み取り専用モード
   */
  readOnly?: boolean;
};

/**
 * テストシナリオビルダーコンポーネント
 *
 * テストシナリオを構築するためのUI
 */
export function TestScenarioBuilder({
  title,
  description,
  testCases,
  onTitleChange,
  onDescriptionChange,
  onAddTestCase,
  onRemoveTestCase,
  onReorderTestCases,
  readOnly = false,
}: TestScenarioBuilderProps) {
  const [newCaseId, setNewCaseId] = useState("");
  const [newRevNumber, setNewRevNumber] = useState("1");

  const handleAddCase = () => {
    if (!newCaseId.trim()) return;

    const newCase = new TestScenarioCaseRef({
      caseId: newCaseId.trim(),
      revisionNumber: Number.parseInt(newRevNumber, 10) || 1,
      order: testCases.length + 1,
    });

    onAddTestCase(newCase);
    setNewCaseId("");
    setNewRevNumber("1");
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newTestCases = [...testCases];
    [newTestCases[index - 1], newTestCases[index]] = [
      newTestCases[index],
      newTestCases[index - 1],
    ];

    // order を再計算
    const reordered = newTestCases.map((tc, i) => ({
      ...tc,
      order: i + 1,
    }));

    onReorderTestCases(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === testCases.length - 1) return;

    const newTestCases = [...testCases];
    [newTestCases[index], newTestCases[index + 1]] = [
      newTestCases[index + 1],
      newTestCases[index],
    ];

    // order を再計算
    const reordered = newTestCases.map((tc, i) => ({
      ...tc,
      order: i + 1,
    }));

    onReorderTestCases(reordered);
  };

  return (
    <div className="space-y-6">
      {/* タイトル */}
      <div className="space-y-2">
        <Label htmlFor="scenario-title">シナリオタイトル</Label>
        <Input
          id="scenario-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="テストシナリオのタイトルを入力"
          disabled={readOnly}
          className="text-lg font-semibold"
        />
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <Label htmlFor="scenario-description">説明（オプション）</Label>
        <Textarea
          id="scenario-description"
          value={description ?? ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="シナリオの目的や概要を記述"
          disabled={readOnly}
          rows={3}
        />
      </div>

      {/* テストケースリスト */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>含まれるテストケース</Label>
          <span className="text-sm text-muted-foreground">
            {testCases.length} 件
          </span>
        </div>

        {/* テストケース追加フォーム */}
        {!readOnly && (
          <div className="rounded-lg border border-dashed p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="case-id">テストケースID</Label>
                <Input
                  id="case-id"
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  placeholder="case-123"
                />
              </div>
              <div className="w-32 space-y-2">
                <Label htmlFor="rev-number">Rev番号</Label>
                <Input
                  id="rev-number"
                  type="number"
                  min="1"
                  value={newRevNumber}
                  onChange={(e) => setNewRevNumber(e.target.value)}
                  placeholder="1"
                />
              </div>
              <Button type="button" onClick={handleAddCase}>
                <Plus className="mr-1 h-4 w-4" />
                追加
              </Button>
            </div>
          </div>
        )}

        {/* テストケース一覧 */}
        {testCases.length > 0 ? (
          <div className="space-y-2">
            {testCases.map((testCase, index) => (
              <div
                key={`${testCase.caseId}-${index}`}
                className="flex items-center gap-2 rounded-lg border p-3"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <span className="min-w-[2rem] text-sm font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                <div className="flex-1">
                  <div className="font-medium">{testCase.caseId}</div>
                  <div className="text-xs text-muted-foreground">
                    Rev {testCase.revisionNumber}
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-1">
                    {/* 上へ移動 */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>

                    {/* 下へ移動 */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === testCases.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>

                    {/* 削除 */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveTestCase(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            テストケースを追加してください
          </p>
        )}
      </div>
    </div>
  );
}
