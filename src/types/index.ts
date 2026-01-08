/**
 * Centralized Type Definitions
 * 
 * This file exports all domain types used across the GROW YOUR NEED platform.
 * Import from here instead of individual service files.
 * 
 * @example
 * import { User, Course, Assignment, Tenant } from '@/types';
 */

import { RecordModel } from 'pocketbase';
import type { 
    TenantSettings,
    TransactionMetadata,
    PluginConfig,
    WebhookPayload,
    ComplianceMetadata,
    SettingValue,
    IntegrationConfig,
    RecommendationContext,
    AuditLogChanges
} from './settings';

// Re-export domain-specific types
export * from './billing';
export * from './ssl';
export * from './settings';
export * from './payment';
export * from './gamification';
export * from './file';
export * from './webhook';
export * from './health';
export * from './monitoring';
export * from './userData';
export * from './ai';
export * from './export';
export * from './audit';
export * from './billingRules';
export * from './activity';
export * from './integration';
export * from './marketing';
export * from './incident';
export * from './aiManagement';
export * from './dashboard';
export * from './travel';
export * from './crm';
export * from './abTesting';
export * from './search';
export * from './reports';
export * from './ai';