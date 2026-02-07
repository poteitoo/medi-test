# End-to-End (E2E) Tests

E2E tests verify complete workflows from start to finish using real implementations.

## ⚠️ Current Status

The E2E tests are **stub implementations** and require the same fixes as integration tests.

## Test Coverage

### test-execution-flow.e2e.test.ts

Tests the complete test execution workflow:

1. **Happy Path**: Create → Start → Execute (all 4 statuses) → Complete
   - Creates test run with 4 items
   - Starts test run (ASSIGNED → IN_PROGRESS)
   - Records results:
     - Item 1: PASS
     - Item 2: FAIL with bug link
     - Item 3: BLOCKED with bug link
     - Item 4: SKIPPED
   - Completes test run (IN_PROGRESS → COMPLETED)
   - Verifies final state in database

2. **Forced Completion**: Test force flag for incomplete runs
   - Creates test run with 4 items
   - Records only 2 results
   - Attempts completion without force (should fail)
   - Completes with force flag (should succeed)
   - Verifies partial execution state

## Prerequisites

Same as integration tests - see `tests/integration/README.md`

## Required Fixes

In addition to integration test fixes:

### 1. Fix recordTestResult Input

```typescript
// ❌ Current
await Effect.runPromise(
  recordTestResult({
    runItemId: runItemIds[0],
    status: "PASS",
    executedBy: testUserId,
  })
);

// ✅ Fixed - add runId
await Effect.runPromise(
  recordTestResult({
    runId: runId,              // Required!
    runItemId: runItemIds[0],
    status: "PASS",
    executedBy: testUserId,
  })
);
```

### 2. Fix Return Value Access

```typescript
// ❌ Current
const result1 = await Effect.runPromise(result1Program);
expect(result1.result.status).toBe("PASS");

// ✅ Fixed - recordTestResult returns TestResult directly
const result1 = await Effect.runPromise(result1Program);
expect(result1.status).toBe("PASS");
```

### 3. Fix Prisma Schema Field Names

Update all database operations to use snake_case field names matching the schema.

## Running Tests

Once fixed:

```bash
# Run all E2E tests
pnpm vitest run tests/e2e

# Run specific test
pnpm vitest run tests/e2e/test-execution-flow.e2e.test.ts

# Run with console output
pnpm vitest run tests/e2e --reporter=verbose
```

## Expected Output

When working correctly, you should see:

```
🧪 E2E: Complete Test Execution Flow

Step 1: Creating test run...
✓ Test run created: <uuid> with 4 items

Step 2: Starting test run...
✓ Test run started: status = IN_PROGRESS

Step 3: Recording test results...
✓ Result 1 recorded: PASS
✓ Result 2 recorded: FAIL with bug link
✓ Result 3 recorded: BLOCKED
✓ Result 4 recorded: SKIPPED

Step 4: Completing test run...
✓ Test run completed: status = COMPLETED

Summary:
  Total: 4
  Executed: 4
  Passed: 1
  Failed: 1
  Blocked: 1
  Skipped: 1

Step 5: Verifying final state...
✓ Final state verified in database

✅ Complete test execution flow completed successfully!
```

## Test Data Lifecycle

Each test:
1. Creates fresh test data (project, user, release, etc.)
2. Executes the workflow
3. Cleans up data in `afterAll`

This ensures tests are:
- **Isolated**: Each test has its own data
- **Repeatable**: Tests can run multiple times
- **Clean**: No test data left in database

## Adding More E2E Tests

Future E2E test scenarios:

1. **Multi-User Execution**
   - Multiple users executing different items in parallel
   - Verify concurrent result recording

2. **CI Integration Flow**
   - Import JUnit XML results
   - Verify auto-matching and result recording

3. **SSE Real-time Updates**
   - Connect SSE client
   - Verify progress events during execution

4. **Run Group Workflow**
   - Create multiple runs in a group
   - Verify group progress aggregation

5. **Error Scenarios**
   - Invalid status transitions
   - Missing required evidence
   - Completing without all results

## Performance Considerations

E2E tests are slower than unit tests because they:
- Use real database operations
- Create complex test data
- Execute full workflows

Best practices:
- Run E2E tests separately from unit tests
- Use parallel execution where possible
- Clean up test data efficiently
- Consider using database snapshots for faster setup

## Integration with CI/CD

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: pnpm install
      - name: Run Migrations
        run: pnpm prisma migrate deploy
      - name: Run E2E Tests
        run: pnpm vitest run tests/e2e
        env:
          DATABASE_URL: file:./test.db
```

## Debugging E2E Tests

Enable debug logging:

```bash
# Prisma query logging
DEBUG=prisma:query pnpm vitest run tests/e2e

# Effect logging
EFFECT_LOG_LEVEL=debug pnpm vitest run tests/e2e

# Vitest verbose output
pnpm vitest run tests/e2e --reporter=verbose
```

## Next Steps

1. Fix all type errors and schema mismatches
2. Verify tests run successfully
3. Add more E2E test scenarios
4. Integrate with CI/CD pipeline
5. Add performance benchmarks
6. Document expected execution times
