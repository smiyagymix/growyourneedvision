# E2E Test Suite for Role-Based Authentication

## Test Coverage

This test suite verifies the complete authentication flow for all user roles.

### Tests Included

1. **Owner Login & Redirect** - Verifies Owner logs in and redirects to `/admin`
2. **Admin Login & Redirect** - Verifies Admin logs in and redirects to `/school-admin`
3. **Teacher Login & Redirect** - Verifies Teacher logs in and redirects to `/teacher`
4. **Student Login & Redirect** - Verifies Student logs in and redirects to `/student`
5. **Parent Login & Redirect** - Verifies Parent logs in and redirects to `/parent`
6. **Individual Login & Redirect** - Verifies Individual logs in and redirects to `/individual`
7. **Invalid Credentials** - Verifies error handling for bad credentials
8. **Protected Route Access** - Verifies unauthenticated users are redirected to login
9. **Logout Flow** - Verifies users can logout successfully

### Running the Tests

```powershell
# Run all tests
pnpm test:e2e

# Run tests in UI mode
pnpm test:e2e --ui

# Run specific test file
pnpm test:e2e tests/auth-roles.spec.ts

# Run tests in headed mode (see browser)
pnpm test:e2e --headed
```

### Test Results

Screenshots are captured for each role's dashboard in `test-results/`:
- `owner-dashboard.png`
- `admin-dashboard.png`
- `teacher-dashboard.png`
- `student-dashboard.png`
- `parent-dashboard.png`
- `individual-dashboard.png`

### Prerequisites

- PocketBase running on http://127.0.0.1:8090
- All test users created (run `.\setup-users.ps1`)
- Dev server running on http://localhost:3001

### Test Data

All credentials are defined in `TEST_USERS` object in the test file.
