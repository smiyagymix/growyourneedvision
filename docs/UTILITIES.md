# Advanced Utilities Documentation

## Overview

This documentation covers the comprehensive utility system created for the GROW-YOUR-NEED platform. All utilities follow production-ready patterns with proper error handling, logging, and type safety.

## Table of Contents

1. [Error Handling](#error-handling)
2. [Logging System](#logging-system)
3. [Database Utilities](#database-utilities)
4. [Validation System](#validation-system)
5. [State Management](#state-management)
6. [API Client](#api-client)
7. [Environment Configuration](#environment-configuration)
8. [Testing Utilities](#testing-utilities)

---

## Error Handling

### Features

- Type-safe error handling with `TypedError` class
- Automatic error normalization from various sources
- Retry logic with exponential backoff
- Circuit breaker pattern
- Request timeouts
- Comprehensive error recovery strategies

### Usage

```typescript
import { 
  ErrorFactory, 
  retryWithBackoff, 
  withTimeout,
  ErrorHandler 
} from '@/utils/errorHandling';

// Create specific error type
const validationError = ErrorFactory.validation(
  'Email is required',
  { field: 'email' }
);

// Retry with exponential backoff
const data = await retryWithBackoff(
  () => fetchData(),
  {
    maxRetries: 3,
    baseDelayMs: 100,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}`);
    }
  }
);

// Add timeout to promise
const result = await withTimeout(
  slowOperation(),
  5000 // 5 seconds
);

// Global error handling
const handler = ErrorHandler.getInstance();
handler.onError((error) => {
  console.error('Application error:', error);
});
```

---

## Logging System

### Features

- Structured logging with severity levels
- Log persistence to localStorage
- Performance metrics tracking
- Timer management
- Child logger support with prefixes
- Automatic stack trace capture

### Levels

- `DEBUG` (0): Detailed debugging information
- `INFO` (1): General informational messages
- `WARN` (2): Warning messages
- `ERROR` (3): Error messages

### Usage

```typescript
import { globalLogger, Logger, LogLevel } from '@/utils/logging';

// Use global logger
globalLogger.info('Application started');
globalLogger.warn('Low memory warning');
globalLogger.error('Failed to load data', error);

// Create instance logger
const logger = new Logger({ 
  minLevel: LogLevel.INFO,
  enableConsole: true,
  enableStorage: true 
});

// Time operations
logger.startTimer('data-fetch');
const data = await fetchData();
logger.endTimer('data-fetch');

// Get statistics
const stats = logger.getStatistics();
console.log(`Total logs: ${stats.totalLogs}`);

// Child logger with prefix
const childLogger = logger.createChild('ComponentName');
childLogger.info('Component initialized');

// Export logs
const csvExport = logger.exportLogsAsCSV();
```

---

## Database Utilities

### Features

- Type-safe query builder
- Connection pool management
- Transaction support
- Database caching with TTL
- Pagination support
- Async operations

### Query Builder

```typescript
import { query, transaction, getCache } from '@/utils/databaseUtilities';

// Simple query
const students = await query<Student>('students')
  .where('gradeLevel = 10')
  .orderBy('-created')
  .select('id', 'name', 'email')
  .get();

// Paginated query
const page = await query<Student>('students')
  .where('gradeLevel = 10')
  .paginate(1, 25)
  .paginated();

console.log(`Page ${page.meta.page} of ${page.meta.totalPages}`);

// Count
const total = await query<Student>('students').count();

// Check existence
const exists = await query<Student>('students')
  .where('email = "test@example.com"')
  .exists();
```

### Transactions

```typescript
// Batch operations
const tx = transaction()
  .create<Student>('students', { name: 'John', gradeLevel: 10 })
  .create<Student>('students', { name: 'Jane', gradeLevel: 11 })
  .update<Student>('students', 'student-id', { gradeLevel: 10 });

const results = await tx.execute();

if (tx.allSucceeded()) {
  console.log('All operations succeeded');
} else {
  const failed = tx.getFailedOperations();
  console.error(`${failed.length} operations failed`);
}
```

### Caching

```typescript
const cache = getCache();

// Set cache with TTL
cache.set('user-data', userData, 5000); // 5 seconds

// Get from cache
const cached = cache.get('user-data');

// Statistics
const stats = cache.getStatistics();
console.log(`Cache size: ${stats.size}`);
```

---

## Validation System

### Features

- Built-in validation rules
- Async validation support
- Custom validators
- Field-level and object-level validation
- Batch validation
- User-friendly error messages

### Validation Rules

```typescript
import { 
  ValidationRules,
  AsyncValidationRules,
  createValidator,
  QuickValidate 
} from '@/utils/advancedValidation';

// Quick validation
const isValid = QuickValidate.email('user@example.com');
const isStrong = QuickValidate.strongPassword('P@ssw0rd123');

// Validator with schema
const userValidator = createValidator({
  email: [
    ValidationRules.required,
    ValidationRules.email,
    AsyncValidationRules.emailExists(checkEmailExists)
  ],
  password: [
    ValidationRules.required,
    ValidationRules.strongPassword,
    ValidationRules.minLength(8)
  ],
  age: [
    ValidationRules.required,
    ValidationRules.minValue(18),
    ValidationRules.maxValue(120)
  ]
});

// Validate
const result = await userValidator.validate({
  email: 'user@example.com',
  password: 'Password123!',
  age: 25
});

if (!result.isValid) {
  console.error('Validation errors:', result.fieldErrors);
}
```

---

## State Management

### Features

- Centralized state store with subscriptions
- Undo/Redo support
- State persistence
- Dev tools integration
- Multiple reducers support
- History management

### Store Usage

```typescript
import { createStore, Store } from '@/utils/stateManagement';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

// Create store
const store = createStore<AppState>(
  {
    user: null,
    theme: 'light',
    notifications: []
  },
  {
    persist: true,
    persistKey: 'app-state',
    maxHistory: 50
  }
);

// Subscribe to changes
const unsubscribe = store.subscribe((state) => {
  console.log('State changed:', state);
});

// Subscribe to field changes
const unwatchTheme = store.subscribeToField('theme', (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
});

// Update state
store.setState(prev => ({
  ...prev,
  user: newUser
}));

// Undo/Redo
if (store.canUndo()) {
  store.undo();
}

if (store.canRedo()) {
  store.redo();
}

// Cleanup
unsubscribe();
unwatchTheme();
```

### Combined Reducers

```typescript
import { combineReducers } from '@/utils/stateManagement';

const combined = combineReducers<AppState>()
  .addReducer('user', userReducer)
  .addReducer('theme', themeReducer)
  .addReducer('notifications', notificationsReducer)
  .combine();

store.dispatch(combined, { type: 'USER_LOGIN', payload: user });
```

---

## API Client

### Features

- Interceptor support
- Request/response transformation
- Automatic retry with exponential backoff
- Request caching
- Timeout handling
- Request queue management

### Usage

```typescript
import { createAPIClient, apiClient } from '@/utils/apiClient';

// Create or use global client
const client = apiClient;
client.setBaseURL('https://api.example.com');

// Add request interceptor
client.addRequestInterceptor((config) => {
  config.headers = {
    ...config.headers,
    'Authorization': `Bearer ${token}`
  };
  return config;
});

// Add response interceptor
client.addResponseInterceptor((data) => {
  return data; // Transform response
});

// Add error interceptor
client.addErrorInterceptor((error) => {
  if (error.status === 401) {
    // Handle auth error
  }
  return error;
});

// Make requests
const users = await client.get<User[]>('/users');
const created = await client.post<User>('/users', { name: 'John' });
const updated = await client.patch<User>(`/users/${id}`, { name: 'Jane' });
await client.delete(`/users/${id}`);

// Clear cache
client.clearCache();

// Cache statistics
const stats = client.getCacheStatistics();
```

### Request Queue

```typescript
import { createRequestQueue } from '@/utils/apiClient';

const queue = createRequestQueue(5); // Max 5 concurrent

// Queue requests
const result1 = await queue.add(() => client.get('/data1'));
const result2 = await queue.add(() => client.get('/data2'));

// Check status
const status = queue.getStatistics();
console.log(`Queued: ${status.queued}, Active: ${status.active}`);
```

---

## Environment Configuration

### Features

- Centralized environment variables
- Feature flags
- Environment detection
- Configuration validation
- Watcher support
- Secure API key handling

### Usage

```typescript
import { 
  envManager,
  isFeatureEnabled,
  isDevelopment,
  isProduction 
} from '@/utils/environmentConfig';

// Check environment
if (isDevelopment()) {
  enableDevTools();
}

// Check feature flags
if (isFeatureEnabled('payments')) {
  loadStripe();
}

// Get configuration
const pbUrl = envManager.get('pocketbaseUrl');
const config = envManager.getAll();

// Watch for changes
envManager.watch('environment', (env) => {
  console.log('Environment changed to:', env);
});

// Validate environment
const validation = envManager.validate();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}

// Debug
console.log(envManager.print());
```

---

## Testing Utilities

### Features

- Mock data generation
- Assertion helpers
- Async test utilities
- Performance benchmarking
- Test runner
- Mock setup helpers

### Usage

```typescript
import {
  MockDataGenerator,
  TestAssert,
  AsyncTestHelper,
  PerformanceTest,
  TestRunner
} from '@/utils/testHelpers';

// Generate mock data
const user = MockDataGenerator.generateUser();
const students = MockDataGenerator.generateBatch(
  () => MockDataGenerator.generateStudent(),
  10
);

// Assertions
TestAssert.assertEqual(result, expected, 'Values should match');
TestAssert.assertTrue(condition, 'Condition should be true');
TestAssert.assertArrayEquals([1, 2], [1, 2]);

// Async tests
await AsyncTestHelper.waitFor(() => data !== null, 5000);
await AsyncTestHelper.delay(1000);

// Performance testing
const duration = await PerformanceTest.measureTime(
  () => heavyOperation(),
  'Heavy operation'
);

const benchmark = await PerformanceTest.benchmark(
  () => operation(),
  100 // iterations
);

console.log(`Avg time: ${benchmark.avgTime.toFixed(2)}ms`);

// Test runner
const runner = new TestRunner();
runner
  .addTest('should add numbers', async () => {
    TestAssert.assertEqual(1 + 1, 2);
  })
  .addTest('should fetch data', async () => {
    const data = await fetchData();
    TestAssert.assertNotNull(data);
  });

await runner.run();
```

---

## Best Practices

### Error Handling

1. Always use `ErrorFactory` for creating typed errors
2. Use `retryWithBackoff` for network operations
3. Add error interceptors to global API client
4. Log errors with full context

### Logging

1. Use appropriate log levels
2. Enable storage in production for debugging
3. Export logs for support cases
4. Use child loggers for components

### Database

1. Always filter by tenant ID in multi-tenant queries
2. Use transactions for related operations
3. Cache expensive queries
4. Validate before create/update

### State

1. Use store for global state
2. Keep store state normalized
3. Use persistence for user preferences
4. Clean up subscriptions on unmount

### API Client

1. Set base URL once during initialization
2. Use interceptors for auth/error handling
3. Set appropriate timeouts
4. Monitor cache statistics

### Validation

1. Validate on both client and server
2. Use async validation for uniqueness checks
3. Provide user-friendly messages
4. Validate entire objects, not just fields

---

## Migration Guide

### From Old Error Handling

```typescript
// Old
try {
  await operation();
} catch (error) {
  console.error(error);
}

// New
try {
  await operation();
} catch (error) {
  const appError = normalizeError(error);
  ErrorHandler.getInstance().handle(appError);
}
```

### From Old API Calls

```typescript
// Old
const response = await fetch(url);
const data = await response.json();

// New
const response = await apiClient.get(url);
const data = response.data;
```

---

## Performance Considerations

- Database cache TTL defaults to 5 minutes
- API client uses request deduplication
- Store history limited to 50 items by default
- Logger storage limited to 1000 entries
- Request queue default concurrency: 5

---

## Troubleshooting

### Issue: Logs not persisting
**Solution**: Check localStorage quota, enable `enableStorage: true` in Logger config

### Issue: API requests timing out
**Solution**: Increase timeout in request config or add retry logic

### Issue: State not updating
**Solution**: Ensure setState receives new object, not mutation of old one

### Issue: Validation not working
**Solution**: Ensure all rules are arrays, use async rule for server validation

---

## Contributing

When adding new utilities:

1. Follow TypeScript strict mode
2. Add comprehensive JSDoc comments
3. Include error handling
4. Add logging for debugging
5. Create tests
6. Update this documentation

