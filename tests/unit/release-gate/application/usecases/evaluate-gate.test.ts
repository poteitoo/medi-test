import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { evaluateGate } from "~/features/release-gate/application/usecases/evaluate-gate";
import { ReleaseRepository } from "~/features/release-gate/application/ports/release-repository";
import { GateEvaluationService } from "~/features/release-gate/application/ports/gate-evaluation-service";
import { WaiverService } from "~/features/release-gate/application/ports/waiver-service";
import { Release } from "~/features/release-gate/domain/models/release";
import { GateViolation } from "~/features/release-gate/domain/models/gate-violation";
import { DEFAULT_GATE_CONDITIONS } from "~/features/release-gate/domain/models/gate-condition";
import { ReleaseNotFoundError } from "~/features/release-gate/domain/errors/release-errors";
import { WaiverNotFoundError } from "~/features/release-gate/domain/errors/waiver-errors";

describe("evaluateGate use case", () => {
  it("should evaluate gate conditions and return passed status when no violations", async () => {
    // Mock ReleaseRepository
    const MockReleaseRepository = Layer.succeed(ReleaseRepository, {
      findById: (releaseId: string) =>
        Effect.succeed(
          new Release({
            id: releaseId,
            projectId: "project-123",
            name: "v1.0.0",
            status: "GATE_CHECK",
            createdAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-02"),
          }),
        ),
      findByProjectId: () => Effect.succeed([]),
      create: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
      updateStatus: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
      createBaseline: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
      findBaselines: () => Effect.succeed([]),
      delete: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
    });

    // Mock GateEvaluationService (all conditions pass)
    const MockGateEvaluationService = Layer.succeed(GateEvaluationService, {
      evaluate: (releaseId: string) =>
        Effect.succeed({
          releaseId,
          conditions: DEFAULT_GATE_CONDITIONS,
          violations: [],
          passed: true,
          evaluatedAt: new Date("2026-01-02"),
        }),
      calculateCoverage: () => Effect.succeed(85),
      checkAllTestsPass: () => Effect.succeed(true),
      checkNoCriticalBugs: () => Effect.succeed(true),
      checkAllApprovalsComplete: () => Effect.succeed(true),
      checkNoUnapprovedChanges: () => Effect.succeed(true),
    });

    // Mock WaiverService
    const MockWaiverService = Layer.succeed(WaiverService, {
      findById: () =>
        Effect.fail(new WaiverNotFoundError({ message: "Not implemented" })),
      findByReleaseId: () => Effect.succeed([]),
      issue: () =>
        Effect.fail(new WaiverNotFoundError({ message: "Not implemented" })),
      delete: () =>
        Effect.fail(new WaiverNotFoundError({ message: "Not implemented" })),
      findExpired: () => Effect.succeed([]),
      isValid: () => Effect.succeed(true),
      findValidWaiverForTarget: () => Effect.succeed(null),
    });

    const TestLayer = Layer.mergeAll(
      MockReleaseRepository,
      MockGateEvaluationService,
      MockWaiverService,
    );

    const program = evaluateGate({ releaseId: "release-123" }).pipe(
      Effect.provide(TestLayer),
    );

    const result = await Effect.runPromise(program);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("should evaluate gate conditions and return failed status when violations exist", async () => {
    const mockViolation = new GateViolation({
      conditionType: "ALL_TESTS_PASS",
      severity: "CRITICAL",
      message: "テストケースが失敗しています",
      suggestedAction: "失敗したテストを修正してください",
    });

    // Mock ReleaseRepository
    const MockReleaseRepository = Layer.succeed(ReleaseRepository, {
      findById: (releaseId: string) =>
        Effect.succeed(
          new Release({
            id: releaseId,
            projectId: "project-123",
            name: "v1.0.0",
            status: "GATE_CHECK",
            createdAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-02"),
          }),
        ),
      findByProjectId: () => Effect.succeed([]),
      create: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
      updateStatus: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
      createBaseline: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
      findBaselines: () => Effect.succeed([]),
      delete: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
    });

    // Mock GateEvaluationService (with violations)
    const MockGateEvaluationService = Layer.succeed(GateEvaluationService, {
      evaluate: (releaseId: string) =>
        Effect.succeed({
          releaseId,
          conditions: DEFAULT_GATE_CONDITIONS,
          violations: [mockViolation],
          passed: false,
          evaluatedAt: new Date("2026-01-02"),
        }),
      calculateCoverage: () => Effect.succeed(85),
      checkAllTestsPass: () => Effect.succeed(false),
      checkNoCriticalBugs: () => Effect.succeed(true),
      checkAllApprovalsComplete: () => Effect.succeed(true),
      checkNoUnapprovedChanges: () => Effect.succeed(true),
    });

    // Mock WaiverService
    const MockWaiverService = Layer.succeed(WaiverService, {
      findById: () =>
        Effect.fail(new WaiverNotFoundError({ message: "Not implemented" })),
      findByReleaseId: () => Effect.succeed([]),
      issue: () =>
        Effect.fail(new WaiverNotFoundError({ message: "Not implemented" })),
      delete: () =>
        Effect.fail(new WaiverNotFoundError({ message: "Not implemented" })),
      findExpired: () => Effect.succeed([]),
      isValid: () => Effect.succeed(true),
      findValidWaiverForTarget: () => Effect.succeed(null),
    });

    const TestLayer = Layer.mergeAll(
      MockReleaseRepository,
      MockGateEvaluationService,
      MockWaiverService,
    );

    const program = evaluateGate({ releaseId: "release-123" }).pipe(
      Effect.provide(TestLayer),
    );

    const result = await Effect.runPromise(program);

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].severity).toBe("CRITICAL");
  });

  it("should reject evaluation when release status is not evaluatable", async () => {
    // Mock ReleaseRepository with PLANNING status
    const MockReleaseRepository = Layer.succeed(ReleaseRepository, {
      findById: (releaseId: string) =>
        Effect.succeed(
          new Release({
            id: releaseId,
            projectId: "project-123",
            name: "v1.0.0",
            status: "PLANNING", // Not evaluatable
            createdAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-02"),
          }),
        ),
      findByProjectId: () => Effect.succeed([]),
      create: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
      updateStatus: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
      createBaseline: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
      findBaselines: () => Effect.succeed([]),
      delete: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
    });

    const MockGateEvaluationService = Layer.succeed(GateEvaluationService, {
      evaluate: () =>
        Effect.fail(new ReleaseNotFoundError({ message: "Not implemented" })),
      calculateCoverage: () => Effect.succeed(85),
      checkAllTestsPass: () => Effect.succeed(true),
      checkNoCriticalBugs: () => Effect.succeed(true),
      checkAllApprovalsComplete: () => Effect.succeed(true),
      checkNoUnapprovedChanges: () => Effect.succeed(true),
    });

    const MockWaiverService = Layer.succeed(WaiverService, {
      findById: () =>
        Effect.fail(new WaiverNotFoundError({ message: "Not implemented" })),
      findByReleaseId: () => Effect.succeed([]),
      issue: () =>
        Effect.fail(new WaiverNotFoundError({ message: "Not implemented" })),
      delete: () =>
        Effect.fail(new WaiverNotFoundError({ message: "Not implemented" })),
      findExpired: () => Effect.succeed([]),
      isValid: () => Effect.succeed(true),
      findValidWaiverForTarget: () => Effect.succeed(null),
    });

    const TestLayer = Layer.mergeAll(
      MockReleaseRepository,
      MockGateEvaluationService,
      MockWaiverService,
    );

    const program = evaluateGate({ releaseId: "release-123" }).pipe(
      Effect.provide(TestLayer),
    );

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });
});
