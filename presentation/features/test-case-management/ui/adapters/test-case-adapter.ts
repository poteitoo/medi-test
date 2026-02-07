import { Effect } from "effect";
import type { TestCase } from "../../domain/models/test-case";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import type { TestCaseContent } from "../../domain/models/test-case-content";
import { TestCaseManagementLayer } from "../../infrastructure/layers/test-case-layer";
import { TestCaseRepository } from "../../application/ports/test-case-repository";

/**
 * TestCaseAdapter
 *
 * Effect プログラムと React コンポーネント間の橋渡し
 * Effect 世界の純粋な関数を React 世界で使いやすいインターフェースに変換
 */
export class TestCaseAdapter {
  /**
   * テストケースをIDで取得
   */
  static async findById(caseId: string): Promise<TestCase> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.findById(caseId);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }

  /**
   * プロジェクトのテストケース一覧を取得
   */
  static async findByProjectId(projectId: string): Promise<readonly TestCase[]> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.findByProjectId(projectId);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }

  /**
   * テストケースを作成
   */
  static async create(input: {
    projectId: string;
    title: string;
    content: TestCaseContent;
    createdBy: string;
  }): Promise<TestCase> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.create(input);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }

  /**
   * リビジョンをIDで取得
   */
  static async findRevisionById(
    revisionId: string,
  ): Promise<TestCaseRevision> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.findRevisionById(revisionId);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }

  /**
   * テストケースの最新リビジョンを取得
   */
  static async findLatestRevision(caseId: string): Promise<TestCaseRevision> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.findLatestRevision(caseId);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }

  /**
   * テストケースの全リビジョンを取得
   */
  static async findAllRevisions(
    caseId: string,
  ): Promise<readonly TestCaseRevision[]> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.findAllRevisions(caseId);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }

  /**
   * 新しいリビジョンを作成
   */
  static async createRevision(input: {
    caseId: string;
    title: string;
    content: TestCaseContent;
    createdBy: string;
  }): Promise<TestCaseRevision> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.createRevision(input);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }

  /**
   * リビジョンを更新
   */
  static async updateRevision(
    revisionId: string,
    input: {
      title?: string;
      content?: TestCaseContent;
    },
  ): Promise<TestCaseRevision> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.updateRevision(revisionId, input);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }

  /**
   * リビジョンのステータスを更新
   */
  static async updateRevisionStatus(
    revisionId: string,
    status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "DEPRECATED" | "DEPRECATED",
    userId?: string,
  ): Promise<TestCaseRevision> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.updateRevisionStatus(revisionId, status, userId);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }

  /**
   * テストケースを削除
   */
  static async delete(caseId: string): Promise<void> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.delete(caseId);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }

  /**
   * ステータスでリビジョンを検索
   */
  static async findRevisionsByStatus(
    projectId: string,
    status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "DEPRECATED" | "DEPRECATED",
  ): Promise<readonly TestCaseRevision[]> {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.findRevisionsByStatus(projectId, status);
    }).pipe(Effect.provide(TestCaseManagementLayer));

    return Effect.runPromise(program);
  }
}
