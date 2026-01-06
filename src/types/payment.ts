/**
 * Payment Types
 * TypeScript interfaces for payment processing
 */

import { RecordModel } from 'pocketbase';

// Payment status types
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
export type PaymentMethodType = 'card' | 'bank_account';
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay' | 'unknown';

// Payment Intent
export interface PaymentIntent extends RecordModel {
    user: string;
    stripe_payment_intent_id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    description?: string;
    metadata?: Record<string, any>;
    receipt_email?: string;
    client_secret?: string;
}

// Subscription
export interface Subscription extends RecordModel {
    tenant?: string;
    user?: string;
    stripe_subscription_id: string;
    stripe_customer_id: string;
    plan_id: string;
    plan_name: string;
    status: SubscriptionStatus;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    canceled_at?: string;
    trial_end?: string;
}

// Payment Method
export interface PaymentMethod extends RecordModel {
    user: string;
    stripe_payment_method_id: string;
    type: PaymentMethodType;
    card_brand?: CardBrand;
    card_last4?: string;
    card_exp_month?: number;
    card_exp_year?: number;
    billing_details?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postal_code?: string;
            country?: string;
        };
    };
    is_default: boolean;
}

// Invoice
export interface Invoice extends RecordModel {
    user: string;
    tenant?: string;
    invoice_number: string;
    stripe_invoice_id?: string;
    stripe_payment_intent_id?: string;
    amount: number;
    currency: string;
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
    due_date?: string;
    paid_at?: string;
    description?: string;
    line_items?: InvoiceLineItem[];
    pdf_url?: string;
    hosted_invoice_url?: string;
}

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

// Subscription Plans
export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
    stripe_price_id?: string;
    stripe_product_id?: string;
    is_popular?: boolean;
    max_users?: number;
    max_storage_gb?: number;
}

// Payment Request (for creating payments)
export interface CreatePaymentIntentRequest {
    amount: number;
    currency: string;
    description?: string;
    receipt_email?: string;
    metadata?: Record<string, any>;
    payment_method_id?: string;
}

export interface CreateSubscriptionRequest {
    plan_id: string;
    payment_method_id?: string;
    trial_days?: number;
    metadata?: Record<string, any>;
}

// Payment Response
export interface PaymentIntentResponse {
    client_secret: string;
    payment_intent_id: string;
    status: PaymentStatus;
}

export interface ConfirmPaymentResponse {
    success: boolean;
    payment_intent_id: string;
    status: PaymentStatus;
    error?: string;
}

// Payment History
export interface PaymentHistoryItem {
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    receipt_url?: string;
    invoice_id?: string;
}

// Refund
export interface RefundRequest {
    payment_intent_id: string;
    amount?: number; // If not provided, refunds full amount
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export interface RefundResponse {
    success: boolean;
    refund_id: string;
    amount: number;
    status: 'succeeded' | 'failed' | 'pending';
}

// Webhook Event
export interface WebhookEvent {
    id: string;
    type: string;
    data: any;
    created: number;
    livemode: boolean;
}

// Error types
export interface PaymentError {
    code: string;
    message: string;
    type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error' | 'rate_limit_error';
    decline_code?: string;
    param?: string;
}
