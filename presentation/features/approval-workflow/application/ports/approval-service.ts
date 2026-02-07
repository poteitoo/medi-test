import { Context, Effect } from "effect";
import type {
  Approval,
  ApprovalObjectType,
} from "../../domain/models/approval";

/**
 * 承認エラー
 */
export class ApprovalNotFoundError extends Error {
  readonly _tag = "ApprovalNotFoundError";
  constructor(message: string = "承認情報が見つかりません") {
    super(message);
    this.name = "ApprovalNotFoundError";
  }
}

export class ApprovalCreationError extends Error {
  readonly _tag = "ApprovalCreationError";
  constructor(message: string) {
    super(message);
    this.name = "ApprovalCreationError";
  }
}

/**
 * ApprovalService Port
 *
 * 承認ワークフローのデータアクセスを抽象化するポート
 */
export class ApprovalService extends Context.Tag("ApprovalService")<
  ApprovalService,
  {
    /**
     * 承認情報をIDで取得
     */
    readonly findById: (
      approvalId: string,
    ) => Effect.Effect<Approval, ApprovalNotFoundError>;

    /**
     * オブジェクトの承認履歴を取得
     */
    readonly findByObjectId: (
      objectId: string,
      objectType: ApprovalObjectType,
    ) => Effect.Effect<readonly Approval[], Error>;

    /**
     * 承認者の承認履歴を取得
     */
    readonly findByApproverId: (
      approverId: string,
    ) => Effect.Effect<readonly Approval[], Error>;

    /**
     * 承認を作成
     */
    readonly approve: (input: {
      readonly objectId: string;
      readonly objectType: ApprovalObjectType;
      readonly approverId: string;
      readonly step?: number;
      readonly comment?: string;
    }) => Effect.Effect<Approval, ApprovalCreationError>;

    /**
     * 却下を作成
     */
    readonly reject: (input: {
      readonly objectId: string;
      readonly objectType: ApprovalObjectType;
      readonly approverId: string;
      readonly step?: number;
      readonly comment?: string;
    }) => Effect.Effect<Approval, ApprovalCreationError>;

    /**
     * 承認情報を削除
     */
    readonly delete: (
      approvalId: string,
    ) => Effect.Effect<void, ApprovalNotFoundError>;

    /**
     * オブジェクトが承認されているかチェック
     */
    readonly isApproved: (
      objectId: string,
      objectType: ApprovalObjectType,
    ) => Effect.Effect<boolean, Error>;

    /**
     * オブジェクトが却下されているかチェック
     */
    readonly isRejected: (
      objectId: string,
      objectType: ApprovalObjectType,
    ) => Effect.Effect<boolean, Error>;
  }
>() {}
