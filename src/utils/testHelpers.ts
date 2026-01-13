/**
 * Testing Utilities and Helpers
 * Provides utilities for unit and integration testing
 */

import { RecordModel } from 'pocketbase';

/**
 * Mock data generator
 */
export class MockDataGenerator {
  private static idCounter: number = 0;

  static reset(): void {
    this.idCounter = 0;
  }

  static generateId(): string {
    return `id-${++this.idCounter}`;
  }

  static generateUser(overrides?: Partial<any>): any {
    return {
      id: this.generateId(),
      email: `user-${this.idCounter}@test.com`,
      name: `Test User ${this.idCounter}`,
      role: 'Student',
      tenantId: 'test-tenant',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      ...overrides,
    };
  }

  static generateStudent(overrides?: Partial<any>): any {
    return {
      ...this.generateUser(),
      role: 'Student',
      gradeLevel: 10,
      enrollmentDate: new Date().toISOString(),
      ...overrides,
    };
  }

  static generateTeacher(overrides?: Partial<any>): any {
    return {
      ...this.generateUser(),
      role: 'Teacher',
      subject: 'Mathematics',
      department: 'Science',
      ...overrides,
    };
  }

  static generateCourse(overrides?: Partial<any>): any {
    return {
      id: this.generateId(),
      name: `Course ${this.idCounter}`,
      code: `CS${this.idCounter}`,
      description: 'Test course',
      instructorId: this.generateId(),
      tenantId: 'test-tenant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  static generateAssignment(overrides?: Partial<any>): any {
    return {
      id: this.generateId(),
      title: `Assignment ${this.idCounter}`,
      description: 'Test assignment',
      courseId: this.generateId(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      points: 100,
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  static generateBatch<T>(
    factory: () => T,
    count: number
  ): T[] {
    return Array.from({ length: count }, () => factory());
  }
}

/**
 * Test assertions helper
 */
export class TestAssert {
  static assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
      );
    }
  }

  static assertNotEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      throw new Error(message || `Expected values to not be equal: ${JSON.stringify(actual)}`);
    }
  }

  static assertTrue(condition: boolean, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Expected condition to be true');
    }
  }

  static assertFalse(condition: boolean, message?: string): void {
    if (condition) {
      throw new Error(message || 'Expected condition to be false');
    }
  }

  static assertNull(value: any, message?: string): void {
    if (value !== null && value !== undefined) {
      throw new Error(message || `Expected null, but got ${JSON.stringify(value)}`);
    }
  }

  static assertNotNull(value: any, message?: string): void {
    if (value === null || value === undefined) {
      throw new Error(message || 'Expected value to not be null');
    }
  }

  static assertArrayEquals<T>(
    actual: T[],
    expected: T[],
    message?: string
  ): void {
    if (actual.length !== expected.length) {
      throw new Error(
        message || `Array length mismatch: expected ${expected.length}, got ${actual.length}`
      );
    }

    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) {
        throw new Error(
          message || `Array element ${i} mismatch: expected ${expected[i]}, got ${actual[i]}`
        );
      }
    }
  }

  static assertThrows(fn: () => void, message?: string): Error {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (error) {
      return error as Error;
    }
  }

  static async assertThrowsAsync(
    fn: () => Promise<void>,
    message?: string
  ): Promise<Error> {
    try {
      await fn();
      throw new Error(message || 'Expected function to throw');
    } catch (error) {
      return error as Error;
    }
  }

  static assertIncludes(
    value: string,
    searchString: string,
    message?: string
  ): void {
    if (!value.includes(searchString)) {
      throw new Error(
        message || `Expected "${value}" to include "${searchString}"`
      );
    }
  }

  static assertObjectEquals(
    actual: Record<string, any>,
    expected: Record<string, any>,
    message?: string
  ): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);

    if (actualStr !== expectedStr) {
      throw new Error(
        message || `Objects not equal.\nExpected: ${expectedStr}\nActual: ${actualStr}`
      );
    }
  }
}

/**
 * Test mock setup
 */
export class MockSetup {
  /**
   * Create mock fetch
   */
  static createMockFetch(responses: Map<string, Response>) {
    return async (url: string, options?: RequestInit) => {
      const response = responses.get(url);
      if (!response) {
        throw new Error(`No mock response for ${url}`);
      }
      return response;
    };
  }

