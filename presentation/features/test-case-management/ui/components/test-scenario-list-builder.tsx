import { useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  List,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { TestScenarioListItem } from "../../domain/models/test-scenario-list-revision";

/**
 * テストシナリオリストビルダーのProps
 */
type TestScenarioListBuilderProps = {
  /**
   * リストタイトル
   */
  title: string;

  /**
   * リスト説明
   */
  description?: string;

  /**
   * テストシナリオのリスト
   */
  testScenarios: readonly TestScenarioListItem[];

  /**
   * タイトル変更時のコールバック
   */
  onTitleChange: (title: string) => void;

  /**
   * 説明変更時のコールバック
   */
  onDescriptionChange: (description: string) => void;

  /**
   * テストシナリオ追加時のコールバック
   */
  onAddScenario: (scenario: TestScenarioListItem) => void;

  /**
   * テストシナリオ削除時のコールバック
   */
  onRemoveScenario: (index: number) => void;

  /**
   * テストシナリオ順序変更時のコールバック
   */
  onReorderScenarios: (scenarios: readonly TestScenarioListItem[]) => void;

  /**
   * 読み取り専用モード
   */
  readOnly?: boolean;
};

/**
 * テストシナリオリストビルダーコンポーネント
 *
 * テストシナリオリストを構築するためのUI
 */
export function TestScenarioListBuilder({
  title,
  description,
  testScenarios,
  onTitleChange,
  onDescriptionChange,
  onAddScenario,
  onRemoveScenario,
  onReorderScenarios,
  readOnly = false,
}: TestScenarioListBuilderProps) {
  const [newScenarioId, setNewScenarioId] = useState("");
  const [newRevNumber, setNewRevNumber] = useState("1");

  const handleAddScenario = () => {
    if (!newScenarioId.trim()) return;

    const newScenario = new TestScenarioListItem({
      scenarioRevisionId: newScenarioId.trim(),
      order: testScenarios.length + 1,
    });

    onAddScenario(newScenario);
    setNewScenarioId("");
    setNewRevNumber("1");
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newScenarios = [...testScenarios];
    [newScenarios[index - 1], newScenarios[index]] = [
      newScenarios[index],
      newScenarios[index - 1],
    ];

    // order を再計算
    const reordered = newScenarios.map((s, i) =>
      new TestScenarioListItem({
        ...s,
        order: i + 1,
      }),
    );

    onReorderScenarios(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === testScenarios.length - 1) return;

    const newScenarios = [...testScenarios];
    [newScenarios[index], newScenarios[index + 1]] = [
      newScenarios[index + 1],
      newScenarios[index],
    ];

    // order を再計算
    const reordered = newScenarios.map((s, i) =>
      new TestScenarioListItem({
        ...s,
        order: i + 1,
      }),
    );

    onReorderScenarios(reordered);
  };

  return (
    <div className="space-y-6">
      {/* タイトル */}
      <div className="space-y-2">
        <Label htmlFor="list-title">リストタイトル</Label>
        <Input
          id="list-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="テストシナリオリストのタイトルを入力"
          disabled={readOnly}
          className="text-lg font-semibold"
        />
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <Label htmlFor="list-description">説明（オプション）</Label>
        <Textarea
          id="list-description"
          value={description ?? ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="リストの目的や概要を記述（例: リリース1.0のテスト計画）"
          disabled={readOnly}
          rows={3}
        />
      </div>

      {/* テストシナリオリスト */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <List className="h-4 w-4" />
            含まれるテストシナリオ
          </Label>
          <span className="text-sm text-muted-foreground">
            {testScenarios.length} 件
          </span>
        </div>

        {/* テストシナリオ追加フォーム */}
        {!readOnly && (
          <div className="rounded-lg border border-dashed p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="scenario-id">テストシナリオID</Label>
                <Input
                  id="scenario-id"
                  value={newScenarioId}
                  onChange={(e) => setNewScenarioId(e.target.value)}
                  placeholder="scenario-123"
                />
              </div>
              <div className="w-32 space-y-2">
                <Label htmlFor="scenario-rev">Rev番号</Label>
                <Input
                  id="scenario-rev"
                  type="number"
                  min="1"
                  value={newRevNumber}
                  onChange={(e) => setNewRevNumber(e.target.value)}
                  placeholder="1"
                />
              </div>
              <Button type="button" onClick={handleAddScenario}>
                <Plus className="mr-1 h-4 w-4" />
                追加
              </Button>
            </div>
          </div>
        )}

        {/* テストシナリオ一覧 */}
        {testScenarios.length > 0 ? (
          <div className="space-y-2">
            {testScenarios.map((scenario, index) => (
              <div
                key={`${scenario.scenarioRevisionId}-${index}`}
                className="flex items-center gap-2 rounded-lg border bg-card p-4"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <span className="min-w-[2rem] text-sm font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                <div className="flex-1">
                  <div className="font-medium">{scenario.scenarioRevisionId}</div>
                  <div className="text-xs text-muted-foreground">
                    {scenario.includeRule ?? "FULL"}
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
                      title="上へ移動"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>

                    {/* 下へ移動 */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === testScenarios.length - 1}
                      title="下へ移動"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>

                    {/* 削除 */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveScenario(index)}
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
            <List className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              テストシナリオを追加してください
            </p>
          </div>
        )}
      </div>

      {/* サマリー情報 */}
      {testScenarios.length > 0 && (
        <div className="rounded-lg bg-muted p-4">
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">{testScenarios.length}</strong>{" "}
            個のシナリオが含まれています
          </div>
        </div>
      )}
    </div>
  );
}
