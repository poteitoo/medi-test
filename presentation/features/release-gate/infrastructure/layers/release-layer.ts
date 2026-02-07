import { Layer } from "effect";
import { PrismaLayer } from "@shared/db/layers/prisma-layer";
import { PrismaReleaseRepository } from "../adapters/prisma-release-repository";
import { GateEvaluationServiceLive } from "../adapters/gate-evaluation-service-impl";
import { PrismaWaiverService } from "../adapters/prisma-waiver-service";
import { PrismaApprovalService } from "~/features/approval-workflow/infrastructure/adapters/prisma-approval-service";

/**
 * ReleaseLayer
 *
 * リリースゲート機能の全依存関係を組み合わせたLayer
 *
 * 提供するサービス:
 * - ReleaseRepository: リリースのデータアクセス
 * - GateEvaluationService: ゲート条件評価
 * - WaiverService: Waiver管理
 * - ApprovalService: 承認管理（リリース承認で使用）
 *
 * 依存関係:
 * - PrismaLayer: データベース接続
 */
export const ReleaseLayer = Layer.mergeAll(
  PrismaReleaseRepository,
  GateEvaluationServiceLive,
  PrismaWaiverService,
  PrismaApprovalService,
).pipe(Layer.provide(PrismaLayer));
