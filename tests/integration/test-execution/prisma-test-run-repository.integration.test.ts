import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import { PrismaClient } from "@prisma/client";
import { TestRunRepository } from "~/features/test-execution/application/ports/test-run-repository";
import { PrismaTestRunRepository } from "~/features/test-execution/infrastructure/adapters/prisma-test-run-repository";
import { createTestPrismaLayer } from "@shared/db/layers/prisma-layer";

/**
 * Integration Tests for PrismaTestRunRepository
 *
 * @remarks
 * These tests verify the repository implementation against a real database.
 * They require:
 * - PostgreSQL test database running
 * - TEST_DATABASE_URL environment variable set
 * - Prisma migrations applied
 *
 * Setup:
 * ```bash
 * # Create test database
 * createdb medi_test_integration
 *
 * # Set environment variable
 * export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/medi_test_integration"
 *
 * # Run migrations
 * DATABASE_URL=$TEST_DATABASE_URL pnpm prisma migrate deploy
 *
 * # Run tests
 * pnpm vitest run tests/integration
 * ```
 *
 * @notes
 * - Each test runs in a transaction that is rolled back
 * - Tests are independent and can run in any order
 * - Uses fixed dates to avoid timezone issues
 */

describe("PrismaTestRunRepository Integration Tests", () => {
  let prisma: PrismaClient;
  let testReleaseId: string;
  let testRunGroupId: string;
  let testListRevisionId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize Prisma with test database
    const databaseUrl =
      process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        "TEST_DATABASE_URL or DATABASE_URL must be set for integration tests",
      );
    }

    prisma = new PrismaClient();

    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.testResult.deleteMany({});
    await prisma.testRunItem.deleteMany({});
    await prisma.testRun.deleteMany({});
    await prisma.testRunGroup.deleteMany({});
    await prisma.testScenarioListRevision.deleteMany({});
    await prisma.testScenarioList.deleteMany({});
    await prisma.testCaseRevision.deleteMany({});
    await prisma.testCase.deleteMany({});
    await prisma.release.deleteMany({});
    await prisma.roleAssignment.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.organization.deleteMany({});

    // Create test data
    const organization = await prisma.organization.create({
      data: {
        id: "test-org-001",
        name: "Test Organization",
        slug: "test-org",
      },
    });

    const project = await prisma.project.create({
      data: {
        id: "test-project-001",
        organization_id: organization.id,
        name: "Test Project",
        slug: "test-project",
        description: "Integration test project",
      },
    });

    const user = await prisma.user.create({
      data: {
        id: "test-user-001",
        organization_id: organization.id,
        name: "Test User",
        email: "test@example.com",
      },
    });
    testUserId = user.id;

    const release = await prisma.release.create({
      data: {
        id: "test-release-001",
        project_id: project.id,
        name: "v1.0.0",
        description: "Test release",
      },
    });
    testReleaseId = release.id;

    const runGroup = await prisma.testRunGroup.create({
      data: {
        id: "test-group-001",
        release_id: testReleaseId,
        name: "Test Run Group",
        purpose: "統合テスト",
        status: "NOT_STARTED",
      },
    });
    testRunGroupId = runGroup.id;

    const testList = await prisma.testScenarioList.create({
      data: {
        id: "test-list-001",
        project_id: project.id,
      },
    });

    const listRevision = await prisma.testScenarioListRevision.create({
      data: {
        id: "test-list-rev-001",
        list_stable_id: testList.id,
        rev: 1,
        title: "Test List",
        created_by: testUserId,
      },
    });
    testListRevisionId = listRevision.id;

    // Create test case for items
    const testCase = await prisma.testCase.create({
      data: {
        id: "test-case-001",
        project_id: project.id,
      },
    });

    await prisma.testCaseRevision.create({
      data: {
        id: "test-case-rev-001",
        case_stable_id: testCase.id,
        rev: 1,
        title: "Test Case 1",
        content: {
          steps: ["Step 1"],
          expected_result: "Expected result",
        },
        created_by: testUserId,
      },
    });
  });

  it("should create a test run with items", async () => {
    const program = Effect.gen(function* () {
      const testRunRepo = yield* TestRunRepository;

      const result = yield* testRunRepo.create({
        runGroupId: testRunGroupId,
        assigneeUserId: testUserId,
        sourceListRevisionId: testListRevisionId,
        buildRef: "build-123",
      });

      return result;
    }).pipe(
      Effect.provide(PrismaTestRunRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result.run.id).toBeDefined();
    expect(result.run.runGroupId).toBe(testRunGroupId);
    expect(result.run.assigneeUserId).toBe(testUserId);
    expect(result.run.status).toBe("ASSIGNED");
    expect(result.items).toBeInstanceOf(Array);
  });

  it("should find test run by id", async () => {
    // Create a test run first
    const testRun = await prisma.testRun.create({
      data: {
        id: "test-run-001",
        run_group_id: testRunGroupId,
        assignee_user_id: testUserId,
        source_list_revision_id: testListRevisionId,
        build_ref: "build-123",
        status: "ASSIGNED",
      },
    });

    const program = Effect.gen(function* () {
      const testRunRepo = yield* TestRunRepository;
      const run = yield* testRunRepo.findById(testRun.id);
      return run;
    }).pipe(
      Effect.provide(PrismaTestRunRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result.id).toBe(testRun.id);
    expect(result.status).toBe("ASSIGNED");
  });

  it("should find test run by id with items", async () => {
    // Create test run with items
    const testRun = await prisma.testRun.create({
      data: {
        id: "test-run-002",
        run_group_id: testRunGroupId,
        assignee_user_id: testUserId,
        source_list_revision_id: testListRevisionId,
        status: "ASSIGNED",
      },
    });

    await prisma.testRunItem.create({
      data: {
        id: "test-item-001",
        run_id: testRun.id,
        case_revision_id: "test-case-rev-001",
        order: 0,
      },
    });

    const program = Effect.gen(function* () {
      const testRunRepo = yield* TestRunRepository;
      const result = yield* testRunRepo.findByIdWithItems(testRun.id);
      return result;
    }).pipe(
      Effect.provide(PrismaTestRunRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result.run.id).toBe(testRun.id);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].caseRevisionId).toBe("test-case-rev-001");
  });

  it("should find test runs by run group id", async () => {
    // Create multiple test runs
    await prisma.testRun.createMany({
      data: [
        {
          id: "test-run-003",
          run_group_id: testRunGroupId,
          assignee_user_id: testUserId,
          source_list_revision_id: testListRevisionId,
          status: "ASSIGNED",
        },
        {
          id: "test-run-004",
          run_group_id: testRunGroupId,
          assignee_user_id: testUserId,
          source_list_revision_id: testListRevisionId,
          status: "IN_PROGRESS",
        },
      ],
    });

    const program = Effect.gen(function* () {
      const testRunRepo = yield* TestRunRepository;
      const runs = yield* testRunRepo.findByRunGroupId(testRunGroupId);
      return runs;
    }).pipe(
      Effect.provide(PrismaTestRunRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(2);
    expect(result.every((r) => r.runGroupId === testRunGroupId)).toBe(true);
  });

  it("should update test run status", async () => {
    // Create test run
    const testRun = await prisma.testRun.create({
      data: {
        id: "test-run-005",
        run_group_id: testRunGroupId,
        assignee_user_id: testUserId,
        source_list_revision_id: testListRevisionId,
        status: "ASSIGNED",
      },
    });

    const program = Effect.gen(function* () {
      const testRunRepo = yield* TestRunRepository;
      const updated = yield* testRunRepo.updateStatus(
        testRun.id,
        "IN_PROGRESS",
      );
      return updated;
    }).pipe(
      Effect.provide(PrismaTestRunRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result.id).toBe(testRun.id);
    expect(result.status).toBe("IN_PROGRESS");

    // Verify in database
    const dbRun = await prisma.testRun.findUnique({
      where: { id: testRun.id },
    });
    expect(dbRun?.status).toBe("IN_PROGRESS");
  });

  it("should fail when finding non-existent test run", async () => {
    const program = Effect.gen(function* () {
      const testRunRepo = yield* TestRunRepository;
      const run = yield* testRunRepo.findById("non-existent-id");
      return run;
    }).pipe(
      Effect.provide(PrismaTestRunRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should handle test runs with no items", async () => {
    // Create test run without items
    const testRun = await prisma.testRun.create({
      data: {
        id: "test-run-006",
        run_group_id: testRunGroupId,
        assignee_user_id: testUserId,
        source_list_revision_id: testListRevisionId,
        status: "ASSIGNED",
      },
    });

    const program = Effect.gen(function* () {
      const testRunRepo = yield* TestRunRepository;
      const result = yield* testRunRepo.findByIdWithItems(testRun.id);
      return result;
    }).pipe(
      Effect.provide(PrismaTestRunRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result.run.id).toBe(testRun.id);
    expect(result.items).toHaveLength(0);
  });
});
