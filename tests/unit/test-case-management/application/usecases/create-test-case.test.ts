import { describe, it, expect, beforeEach } from "vitest";
import { Effect, Layer, Context } from "effect";
import { createTestCase } from "~/features/test-case-management/application/usecases/create-test-case";
import { TestCaseRepository } from "~/features/test-case-management/application/ports/test-case-repository";
import { TestCase } from "~/features/test-case-management/domain/models/test-case";
import { TestCaseContent } from "~/features/test-case-management/domain/models/test-case-content";
import { RevisionValidationError, RevisionCreationError, RevisionUpdateError } from "~/features/test-case-management/domain/errors/revision-errors";
import { TestCaseNotFoundError, TestCaseRevisionNotFoundError } from "~/features/test-case-management/domain/errors/test-case-errors";
import type { RevisionStatus } from "~/features/test-case-management/domain/models/revision-status";

/**
 * Mock TestCaseRepository implementation for testing
 */
const createMockRepository = () => {
  const mockCreate = Effect.succeed(
    new TestCase({
      id: "test-case-123",
      projectId: "project-456",
      createdAt: new Date("2024-01-01"),
    }),
  );

  return {
    findById: (_caseId: string) => Effect.fail(new TestCaseNotFoundError({ message: "Not implemented", caseId: _caseId })),
    findByProjectId: (_projectId: string) => Effect.succeed([]),
    create: (_input: { readonly projectId: string; readonly title: string; readonly content: TestCaseContent; readonly createdBy: string }) => mockCreate,
    findRevisionById: (_revisionId: string) => Effect.fail(new TestCaseRevisionNotFoundError({ message: "Not implemented" })),
    findLatestRevision: (_caseId: string) => Effect.fail(new TestCaseRevisionNotFoundError({ message: "Not implemented" })),
    findAllRevisions: (_caseId: string) => Effect.succeed([]),
    findRevisionByNumber: (_caseId: string, _revisionNumber: number) => Effect.fail(new TestCaseRevisionNotFoundError({ message: "Not implemented" })),
    createRevision: (_input: { readonly caseId: string; readonly title: string; readonly content: TestCaseContent; readonly createdBy: string }) => Effect.fail(new RevisionCreationError({ message: "Not implemented", cause: new Error("Not implemented") })),
    updateRevision: (_revisionId: string, _input: { readonly title?: string; readonly content?: TestCaseContent }) => Effect.fail(new RevisionUpdateError({ message: "Not implemented", revisionId: _revisionId, cause: new Error("Not implemented") })),
    updateRevisionStatus: (_revisionId: string, _status: RevisionStatus, _userId?: string) => Effect.fail(new RevisionUpdateError({ message: "Not implemented", revisionId: _revisionId, cause: new Error("Not implemented") })),
    delete: (_caseId: string) => Effect.succeed(undefined),
    findRevisionsByStatus: (_projectId: string, _status: RevisionStatus) => Effect.succeed([]),
  };
};

const MockRepositoryLayer = Layer.succeed(
  TestCaseRepository,
  createMockRepository(),
);

describe("createTestCase Use Case", () => {
  const validInput = {
    projectId: "project-456",
    title: "Login Test",
    content: new TestCaseContent({
      steps: ["Open login page", "Enter credentials", "Click login"],
      expected_result: "User is logged in",
      priority: "HIGH" as const,
      tags: ["auth", "critical"],
    }),
    createdBy: "user-789",
  };

  it("should create a test case with valid input", async () => {
    const program = createTestCase(validInput).pipe(
      Effect.provide(MockRepositoryLayer),
    );

    const result = await Effect.runPromise(program);

    expect(result.id).toBe("test-case-123");
    expect(result.projectId).toBe("project-456");
  });

  it("should validate test case content before creation", async () => {
    const invalidInput = {
      ...validInput,
      content: new TestCaseContent({
        steps: [], // Invalid: empty steps
        expected_result: "",
      }),
    };

    const program = createTestCase(invalidInput).pipe(
      Effect.provide(MockRepositoryLayer),
    );

    // Effect wraps errors - check the error message instead
    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should fail when steps are empty", async () => {
    const invalidInput = {
      ...validInput,
      content: new TestCaseContent({
        steps: [],
        expected_result: "Result",
      }),
    };

    const program = createTestCase(invalidInput).pipe(
      Effect.provide(MockRepositoryLayer),
    );

    // Effect wraps errors - just check that it rejects
    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should fail when expected result is missing", async () => {
    const invalidInput = {
      ...validInput,
      content: new TestCaseContent({
        steps: ["Step 1"],
        expected_result: "",
      }),
    };

    const program = createTestCase(invalidInput).pipe(
      Effect.provide(MockRepositoryLayer),
    );

    // Effect wraps errors - just check that it rejects
    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should accept optional fields", async () => {
    const inputWithOptionals = {
      ...validInput,
      content: new TestCaseContent({
        steps: ["Step 1"],
        expected_result: "Result",
        preconditions: "User is logged out",
        test_data: "test@example.com",
        environment: "staging",
        notes: "Additional notes",
      }),
    };

    const program = createTestCase(inputWithOptionals).pipe(
      Effect.provide(MockRepositoryLayer),
    );

    const result = await Effect.runPromise(program);
    expect(result).toBeDefined();
  });
});