  /**
   * Create mock response
   */
  static createMockResponse<T>(data: T, status: number = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Create mock error response
   */
  static createMockErrorResponse(message: string, status: number = 400) {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Create mock PocketBase client
   */
  static createMockPocketBase() {
    return {
      collection: (name: string) => ({
        getList: async () => ({
          items: [],
          page: 1,
          perPage: 25,
          totalPages: 0,
          totalItems: 0,
        }),
        getOne: async (id: string) => ({ id }),
        create: async (data: any) => ({ id: this.generateId(), ...data }),
        update: async (id: string, data: any) => ({ id, ...data }),
        delete: async (id: string) => true,
        getFullList: async () => [],
      }),
      authStore: {
        token: 'test-token',
        record: { id: 'test-user', email: 'test@test.com' },
        save: () => {},
        clear: () => {},
        isValid: true,
      },
      authRefresh: async () => ({ token: 'new-token' }),
    };
  }

  private static generateId(): string {
    return `mock-id-${Date.now()}`;
  }

  /**
   * Create mock localStorage
   */
  static createMockLocalStorage() {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] || null,
      length: Object.keys(store).length,
    };
  }
}

/**
 * Async test helpers
 */
export class AsyncTestHelper {
  /**
   * Wait for condition
   */
  static async waitFor(
    condition: () => boolean,
    timeoutMs: number = 5000
  ): Promise<void> {
    const startTime = Date.now();

    while (!condition()) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Timeout waiting for condition');
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  /**
   * Delay execution
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Race promise with timeout
   */
  static async timeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Mock async function
   */
  static createAsyncMock<T>(
    fn: (args: any) => Promise<T>,
    returnValue: T
  ) {
    const mock = async (args: any) => {
      await this.delay(0); // Simulate async
      return returnValue;
    };

    mock.callCount = 0;
    mock.calls = [];

    return mock;
  }
}

/**
 * Performance testing
 */
export class PerformanceTest {
  /**
   * Measure execution time
   */
  static async measureTime(
    fn: () => Promise<void>,
    label?: string
  ): Promise<number> {
    const startTime = performance.now();
    await fn();
    const duration = performance.now() - startTime;

    if (label) {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure memory usage
   */
  static getMemoryUsage(): NodeJS.MemoryUsage | null {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return null;
  }

  /**
   * Benchmark function
   */
  static async benchmark(
    fn: () => Promise<void>,
    iterations: number = 100
  ): Promise<{
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await fn();
      times.push(performance.now() - startTime);
    }

    const totalTime = times.reduce((a, b) => a + b, 0);

    return {
      totalTime,
      avgTime: totalTime / iterations,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
    };
  }
}

/**
 * Test suite runner
 */
export class TestRunner {
  private tests: Map<string, () => Promise<void>> = new Map();
  private results: {
    passed: number;
    failed: number;
    errors: Array<{ test: string; error: Error }>;
  } = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  /**
   * Add test
   */
  addTest(name: string, fn: () => Promise<void>): this {
    this.tests.set(name, fn);
    return this;
  }

  /**
   * Run all tests
   */
  async run(): Promise<void> {
    console.log(`Running ${this.tests.size} tests...`);

    for (const [name, fn] of this.tests.entries()) {
      try {
        await fn();
        this.results.passed++;
        console.log(`✓ ${name}`);
      } catch (error) {
        this.results.failed++;
        this.results.errors.push({
          test: name,
          error: error instanceof Error ? error : new Error(String(error)),
        });
        console.error(`✗ ${name}`);
        console.error(`  ${(error as Error).message}`);
      }
    }

    this.printSummary();
  }

  /**
   * Print summary
   */
  private printSummary(): void {
    console.log('\n------- Test Summary -------');
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Total: ${this.results.passed + this.results.failed}`);

    if (this.results.errors.length > 0) {
      console.log('\n------- Errors -------');
      this.results.errors.forEach(({ test, error }) => {
        console.log(`${test}: ${error.message}`);
      });
    }
  }

  /**
   * Get results
   */
  getResults() {
    return this.results;
  }
}

export default {
  MockDataGenerator,
  TestAssert,
  MockSetup,
  AsyncTestHelper,
  PerformanceTest,
  TestRunner,
};
