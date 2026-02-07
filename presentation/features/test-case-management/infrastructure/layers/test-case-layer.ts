import { Layer } from "effect";
import { PrismaLayer } from "@shared/db/layers/prisma-layer";
import { PrismaTestCaseRepository } from "../adapters/prisma-test-case-repository";
import { PrismaTestScenarioRepository } from "../adapters/prisma-test-scenario-repository";
import { PrismaTestScenarioListRepository } from "../adapters/prisma-test-scenario-list-repository";

/**
 * Test Case Management Layer
 *
 * すべてのテストケース管理関連のリポジトリを提供するレイヤー
 *
 * @example
 * const program = Effect.gen(function* () {
 *   const testCaseRepo = yield* TestCaseRepository;
 *   const scenarios = yield* testCaseRepo.findByProjectId("project-id");
 *   return scenarios;
 * }).pipe(Effect.provide(TestCaseManagementLayer));
 */
export const TestCaseManagementLayer = Layer.mergeAll(
  PrismaTestCaseRepository,
  PrismaTestScenarioRepository,
  PrismaTestScenarioListRepository,
).pipe(Layer.provide(PrismaLayer));
