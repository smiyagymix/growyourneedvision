/**
 * Billing & Payment Validation Schemas
 * 
 * Comprehensive Zod schemas for type-safe validation of all billing data,
 * replacing `any` types with strict validation.
 */

import { z } from 'zod';

// ============= Invoice Schemas =============

export const InvoiceStatusSchema = z.enum(['paid', 'pending', 'overdue', 'cancelled', 'draft']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceSchema = z.object({
  id: z.string().min(1, 'Invoice ID required'),
  tenant_name: z.string().min(1, 'Tenant name required'),
  tenant_id: z.string().min(1, 'Tenant ID required'),
  amount: z.number().positive('Amount must be positive'),
  status: InvoiceStatusSchema,
  due_date: z.string().datetime('Must be valid ISO date'),
  paid_date: z.string().datetime('Must be valid ISO date').optional(),
  plan_name: z.string().min(1, 'Plan name required'),
  period: z.string().min(1, 'Period required'),
  description: z.string().optional(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    total: z.number().positive()
  })).optional(),
  created: z.string().datetime().optional(),
  updated: z.string().datetime().optional()
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const InvoiceCreateSchema = InvoiceSchema.omit({ id: true, created: true, updated: true });
export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;

export const InvoiceListResponseSchema = z.object({
  items: z.array(InvoiceSchema),
  total: z.number().non-negative(),
  page: z.number().positive(),
  perPage: z.number().positive(),
  lastPage: z.number().non-negative()
});

export type InvoiceListResponse = z.infer<typeof InvoiceListResponseSchema>;

// ============= Payment Gateway Schemas =============

export const GatewayTypeSchema = z.enum(['stripe', 'paypal', 'bank_transfer']);
export type GatewayType = z.infer<typeof GatewayTypeSchema>;

export const GatewayStatusSchema = z.enum(['connected', 'disconnected', 'error', 'pending']);
export type GatewayStatus = z.infer<typeof GatewayStatusSchema>;

export const PaymentGatewaySchema = z.object({
  id: z.string().min(1, 'Gateway ID required'),
  name: z.string().min(1, 'Gateway name required'),
  type: GatewayTypeSchema,
  enabled: z.boolean(),
  test_mode: z.boolean(),
  status: GatewayStatusSchema,
  last_transaction: z.string().optional(),
  last_transaction_timestamp: z.string().datetime().optional(),
  api_key: z.string().optional(),
  webhook_endpoint: z.string().url().optional(),
  webhook_secret: z.string().optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
  error_message: z.string().optional(),
  created: z.string().datetime().optional(),
  updated: z.string().datetime().optional()
});

export type PaymentGateway = z.infer<typeof PaymentGatewaySchema>;

export const PaymentGatewayCreateSchema = PaymentGatewaySchema.omit({ 
  id: true, 
  created: true, 
  updated: true,
  status: true 
}).extend({
  status: GatewayStatusSchema.default('disconnected')
});

export type PaymentGatewayCreate = z.infer<typeof PaymentGatewayCreateSchema>;

export const PaymentGatewayUpdateSchema = PaymentGatewaySchema.partial().omit({
  id: true,
  created: true,
  updated: true
});

export type PaymentGatewayUpdate = z.infer<typeof PaymentGatewayUpdateSchema>;

// ============= Billing Stats Schemas =============

export const BillingStatsSchema = z.object({
  total_revenue: z.number().non-negative(),
  pending_amount: z.number().non-negative(),
  overdue_count: z.number().non-negative(),
  invoice_count: z.number().non-negative(),
  paid_invoices: z.number().non-negative(),
  pending_invoices: z.number().non-negative(),
  overdue_invoices: z.number().non-negative(),
  average_payment_time: z.number().non-negative().optional(),
  mrr: z.number().non-negative().optional(),
  arr: z.number().non-negative().optional()
});

export type BillingStats = z.infer<typeof BillingStatsSchema>;

// ============= Payment Processing Schemas =============

export const PaymentIntentSchema = z.object({
  id: z.string().min(1),
  invoice_id: z.string().min(1),
  tenant_id: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).toUpperCase(),
  gateway_type: GatewayTypeSchema,
  status: z.enum(['pending', 'processing', 'succeeded', 'failed', 'cancelled']),
  external_id: z.string().optional(),
  error: z.string().optional(),
  created: z.string().datetime()
});

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;

// ============= Error Handling Schemas =============

export const BillingErrorSchema = z.object({
  code: z.enum([
    'INVOICE_NOT_FOUND',
    'GATEWAY_CONNECTION_FAILED',
    'INVALID_AMOUNT',
    'PAYMENT_FAILED',
    'GATEWAY_ERROR',
    'DATABASE_ERROR',
    'VALIDATION_ERROR',
    'UNAUTHORIZED'
  ]),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime()
});

export type BillingError = z.infer<typeof BillingErrorSchema>;

// ============= Type Guards =============

export function isInvoice(data: unknown): data is Invoice {
  return InvoiceSchema.safeParse(data).success;
}

export function isPaymentGateway(data: unknown): data is PaymentGateway {
  return PaymentGatewaySchema.safeParse(data).success;
}

export function isBillingError(data: unknown): data is BillingError {
  return BillingErrorSchema.safeParse(data).success;
}

// ============= Validation Functions =============

export function validateInvoice(data: unknown): { success: true; data: Invoice } | { success: false; errors: Record<string, string> } {
  const result = InvoiceSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach(issue => {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    });
    return { success: false, errors };
  }
  return { success: true, data: result.data };
}

export function validatePaymentGateway(data: unknown): { success: true; data: PaymentGateway } | { success: false; errors: Record<string, string> } {
  const result = PaymentGatewaySchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach(issue => {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    });
    return { success: false, errors };
  }
  return { success: true, data: result.data };
}
