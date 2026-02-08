import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Effect } from "effect";
import { PrismaClient } from "@prisma/client";
import { TestExecutionLayer } from "~/features/test-execution/infrastructure/layers/test-execution-layer";
import { createTestRun } from "~/features/test-execution/application/usecases/create-test-run";
import { startTestRun } from "~/features/test-execution/application/usecases/start-test-run";
import { recordTestResult } from "~/features/test-execution/application/usecases/record-test-result";
import { completeTestRun } from "~/features/test-execution/application/usecases/complete-test-run";

/**
 * E2E Test: Complete Test Execution Flow
 *
 * @remarks
 * This test verifies the entire test execution workflow from creation to completion:
 * 1. Create test run (ASSIGNED status)
 * 2. Start test run (IN_PROGRESS status)
 * 3. Record multiple test results (PASS/FAIL/BLOCKED/SKIPPED)
 * 4. Complete test run (COMPLETED status)
 *
 * Requirements:
 * - PostgreSQL test database running
 * - TEST_DATABASE_URL environment variable set
 * - Prisma migrations applied
 *
 * Setup:
 * ```bash
 * export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/medi_test_e2e"
 * DATABASE_URL=$TEST_DATABASE_URL pnpm prisma migrate deploy
 * pnpm vitest run tests/e2e
 * ```
 */

