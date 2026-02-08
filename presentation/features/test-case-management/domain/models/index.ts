/**
 * Test Case Management Domain Models
 *
 * このファイルはドメインモデルのエクスポートをまとめます。
 */

// Revision Status
export {
  RevisionStatus,
  RevisionStatusLabels,
  RevisionStatusDescriptions,
  isEditable,
  canTransitionTo,
  getAvailableTransitions,
  isApprovable,
  isFinalStatus,
  getStatusBadgeColor,
} from "./revision-status";
export type { RevisionStatus as RevisionStatusType } from "./revision-status";

// Test Case Content
export {
  TestStep,
  TestCasePriority,
  TestCasePriorityLabels,
  TestCaseContent,
  emptyTestCaseContent,
  validateTestCaseContent,
} from "./test-case-content";
export type {
  TestCasePriority as TestCasePriorityType,
  ValidationResult,
} from "./test-case-content";

// Test Case
export { TestCase } from "./test-case";

// Test Case Revision
export { TestCaseRevision } from "./test-case-revision";
export type { Json } from "./test-case-revision";

// Test Scenario
export { TestScenario } from "./test-scenario";

// Test Scenario Revision
export {
  TestScenarioItem,
  TestScenarioRevision,
} from "./test-scenario-revision";

// Backward compatibility aliases
export { TestScenarioItem as TestScenarioCaseRef } from "./test-scenario-revision";

// Test Scenario List
export { TestScenarioList } from "./test-scenario-list";

// Test Scenario List Revision
export {
  TestScenarioListItem,
  TestScenarioListRevision,
} from "./test-scenario-list-revision";

// Backward compatibility aliases
export { TestScenarioListItem as TestScenarioListItemRef } from "./test-scenario-list-revision";
