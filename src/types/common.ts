/**
 * Common Type Definitions - Eliminates Record<string, any> patterns
 * 
 * Provides type-safe alternatives for generic data structures,
 * reducing reliance on `any` across the codebase.
 */

import { RecordModel } from 'pocketbase';

// Generic metadata that's actually typed
export interface Metadata {
  [key: string]: string | number | boolean | Date | null | Metadata | unknown[];
}

// For analytics and event tracking
export interface EventProperties {
  [key: string]: string | number | boolean | null;
}

// For API responses with unknown structure but validation required
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  metadata?: Metadata;
}

// Generic paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

// For zod validation error handling (replaces any in extractZodErrors)
export interface ZodIssue {
  code: string;
  message: string;
  path: (string | number)[];
  keys?: string[];
}

export interface ValidationError {
  [field: string]: string;
}

// Error handling - replaces catch (error: any)
export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: Metadata;
  timestamp?: Date;
}

// For generic data transformation
export interface DataTransformer<TInput, TOutput> {
  transform: (value: TInput) => TOutput;
}

// For field configurations in schemas
export interface FieldConfig {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
  validation?: {
    min?: number | string;
    max?: number | string;
    pattern?: string;
    custom?: (value: unknown) => boolean;
  };
}

// HTTP headers (replaces Record<string, any> in request headers)
export interface HttpHeaders {
  [key: string]: string | number | boolean;
}

// Generic async operation result
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: AppError;
  duration?: number; // milliseconds
}

// For rate limiting and queue operations
export interface QueuedOperation<T = unknown> {
  id: string;
  execute: () => Promise<T>;
  priority?: number;
  retries?: number;
  metadata?: Metadata;
}

// Configuration objects (replaces generic Record<string, any>)
export interface ConfigObject {
  [key: string]: string | number | boolean | null | ConfigObject;
}

// For user-defined custom properties/traits
export interface UserTraits {
  [key: string]: string | number | boolean | Date | null;
}

// Generic collection item with timestamps
export interface BaseEntity extends RecordModel {
  id: string;
  created: string;
  updated: string;
}

// For CSRF token configuration
export interface CsrfTokenConfig {
  token: string;
  header: string;
  paramName?: string;
  cookieName?: string;
}

// For filter/query parameters (replaces Record<string, any> in queries)
export interface QueryFilter {
  [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

// Generic state update for mutations (type, not interface for mapped types)
export type StateUpdate<T> = Partial<T>;

// For webhook payloads with validation
export interface WebhookPayloadBase {
  event: string;
  timestamp: number;
  tenantId?: string;
  data: unknown;
}

// For stream data or batched operations
export interface BatchItem<T> {
  id: string;
  data: T;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: AppError;
}

// Replace Promise<any>
export type AsyncResult<T = unknown> = Promise<OperationResult<T>>;
