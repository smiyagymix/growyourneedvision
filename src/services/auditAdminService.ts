import env from '../config/environment';
import { pocketBaseClient } from '../lib/pocketbase';
import { createTypedCollection } from '../lib/pocketbase-types';
import { Result, Ok, Err } from '../lib/types';
import { AppError } from './errorHandler';
import { AuditMetadata } from '../types/audit';

export interface AuditLogRecord {
  id?: string;
  timestamp: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  user_id?: string;
  severity?: string;
  metadata?: AuditMetadata;
}

export interface PaginatedAuditResult {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: AuditLogRecord[];
}

class AuditAdminService {
  private apiUrl: string;
  private serviceApiKey: string;

  constructor() {
    this.apiUrl = env.get('apiUrl') || '/api';
    this.serviceApiKey = env.get('serviceApiKey');
  }

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.serviceApiKey) {
      headers['x-api-key'] = this.serviceApiKey;
    }

    const model = pb.authStore.model as any;
    const tenantId = model?.tenantId;
    if (tenantId) headers['x-tenant-id'] = String(tenantId);

    const role = model?.role;
    if (role) {
      const elevated = ['Owner', 'SchoolAdmin', 'Admin'].includes(role);
      headers['x-user-role'] = elevated ? 'admin' : String(role).toLowerCase();
    }

    const userId = model?.id;
    if (userId) headers['x-user-id'] = String(userId);

    return headers;
  }

  async list(params: { page?: number; perPage?: number; action?: string; userId?: string; from?: string; to?: string; severity?: string } = {}): Promise<PaginatedAuditResult> {
    const search = new URLSearchParams();
    if (params.page) search.append('page', String(params.page));
    if (params.perPage) search.append('perPage', String(params.perPage));
    if (params.action) search.append('action', params.action);
    if (params.userId) search.append('userId', params.userId);
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.severity) search.append('severity', params.severity);

    const response = await fetch(`${this.apiUrl}/admin/audit?${search.toString()}`, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to load audit logs');
    }

    return response.json();
  }

  async export(params: { action?: string; userId?: string; from?: string; to?: string; severity?: string } = {}): Promise<Blob> {
    const search = new URLSearchParams();
    if (params.action) search.append('action', params.action);
    if (params.userId) search.append('userId', params.userId);
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.severity) search.append('severity', params.severity);

    const response = await fetch(`${this.apiUrl}/admin/audit/export?${search.toString()}`, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to export audit logs');
    }

    return response.blob();
  }
}

export const auditAdminService = new AuditAdminService();

// Export standalone logAudit function for backwards compatibility
export async function logAudit(
  resourceType: string,
  resourceId: string,
  action: string,
  details: string,
  severity: string = 'info',
  metadata?: AuditMetadata
): Promise<void> {
  const record: AuditLogRecord = {
    timestamp: new Date().toISOString(),
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    severity,
    metadata: { details, ...metadata }
  };

  try {
    await pb.collection('audit_logs').create(record);
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}
