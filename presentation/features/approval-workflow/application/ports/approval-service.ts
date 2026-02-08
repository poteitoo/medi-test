import { Context, Effect } from "effect";
import type {
  Approval,
  ApprovalObjectType,
  EvidenceLink,
} from "../../domain/models/approval";
import type {
  ApprovalNotFoundError,
  ApprovalValidationError,
  AlreadyApprovedException,
} from "../../domain/errors/approval-errors";

/**
 * ApprovalService Port
 *
 * @description
 * 承認ワークフローのデータアクセスを抽象化するポートです。
 * テストケース、シナリオ、リリースなど様々なオブジェクトの承認・却下を管理します。
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const service = yield* ApprovalService;
 *
 *   // 承認を作成
 *   const approval = yield* service.createApproval({
 *     objectType: "CASE_REVISION",
 *     objectId: "revision-123",
 *     step: 1,
 *     decision: "APPROVED",
 *     approverId: "user-456",
 *     comment: "問題なし",
 *     evidenceLinks: [{ url: "https://example.com", title: "テスト結果" }]
 *   });
 *
 *   // 承認履歴を取得
 *   const approvals = yield* service.getApprovals("CASE_REVISION", "revision-123");
 * });
 * ```
 */
export class ApprovalService extends Context.Tag("ApprovalService")<
  ApprovalService,
  {
    /**
     * 承認を作成
     *
     * @description
     * 新しい承認または却下を作成します。
     * 同じステップで同じユーザーが既に承認している場合はAlreadyApprovedExceptionを返します。
     *
     * @param data - 承認データ
     * @returns 作成された承認
     */
    readonly createApproval: (data: {
      readonly objectType: ApprovalObjectType;
      readonly objectId: string;
      readonly step: number;
      readonly decision: "APPROVED" | "REJECTED";
      readonly approverId: string;
      readonly comment?: string;
      readonly evidenceLinks?: EvidenceLink[];
    }) => Effect.Effect<Approval, ApprovalValidationError>;

    /**
     * オブジェクトの承認履歴を取得
     *
     * @description
     * 指定されたオブジェクトの承認履歴を新しい順に取得します。
     *
     * @param objectType - オブジェクトタイプ
     * @param objectId - オブジェクトID
     * @returns 承認履歴の配列
     */
    readonly getApprovals: (
      objectType: ApprovalObjectType,
      objectId: string,
    ) => Effect.Effect<readonly Approval[], never>;

    /**
     * 承認者の承認履歴を取得
     *
     * @description
     * 指定されたユーザーが行った承認履歴を取得します。
     *
     * @param approverId - 承認者ID
     * @returns 承認履歴の配列
     */
    readonly getApprovalsByApprover: (
      approverId: string,
    ) => Effect.Effect<readonly Approval[], never>;

    /**
     * 承認が存在するかチェック
     *
     * @description
     * 指定されたステップで指定されたユーザーが既に承認または却下しているかチェックします。
     * 二重承認を防ぐために使用します。
     *
     * @param objectType - オブジェクトタイプ
     * @param objectId - オブジェクトID
     * @param step - 承認ステップ
     * @param approverId - 承認者ID
     * @returns 既に承認がある場合true
     */
    readonly hasApproval: (
      objectType: ApprovalObjectType,
      objectId: string,
      step: number,
      approverId: string,
    ) => Effect.Effect<boolean, never>;

    /**
     * 最新の承認を取得
     *
     * @description
     * 指定されたオブジェクトの最新の承認を取得します。
     * 承認履歴がない場合はnullを返します。
     *
     * @param objectType - オブジェクトタイプ
     * @param objectId - オブジェクトID
     * @returns 最新の承認、または null
     */
    readonly getLatestApproval: (
      objectType: ApprovalObjectType,
      objectId: string,
    ) => Effect.Effect<Approval | null, never>;
  }
>() {}
