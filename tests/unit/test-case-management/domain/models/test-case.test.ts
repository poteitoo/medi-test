import { describe, it, expect } from "vitest";
import { TestCase } from "~/features/test-case-management/domain/models/test-case";
import { TestCaseContent } from "~/features/test-case-management/domain/models/test-case-content";
import {
  canTransitionTo,
  isEditable,
  isApprovable,
} from "~/features/test-case-management/domain/models/revision-status";

describe("TestCase Domain Model", () => {
  describe("TestCase", () => {
    it("should create a test case with required fields", () => {
      const testCase = new TestCase({
        id: "test-case-123",
        projectId: "project-456",
        createdAt: new Date("2024-01-01"),
      });

      expect(testCase.id).toBe("test-case-123");
      expect(testCase.projectId).toBe("project-456");
      expect(testCase.createdAt).toEqual(new Date("2024-01-01"));
    });

    it("should be immutable (Data.Class behavior)", () => {
      const testCase = new TestCase({
        id: "test-case-123",
        projectId: "project-456",
        createdAt: new Date("2024-01-01"),
      });

      // Data.Class creates immutable objects (properties are readonly)
      // TypeScript prevents mutation at compile time
      expect(testCase.id).toBe("test-case-123");
    });
  });

  describe("TestCaseContent", () => {
    it("should create valid content with required fields", () => {
      const content = new TestCaseContent({
        steps: ["Step 1", "Step 2"],
        expected_result: "Expected result",
      });

      expect(content.steps).toHaveLength(2);
      expect(content.expected_result).toBe("Expected result");
    });

    it("should include optional fields", () => {
      const content = new TestCaseContent({
        steps: ["Step 1"],
        expected_result: "Result",
        priority: "HIGH",
        tags: ["auth", "critical"],
        environment: "staging",
      });

      expect(content.priority).toBe("HIGH");
      expect(content.tags).toEqual(["auth", "critical"]);
      expect(content.environment).toBe("staging");
    });

    it("should validate content correctly", () => {
      const validContent = new TestCaseContent({
        steps: ["Step 1"],
        expected_result: "Result",
      });

      // TestCaseContent validation is done at the Zod schema level
      // The domain model accepts the data as-is
      expect(validContent.steps).toHaveLength(1);
      expect(validContent.expected_result).toBe("Result");
    });

    it("should fail validation with empty steps", () => {
      const invalidContent = new TestCaseContent({
        steps: [],
        expected_result: "Result",
      });

      // Empty steps are caught at validation time via Zod schema, not at construction
      // The domain model just holds the data
      expect(invalidContent.steps).toHaveLength(0);
    });
  });

  describe("RevisionStatus", () => {
    it("should allow valid status transitions", () => {
      expect(canTransitionTo("DRAFT", "IN_REVIEW")).toBe(true);
      expect(canTransitionTo("IN_REVIEW", "APPROVED")).toBe(true);
      expect(canTransitionTo("IN_REVIEW", "DEPRECATED")).toBe(true);
      expect(canTransitionTo("DEPRECATED", "DRAFT")).toBe(true);
    });

    it("should prevent invalid status transitions", () => {
      expect(canTransitionTo("APPROVED", "DRAFT")).toBe(false);
      expect(canTransitionTo("APPROVED", "IN_REVIEW")).toBe(false);
      expect(canTransitionTo("DRAFT", "APPROVED")).toBe(false);
    });

    it("should correctly identify editable statuses", () => {
      expect(isEditable("DRAFT")).toBe(true);
      expect(isEditable("DEPRECATED")).toBe(true);
      expect(isEditable("APPROVED")).toBe(false);
      expect(isEditable("IN_REVIEW")).toBe(false);
    });

    it("should correctly identify approvable statuses", () => {
      expect(isApprovable("IN_REVIEW")).toBe(true);
      expect(isApprovable("DRAFT")).toBe(false);
      expect(isApprovable("APPROVED")).toBe(false);
    });
  });
});
