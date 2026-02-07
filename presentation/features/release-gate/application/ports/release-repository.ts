import { Context, Effect } from "effect";
import type { Release } from "../../domain/models/release";
import type { ReleaseBaseline } from "../../domain/models/release-baseline";
import type { ReleaseStatus } from "../../domain/models/release-status";
import { ReleaseNotFoundError } from "../../domain/errors/release-errors";

/**
 * ReleaseRepository Port
 *
 * リリースのデータアクセスを抽象化するポート
 */
export class ReleaseRepository extends Context.Tag("ReleaseRepository")<
  ReleaseRepository,
  {
    /**
     * リリースをIDで取得
     */
    readonly findById: (
      releaseId: string,
    ) => Effect.Effect<Release, ReleaseNotFoundError>;

    /**
     * プロジェクトのリリース一覧を取得
     */
    readonly findByProjectId: (
      projectId: string,
    ) => Effect.Effect<readonly Release[], Error>;

    /**
     * リリースを作成
     */
    readonly create: (input: {
      readonly projectId: string;
      readonly name: string;
      readonly description?: string;
      readonly buildRef?: string;
    }) => Effect.Effect<Release, Error>;

    /**
     * リリースステータスを更新
     */
    readonly updateStatus: (
      releaseId: string,
      status: ReleaseStatus,
    ) => Effect.Effect<Release, ReleaseNotFoundError>;

    /**
     * リリースのベースラインを作成
     */
    readonly createBaseline: (input: {
      readonly releaseId: string;
      readonly sourceListRevisionId: string;
      readonly createdBy: string;
    }) => Effect.Effect<ReleaseBaseline, Error>;

    /**
     * リリースのベースライン一覧を取得
     */
    readonly findBaselines: (
      releaseId: string,
    ) => Effect.Effect<readonly ReleaseBaseline[], Error>;

    /**
     * リリースを削除
     */
    readonly delete: (
      releaseId: string,
    ) => Effect.Effect<void, ReleaseNotFoundError>;
  }
>() {}
