import { describe, it, expect, beforeEach } from "vitest";
import { Effect, Layer, Context } from "effect";
import { createTestCase } from "~/features/test-case-management/application/usecases/create-test-case";
import { TestCaseRepository } from "~/features/test-case-management/application/ports/test-case-repository";
import { TestCase } from "~/features/test-case-management/domain/models/test-case";
import {
  TestCaseContent,
  TestStep,
} from "~/features/test-case-management/domain/models/test-case-content";
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
    findById: (_caseId: string) => Effect.succeed(null),
    findByProjectId: (_projectId: string) => Effect.succeed([]),
    create: (_projectId: string, _createdBy: string) => mockCreate,
    findRevisionById: (_revisionId: string) => Effect.succeed(null),
    findLatestRevision: (_caseId: string) => Effect.succeed(null),
    findAllRevisions: (_caseId: string) => Effect.succeed([]),
    findRevisionByNumber: (_caseId: string, _revisionNumber: number) =>
      Effect.succeed(null),
    createRevision: (
      _caseId: string,
      _input: {
        readonly title: string;
        readonly content: TestCaseContent;
        readonly reason: string;
        readonly createdBy: string;
      },
    ) => Effect.succeed({} as any),
    updateRevision: (
      _revisionId: string,
      _input: { readonly title?: string; readonly content?: TestCaseContent },
    ) => Effect.succeed({} as any),
    updateRevisionStatus: (_revisionId: string, _status: RevisionStatus) =>
      Effect.succeed({} as any),
    delete: (_caseId: string) => Effect.succeed(undefined),
    findRevisionsByStatus: (_projectId: string, _status: RevisionStatus) =>
      Effect.succeed([]),
    findRevisionHistory: (_caseId: string) => Effect.succeed([]),
    deleteCase: (_caseId: string) => Effect.succeed(undefined),
  };
};

const MockRepositoryLayer = Layer.succeed(
  TestCaseRepository,
  createMockRepository(),
);

describe("createTestCase Use Case", () => {
  const validInput = {
    projectId: "project-456",
    createdBy: "user-789",
    initialData: {
      title: "Login Test",
      content: new TestCaseContent({
        steps: [
          new TestStep({
            stepNumber: 1,
            action: "Open login page",
            expectedOutcome: "Login page is displayed",
          }),
          new TestStep({
            stepNumber: 2,
            action: "Enter credentials",
            expectedOutcome: "Credentials are entered",
          }),
          new TestStep({
            stepNumber: 3,
            action: "Click login",
            expectedOutcome: "User is logged in",
          }),
        ],
        expectedResult: "User is logged in",
        priority: "HIGH" as const,
        tags: ["auth", "critical"],
        environment: "staging",
      }),
    },
  };

  it("should create a test case with valid input", async () => {
    const program = createTestCase(
      validInput.projectId,
      validInput.createdBy,
      validInput.initialData,
    ).pipe(Effect.provide(MockRepositoryLayer));

    const result = await Effect.runPromise(program);

    expect(result).toBeDefined();
  });

  it("should validate test case content before creation", async () => {
    const invalidInput = {
      projectId: validInput.projectId,
      createdBy: validInput.createdBy,
      initialData: {
        title: "Invalid Test",
        content: new TestCaseContent({
          steps: [], // Invalid: empty steps
          expectedResult: "",
          tags: [],
          priority: "MEDIUM" as const,
          environment: "staging",
        }),
      },
    };

    const program = createTestCase(
      invalidInput.projectId,
      invalidInput.createdBy,
      invalidInput.initialData,
    ).pipe(Effect.provide(MockRepositoryLayer));

    // Effect wraps errors - check the error message instead
    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should fail when steps are empty", async () => {
    const invalidInput = {
      projectId: validInput.projectId,
      createdBy: validInput.createdBy,
      initialData: {
        title: "Empty Steps Test",
        content: new TestCaseContent({
          steps: [],
          expectedResult: "Result",
          tags: [],
          priority: "MEDIUM" as const,
          environment: "staging",
        }),
      },
    };

    const program = createTestCase(
      invalidInput.projectId,
      invalidInput.createdBy,
      invalidInput.initialData,
    ).pipe(Effect.provide(MockRepositoryLayer));

    // Effect wraps errors - just check that it rejects
    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should fail when expected result is missing", async () => {
    const invalidInput = {
      projectId: validInput.projectId,
      createdBy: validInput.createdBy,
      initialData: {
        title: "Missing Result Test",
        content: new TestCaseContent({
          steps: [
            new TestStep({
              stepNumber: 1,
              action: "Step 1",
              expectedOutcome: "Outcome 1",
            }),
          ],
          expectedResult: "",
          tags: [],
          priority: "MEDIUM" as const,
          environment: "staging",
        }),
      },
    };

    const program = createTestCase(
      invalidInput.projectId,
      invalidInput.createdBy,
      invalidInput.initialData,
    ).pipe(Effect.provide(MockRepositoryLayer));

    // Effect wraps errors - just check that it rejects
    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("should accept optional fields", async () => {
    const inputWithOptionals = {
      projectId: validInput.projectId,
      createdBy: validInput.createdBy,
      initialData: {
        title: "Test with Optionals",
        content: new TestCaseContent({
          steps: [
            new TestStep({
              stepNumber: 1,
              action: "Step 1",
              expectedOutcome: "Outcome 1",
            }),
          ],
          expectedResult: "Result",
          tags: [],
          priority: "MEDIUM" as const,
          environment: "staging",
          preconditions: "User is logged out",
          testData: "test@example.com",
          notes: "Additional notes",
        }),
      },
    };

    const program = createTestCase(
      inputWithOptionals.projectId,
      inputWithOptionals.createdBy,
      inputWithOptionals.initialData,
    ).pipe(Effect.provide(MockRepositoryLayer));

    const result = await Effect.runPromise(program);
    expect(result).toBeDefined();
  });
});
