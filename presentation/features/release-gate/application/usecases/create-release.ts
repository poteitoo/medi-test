import { Effect } from "effect";
import { ReleaseRepository } from "../ports/release-repository";

/**
 * リリース作成の入力パラメータ
 */
export type CreateReleaseInput = {
  /**
   * プロジェクトID
   */
  readonly projectId: string;

  /**
   * リリース名
   */
  readonly name: string;

  /**
   * リリース説明
   */
  readonly description?: string;

  /**
   * ビルド参照（Git SHA、CIビルド番号等）
   */
  readonly buildRef?: string;
};

/**
 * リリース作成ユースケース
 *
 * 新しいリリースを作成する
 * 初期ステータスはPLANNINGとなる
 *
 * @example
 * const program = createRelease({
 *   projectId: "project-123",
 *   name: "v1.2.0",
 *   description: "新機能追加とバグ修正",
 *   buildRef: "abc123def",
 * });
 */
export const createRelease = (input: CreateReleaseInput) =>
  Effect.gen(function* () {
    const releaseRepo = yield* ReleaseRepository;

    // リリースを作成
    const release = yield* releaseRepo.create({
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      buildRef: input.buildRef,
    });

    return release;
  });
