/**
 * Type Guards and Runtime Type Checking
 * Proper type narrowing for unknown values
 */

import type { RecordModel } from 'pocketbase';
import type { User, UserRole } from './index';

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if value is a valid record with id
 */
export function isRecord(value: unknown): value is RecordModel {
  return isObject(value) && 
         'id' in value && 
         isString(value.id) &&
         'created' in value &&
         'updated' in value;
}

/**
 * Check if value is a valid User
 */
export function isUser(value: unknown): value is User {
  return isRecord(value) &&
         'email' in value &&
         'name' in value &&
         'role' in value &&
         isString(value.email) &&
         isString(value.name) &&
         isUserRole(value.role);
}

/**
 * Check if value is a valid UserRole
 */
export function isUserRole(value: unknown): value is UserRole {
  const validRoles: UserRole[] = ['Owner', 'SchoolAdmin', 'Teacher', 'Student', 'Parent', 'Individual'];
  return isString(value) && validRoles.includes(value as UserRole);
}

/**
 * Check if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if value is a Date object
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Assert value is defined (throws if not)
 */
export function assertDefined<T>(value: T | null | undefined, message = 'Value must be defined'): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Assert value is of type (throws if not)
 */
export function assertType<T>(
  value: unknown, 
  guard: (value: unknown) => value is T,
  message = 'Value is not of expected type'
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(message);
  }
}

/**
 * Safe parse JSON with type guard
 */
export function parseJSON<T = unknown>(
  json: string,
  guard?: (value: unknown) => value is T
): T | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (guard && !guard(parsed)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Safe access nested property
 */
export function getNestedProperty<T = unknown>(
  obj: unknown,
  path: string,
  defaultValue?: T
): T | undefined {
  if (!isObject(obj)) return defaultValue;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (!isObject(current) || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current as T;
}

/**
 * Type-safe Object.keys
 */
export function typedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

/**
 * Type-safe Object.entries
 */
export function typedEntries<T extends object>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

/**
 * Check if value has specific property
 */
export function hasProperty<K extends PropertyKey>(
  value: unknown,
  property: K
): value is Record<K, unknown> {
  return isObject(value) && property in value;
}

/**
 * Exhaustive check for switch statements
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
