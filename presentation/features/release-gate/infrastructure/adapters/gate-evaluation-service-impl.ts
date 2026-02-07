import { Effect, Layer } from "effect";
import { Database } from "@shared/db/layers/prisma-layer";
import type { GateEvaluationService } from "../../application/ports/gate-evaluation-service";
import { GateEvaluationService as GateEvaluationServiceTag } from "../../application/ports/gate-evaluation-service";
import type { GateCondition } from "../../domain/models/gate-condition";
import { DEFAULT_GATE_CONDITIONS } from "../../domain/models/gate-condition";
import { GateViolation } from "../../domain/models/gate-violation";

/**
 * GateEvaluationService実装
 *
 * リリースゲート条件の評価ビジネスロジック
 */
export const GateEvaluationServiceLive = Layer.effect(
  GateEvaluationServiceTag,
  Effect.gen(function* () {
    const prisma = yield* Database;

    const calculateCoverage = (releaseId: string) =>
      Effect.gen(function* () {
        // Get all baselines for the release
        const baselines = yield* Effect.tryPromise({
          try: () =>
            prisma.releaseBaseline.findMany({
              where: { release_id: releaseId },
              include: {
                list_revision: {
                  include: {
                    items: {
                      include: {
                        scenario_revision: {
                          include: {
                            items: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            }),
          catch: (error) =>
            new Error(`ベースライン取得エラー: ${String(error)}`),
        });

        // Get all requirements for the project
        const release = yield* Effect.tryPromise({
          try: () =>
            prisma.release.findUnique({
              where: { id: releaseId },
            }),
          catch: (error) => new Error(`リリース取得エラー: ${String(error)}`),
        });

        if (!release) {
          return 0;
        }

        const requirements = yield* Effect.tryPromise({
          try: () =>
            prisma.requirement.findMany({
              where: { project_id: release.project_id },
            }),
          catch: (error) => new Error(`要件取得エラー: ${String(error)}`),
        });

        if (requirements.length === 0) {
          return 100; // No requirements = 100% coverage
        }

        // Count unique test case revisions from baselines
        const testCaseRevisionIds = new Set<string>();
        for (const baseline of baselines) {
          for (const listItem of baseline.list_revision.items) {
            for (const scenarioItem of listItem.scenario_revision.items) {
              testCaseRevisionIds.add(scenarioItem.case_revision_id);
            }
          }
        }

        // Get mappings for these test case revisions
        const mappings = yield* Effect.tryPromise({
          try: () =>
            prisma.mappingItem.findMany({
              where: {
                target_type: "CASE_REVISION",
                target_revision_id: { in: Array.from(testCaseRevisionIds) },
              },
            }),
          catch: (error) =>
            new Error(`マッピング取得エラー: ${String(error)}`),
        });

        // Count covered requirements
        const coveredRequirementIds = new Set(
          mappings.map((m) => m.requirement_id),
        );

        return (coveredRequirementIds.size / requirements.length) * 100;
      });

    const checkAllTestsPass = (releaseId: string) =>
      Effect.gen(function* () {
        // Get all test run groups for the release
        const runGroups = yield* Effect.tryPromise({
          try: () =>
            prisma.testRunGroup.findMany({
              where: { release_id: releaseId },
              include: {
                test_runs: {
                  include: {
                    items: {
                      include: {
                        results: true,
                      },
                    },
                  },
                },
              },
            }),
          catch: (error) =>
            new Error(`テスト実行グループ取得エラー: ${String(error)}`),
        });

        // Check if all test results are PASS
        for (const group of runGroups) {
          for (const run of group.test_runs) {
            for (const item of run.items) {
              if (item.results.length === 0) {
                return false; // Unexecuted test
              }
              const latestResult = item.results[item.results.length - 1];
              if (latestResult.status !== "PASS") {
                return false; // Failed test
              }
            }
          }
        }

        return true;
      });

    const checkNoCriticalBugs = (releaseId: string) =>
      Effect.gen(function* () {
        // Get all test run groups for the release
        const runGroups = yield* Effect.tryPromise({
          try: () =>
            prisma.testRunGroup.findMany({
              where: { release_id: releaseId },
              include: {
                test_runs: {
                  include: {
                    items: {
                      include: {
                        results: true,
                      },
                    },
                  },
                },
              },
            }),
          catch: (error) =>
            new Error(`テスト実行グループ取得エラー: ${String(error)}`),
        });

        // Check bug_links in test results for critical/high severity
        for (const group of runGroups) {
          for (const run of group.test_runs) {
            for (const item of run.items) {
              for (const result of item.results) {
                if (result.bug_links) {
                  const bugs = result.bug_links as {
                    url: string;
                    title: string;
                    severity?: string;
                  }[];
                  for (const bug of bugs) {
                    if (
                      bug.severity === "CRITICAL" ||
                      bug.severity === "HIGH"
                    ) {
                      return false;
                    }
                  }
                }
              }
            }
          }
        }

        return true;
      });

    const checkAllApprovalsComplete = (releaseId: string) =>
      Effect.gen(function* () {
        // Get all baselines for the release
        const baselines = yield* Effect.tryPromise({
          try: () =>
            prisma.releaseBaseline.findMany({
              where: { release_id: releaseId },
              include: {
                list_revision: true,
              },
            }),
          catch: (error) =>
            new Error(`ベースライン取得エラー: ${String(error)}`),
        });

        // Check if all list revisions are APPROVED
        for (const baseline of baselines) {
          if (baseline.list_revision.status !== "APPROVED") {
            return false;
          }
        }

        return true;
      });

    const checkNoUnapprovedChanges = (releaseId: string) =>
      Effect.gen(function* () {
        // Get the project for this release
        const release = yield* Effect.tryPromise({
          try: () =>
            prisma.release.findUnique({
              where: { id: releaseId },
            }),
          catch: (error) => new Error(`リリース取得エラー: ${String(error)}`),
        });

        if (!release) {
          return false;
        }

        // Check for any IN_REVIEW or DEPRECATED revisions
        const unapprovedRevisions = yield* Effect.tryPromise({
          try: async () => {
            const caseRevisions = await prisma.testCaseRevision.count({
              where: {
                test_case: { project_id: release.project_id },
                status: { in: ["IN_REVIEW", "DEPRECATED"] },
              },
            });

            const scenarioRevisions = await prisma.testScenarioRevision.count({
              where: {
                scenario: { project_id: release.project_id },
                status: { in: ["IN_REVIEW", "DEPRECATED"] },
              },
            });

            const listRevisions = await prisma.testScenarioListRevision.count({
              where: {
                list: { project_id: release.project_id },
                status: { in: ["IN_REVIEW", "DEPRECATED"] },
              },
            });

            return caseRevisions + scenarioRevisions + listRevisions;
          },
          catch: (error) =>
            new Error(`未承認リビジョンチェックエラー: ${String(error)}`),
        });

        return unapprovedRevisions === 0;
      });

    const evaluate = (
      releaseId: string,
      conditions?: readonly GateCondition[],
    ) =>
      Effect.gen(function* () {
        const evaluationConditions = conditions ?? DEFAULT_GATE_CONDITIONS;
        const violations: GateViolation[] = [];

        for (const condition of evaluationConditions) {
          switch (condition.type) {
            case "MIN_TEST_COVERAGE": {
              const coverage = yield* calculateCoverage(releaseId);
              const threshold = condition.threshold ?? 80;
              if (coverage < threshold) {
                violations.push(
                  new GateViolation({
                    conditionType: condition.type,
                    severity: condition.required ? "CRITICAL" : "WARNING",
                    message: `テストカバレッジが不足しています（${coverage.toFixed(1)}% < ${threshold}%）`,
                    details: {
                      expected: threshold,
                      actual: coverage,
                    },
                    suggestedAction:
                      "要件に対するテストケースのマッピングを追加してください",
                  }),
                );
              }
              break;
            }

            case "ALL_TESTS_PASS": {
              const allPass = yield* checkAllTestsPass(releaseId);
              if (!allPass) {
                violations.push(
                  new GateViolation({
                    conditionType: condition.type,
                    severity: condition.required ? "CRITICAL" : "WARNING",
                    message: "失敗または未実行のテストケースが存在します",
                    suggestedAction:
                      "全てのテストケースを実行し、失敗したテストを修正してください",
                  }),
                );
              }
              break;
            }

            case "NO_CRITICAL_BUGS": {
              const noCriticalBugs = yield* checkNoCriticalBugs(releaseId);
              if (!noCriticalBugs) {
                violations.push(
                  new GateViolation({
                    conditionType: condition.type,
                    severity: condition.required ? "CRITICAL" : "WARNING",
                    message: "致命的（Critical/High）なバグがリンクされています",
                    suggestedAction:
                      "致命的なバグを修正するか、Waiverを発行してください",
                  }),
                );
              }
              break;
            }

            case "ALL_APPROVALS_COMPLETE": {
              const allApproved = yield* checkAllApprovalsComplete(releaseId);
              if (!allApproved) {
                violations.push(
                  new GateViolation({
                    conditionType: condition.type,
                    severity: condition.required ? "CRITICAL" : "WARNING",
                    message: "未承認のテストシナリオリストが存在します",
                    suggestedAction:
                      "全てのテストシナリオリストの承認を完了してください",
                  }),
                );
              }
              break;
            }

            case "NO_UNAPPROVED_CHANGES": {
              const noUnapproved = yield* checkNoUnapprovedChanges(releaseId);
              if (!noUnapproved) {
                violations.push(
                  new GateViolation({
                    conditionType: condition.type,
                    severity: condition.required ? "CRITICAL" : "INFO",
                    message: "承認待ちまたは却下されたリビジョンが存在します",
                    suggestedAction:
                      "全てのリビジョンの承認を完了するか、不要なリビジョンを削除してください",
                  }),
                );
              }
              break;
            }
          }
        }

        return {
          releaseId,
          conditions: evaluationConditions,
          violations,
          passed: !violations.some((v) => v.severity === "CRITICAL"),
          evaluatedAt: new Date(),
        };
      });

    return {
      evaluate,
      calculateCoverage,
      checkAllTestsPass,
      checkNoCriticalBugs,
      checkAllApprovalsComplete,
      checkNoUnapprovedChanges,
    };
  }),
);
