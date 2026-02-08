import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Effect } from "effect";
import type { PrismaClient } from "@prisma/client";
import { TestCaseRepository } from "~/features/test-case-management/application/ports/test-case-repository";
import { PrismaTestCaseRepositoryLiveLive } from "~/features/test-case-management/infrastructure/adapters/prisma-test-case-repository";
import {
  TestCaseContent,
  TestStep,
} from "~/features/test-case-management/domain/models/test-case-content";
import { PrismaLayer } from "@shared/db/layers/prisma-layer";
import { prisma as sharedPrisma } from "@shared/db/client";

/**
 * Integration tests for PrismaTestCaseRepositoryLive
 *
 * Note: These tests require a test database
 */
describe("PrismaTestCaseRepositoryLive Integration", () => {
  let prisma: PrismaClient;
  let testProjectId: string;

  beforeEach(async () => {
    prisma = sharedPrisma;

    // Create test project
    const org = await prisma.organization.create({
      data: {
        name: "Test Org",
        slug: "test-org",
      },
    });

    const project = await prisma.project.create({
      data: {
        organization_id: org.id,
        name: "Test Project",
        slug: "test-project",
      },
    });

    testProjectId = project.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.testCaseRevision.deleteMany();
    await prisma.testCase.deleteMany();
    await prisma.project.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.$disconnect();
  });

  it("should create a test case", async () => {
    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;

      // TestCaseを作成
      const testCase = yield* repo.create(testProjectId, "user-123");

      // 初期リビジョンを作成
      const revision = yield* repo.createRevision(testCase.id, {
        title: "Login Test",
        content: new TestCaseContent({
          steps: [
            new TestStep({
              stepNumber: 1,
              action: "Open page",
              expectedOutcome: "Page is displayed",
            }),
            new TestStep({
              stepNumber: 2,
              action: "Enter credentials",
              expectedOutcome: "Credentials are entered",
            }),
          ],
          expectedResult: "Logged in",
          tags: [],
          priority: "MEDIUM",
          environment: "staging",
        }),
        reason: "初回作成",
        createdBy: "user-123",
      });

      return { testCase, revision };
    }).pipe(
      Effect.provide(PrismaTestCaseRepositoryLive),
      Effect.provide(PrismaLayer),
    );

    const { testCase, revision } = await Effect.runPromise(program);

    expect(testCase.id).toBeDefined();
    expect(testCase.projectId).toBe(testProjectId);
    expect(revision).toBeDefined();
  });

  it("should find test case by ID", async () => {
    // Create test case first
    const created = await prisma.testCase.create({
      data: {
        project_id: testProjectId,
        revisions: {
          create: {
            rev: 1,
            status: "DRAFT",
            title: "Test",
            content: {
              steps: [
                {
                  stepNumber: 1,
                  action: "Step 1",
                  expectedOutcome: "Outcome 1",
                },
              ],
              expectedResult: "Result",
              tags: [],
              priority: "MEDIUM",
              environment: "staging",
            },
            created_by: "user-123",
          },
        },
      },
    });

    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.findById(created.id);
    }).pipe(
      Effect.provide(PrismaTestCaseRepositoryLive),
      Effect.provide(PrismaLayer),
    );

    const testCase = await Effect.runPromise(program);

    expect(testCase).not.toBeNull();
    if (testCase) {
      expect(testCase.id).toBe(created.id);
      expect(testCase.projectId).toBe(testProjectId);
    }
  });

  it("should find test cases by project", async () => {
    // Create multiple test cases
    await prisma.testCase.create({
      data: {
        project_id: testProjectId,
        revisions: {
          create: {
            rev: 1,
            status: "DRAFT",
            title: "Test 1",
            content: {
              steps: [
                {
                  stepNumber: 1,
                  action: "Step",
                  expectedOutcome: "Outcome",
                },
              ],
              expectedResult: "Result",
              tags: [],
              priority: "MEDIUM",
              environment: "staging",
            },
            created_by: "user-123",
          },
        },
      },
    });

    await prisma.testCase.create({
      data: {
        project_id: testProjectId,
        revisions: {
          create: {
            rev: 1,
            status: "DRAFT",
            title: "Test 2",
            content: {
              steps: [
                {
                  stepNumber: 1,
                  action: "Step",
                  expectedOutcome: "Outcome",
                },
              ],
              expectedResult: "Result",
              tags: [],
              priority: "MEDIUM",
              environment: "staging",
            },
            created_by: "user-123",
          },
        },
      },
    });

    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.findByProjectId(testProjectId);
    }).pipe(
      Effect.provide(PrismaTestCaseRepositoryLive),
      Effect.provide(PrismaLayer),
    );

    const testCases = await Effect.runPromise(program);

    expect(testCases).toHaveLength(2);
  });

  it("should create and retrieve revisions", async () => {
    const testCase = await prisma.testCase.create({
      data: {
        project_id: testProjectId,
        revisions: {
          create: {
            rev: 1,
            status: "DRAFT",
            title: "Test",
            content: {
              steps: [
                {
                  stepNumber: 1,
                  action: "Step 1",
                  expectedOutcome: "Outcome 1",
                },
              ],
              expectedResult: "Result",
              tags: [],
              priority: "MEDIUM",
              environment: "staging",
            },
            created_by: "user-123",
          },
        },
      },
    });

    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;

      // Create second revision
      const revision = yield* repo.createRevision(testCase.id, {
        title: "Test Updated",
        content: new TestCaseContent({
          steps: [
            new TestStep({
              stepNumber: 1,
              action: "Step 1",
              expectedOutcome: "Outcome 1",
            }),
            new TestStep({
              stepNumber: 2,
              action: "Step 2",
              expectedOutcome: "Outcome 2",
            }),
          ],
          expectedResult: "Updated Result",
          tags: [],
          priority: "MEDIUM",
          environment: "staging",
        }),
        reason: "更新理由",
        createdBy: "user-123",
      });

      // Get all revisions
      const allRevisions = yield* repo.findRevisionHistory(testCase.id);

      return { revision, allRevisions };
    }).pipe(
      Effect.provide(PrismaTestCaseRepositoryLive),
      Effect.provide(PrismaLayer),
    );

    const { revision, allRevisions } = await Effect.runPromise(program);

    expect(revision.rev).toBe(2);
    expect(allRevisions).toHaveLength(2);
  });

  it("should update revision status", async () => {
    const testCase = await prisma.testCase.create({
      data: {
        project_id: testProjectId,
        revisions: {
          create: {
            rev: 1,
            status: "DRAFT",
            title: "Test",
            content: {
              steps: [
                {
                  stepNumber: 1,
                  action: "Step",
                  expectedOutcome: "Outcome",
                },
              ],
              expectedResult: "Result",
              tags: [],
              priority: "MEDIUM",
              environment: "staging",
            },
            created_by: "user-123",
          },
        },
      },
    });

    const revision = await prisma.testCaseRevision.findFirst({
      where: { case_stable_id: testCase.id },
    });

    const program = Effect.gen(function* () {
      const repo = yield* TestCaseRepository;
      return yield* repo.updateRevisionStatus(revision!.id, "IN_REVIEW");
    }).pipe(
      Effect.provide(PrismaTestCaseRepositoryLive),
      Effect.provide(PrismaLayer),
    );

    const updated = await Effect.runPromise(program);

    expect(updated.status).toBe("IN_REVIEW");
  });
});
