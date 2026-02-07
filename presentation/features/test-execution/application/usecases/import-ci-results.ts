import { Effect } from "effect";
import { CIResultParser } from "../ports/ci-result-parser";
import { TestRunRepository } from "../ports/test-run-repository";
import { TestResultRepository } from "../ports/test-result-repository";
import { TestRunNotFoundError } from "~/features/test-execution/domain/errors/test-run-errors";

/**
 * Import CI Results Use Case
 *
 * CI/CDパイプラインから出力されたJUnit XMLファイルをインポートし、
 * テストラン結果として記録するユースケース
 *
 * @remarks
 * - JUnit XML形式のテスト結果を自動的にシステムに取り込む
 * - テストケース名でマッチングを行い、対応するRunItemに結果を記録
 * - マッチングできないテストケースはスキップ
 * - インポート完了後、テストランのステータスを自動更新
 *
 * @example
 * ```typescript
 * const program = importCIResults({
 *   runId: "test-run-123",
 *   junitXmlContent: xmlString,
 *   executedBy: "ci-bot-user-id",
 * }).pipe(Effect.provide(TestExecutionLayer));
 *
 * const result = await Effect.runPromise(program);
 * console.log(`${result.imported}/${result.total} 件のテストを記録しました`);
 * ```
 */

export type ImportCIResultsInput = {
  readonly runId: string;
  readonly junitXmlContent: string;
  readonly executedBy: string;
};

export type ImportCIResultsResult = {
  readonly runId: string;
  readonly total: number;
  readonly imported: number;
  readonly skipped: number;
  readonly summary: {
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
  };
};

export const importCIResults = (input: ImportCIResultsInput) =>
  Effect.gen(function* () {
    const parser = yield* CIResultParser;
    const testRunRepo = yield* TestRunRepository;
    const testResultRepo = yield* TestResultRepository;

    // Parse JUnit XML
    const parsedResult = yield* parser.parseJUnitXML(input.junitXmlContent);

    // Fetch test run with items
    const { run, items } = yield* testRunRepo.findByIdWithItems(input.runId);

    if (!run) {
      return yield* Effect.fail(
        new TestRunNotFoundError({
          message: "テストランが見つかりません",
          runId: input.runId,
        }),
      );
    }

    // TODO: テストケース名でのマッチングロジック
    // 現在はスタブ実装: 実際にはテストケース名やクラス名で対応するRunItemを検索
    // 例: item.testCaseTitle と parsedTestCase.name の類似度計算など

    let imported = 0;
    let skipped = 0;
    const summary = {
      passed: 0,
      failed: 0,
      skipped: 0,
    };

    // Import test results
    for (const testCase of parsedResult.testCases) {
      // Stub: 実際のマッチングロジックは未実装
      // ここでは items[0] を使用してスタブ動作を示す
      const matchedItem = items[0]; // TODO: 実際のマッチングロジック

      if (!matchedItem) {
        skipped++;
        continue;
      }

      // Record test result
      const status =
        testCase.status === "PASS"
          ? "PASS"
          : testCase.status === "FAIL"
            ? "FAIL"
            : "SKIPPED";

      yield* testResultRepo.create({
        runItemId: matchedItem.id,
        status,
        evidence: {
          logs: testCase.systemOut || testCase.systemErr,
        },
        executedBy: input.executedBy,
      });

      imported++;

      // Update summary
      if (status === "PASS") summary.passed++;
      else if (status === "FAIL") summary.failed++;
      else if (status === "SKIPPED") summary.skipped++;
    }

    // Auto-update run status to IN_PROGRESS if it was ASSIGNED
    if (run.status === "ASSIGNED") {
      yield* testRunRepo.updateStatus(input.runId, "IN_PROGRESS");
    }

    return {
      runId: input.runId,
      total: parsedResult.testCases.length,
      imported,
      skipped,
      summary,
    };
  });
