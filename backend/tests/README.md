# Backend Testing with Vitest

This directory contains unit tests for the SmartOps backend API.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test

# Run tests once and exit
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

- `auth.test.js` - Tests for authentication endpoints (login, register)
- `workItems.test.js` - Tests for work item status changes and permissions

## Test Coverage

### Auth Tests
- ✅ Login fails with incorrect email
- ✅ Login fails with incorrect password
- ✅ Login fails with missing credentials
- ✅ Login succeeds with correct credentials

### Work Items Tests
- ✅ Admin can change work item status to 'on_hold'
- ✅ Manager can change work item status to 'on_hold'
- ✅ Regular user can change status of their assigned work items
- ✅ Regular user cannot change work items they are not assigned to
- ✅ Admin can change any work item status regardless of assignment

## Adding New Tests

1. Create a new test file in the `tests/` directory
2. Import Vitest functions: `import { describe, it, expect, beforeEach, afterEach } from 'vitest';`
3. Use `beforeEach` and `afterEach` to set up and clean up test data
4. Use `describe` blocks to group related tests
5. Use `it` blocks for individual test cases
6. Use `expect` assertions to verify expected behavior

## Example Test Structure

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Feature Name', () => {
  beforeEach(async () => {
    // Set up test data
  });

  afterEach(async () => {
    // Clean up test data
  });

  it('should do something', async () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```
