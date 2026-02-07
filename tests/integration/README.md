# Integration Tests

Integration tests verify repository implementations against a real database.

## ⚠️ Current Status

The integration tests are **stub implementations** and require setup before they can run:

1. **Database Schema Sync**: Tests were written assuming PostgreSQL, but current schema uses SQLite
2. **Prisma Client Config**: Tests need to be updated to work with the current Prisma setup
3. **Test Data Setup**: Complex test data setup needs to be aligned with actual schema

## Prerequisites

Before running integration tests:

1. **Test Database**: Set up a dedicated test database
   ```bash
   # For SQLite (current schema)
   export DATABASE_URL="file:./test.db"

   # For PostgreSQL (future migration)
   createdb medi_test_integration
   export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/medi_test_integration"
   ```

2. **Run Migrations**:
   ```bash
   pnpm prisma migrate deploy
   ```

3. **Generate Prisma Client**:
   ```bash
   pnpm prisma generate
   ```

## Required Fixes

Before these tests can run, fix the following:

### 1. Remove Unsupported PrismaClient Options
```typescript
// ❌ Current (doesn't work)
prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

// ✅ Fixed
prisma = new PrismaClient();
// Use DATABASE_URL environment variable instead
```

### 2. Fix Field Names to Match Schema
The Prisma schema uses snake_case (e.g., `organization_id`, `project_id`), but tests need to match:

```typescript
// Check actual schema field names in prisma/schema.prisma
// Update all test data creation to use correct field names
```

### 3. Add Missing Foreign Keys
Tests create data without proper relationships. Add:
- `organization_id` to Project, User, etc.
- Proper foreign key relationships
- Required fields from schema

### 4. Use Transactions for Cleanup
```typescript
beforeEach(async () => {
  await prisma.$transaction([
    prisma.testResult.deleteMany(),
    prisma.testRunItem.deleteMany(),
    // ... order matters for foreign keys
  ]);
});
```

## Running Tests

Once fixed:

```bash
# Run all integration tests
pnpm vitest run tests/integration

# Run specific test file
pnpm vitest run tests/integration/test-execution/prisma-test-run-repository.integration.test.ts

# Run with coverage
pnpm vitest run --coverage tests/integration
```

## Test Files

- `prisma-test-run-repository.integration.test.ts` - TestRunRepository integration tests (7 tests)
- `prisma-test-result-repository.integration.test.ts` - TestResultRepository integration tests (11 tests)

## Alternative: In-Memory Testing

For faster tests without database setup, consider using:

1. **SQLite in-memory database**:
   ```typescript
   const prisma = new PrismaClient({
     datasources: { db: { url: "file::memory:?cache=shared" } }
   });
   ```

2. **Prisma Test Environment** packages like `prisma-test-environment`

3. **Mock Repositories** (current unit test approach)

## Integration with CI/CD

Add to CI pipeline once fixed:

```yaml
# .github/workflows/test.yml
- name: Run Integration Tests
  env:
    DATABASE_URL: file:./test.db
  run: |
    pnpm prisma migrate deploy
    pnpm vitest run tests/integration
```

## Next Steps

1. Fix Prisma schema alignment issues
2. Update test data creation to match schema
3. Add proper cleanup and transactions
4. Enable in CI/CD pipeline
5. Add more integration test coverage
