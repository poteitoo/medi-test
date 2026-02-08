import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import { PrismaClient } from "@prisma/client";
import { TestResultRepository } from "~/features/test-execution/application/ports/test-result-repository";
import { PrismaTestResultRepository } from "~/features/test-execution/infrastructure/adapters/prisma-test-result-repository";
import { createTestPrismaLayer } from "@shared/db/layers/prisma-layer";

/**
 * Integration Tests for PrismaTestResultRepository
 *
 * @remarks
 * These tests verify the repository implementation against a real database.
 * See prisma-test-run-repository.integration.test.ts for setup instructions.
 */

describe("PrismaTestResultRepository Integration Tests", () => {
  let prisma: PrismaClient;
  let testRunId: string;
  let testRunItemId: string;
  let testUserId: string;

  beforeAll(async () => {
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

    const runGroup = await prisma.testRunGroup.create({
      data: {
        id: "test-group-001",
        release_id: release.id,
        name: "Test Run Group",
        purpose: "統合テスト",
        status: "NOT_STARTED",
      },
    });

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

    const testRun = await prisma.testRun.create({
      data: {
        id: "test-run-001",
        run_group_id: runGroup.id,
        assignee_user_id: testUserId,
        source_list_revision_id: listRevision.id,
        status: "IN_PROGRESS",
      },
    });
    testRunId = testRun.id;

    const testCase = await prisma.testCase.create({
      data: {
        id: "test-case-001",
        project_id: project.id,
      },
    });

    const caseRevision = await prisma.testCaseRevision.create({
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

    const runItem = await prisma.testRunItem.create({
      data: {
        id: "test-item-001",
        run_id: testRun.id,
        case_revision_id: caseRevision.id,
        order: 0,
      },
    });
    testRunItemId = runItem.id;
  });

  it("should create a test result with status PASS", async () => {
    const program = Effect.gen(function* () {
      const testResultRepo = yield* TestResultRepository;

      const result = yield* testResultRepo.create({
        runItemId: testRunItemId,
        status: "PASS",
        executedBy: testUserId,
      });

      return result;
    }).pipe(
      Effect.provide(PrismaTestResultRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result.id).toBeDefined();
    expect(result.runItemId).toBe(testRunItemId);
    expect(result.status).toBe("PASS");
    expect(result.executedBy).toBe(testUserId);
    expect(result.executedAt).toBeInstanceOf(Date);
  });

  it("should create a test result with evidence", async () => {
    const program = Effect.gen(function* () {
      const testResultRepo = yield* TestResultRepository;

      const result = yield* testResultRepo.create({
        runItemId: testRunItemId,
        status: "FAIL",
        evidence: {
          logs: "Error: Connection timeout",
          screenshots: ["screenshot1.png", "screenshot2.png"],
          links: ["https://example.com/log"],
        },
        executedBy: testUserId,
      });

      return result;
    }).pipe(
      Effect.provide(PrismaTestResultRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result.status).toBe("FAIL");
    expect(result.evidence).toBeDefined();
    expect(result.evidence?.logs).toBe("Error: Connection timeout");
    expect(result.evidence?.screenshots).toHaveLength(2);
    expect(result.evidence?.links).toHaveLength(1);
  });

  it("should create a test result with bug links", async () => {
    const program = Effect.gen(function* () {
      const testResultRepo = yield* TestResultRepository;

      const result = yield* testResultRepo.create({
        runItemId: testRunItemId,
        status: "FAIL",
        bugLinks: [
          {
            url: "https://tracker.example.com/bug/123",
            title: "Login fails on mobile",
            severity: "HIGH",
          },
          {
            url: "https://tracker.example.com/bug/124",
            title: "UI rendering issue",
            severity: "MEDIUM",
          },
        ],
        executedBy: testUserId,
      });

      return result;
    }).pipe(
      Effect.provide(PrismaTestResultRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result.status).toBe("FAIL");
    expect(result.bugLinks).toBeDefined();
    expect(result.bugLinks).toHaveLength(2);
    expect(result.bugLinks?.[0].severity).toBe("HIGH");
  });

  it("should find results by run item id", async () => {
    // Create multiple results for the same item
    await prisma.testResult.createMany({
      data: [
        {
          id: "result-001",
          run_item_id: testRunItemId,
          status: "FAIL",
          executed_by: testUserId,
          executed_at: new Date("2024-01-01T10:00:00Z"),
        },
        {
          id: "result-002",
          run_item_id: testRunItemId,
          status: "PASS",
          executed_by: testUserId,
          executed_at: new Date("2024-01-01T11:00:00Z"),
        },
      ],
    });

    const program = Effect.gen(function* () {
      const testResultRepo = yield* TestResultRepository;
      const results = yield* testResultRepo.findByRunItemId(testRunItemId);
      return results;
    }).pipe(
      Effect.provide(PrismaTestResultRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const results = await Effect.runPromise(program);

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.runItemId === testRunItemId)).toBe(true);
  });

  it("should find latest result by run item id", async () => {
    // Create multiple results
    await prisma.testResult.createMany({
      data: [
        {
          id: "result-003",
          run_item_id: testRunItemId,
          status: "FAIL",
          executed_by: testUserId,
          executed_at: new Date("2024-01-01T10:00:00Z"),
        },
        {
          id: "result-004",
          run_item_id: testRunItemId,
          status: "PASS",
          executed_by: testUserId,
          executed_at: new Date("2024-01-01T11:00:00Z"), // Latest
        },
      ],
    });

    const program = Effect.gen(function* () {
      const testResultRepo = yield* TestResultRepository;
      const result = yield* testResultRepo.findLatestByRunItemId(testRunItemId);
      return result;
    }).pipe(
      Effect.provide(PrismaTestResultRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result).toBeDefined();
    expect(result?.id).toBe("result-004");
    expect(result?.status).toBe("PASS");
  });

  it("should return null when no results exist for run item", async () => {
    const program = Effect.gen(function* () {
      const testResultRepo = yield* TestResultRepository;
      const result = yield* testResultRepo.findLatestByRunItemId(testRunItemId);
      return result;
    }).pipe(
      Effect.provide(PrismaTestResultRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result).toBeNull();
  });

  it("should find results by run id", async () => {
    // Create another run item
    const runItem2 = await prisma.testRunItem.create({
      data: {
        id: "test-item-002",
        run_id: testRunId,
        case_revision_id: "test-case-rev-001",
        order: 1,
      },
    });

    // Create results for both items
    await prisma.testResult.createMany({
      data: [
        {
          id: "result-005",
          run_item_id: testRunItemId,
          status: "PASS",
          executed_by: testUserId,
          executed_at: new Date("2024-01-01T10:00:00Z"),
        },
        {
          id: "result-006",
          run_item_id: runItem2.id,
          status: "FAIL",
          executed_by: testUserId,
          executed_at: new Date("2024-01-01T11:00:00Z"),
        },
      ],
    });

    const program = Effect.gen(function* () {
      const testResultRepo = yield* TestResultRepository;
      const results = yield* testResultRepo.findByRunId(testRunId);
      return results;
    }).pipe(
      Effect.provide(PrismaTestResultRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const results = await Effect.runPromise(program);

    expect(results).toHaveLength(2);
    expect(results.some((r) => r.status === "PASS")).toBe(true);
    expect(results.some((r) => r.status === "FAIL")).toBe(true);
  });

  it("should handle BLOCKED status with bug links", async () => {
    const program = Effect.gen(function* () {
      const testResultRepo = yield* TestResultRepository;

      const result = yield* testResultRepo.create({
        runItemId: testRunItemId,
        status: "BLOCKED",
        bugLinks: [
          {
            url: "https://tracker.example.com/bug/125",
            title: "Database migration failed",
            severity: "CRITICAL",
          },
        ],
        executedBy: testUserId,
      });

      return result;
    }).pipe(
      Effect.provide(PrismaTestResultRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result.status).toBe("BLOCKED");
    expect(result.bugLinks?.[0].severity).toBe("CRITICAL");
  });

  it("should handle SKIPPED status", async () => {
    const program = Effect.gen(function* () {
      const testResultRepo = yield* TestResultRepository;

      const result = yield* testResultRepo.create({
        runItemId: testRunItemId,
        status: "SKIPPED",
        executedBy: testUserId,
      });

      return result;
    }).pipe(
      Effect.provide(PrismaTestResultRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);

    expect(result.status).toBe("SKIPPED");
    expect(result.evidence).toBeUndefined();
    expect(result.bugLinks).toBeUndefined();
  });

  it("should preserve execution timestamp", async () => {
    const beforeCreate = new Date();

    const program = Effect.gen(function* () {
      const testResultRepo = yield* TestResultRepository;
      const result = yield* testResultRepo.create({
        runItemId: testRunItemId,
        status: "PASS",
        executedBy: testUserId,
      });
      return result;
    }).pipe(
      Effect.provide(PrismaTestResultRepository),
      Effect.provide(createTestPrismaLayer(prisma)),
    );

    const result = await Effect.runPromise(program);
    const afterCreate = new Date();

    expect(result.executedAt.getTime()).toBeGreaterThanOrEqual(
      beforeCreate.getTime(),
    );
    expect(result.executedAt.getTime()).toBeLessThanOrEqual(
      afterCreate.getTime(),
    );
  });
});
