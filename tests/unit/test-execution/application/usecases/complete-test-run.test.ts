import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { completeTestRun } from "~/features/test-execution/application/usecases/complete-test-run";
import { TestRunRepository } from "~/features/test-execution/application/ports/test-run-repository";
import { TestResultRepository } from "~/features/test-execution/application/ports/test-result-repository";
import { TestRun } from "~/features/test-execution/domain/models/test-run";
import { TestRunItem } from "~/features/test-execution/domain/models/test-run-item";
import { TestResult } from "~/features/test-execution/domain/models/test-result";
import { TestRunNotFoundError } from "~/features/test-execution/domain/errors/test-run-errors";

/**
 * Mock TestRunRepository implementation for testing
 */
const createMockTestRunRepository = (
  initialStatus: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" = "IN_PROGRESS",
) => {
  const mockTestRun = new TestRun({
    id: "run-123",
    runGroupId: "group-456",
    assigneeUserId: "user-789",
    sourceListRevisionId: "list-rev-001",
    buildRef: "v1.0.0",
    status: initialStatus,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  });

  const mockTestRunCompleted = new TestRun({
    ...mockTestRun,
    status: "COMPLETED",
    updatedAt: new Date("2024-01-02"),
  });

  const mockTestRunItem1 = new TestRunItem({
    id: "item-001",
    runId: "run-123",
    caseRevisionId: "case-rev-001",
    order: 0,
    createdAt: new Date("2024-01-01"),
  });

  const mockTestRunItem2 = new TestRunItem({
    id: "item-002",
    runId: "run-123",
    caseRevisionId: "case-rev-002",
    order: 1,
    createdAt: new Date("2024-01-01"),
  });

  return {
    findById: (runId: string) =>
      runId === "run-123"
        ? Effect.succeed(mockTestRun)
        : Effect.fail(
            new TestRunNotFoundError({
              message: "Test run not found",
              runId,
            }),
          ),
    findByIdWithItems: (runId: string) =>
      runId === "run-123"
        ? Effect.succeed({
            run: mockTestRun,
            items: [mockTestRunItem1, mockTestRunItem2],
          })
        : Effect.fail(
            new TestRunNotFoundError({
              message: "Test run not found",
              runId,
            }),
          ),
    findByRunGroupId: (_runGroupId: string) => Effect.succeed([]),
    findByReleaseId: (_releaseId: string) => Effect.succeed([]),
    create: (_input: {
      readonly runGroupId: string;
      readonly assigneeUserId: string;
      readonly sourceListRevisionId: string;
      readonly buildRef?: string;
    }) =>
      Effect.succeed({
        run: mockTestRun,
        items: [mockTestRunItem1],
      }),
    updateStatus: (
      runId: string,
      _status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED",
    ) =>
      runId === "run-123"
        ? Effect.succeed(mockTestRunCompleted)
        : Effect.fail(
            new TestRunNotFoundError({
              message: "Test run not found",
              runId,
            }),
          ),
  };
};

/**
 * Mock TestResultRepository implementation for testing
 */
const createMockTestResultRepository = (hasAllResults: boolean = true) => {
  const mockResult1 = new TestResult({
    id: "result-001",
    runItemId: "item-001",
    status: "PASS",
    executedBy: "user-789",
    executedAt: new Date("2024-01-02"),
  });

  const mockResult2 = new TestResult({
    id: "result-002",
    runItemId: "item-002",
    status: "FAIL",
    executedBy: "user-789",
    executedAt: new Date("2024-01-02"),
  });

  return {
    create: (_input: {
      readonly runItemId: string;
      readonly status: "PASS" | "FAIL" | "BLOCKED" | "SKIPPED";
      readonly evidence?: {
        readonly logs?: string;
        readonly screenshots?: readonly string[];
        readonly links?: readonly string[];
      };
      readonly bugLinks?: readonly {
        readonly url: string;
        readonly title: string;
        readonly severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      }[];
      readonly executedBy: string;
    }) => Effect.succeed(mockResult1),
    findByRunItemId: (_runItemId: string) => Effect.succeed([]),
    findLatestByRunItemId: (runItemId: string) =>
      hasAllResults
        ? runItemId === "item-001"
          ? Effect.succeed(mockResult1)
          : Effect.succeed(mockResult2)
        : runItemId === "item-001"
          ? Effect.succeed(mockResult1)
          : Effect.succeed(null),
    findByRunId: (_runId: string) =>
      hasAllResults
        ? Effect.succeed([mockResult1, mockResult2])
        : Effect.succeed([mockResult1]),
  };
};

const createMockLayer = (
  runStatus: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" = "IN_PROGRESS",
  hasAllResults: boolean = true,
) => {
  return Layer.mergeAll(
    Layer.succeed(TestRunRepository, createMockTestRunRepository(runStatus)),
    Layer.succeed(
      TestResultRepository,
      createMockTestResultRepository(hasAllResults),
    ),
  );
};

describe("completeTestRun Use Case", () => {
  const validInput = {
    runId: "run-123",
  };

  it("should complete a test run when all items are executed", async () => {
    const MockLayer = createMockLayer("IN_PROGRESS", true);

    const program = completeTestRun(validInput).pipe(Effect.provide(MockLayer));

    const result = await Effect.runPromise(program);

    expect(result.run.id).toBe("run-123");
    expect(result.run.status).toBe("COMPLETED");
    expect(result.summary.total).toBe(2);
    expect(result.summary.executed).toBe(2);
  });

  it("should calculate summary correctly", async () => {
    const MockLayer = createMockLayer("IN_PROGRESS", true);

    const program = completeTestRun(validInput).pipe(Effect.provide(MockLayer));

    const result = await Effect.runPromise(program);

    expect(result.summary).toMatchObject({
      total: 2,
      executed: 2,
      passed: 1,
      failed: 1,
      blocked: 0,
      skipped: 0,
    });
  });

  it("should fail when test run is not IN_PROGRESS", async () => {
    const MockLayer = createMockLayer("ASSIGNED", true);

    const program = completeTestRun(validInput).pipe(Effect.provide(MockLayer));

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should fail when test run is already COMPLETED", async () => {
    const MockLayer = createMockLayer("COMPLETED", true);

    const program = completeTestRun(validInput).pipe(Effect.provide(MockLayer));

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should fail when not all items are executed without force flag", async () => {
    const MockLayer = createMockLayer("IN_PROGRESS", false);

    const program = completeTestRun(validInput).pipe(Effect.provide(MockLayer));

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should complete with force flag even when not all items are executed", async () => {
    const MockLayer = createMockLayer("IN_PROGRESS", false);

    const input = {
      runId: "run-123",
      force: true,
    };

    const program = completeTestRun(input).pipe(Effect.provide(MockLayer));

    const result = await Effect.runPromise(program);

    expect(result.run.status).toBe("COMPLETED");
    expect(result.summary.total).toBe(2);
    expect(result.summary.executed).toBe(1); // Only one item executed
  });

  it("should fail when test run is not found", async () => {
    const MockLayer = createMockLayer("IN_PROGRESS", true);

    const input = {
      runId: "non-existent-run",
    };

    const program = completeTestRun(input).pipe(Effect.provide(MockLayer));

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });
});
