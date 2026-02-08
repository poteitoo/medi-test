import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { startTestRun } from "~/features/test-execution/application/usecases/start-test-run";
import { TestRunRepository } from "~/features/test-execution/application/ports/test-run-repository";
import { TestRun } from "~/features/test-execution/domain/models/test-run";
import { TestRunItem } from "~/features/test-execution/domain/models/test-run-item";
import {
  TestRunNotFoundError,
  InvalidRunStatusError,
} from "~/features/test-execution/domain/errors/test-run-errors";

/**
 * Mock TestRunRepository implementation for testing
 */
const createMockTestRunRepository = (
  initialStatus: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" = "ASSIGNED",
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

  const mockTestRunInProgress = new TestRun({
    ...mockTestRun,
    status: "IN_PROGRESS",
    updatedAt: new Date("2024-01-02"),
  });

  const mockTestRunItem = new TestRunItem({
    id: "item-001",
    runId: "run-123",
    caseRevisionId: "case-rev-001",
    originScenarioRevisionId: "scenario-rev-001",
    order: 0,
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
            items: [mockTestRunItem],
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
        items: [mockTestRunItem],
      }),
    updateStatus: (
      runId: string,
      _status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED",
    ) =>
      runId === "run-123"
        ? Effect.succeed(mockTestRunInProgress)
        : Effect.fail(
            new TestRunNotFoundError({
              message: "Test run not found",
              runId,
            }),
          ),
  };
};

describe("startTestRun Use Case", () => {
  const validInput = {
    runId: "run-123",
  };

  it("should start a test run with ASSIGNED status", async () => {
    const MockRepositoryLayer = Layer.succeed(
      TestRunRepository,
      createMockTestRunRepository("ASSIGNED"),
    );

    const program = startTestRun(validInput).pipe(
      Effect.provide(MockRepositoryLayer),
    );

    const result = await Effect.runPromise(program);

    expect(result.id).toBe("run-123");
    expect(result.status).toBe("IN_PROGRESS");
  });

  it("should fail when test run is not found", async () => {
    const MockRepositoryLayer = Layer.succeed(
      TestRunRepository,
      createMockTestRunRepository(),
    );

    const input = {
      runId: "non-existent-run",
    };

    const program = startTestRun(input).pipe(
      Effect.provide(MockRepositoryLayer),
    );

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should fail when test run is already IN_PROGRESS", async () => {
    const MockRepositoryLayer = Layer.succeed(
      TestRunRepository,
      createMockTestRunRepository("IN_PROGRESS"),
    );

    const program = startTestRun(validInput).pipe(
      Effect.provide(MockRepositoryLayer),
    );

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should fail when test run is already COMPLETED", async () => {
    const MockRepositoryLayer = Layer.succeed(
      TestRunRepository,
      createMockTestRunRepository("COMPLETED"),
    );

    const program = startTestRun(validInput).pipe(
      Effect.provide(MockRepositoryLayer),
    );

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should only allow transition from ASSIGNED to IN_PROGRESS", async () => {
    const MockRepositoryLayer = Layer.succeed(
      TestRunRepository,
      createMockTestRunRepository("ASSIGNED"),
    );

    const program = startTestRun(validInput).pipe(
      Effect.provide(MockRepositoryLayer),
    );

    const result = await Effect.runPromise(program);

    // Verify the status is updated correctly
    expect(result.status).toBe("IN_PROGRESS");
  });
});
