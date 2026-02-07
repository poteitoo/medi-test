import { Data } from "effect";

/**
 * ReleaseBaseline ドメインモデル
 *
 * リリースのベースライン（承認済みテストシナリオリストのスナップショット）を表現
 * リリース時点で実行すべき承認済みテストケースセットを固定する
 */
export class ReleaseBaseline extends Data.Class<{
  /**
   * ベースラインID（UUID）
   */
  readonly id: string;

  /**
   * リリースID
   */
  readonly releaseId: string;

  /**
   * ソースとなるテストシナリオリストリビジョンID
   */
  readonly sourceListRevisionId: string;

  /**
   * ベースライン作成者ユーザーID
   */
  readonly createdBy: string;

  /**
   * 作成日時
   */
  readonly createdAt: Date;
}> {}
