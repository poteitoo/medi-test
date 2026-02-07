import { Layer } from "effect";
import { PrismaLayer } from "@shared/db/layers/prisma-layer";
import { PrismaTestRunRepository } from "../adapters/prisma-test-run-repository";
import { PrismaTestResultRepository } from "../adapters/prisma-test-result-repository";

/**
 * TestExecutionLayer
 *
 * テスト実行機能の全依存関係を組み合わせたLayer
 *
 * 提供するサービス:
 * - TestRunRepository: テストランのデータアクセス
 * - TestResultRepository: テスト結果のデータアクセス
 *
 * 依存関係:
 * - PrismaLayer: データベース接続
 */
export const TestExecutionLayer = Layer.mergeAll(
  PrismaTestRunRepository,
  PrismaTestResultRepository,
).pipe(Layer.provide(PrismaLayer));
