import { Context, Effect } from "effect";
import type { Project } from "../../domain/models/project";

/**
 * Project Repository エラー
 */
export class ProjectNotFoundError extends Error {
  readonly _tag = "ProjectNotFoundError";
  constructor(message: string = "プロジェクトが見つかりません") {
    super(message);
    this.name = "ProjectNotFoundError";
  }
}

export class ProjectAlreadyExistsError extends Error {
  readonly _tag = "ProjectAlreadyExistsError";
  constructor(message: string = "プロジェクトが既に存在します") {
    super(message);
    this.name = "ProjectAlreadyExistsError";
  }
}

/**
 * Project Repository Port
 *
 * プロジェクトデータへのアクセスを抽象化するポート
 */
export class ProjectRepository extends Context.Tag("ProjectRepository")<
  ProjectRepository,
  {
    /**
     * IDでプロジェクトを取得
     */
    readonly findById: (
      id: string,
    ) => Effect.Effect<Project, ProjectNotFoundError>;

    /**
     * スラッグでプロジェクトを取得
     */
    readonly findBySlug: (
      organizationId: string,
      slug: string,
    ) => Effect.Effect<Project, ProjectNotFoundError>;

    /**
     * 組織のすべてのプロジェクトを取得
     */
    readonly findByOrganizationId: (
      organizationId: string,
    ) => Effect.Effect<readonly Project[], Error>;

    /**
     * 組織のアクティブなプロジェクトを取得（アーカイブ除外）
     */
    readonly findActiveByOrganizationId: (
      organizationId: string,
    ) => Effect.Effect<readonly Project[], Error>;

    /**
     * プロジェクトを作成
     */
    readonly create: (input: {
      readonly organizationId: string;
      readonly name: string;
      readonly slug: string;
      readonly description?: string;
      readonly repositoryUrl?: string;
    }) => Effect.Effect<Project, ProjectAlreadyExistsError>;

    /**
     * プロジェクトを更新
     */
    readonly update: (
      id: string,
      input: {
        readonly name?: string;
        readonly slug?: string;
        readonly description?: string;
        readonly repositoryUrl?: string;
        readonly isArchived?: boolean;
      },
    ) => Effect.Effect<Project, ProjectNotFoundError>;

    /**
     * プロジェクトを削除
     */
    readonly delete: (id: string) => Effect.Effect<void, ProjectNotFoundError>;

    /**
     * プロジェクトをアーカイブ
     */
    readonly archive: (
      id: string,
    ) => Effect.Effect<Project, ProjectNotFoundError>;

    /**
     * プロジェクトをアーカイブ解除
     */
    readonly unarchive: (
      id: string,
    ) => Effect.Effect<Project, ProjectNotFoundError>;
  }
>() {}
