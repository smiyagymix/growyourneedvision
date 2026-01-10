/**
 * Service Layer Types - Eliminates any from service methods and API calls
 */

import { RecordModel } from 'pocketbase';
import { Metadata, ValidationError, OperationResult, PaginatedResponse, QueryFilter } from './common';

// ============= Auth Service Types =============

export interface TokenPayload {
  sub: string; // user ID
  email: string;
  role: string;
  tenantId?: string;
  iat: number;
  exp: number;
  permissions?: string[];
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

export interface TwoFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// ============= PocketBase Query Types =============

export interface PocketBaseListOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
  skipTotal?: boolean;
  requestKey?: string | null;
}

export interface PocketBaseFullListOptions extends Omit<PocketBaseListOptions, 'page' | 'perPage'> {
  batch?: number;
}

// ============= Import/Export Types =============

export interface ImportSchema {
  fields: {
    name: string;
    type: string;
    required: boolean;
    default?: unknown;
    transform?: (value: unknown) => unknown;
  }[];
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  delimiter?: string;
  includeHeaders?: boolean;
  filters?: QueryFilter;
  columns?: string[];
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  warnings?: string[];
}

// ============= Webhook Types =============

export interface WebhookDeliveryStatus {
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  error?: string;
}

export interface SignatureGenerationParams {
  secret: string;
  payload: Record<string, unknown>;
  algorithm?: 'sha256' | 'sha512';
}

// ============= User Service Types =============

export interface UserUpdatePayload {
  email?: string;
  username?: string;
  name?: string;
  role?: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
}

export interface UserMergeResult {
  primaryUserId: string;
  mergedUserId: string;
  preservedData: Record<string, unknown>;
  mergedCollections: string[];
  timestamp: Date;
}

// ============= Analytics Types =============

export interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, string | number | boolean | null>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface AnalyticsMetrics {
  [key: string]: number;
}

export interface UserProperties {
  [key: string]: string | number | boolean | Date | null;
}

// ============= Audit Log Types =============

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  changes: Record<string, { before?: unknown; after?: unknown }>;
  metadata?: Metadata;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ============= Email Service Types =============

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isHtml: boolean;
}

export interface EmailDeliveryStatus {
  id: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  recipient: string;
  attempts: number;
  lastAttemptAt?: Date;
  error?: string;
}

// ============= File Service Types =============

export interface FileUploadResult {
  fileId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
}

export interface FileStorageMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  checksum?: string;
}

// ============= Feature Flag Types =============

export interface FeatureFlagDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetTenants?: string[];
  targetRoles?: string[];
  metadata?: Metadata;
}

// ============= Compliance Types =============

export interface ComplianceReport {
  id: string;
  standard: string;
  tenantId?: string;
  generatedAt: Date;
  status: 'pending' | 'completed' | 'failed';
  metrics: Record<string, unknown>;
  recommendations: string[];
  evidence: string[];
}

// ============= Health Check Types =============

export interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, ServiceHealth>;
  uptime: number; // seconds
  memory: {
    used: number;
    total: number;
  };
  timestamp: Date;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency: number; // milliseconds
  lastCheck: Date;
  error?: string;
}

// ============= Backup/Restore Types =============

export interface BackupMetadata {
  id: string;
  createdAt: Date;
  size: number;
  version: string;
  tenantId?: string;
  checksum: string;
  status: 'completed' | 'failed';
}

export interface RestoreOptions {
  backupId: string;
  targetTenantId?: string;
  preview?: boolean;
  validateOnly?: boolean;
}

// ============= Bulk Operation Types =============

export interface BulkOperationConfig {
  type: 'suspend' | 'resume' | 'roleChange' | 'delete' | 'merge';
  targetIds: string[];
  parameters?: Record<string, unknown>;
  dryRun?: boolean;
}

export interface BulkOperationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  duration: number;
}

// ============= API Response Wrappers =============

export interface ListApiResponse<T extends RecordModel> extends PaginatedResponse<T> {
  requestId?: string;
  timestamp: Date;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId?: string;
}
