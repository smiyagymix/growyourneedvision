/**
 * Specific Type Definitions for Settings and Metadata
 * Replaces generic Record<string, unknown> with proper types
 */

export interface TenantSettings {
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    logo?: string;
  };
  features?: {
    enableAI?: boolean;
    enablePayments?: boolean;
    enableCommunication?: boolean;
    enableAnalytics?: boolean;
  };
  limits?: {
    maxUsers?: number;
    maxStorage?: number;
    maxAPICallsPerMonth?: number;
  };
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
}

export interface TransactionMetadata {
  ipAddress?: string;
  userAgent?: string;
  paymentMethodBrand?: string;
  last4?: string;
  receiptUrl?: string;
  failureReason?: string;
  disputeId?: string;
  refundReason?: string;
  invoiceId?: string;
}

export interface PluginConfig {
  apiKey?: string;
  webhookUrl?: string;
  enabledFeatures?: string[];
  customSettings?: {
    [key: string]: string | number | boolean;
  };
  rateLimit?: number;
  timeout?: number;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: {
    id: string;
    type: string;
    attributes: {
      [key: string]: string | number | boolean | null;
    };
  };
  metadata?: {
    sourceIp?: string;
    userAgent?: string;
    retryCount?: number;
  };
}

export interface ComplianceMetadata {
  gdprConsent?: boolean;
  ccpaOptOut?: boolean;
  dataRetentionDays?: number;
  lastAuditDate?: string;
  complianceOfficer?: string;
  certifications?: string[];
  dataProcessingAgreement?: boolean;
}

export interface SettingValue {
  stringValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  jsonValue?: {
    [key: string]: string | number | boolean | null | SettingValue;
  };
}

export interface IntegrationConfig {
  enabled: boolean;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  endpoints?: {
    [key: string]: string;
  };
  options?: {
    retryAttempts?: number;
    timeout?: number;
    cacheEnabled?: boolean;
    cacheTTL?: number;
  };
}

export interface RecommendationContext {
  userId: string;
  currentPage?: string;
  recentActivity?: string[];
  preferences?: {
    [key: string]: string | number | boolean;
  };
  demographics?: {
    role?: string;
    level?: string;
    interests?: string[];
  };
}

export interface AuditLogChanges {
  before?: {
    [key: string]: string | number | boolean | null;
  };
  after?: {
    [key: string]: string | number | boolean | null;
  };
  fields: string[];
}