describe("E2E: Complete Test Execution Flow", () => {
  let prisma: PrismaClient;
  let testProjectId: string;
  let testReleaseId: string;
  let testRunGroupId: string;
  let testListRevisionId: string;
  let testUserId: string;
  let testCaseRevisionIds: string[];

  beforeAll(async () => {
    const databaseUrl =
      process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        "TEST_DATABASE_URL or DATABASE_URL must be set for E2E tests",
      );
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    await prisma.$connect();

    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.testResult.deleteMany({});
    await prisma.testRunItem.deleteMany({});
    await prisma.testRun.deleteMany({});
    await prisma.testRunGroup.deleteMany({});
    await prisma.testScenarioListItem.deleteMany({});
    await prisma.testScenarioListRevision.deleteMany({});
    await prisma.testScenarioList.deleteMany({});
    await prisma.testCaseRevision.deleteMany({});
    await prisma.testCase.deleteMany({});
    await prisma.release.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});

    await prisma.$disconnect();
  });

  async function setupTestData() {
    // Create project
    const project = await prisma.project.create({
      data: {
        id: "e2e-project-001",
        name: "E2E Test Project",
        description: "End-to-end test project",
      },
    });
    testProjectId = project.id;

    // Create user
    const user = await prisma.user.create({
      data: {
        id: "e2e-user-001",
        username: "e2euser",
        email: "e2e@example.com",
        display_name: "E2E Test User",
      },
    });
    testUserId = user.id;

    // Create release
    const release = await prisma.release.create({
      data: {
        id: "e2e-release-001",
        project_id: testProjectId,
        version: "1.0.0-e2e",
        scheduled_date: new Date("2024-06-01"),
      },
    });
    testReleaseId = release.id;

    // Create run group
    const runGroup = await prisma.testRunGroup.create({
      data: {
        id: "e2e-group-001",
        release_id: testReleaseId,
        environment_type: "STAGING",
        status: "NOT_STARTED",
      },
    });
    testRunGroupId = runGroup.id;

    // Create test cases
    const testCases = await Promise.all([
      prisma.testCase.create({
        data: {
          id: "e2e-case-001",
          project_id: testProjectId,
          identifier: "E2E-TC-001",
        },
      }),
      prisma.testCase.create({
        data: {
          id: "e2e-case-002",
          project_id: testProjectId,
          identifier: "E2E-TC-002",
        },
      }),
      prisma.testCase.create({
        data: {
          id: "e2e-case-003",
          project_id: testProjectId,
          identifier: "E2E-TC-003",
        },
      }),
      prisma.testCase.create({
        data: {
          id: "e2e-case-004",
          project_id: testProjectId,
          identifier: "E2E-TC-004",
        },
      }),
    ]);

    // Create test case revisions
    testCaseRevisionIds = await Promise.all(
      testCases.map(async (testCase, index) => {
        const revision = await prisma.testCaseRevision.create({
          data: {
            id: `e2e-case-rev-${String(index + 1).padStart(3, "0")}`,
            case_id: testCase.id,
            version: 1,
            title: `E2E Test Case ${index + 1}`,
            committed_by: testUserId,
            committed_at: new Date("2024-01-01"),
          },
        });
        return revision.id;
      }),
    ).then((ids) => ids);

    // Create test scenario list
    const testList = await prisma.testScenarioList.create({
      data: {
        id: "e2e-list-001",
        project_id: testProjectId,
        title: "E2E Test Scenario List",
      },
    });

    // Create list revision
    const listRevision = await prisma.testScenarioListRevision.create({
      data: {
        id: "e2e-list-rev-001",
        list_id: testList.id,
        version: 1,
        committed_by: testUserId,
        committed_at: new Date("2024-01-01"),
      },
    });
    testListRevisionId = listRevision.id;

    // Create list items
    await Promise.all(
      testCaseRevisionIds.map((caseRevId, index) =>
        prisma.testScenarioListItem.create({
          data: {
            id: `e2e-list-item-${String(index + 1).padStart(3, "0")}`,
            list_revision_id: listRevision.id,
            case_revision_id: caseRevId,
            order: index,
          },
        }),
      ),
    );
  }

  it("should complete full test execution workflow", async () => {
    // Step 1: Create test run
    console.log("Step 1: Creating test run...");
    const createProgram = createTestRun({
      runGroupId: testRunGroupId,
      assigneeUserId: testUserId,
      sourceListRevisionId: testListRevisionId,
      buildRef: "e2e-build-123",
    }).pipe(Effect.provide(TestExecutionLayer));

    const createResult = await Effect.runPromise(createProgram);

    expect(createResult.run.status).toBe("ASSIGNED");
    expect(createResult.items).toHaveLength(4);
    console.log(
      `✓ Test run created: ${createResult.run.id} with ${createResult.items.length} items`,
    );

    const runId = createResult.run.id;
    const runItemIds = createResult.items.map((item) => item.id);

    // Step 2: Start test run
    console.log("\nStep 2: Starting test run...");
    const startProgram = startTestRun({
      runId,
    }).pipe(Effect.provide(TestExecutionLayer));

    const startResult = await Effect.runPromise(startProgram);

    expect(startResult.status).toBe("IN_PROGRESS");
    console.log(`✓ Test run started: status = ${startResult.status}`);

    // Step 3: Record test results
    console.log("\nStep 3: Recording test results...");

    // Result 1: PASS
    const result1Program = recordTestResult({
      runItemId: runItemIds[0],
      status: "PASS",
      executedBy: testUserId,
    }).pipe(Effect.provide(TestExecutionLayer));

    const result1 = await Effect.runPromise(result1Program);
    expect(result1.result.status).toBe("PASS");
    console.log(`✓ Result 1 recorded: PASS`);

    // Result 2: FAIL with bug link
    const result2Program = recordTestResult({
      runItemId: runItemIds[1],
      status: "FAIL",
      evidence: {
        logs: "Error: Connection timeout after 30s",
      },
      bugLinks: [
        {
          url: "https://tracker.example.com/bug/e2e-001",
          title: "Connection timeout in payment flow",
          severity: "HIGH",
        },
      ],
      executedBy: testUserId,
    }).pipe(Effect.provide(TestExecutionLayer));

    const result2 = await Effect.runPromise(result2Program);
    expect(result2.result.status).toBe("FAIL");
    expect(result2.result.bugLinks).toHaveLength(1);
    console.log(`✓ Result 2 recorded: FAIL with bug link`);

    // Result 3: BLOCKED
    const result3Program = recordTestResult({
      runItemId: runItemIds[2],
      status: "BLOCKED",
      bugLinks: [
        {
          url: "https://tracker.example.com/bug/e2e-002",
          title: "Database migration not applied",
          severity: "CRITICAL",
        },
      ],
      executedBy: testUserId,
    }).pipe(Effect.provide(TestExecutionLayer));

    const result3 = await Effect.runPromise(result3Program);
    expect(result3.result.status).toBe("BLOCKED");
    console.log(`✓ Result 3 recorded: BLOCKED`);

    // Result 4: SKIPPED
    const result4Program = recordTestResult({
      runItemId: runItemIds[3],
      status: "SKIPPED",
      executedBy: testUserId,
    }).pipe(Effect.provide(TestExecutionLayer));

    const result4 = await Effect.runPromise(result4Program);
    expect(result4.result.status).toBe("SKIPPED");
    console.log(`✓ Result 4 recorded: SKIPPED`);

    // Step 4: Complete test run
    console.log("\nStep 4: Completing test run...");
    const completeProgram = completeTestRun({
      runId,
      force: false,
    }).pipe(Effect.provide(TestExecutionLayer));

    const completeResult = await Effect.runPromise(completeProgram);

    expect(completeResult.run.status).toBe("COMPLETED");
    expect(completeResult.summary.total).toBe(4);
    expect(completeResult.summary.executed).toBe(4);
    expect(completeResult.summary.passed).toBe(1);
    expect(completeResult.summary.failed).toBe(1);
    expect(completeResult.summary.blocked).toBe(1);
    expect(completeResult.summary.skipped).toBe(1);

    console.log(`✓ Test run completed: status = ${completeResult.run.status}`);
    console.log(`\nSummary:`);
    console.log(`  Total: ${completeResult.summary.total}`);
    console.log(`  Executed: ${completeResult.summary.executed}`);
    console.log(`  Passed: ${completeResult.summary.passed}`);
    console.log(`  Failed: ${completeResult.summary.failed}`);
    console.log(`  Blocked: ${completeResult.summary.blocked}`);
    console.log(`  Skipped: ${completeResult.summary.skipped}`);

    // Step 5: Verify final state in database
    console.log("\nStep 5: Verifying final state...");
    const finalRun = await prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        run_items: {
          include: {
            test_results: {
              orderBy: { executed_at: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    expect(finalRun?.status).toBe("COMPLETED");
    expect(finalRun?.run_items).toHaveLength(4);
    expect(
      finalRun?.run_items.every((item) => item.test_results.length > 0),
    ).toBe(true);
    console.log(`✓ Final state verified in database`);

    console.log("\n✅ Complete test execution flow completed successfully!");
  });

  it("should handle forced completion with incomplete items", async () => {
    console.log("\n🧪 Testing forced completion...");

    // Create test run
    const createProgram = createTestRun({
      runGroupId: testRunGroupId,
      assigneeUserId: testUserId,
      sourceListRevisionId: testListRevisionId,
      buildRef: "e2e-build-forced",
    }).pipe(Effect.provide(TestExecutionLayer));

    const createResult = await Effect.runPromise(createProgram);
    const runId = createResult.run.id;
    const runItemIds = createResult.items.map((item) => item.id);

    // Start test run
    await Effect.runPromise(
      startTestRun({ runId }).pipe(Effect.provide(TestExecutionLayer)),
    );

    // Record only 2 out of 4 results
    await Effect.runPromise(
      recordTestResult({
        runItemId: runItemIds[0],
        status: "PASS",
        executedBy: testUserId,
      }).pipe(Effect.provide(TestExecutionLayer)),
    );

    await Effect.runPromise(
      recordTestResult({
        runItemId: runItemIds[1],
        status: "FAIL",
        executedBy: testUserId,
      }).pipe(Effect.provide(TestExecutionLayer)),
    );

    console.log("✓ Recorded 2 out of 4 results");

    // Try to complete without force - should fail
    const completeWithoutForceProgram = completeTestRun({
      runId,
      force: false,
    }).pipe(Effect.provide(TestExecutionLayer));

    await expect(
      Effect.runPromise(completeWithoutForceProgram),
    ).rejects.toThrow();
    console.log("✓ Completion without force flag rejected (expected)");

    // Complete with force - should succeed
    const completeWithForceProgram = completeTestRun({
      runId,
      force: true,
    }).pipe(Effect.provide(TestExecutionLayer));

    const completeResult = await Effect.runPromise(completeWithForceProgram);

    expect(completeResult.run.status).toBe("COMPLETED");
    expect(completeResult.summary.total).toBe(4);
    expect(completeResult.summary.executed).toBe(2);
    console.log("✓ Forced completion succeeded");
    console.log(
      `  Executed: ${completeResult.summary.executed}/${completeResult.summary.total}`,
    );

    console.log("\n✅ Forced completion test passed!");
  });
});
