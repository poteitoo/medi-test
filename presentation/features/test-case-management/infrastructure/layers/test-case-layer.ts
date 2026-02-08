import { Layer } from "effect";
import { PrismaLayer } from "@shared/db/layers/prisma-layer";
import { PrismaTestCaseRepositoryLive } from "../adapters/prisma-test-case-repository";
import { PrismaTestScenarioRepositoryLive } from "../adapters/prisma-test-scenario-repository";
import { PrismaTestScenarioListRepositoryLive } from "../adapters/prisma-test-scenario-list-repository";

/**
 * Test Case Management Layer
 *
 * テストケース管理機能のすべてのリポジトリを統合したレイヤー。
 * このレイヤーを提供することで、TestCaseRepository、TestScenarioRepository、
 * TestScenarioListRepositoryの3つのリポジトリが利用可能になります。
 *
 * このレイヤーはPrismaLayerに依存しており、データベースアクセスに
 * PrismaClientを使用します。
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import { TestCaseRepository } from "../application/ports/test-case-repository";
 * import { TestScenarioRepository } from "../application/ports/test-scenario-repository";
 * import { TestScenarioListRepository } from "../application/ports/test-scenario-list-repository";
 * import { TestCaseManagementLayer } from "../infrastructure/layers/test-case-layer";
 *
 * // テストケースの取得例
 * const program = Effect.gen(function* () {
 *   const testCaseRepo = yield* TestCaseRepository;
 *   const testCases = yield* testCaseRepo.findByProjectId("proj-123");
 *   return testCases;
 * }).pipe(Effect.provide(TestCaseManagementLayer));
 *
 * await Effect.runPromise(program);
 * ```
 *
 * @example
 * ```typescript
 * // 複数のリポジトリを同時に使用する例
 * const program = Effect.gen(function* () {
 *   const testCaseRepo = yield* TestCaseRepository;
 *   const scenarioRepo = yield* TestScenarioRepository;
 *   const listRepo = yield* TestScenarioListRepository;
 *
 *   // テストケースを作成
 *   const testCase = yield* testCaseRepo.create("proj-123", "user-456");
 *
 *   // シナリオを作成
 *   const scenario = yield* scenarioRepo.create("proj-123", "user-456");
 *
 *   // リストを作成
 *   const list = yield* listRepo.create("proj-123", "user-456");
 *
 *   return { testCase, scenario, list };
 * }).pipe(Effect.provide(TestCaseManagementLayer));
 *
 * await Effect.runPromise(program);
 * ```
 */
export const TestCaseManagementLayer = Layer.mergeAll(
  PrismaTestCaseRepositoryLive,
  PrismaTestScenarioRepositoryLive,
  PrismaTestScenarioListRepositoryLive,
);
