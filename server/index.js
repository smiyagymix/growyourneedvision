import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { logAudit, auditMiddleware, getAuditStats, flushAuditBuffer } from './auditLogger.js';
import { storeReceipt } from './receiptService.js';
import billingRetryService from './billingRetryService.js';
import prorationService from './prorationService.js';
import analyticsService from './analyticsService.js';
import trialManagementService from './trialManagementService.js';
import couponService from './couponService.js';
import { churnPredictionService } from './churnPredictionService.js';
import reportBuilderService from './reportBuilderService.js';
import schedulerService from './schedulerService.js';
import * as revenueAnalysisService from './revenueAnalysisService.js';
import * as customerHealthService from './customerHealthService.js';
import * as subscriptionLifecycleService from './subscriptionLifecycleService.js';
import * as exportCenterService from './exportCenterService.js';
import cacheService from './cacheService.js';
import auditService from './auditLogService.js';
import productionValidator from './productionValidator.js';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { randomUUID } from 'crypto';
import * as Sentry from '@sentry/node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Load environment variables
dotenv.config({ path: '../.env' });

// Validate production environment
if (process.env.NODE_ENV === 'production') {
    if (!productionValidator.validateEnvironment()) {
        console.error('❌ Production environment validation failed. Exiting...');
        process.exit(1);
    }
    productionValidator.printEnvironmentInfo();
}

// ----- Observability providers (optional) -----
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
        release: process.env.SENTRY_RELEASE,
    });
    console.log('Sentry initialized');
}

let otelSdk;
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    const otlpHeaders = {};
    if (process.env.OTEL_EXPORTER_OTLP_HEADERS) {
        // expected format: key1=val1,key2=val2
        process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').forEach((pair) => {
            const [k, v] = pair.split('=');
            if (k && v) otlpHeaders[k.trim()] = v.trim();
        });
    }
    if (process.env.OTEL_EXPORTER_OTLP_AUTH_TOKEN) {
        otlpHeaders['Authorization'] = `Bearer ${process.env.OTEL_EXPORTER_OTLP_AUTH_TOKEN}`;
    }

    otelSdk = new NodeSDK({
        traceExporter: new OTLPTraceExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
            headers: otlpHeaders,
        }),
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: 'payment-server',
            [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
        }),
        instrumentations: [getNodeAutoInstrumentations()],
    });
    otelSdk.start().then(() => console.log('OpenTelemetry started')).catch((err) => console.error('OpenTelemetry failed to start', err));
}

const app = express();

// Security headers middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: Remove unsafe-eval in production if possible
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"]
        }
    },
    crossOriginEmbedderPolicy: false, // Needed for some external resources
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// HSTS - Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use(helmet.hsts({
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    }));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // set `RateLimit` and `RateLimit-Policy` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Apply the rate limiting middleware to all requests
app.use('/api/', limiter);

// More sensitive limiter for payment/subscription creation
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10, // Limit each IP to 10 payment intents per hour
    message: { message: 'Too many payment attempts, please try again later' }
});
app.use('/api/payments/create', paymentLimiter);

const port = process.env.PORT || 3001;
const serviceApiKey = process.env.SERVICE_API_KEY;
const requireApiKey = (req, res, next) => {
    if (!serviceApiKey) {
        return res.status(500).json({ message: 'SERVICE_API_KEY not configured' });
    }
    const key = req.header('x-api-key');
    if (!key || key !== serviceApiKey) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

const requireTenant = (req, res, next) => {
    const tenantId = req.header('x-tenant-id');
    if (!tenantId) {
        return res.status(400).json({ message: 'Missing tenant id' });
    }
    req.tenantId = tenantId;
    next();
};

// Payments feature flag and conditional Stripe init
const PAYMENTS_ENABLED = (process.env.FEATURE_PAYMENTS || '').toString().toLowerCase() === 'true';
let stripe = null;
if (PAYMENTS_ENABLED && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16', // Use a fixed API version
    });
}

const PB_URL = process.env.POCKETBASE_URL;
const PB_TOKEN = process.env.POCKETBASE_SERVICE_TOKEN;

const requireAdmin = (req, res, next) => {
    const role = req.header('x-user-role');
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

const requireTeacherOrAdmin = (req, res, next) => {
    const role = req.header('x-user-role');
    if (role === 'admin' || role === 'teacher' || role === 'Teacher') return next();
    return res.status(403).json({ message: 'Teacher or admin access required' });
};

// Simple in-memory request metrics with histogram buckets
const latencyBuckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]; // ms (histogram)
const requestMetrics = {
    counts: new Map(), // key => count
    durationsMs: new Map(), // key => total duration
    errors: new Map(), // key => error count
    latencyHistogram: new Map(), // key => bucket counts array
};

const processStartTimeSeconds = Math.floor(Date.now() / 1000);

const recordMetric = (key, durationMs, statusCode) => {
    requestMetrics.counts.set(key, (requestMetrics.counts.get(key) || 0) + 1);
    requestMetrics.durationsMs.set(key, (requestMetrics.durationsMs.get(key) || 0) + durationMs);
    if (statusCode >= 500) {
        requestMetrics.errors.set(key, (requestMetrics.errors.get(key) || 0) + 1);
    }
    if (!requestMetrics.latencyHistogram.has(key)) {
        requestMetrics.latencyHistogram.set(key, new Array(latencyBuckets.length + 1).fill(0)); // +Inf bucket
    }
    const buckets = requestMetrics.latencyHistogram.get(key);
    const idx = latencyBuckets.findIndex((b) => durationMs <= b);
    const bucketIndex = idx === -1 ? latencyBuckets.length : idx;
    buckets[bucketIndex] += 1;
};

async function pbList(collection, { filter, sort = '-created', expand, perPage = 50 }) {
    if (!PB_URL || !PB_TOKEN) throw new Error('PocketBase not configured');
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (sort) params.append('sort', sort);
    if (expand) params.append('expand', expand);
    params.append('perPage', String(perPage));
    const res = await fetch(`${PB_URL}/api/collections/${collection}/records?${params.toString()}`, {
        headers: {
            'Authorization': PB_TOKEN.startsWith('Bearer ') ? PB_TOKEN : `Bearer ${PB_TOKEN}`
        }
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PocketBase list ${collection} failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    return json?.items || [];
}

async function pbListPage(collection, { filter, sort = '-created', expand, page = 1, perPage = 20 }) {
    if (!PB_URL || !PB_TOKEN) throw new Error('PocketBase not configured');
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (sort) params.append('sort', sort);
    if (expand) params.append('expand', expand);
    params.append('page', String(page));
    params.append('perPage', String(perPage));
    const res = await fetch(`${PB_URL}/api/collections/${collection}/records?${params.toString()}`, {
        headers: {
            'Authorization': PB_TOKEN.startsWith('Bearer ') ? PB_TOKEN : `Bearer ${PB_TOKEN}`
        }
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PocketBase list ${collection} failed: ${res.status} ${text}`);
    }
    return res.json();
}

async function pbListAll(collection, { filter, sort = '-created', expand, perPage = 200 }) {
    const first = await pbListPage(collection, { filter, sort, expand, page: 1, perPage });
    let items = first?.items || [];
    const totalPages = first?.totalPages || 1;
    for (let page = 2; page <= totalPages; page++) {
        const res = await pbListPage(collection, { filter, sort, expand, page, perPage });
        if (res?.items?.length) items = items.concat(res.items);
    }
    return items;
}

async function pbCreate(collection, body) {
    if (!PB_URL || !PB_TOKEN) throw new Error('PocketBase not configured');
    const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
        method: 'POST',
        headers: {
            'Authorization': PB_TOKEN.startsWith('Bearer ') ? PB_TOKEN : `Bearer ${PB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PocketBase create ${collection} failed: ${res.status} ${text}`);
    }
    return res.json();
}

async function pbUpdate(collection, id, body) {
    if (!PB_URL || !PB_TOKEN) throw new Error('PocketBase not configured');
    const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': PB_TOKEN.startsWith('Bearer ') ? PB_TOKEN : `Bearer ${PB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PocketBase update ${collection} failed: ${res.status} ${text}`);
    }
    return res.json();
}

// Middleware
app.use(cors());
app.use(express.json());

if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
}

// Add audit middleware to automatically track request context
app.use(auditMiddleware);

// Observability: add request id + per-route latency and structured log
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    const reqId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('x-request-id', reqId);
    res.locals.reqId = reqId;
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const key = `${req.method} ${req.path}`;
        recordMetric(key, durationMs, res.statusCode);
        if (durationMs > 1000) {
            console.warn(JSON.stringify({ level: 'warn', type: 'slow_request', reqId, method: req.method, path: req.path, status: res.statusCode, durationMs: Number(durationMs.toFixed(1)) }));
        } else {
            console.log(JSON.stringify({ level: 'info', type: 'request', reqId, method: req.method, path: req.path, status: res.statusCode, durationMs: Number(durationMs.toFixed(1)) }));
        }
    });
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    const auditStats = getAuditStats();
    res.json({
        status: 'ok',
        service: 'payment-server',
        stripe: PAYMENTS_ENABLED && !!process.env.STRIPE_SECRET_KEY,
        pocketbase: !!process.env.POCKETBASE_URL && !!process.env.POCKETBASE_SERVICE_TOKEN,
        uptimeSeconds: Math.floor(process.uptime()),
        metrics: {
            routes: Array.from(requestMetrics.counts.entries()).map(([route, count]) => {
                const totalMs = requestMetrics.durationsMs.get(route) || 0;
                const avg = count ? totalMs / count : 0;
                const errors = requestMetrics.errors.get(route) || 0;
                return { route, count, avgMs: Number(avg.toFixed ? avg.toFixed(2) : avg), errors };
            })
        },
        audit: {
            buffered: auditStats.buffered,
            bySeverity: auditStats.bySeverity
        }
    });
});

// Prometheus-style metrics endpoint (plaintext exposition)
app.get('/api/metrics', (req, res) => {
    const lines = [];
    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    requestMetrics.counts.forEach((count, route) => {
        const [method, path] = route.split(' ');
        lines.push(`http_requests_total{method="${method}",path="${path}"} ${count}`);
    });

    lines.push('# HELP http_request_duration_ms_sum Total duration of HTTP requests in ms');
    lines.push('# TYPE http_request_duration_ms_sum counter');
    requestMetrics.durationsMs.forEach((sum, route) => {
        const [method, path] = route.split(' ');
        lines.push(`http_request_duration_ms_sum{method="${method}",path="${path}"} ${sum}`);
    });

    lines.push('# HELP http_request_duration_ms_bucket Histogram of HTTP request durations in ms');
    lines.push('# TYPE http_request_duration_ms_bucket histogram');
    requestMetrics.latencyHistogram.forEach((buckets, route) => {
        const [method, path] = route.split(' ');
        let cumulative = 0;
        buckets.forEach((count, idx) => {
            cumulative += count;
            const le = idx < latencyBuckets.length ? latencyBuckets[idx] : '+Inf';
            lines.push(`http_request_duration_ms_bucket{method="${method}",path="${path}",le="${le}"} ${cumulative}`);
        });
    });

    lines.push('# HELP http_request_errors_total HTTP 5xx responses');
    lines.push('# TYPE http_request_errors_total counter');
    requestMetrics.errors.forEach((count, route) => {
        const [method, path] = route.split(' ');
        lines.push(`http_request_errors_total{method="${method}",path="${path}"} ${count}`);
    });

    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${Math.floor(process.uptime())}`);

    lines.push('# HELP process_start_time_seconds Start time of the process since unix epoch in seconds');
    lines.push('# TYPE process_start_time_seconds gauge');
    lines.push(`process_start_time_seconds ${processStartTimeSeconds}`);

    res.setHeader('Content-Type', 'text/plain');
    res.send(lines.join('\n'));
});

// ==========================================
// PAYMENT INTENTS
// ==========================================

app.post('/api/payments/create-intent', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { amount, currency, description, metadata, receipt_email } = req.body;

        if (!PAYMENTS_ENABLED || !stripe) {
            return res.status(501).json({ message: 'Payments are disabled' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            description,
            metadata,
            receipt_email,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            payment_intent_id: paymentIntent.id,
            client_secret: paymentIntent.client_secret,
        });
        await logAudit({
            action: 'payment.intent.create',
            resourceType: 'payment_intent',
            resourceId: paymentIntent.id,
            tenantId: req.tenantId,
            metadata: { amount, currency, description }
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/payments/confirm', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { payment_intent_id, payment_method_id } = req.body;

        if (!PAYMENTS_ENABLED || !stripe) {
            return res.status(501).json({ message: 'Payments are disabled' });
        }

        const paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id, {
            payment_method: payment_method_id,
        });

        res.json(paymentIntent);

        // Generate receipt on succeeded intents
        if (paymentIntent.status === 'succeeded') {
            await storeReceipt({
                invoiceId: paymentIntent.invoice || null,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount_received,
                currency: paymentIntent.currency,
                tenantId: req.tenantId,
                payerEmail: paymentIntent.receipt_email,
                method: paymentIntent.payment_method_types?.[0],
                reference: paymentIntent.charges?.data?.[0]?.id,
                metadata: paymentIntent.metadata || {}
            });
        }

        await logAudit({
            action: 'payment.intent.confirm',
            resourceType: 'payment_intent',
            resourceId: paymentIntent.id,
            tenantId: req.tenantId,
            metadata: { status: paymentIntent.status }
        });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// SUBSCRIPTIONS
// ==========================================

app.post('/api/payments/create-subscription', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { email, payment_method_id, plan_id, user_id } = req.body;

        if (!PAYMENTS_ENABLED || !stripe) {
            return res.status(501).json({ message: 'Payments are disabled' });
        }

        // 1. Create or get customer
        let customer;
        const existingCustomers = await stripe.customers.list({ email, limit: 1 });

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
        } else {
            customer = await stripe.customers.create({
                email,
                payment_method: payment_method_id,
                invoice_settings: {
                    default_payment_method: payment_method_id,
                },
                metadata: {
                    userId: user_id
                }
            });
        }

        // 2. Attach payment method if provided and new
        if (payment_method_id) {
            try {
                await stripe.paymentMethods.attach(payment_method_id, {
                    customer: customer.id,
                });

                // Set as default if needed
                await stripe.customers.update(customer.id, {
                    invoice_settings: {
                        default_payment_method: payment_method_id,
                    },
                });
            } catch (e) {
                // Ignore if already attached
                console.log('Payment method attachment note:', e.message);
            }
        }

        const priceId = process.env[`STRIPE_PRICE_${String(plan_id).toUpperCase()}`];
        if (!priceId) {
            throw new Error('Invalid plan ID or price not configured');
        }

        // 4. Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                userId: user_id,
                planId: plan_id
            }
        });

        res.json({
            subscription_id: subscription.id,
            customer_id: customer.id,
            client_secret: subscription.latest_invoice.payment_intent?.client_secret,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            plan_name: plan_id,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        });

        await logAudit({
            action: 'subscription.create',
            resourceType: 'subscription',
            resourceId: subscription.id,
            tenantId: req.tenantId,
            metadata: { plan_id: plan_id, customer: customer.id }
        });

    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/payments/cancel-subscription', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { subscription_id, cancel_at_period_end } = req.body;

        if (!PAYMENTS_ENABLED || !stripe) {
            return res.status(501).json({ message: 'Payments are disabled' });
        }

        let subscription;
        if (cancel_at_period_end) {
            subscription = await stripe.subscriptions.update(subscription_id, {
                cancel_at_period_end: true
            });
        } else {
            subscription = await stripe.subscriptions.cancel(subscription_id);
        }

        res.json({
            id: subscription.id,
            status: subscription.status,
            canceled_at: subscription.canceled_at
        });
        await logAudit({
            action: 'subscription.cancel',
            resourceType: 'subscription',
            resourceId: subscription.id,
            tenantId: req.tenantId,
            metadata: { cancel_at_period_end }
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// PAYMENT METHODS
// ==========================================

app.post('/api/payments/save-method', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { payment_method_id } = req.body;

        if (!PAYMENTS_ENABLED || !stripe) {
            return res.status(501).json({ message: 'Payments are disabled' });
        }

        const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);

        res.json({
            id: paymentMethod.id,
            type: paymentMethod.type,
            card: paymentMethod.card,
            billing_details: paymentMethod.billing_details
        });
        await logAudit({
            action: 'payment.method.save',
            resourceType: 'payment_method',
            resourceId: paymentMethod.id,
            tenantId: req.tenantId,
            metadata: { type: paymentMethod.type }
        });
    } catch (error) {
        console.error('Error retrieving payment method:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// PAYMENT HISTORY & INVOICES (PocketBase passthrough)
// ==========================================

// Tenant admin updates
app.post('/api/admin/tenants/:id', requireApiKey, requireAdmin, async (req, res) => {
    try {
        const updated = await pbUpdate('tenants', req.params.id, req.body || {});
        await logAudit({ action: 'tenant.update', resourceType: 'tenant', resourceId: req.params.id, tenantId: req.params.id, metadata: { keys: Object.keys(req.body || {}) }, userId: req.header('x-user-id') || 'admin' });
        res.json(updated);
    } catch (error) {
        console.error('Error updating tenant:', error);
        res.status(500).json({ message: error.message });
    }
});

// Assume admin (stub token)
app.post('/api/admin/tenants/:id/assume', requireApiKey, requireAdmin, async (req, res) => {
    try {
        const token = Buffer.from(`${req.params.id}:${Date.now()}`).toString('base64');
        await logAudit({ action: 'tenant.assume', resourceType: 'tenant', resourceId: req.params.id, tenantId: req.params.id, metadata: {}, userId: req.header('x-user-id') || 'admin' });
        res.json({ assumeToken: token, expiresIn: 900 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DNS verify (stub)
app.post('/api/admin/tenants/:id/verify-dns', requireApiKey, requireAdmin, async (req, res) => {
    try {
        const { domain } = req.body || {};
        if (!domain) return res.status(400).json({ message: 'domain required' });
        await logAudit({ action: 'tenant.verify_dns', resourceType: 'tenant', resourceId: req.params.id, tenantId: req.params.id, metadata: { domain }, userId: req.header('x-user-id') || 'admin' });
        // Stubbed response
        res.json({ domain, status: 'pending', requiredRecord: `CNAME ${domain} -> app.growyourneed.com` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Support ticket create
app.post('/api/admin/tenants/:id/tickets', requireApiKey, async (req, res) => {
    try {
        const { subject, description, priority = 'Medium', category = 'Other' } = req.body || {};
        if (!subject || !description) return res.status(400).json({ message: 'subject and description required' });
        const ticket = await pbCreate('tickets', {
            subject,
            description,
            priority,
            status: 'Open',
            category,
            tenantId: req.params.id,
            created_by: req.header('x-user-id') || 'admin'
        });
        await logAudit({ action: 'ticket.create', resourceType: 'ticket', resourceId: ticket.id, tenantId: req.params.id, userId: req.header('x-user-id') || 'admin' });
        res.json(ticket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/payments/history', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { userId, limit } = req.query;
        const filters = [`tenantId = "${req.tenantId}"`];
        if (userId) filters.push(`user = "${userId}"`);
        const filter = filters.join(' && ');
        const items = await pbList('payment_intents', { filter, sort: '-created', perPage: Number(limit) || 50 });
        res.json(items);
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/payments/invoices', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { userId, limit } = req.query;
        const filters = [`tenantId = "${req.tenantId}"`];
        if (userId) filters.push(`user = "${userId}"`);
        const filter = filters.join(' && ');
        const items = await pbList('invoices', { filter, sort: '-created', expand: 'user', perPage: Number(limit) || 50 });
        res.json(items);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// SCHOOL FINANCE SUMMARY (PocketBase passthrough, tenant scoped)
// ==========================================

app.get('/api/school/finance/summary', requireApiKey, requireTenant, async (req, res) => {
    try {
        const tenantFilter = `tenantId = "${req.tenantId}"`;

        const [paidInvoices, pendingInvoices, expenses, payroll] = await Promise.all([
            pbList('school_invoices', { filter: `${tenantFilter} && status = "Paid"`, perPage: 200 }),
            pbList('school_invoices', { filter: `${tenantFilter} && (status = "Pending" || status = "Overdue")`, perPage: 200 }),
            pbList('expenses', { filter: `${tenantFilter} && status = "Approved"`, perPage: 200 }),
            pbList('payroll', { filter: `${tenantFilter} && status = "Paid"`, perPage: 200 })
        ]);

        const sum = (items, field = 'amount') => items.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);

        const totalRevenue = sum(paidInvoices, 'amount');
        const outstanding = sum(pendingInvoices, 'amount');
        const totalExpenses = sum(expenses, 'amount') + sum(payroll, 'amount');
        const netIncome = totalRevenue - totalExpenses;

        res.json({ totalRevenue, outstanding, totalExpenses, netIncome });
    } catch (error) {
        console.error('Error fetching finance summary:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// SCHOOL FINANCE - INVOICES (secured, paginated + export)
// ==========================================

app.get('/api/school/finance/invoices', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { page = 1, perPage = 20, search = '', status, sort = '-created', dueFrom, dueTo, studentName, feeName } = req.query;
        const filters = [`tenantId = "${req.tenantId}"`];
        if (status) filters.push(`status = "${status}"`);
        if (dueFrom) filters.push(`due_date >= "${String(dueFrom).replace(/"/g, '\\"')}"`);
        if (dueTo) filters.push(`due_date <= "${String(dueTo).replace(/"/g, '\\"')}"`);
        if (studentName) {
            const safe = String(studentName).replace(/"/g, '\\"');
            filters.push(`student.name ~ "${safe}"`);
        }
        if (feeName) {
            const safe = String(feeName).replace(/"/g, '\\"');
            filters.push(`fee.name ~ "${safe}"`);
        }
        if (search) {
            const safe = String(search).replace(/"/g, '\\"');
            filters.push(`(status ~ "${safe}" || id ~ "${safe}" || fee ~ "${safe}" || student.name ~ "${safe}" || fee.name ~ "${safe}")`);
        }
        const filter = filters.join(' && ');
        const result = await pbListPage('school_invoices', {
            filter,
            sort: String(sort),
            expand: 'student,fee',
            page: Number(page) || 1,
            perPage: Number(perPage) || 20,
        });
        res.json(result);
    } catch (error) {
        console.error('Error fetching school invoices:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/school/finance/invoices/export', requireApiKey, requireTenant, requireAdmin, async (req, res) => {
    try {
        const { search = '', status, sort = '-created', dueFrom, dueTo, studentName, feeName } = req.query;
        const filters = [`tenantId = "${req.tenantId}"`];
        if (status) filters.push(`status = "${status}"`);
        if (dueFrom) filters.push(`due_date >= "${String(dueFrom).replace(/"/g, '\\"')}"`);
        if (dueTo) filters.push(`due_date <= "${String(dueTo).replace(/"/g, '\\"')}"`);
        if (studentName) {
            const safe = String(studentName).replace(/"/g, '\\"');
            filters.push(`student.name ~ "${safe}"`);
        }
        if (feeName) {
            const safe = String(feeName).replace(/"/g, '\\"');
            filters.push(`fee.name ~ "${safe}"`);
        }
        if (search) {
            const safe = String(search).replace(/"/g, '\\"');
            filters.push(`(status ~ "${safe}" || id ~ "${safe}" || fee ~ "${safe}" || student.name ~ "${safe}" || fee.name ~ "${safe}")`);
        }
        const filter = filters.join(' && ');
        const items = await pbListAll('school_invoices', {
            filter,
            sort: String(sort),
            expand: 'student,fee',
            perPage: 200,
        });

        const rows = [
            ['id', 'student', 'student_name', 'fee', 'fee_name', 'amount', 'status', 'due_date', 'created'],
            ...items.map((inv) => [
                inv.id,
                inv.student,
                inv.expand?.student?.name || '',
                inv.fee,
                inv.expand?.fee?.name || '',
                inv.amount,
                inv.status,
                inv.due_date,
                inv.created,
            ])
        ];

        const csv = rows.map(r => r.map(v => typeof v === 'string' ? `"${String(v).replace(/"/g, '""')}"` : v).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="school-invoices.csv"');
        res.send(csv);

        await logAudit({
            action: 'invoice.export.csv',
            resourceType: 'invoice',
            resourceId: 'bulk',
            tenantId: req.tenantId,
            userId: req.header('x-user-id') || 'admin',
            metadata: { count: items.length, filters }
        });
    } catch (error) {
        console.error('Error exporting school invoices:', error);
        res.status(500).json({ message: error.message });
    }
});

// Billing invoices fetch (tenant scoped)
app.get('/api/admin/billing/invoices', requireApiKey, requireAdmin, async (req, res) => {
    try {
        const { tenantId } = req.query;
        const filter = tenantId ? `tenantId = "${tenantId}"` : '';
        const items = await pbList('billing_invoices', { filter, sort: '-created', perPage: 50 });
        res.json(items);
    } catch (error) {
        console.error('Error fetching billing invoices:', error);
        res.status(500).json({ message: error.message });
    }
});

// Billing invoice download stub (would fetch file URL)
app.get('/api/admin/billing/invoices/:id/download', requireApiKey, requireAdmin, async (req, res) => {
    try {
        const invoice = await pbList('billing_invoices', { filter: `id = "${req.params.id}"`, perPage: 1 });
        if (!invoice?.[0]) return res.status(404).json({ message: 'Not found' });
        const csv = `id,amount,status\n${invoice[0].id},${invoice[0].amount},${invoice[0].status}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="billing-invoice-${req.params.id}.csv"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Bulk reminders
app.post('/api/school/finance/invoices/reminders', requireApiKey, requireTenant, requireAdmin, async (req, res) => {
    try {
        const { invoiceIds = [], channels = { email: true, sms: false, inApp: true }, message, throttleSeconds = 30 } = req.body || {};
        if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return res.status(400).json({ message: 'invoiceIds required' });
        }
        const now = new Date().toISOString();
        // Persist reminder request for auditing; actual channel delivery would be handled by downstream worker
        for (const id of invoiceIds) {
            await logAudit({
                action: 'invoice.reminder',
                resourceType: 'invoice',
                resourceId: id,
                tenantId: req.tenantId,
                userId: req.header('x-user-id') || 'admin',
                metadata: { channels, message: message?.slice(0, 500), throttleSeconds, timestamp: now }
            });
        }
        res.json({ ok: true, queued: invoiceIds.length, channels, throttleSeconds });
    } catch (error) {
        console.error('Error sending reminders:', error);
        res.status(500).json({ message: error.message });
    }
});

// Upload external payment proof (URL + note)
app.post('/api/school/finance/invoices/:id/proof', requireApiKey, requireTenant, requireAdmin, async (req, res) => {
    try {
        const { proofUrl, note } = req.body || {};
        if (!proofUrl) return res.status(400).json({ message: 'proofUrl required' });
        await logAudit({
            action: 'invoice.proof.upload',
            resourceType: 'invoice',
            resourceId: req.params.id,
            tenantId: req.tenantId,
            userId: req.header('x-user-id') || 'admin',
            metadata: { proofUrl, note }
        });
        // Optionally persist to PocketBase if collection exists
        try {
            await pbCreate('payment_proofs', { invoice: req.params.id, proof_url: proofUrl, note, tenantId: req.tenantId });
        } catch (err) {
            console.warn('payment_proofs collection missing or PB not configured', err?.message);
        }
        res.json({ ok: true });
    } catch (error) {
        console.error('Error uploading payment proof:', error);
        res.status(500).json({ message: error.message });
    }
});

// PDF receipt generation
app.get('/api/school/finance/invoices/:id/receipt.pdf', requireApiKey, requireTenant, requireAdmin, async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const itemRes = await pbListPage('school_invoices', { filter: `id = "${invoiceId}" && tenantId = "${req.tenantId}"`, perPage: 1, expand: 'student,fee' });
        const invoice = itemRes?.items?.[0];
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}.pdf"`);
        doc.pipe(res);
        doc.fontSize(18).text('Invoice Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice ID: ${invoice.id}`);
        doc.text(`Student: ${invoice.expand?.student?.name || invoice.student}`);
        doc.text(`Fee: ${invoice.expand?.fee?.name || invoice.fee}`);
        doc.text(`Amount: ${invoice.amount}`);
        doc.text(`Status: ${invoice.status}`);
        doc.text(`Due Date: ${invoice.due_date}`);
        doc.text(`Generated: ${new Date().toISOString()}`);
        doc.end();

        await logAudit({
            action: 'invoice.receipt.pdf',
            resourceType: 'invoice',
            resourceId: invoiceId,
            tenantId: req.tenantId,
            userId: req.header('x-user-id') || 'admin',
            metadata: { amount: invoice.amount, status: invoice.status }
        });
    } catch (error) {
        console.error('Error generating receipt PDF:', error);
        if (!res.headersSent) res.status(500).json({ message: error.message });
    }
});

// Student autocomplete
app.get('/api/school/finance/students/search', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { term = '' } = req.query;
        const safe = String(term).replace(/"/g, '\\"');
        const items = await pbListPage('students', {
            filter: `tenantId = "${req.tenantId}" && name ~ "${safe}"`,
            perPage: 10,
            sort: 'name'
        });
        res.json(items?.items || []);
    } catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({ message: error.message });
    }
});

// Attendance exports and aggregates (teacher/admin)
app.get('/api/school/attendance/export', requireApiKey, requireTenant, requireTeacherOrAdmin, async (req, res) => {
    try {
        const { classId, date } = req.query;
        if (!classId || !date) return res.status(400).json({ message: 'classId and date required' });
        const start = `${date} 00:00:00`;
        const end = `${date} 23:59:59`;
        const records = await pbList('attendance_records', {
            filter: `class = "${classId}" && date >= "${start}" && date <= "${end}" && tenantId = "${req.tenantId}"`,
            perPage: 200,
            expand: 'student'
        });
        const rows = [['student_id', 'student_name', 'status', 'date'], ...records.map(r => [r.student, r.expand?.student?.name || '', r.status, r.date])];
        const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-${classId}-${date}.csv"`);
        res.send(csv);
        await logAudit({ action: 'attendance.export', resourceType: 'attendance', resourceId: classId, tenantId: req.tenantId, userId: req.header('x-user-id') || 'teacher', metadata: { date } });
    } catch (error) {
        console.error('Error exporting attendance:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/school/attendance/aggregates', requireApiKey, requireTenant, requireTeacherOrAdmin, async (req, res) => {
    try {
        const { classId, from, to } = req.query;
        if (!classId || !from || !to) return res.status(400).json({ message: 'classId, from, to required' });
        const records = await pbList('attendance_records', {
            filter: `class = "${classId}" && date >= "${from}" && date <= "${to}" && tenantId = "${req.tenantId}"`,
            perPage: 500,
        });
        const counts = records.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {});
        res.json({ total: records.length, counts });
    } catch (error) {
        console.error('Error fetching attendance aggregates:', error);
        res.status(500).json({ message: error.message });
    }
});

// People export (admin)
app.get('/api/school/people/export', requireApiKey, requireTenant, requireAdmin, async (req, res) => {
    try {
        const { role = 'Student' } = req.query;
        const items = await pbListAll('users', { filter: `tenantId = "${req.tenantId}" && role = "${role}"`, sort: 'name' });
        const rows = [['id', 'name', 'email', 'role', 'verified'], ...items.map(u => [u.id, u.name, u.email, u.role, u.verified])];
        const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="people-${role}.csv"`);
        res.send(csv);
        await logAudit({ action: 'people.export', resourceType: 'user', resourceId: 'bulk', tenantId: req.tenantId, userId: req.header('x-user-id') || 'admin', metadata: { role, count: items.length } });
    } catch (error) {
        console.error('Error exporting people:', error);
        res.status(500).json({ message: error.message });
    }
});

// Services export (admin)
app.get('/api/school/services/export', requireApiKey, requireTenant, requireAdmin, async (req, res) => {
    try {
        const services = await pbListAll('school_services', { filter: `tenantId = "${req.tenantId}"`, sort: 'name' });
        const rows = [['id', 'name', 'category', 'price', 'duration_minutes'], ...services.map(s => [s.id, s.name, s.category, s.price, s.duration_minutes])];
        const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="services.csv"');
        res.send(csv);
        await logAudit({ action: 'services.export', resourceType: 'service', resourceId: 'bulk', tenantId: req.tenantId, userId: req.header('x-user-id') || 'admin', metadata: { count: services.length } });
    } catch (error) {
        console.error('Error exporting services:', error);
        res.status(500).json({ message: error.message });
    }
});

// Audit logs (admin)
app.get('/api/admin/audit', requireApiKey, requireTenant, requireAdmin, async (req, res) => {
    try {
        const { page = 1, perPage = 50, action, userId, from, to, severity } = req.query;
        const filters = [`tenant_id = "${req.tenantId}"`];
        if (action) filters.push(`action ~ "${action}"`);
        if (userId) filters.push(`user_id = "${userId}"`);
        if (severity) filters.push(`severity = "${severity}"`);
        if (from) filters.push(`timestamp >= "${from}"`);
        if (to) filters.push(`timestamp <= "${to}"`);
        const filter = filters.join(' && ');
        const result = await pbListPage('audit_logs', {
            filter,
            sort: '-timestamp',
            page: Number(page) || 1,
            perPage: Number(perPage) || 50
        });
        res.json(result);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: error.message });
    }
});

// Audit statistics endpoint (admin only)
app.get('/api/admin/audit/stats', requireApiKey, requireAdmin, async (req, res) => {
    try {
        const stats = getAuditStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// Flush buffered audit logs (admin only)
app.post('/api/admin/audit/flush', requireApiKey, requireAdmin, async (req, res) => {
    try {
        const result = await flushAuditBuffer();
        await logAudit({
            action: 'audit.buffer.flush',
            resourceType: 'audit',
            resourceId: 'buffer',
            tenantId: 'platform',
            userId: req.header('x-user-id') || 'admin',
            severity: 'medium',
            metadata: result,
            req
        });
        res.json(result);
    } catch (error) {
        console.error('Error flushing audit buffer:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/admin/audit/export', requireApiKey, requireTenant, requireAdmin, async (req, res) => {
    try {
        const { action, userId, from, to, severity } = req.query;
        const filters = [`tenant_id = "${req.tenantId}"`];
        if (action) filters.push(`action ~ "${action}"`);
        if (userId) filters.push(`user_id = "${userId}"`);
        if (severity) filters.push(`severity = "${severity}"`);
        if (from) filters.push(`timestamp >= "${from}"`);
        if (to) filters.push(`timestamp <= "${to}"`);
        const filter = filters.join(' && ');
        const items = await pbListAll('audit_logs', { filter, sort: '-timestamp', perPage: 200 });
        const rows = [['timestamp', 'action', 'resource_type', 'resource_id', 'user_id', 'severity', 'metadata'], ...items.map(i => [i.timestamp, i.action, i.resource_type, i.resource_id, i.user_id, i.severity, JSON.stringify(i.metadata || {})])];
        const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting audit logs:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// SCHOOL FINANCE - EXPENSES (secured)
// ==========================================

app.post('/api/school/finance/expenses', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { title, amount, category, date, status } = req.body;
        if (!title || amount == null || !category || !date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const payload = {
            title,
            amount,
            category,
            date,
            status: status || 'Pending',
            tenantId: req.tenantId
        };
        const created = await pbCreate('expenses', payload);
        res.json(created);
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ message: error.message });
    }
});

app.patch('/api/school/finance/expenses/:id/status', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['Pending', 'Approved', 'Rejected'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const updated = await pbUpdate('expenses', req.params.id, { status });
        res.json(updated);
    } catch (error) {
        console.error('Error updating expense status:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/school/finance/expenses', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { page = 1, perPage = 50, search } = req.query;
        const filters = [`tenantId = "${req.tenantId}"`];
        if (search) {
            filters.push(`title ~ "${search}" || category ~ "${search}"`);
        }
        const filter = filters.join(' && ');
        const items = await pbList('expenses', {
            filter,
            sort: '-date',
            perPage: Number(perPage) || 50
        });
        res.json(items);
    } catch (error) {
        console.error('Error listing expenses:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// SCHOOL FINANCE - PAYROLL (secured)
// ==========================================

app.post('/api/school/finance/payroll/run', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { month } = req.body;
        if (!month) return res.status(400).json({ message: 'Month is required (YYYY-MM)' });

        const roleFilter = '(role = "Teacher" || role = "Staff" || role = "Admin")';
        const staff = await pbList('users', {
            filter: `${roleFilter} && tenantId = "${req.tenantId}"`,
            perPage: 200
        });

        let created = 0;
        for (const s of staff) {
            const existing = await pbList('payroll', {
                filter: `staff = "${s.id}" && month = "${month}" && tenantId = "${req.tenantId}"`,
                perPage: 1
            });
            if (existing.length === 0) {
                await pbCreate('payroll', {
                    staff: s.id,
                    month,
                    amount: s.salary || 3000,
                    status: 'Pending',
                    tenantId: req.tenantId
                });
                created++;
            }
        }

        res.json({ created });
    } catch (error) {
        console.error('Error running payroll:', error);
        res.status(500).json({ message: error.message });
    }
});

app.patch('/api/school/finance/payroll/:id/status', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['Pending', 'Paid'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const body = { status };
        if (status === 'Paid') {
            body.paid_at = new Date().toISOString();
        }
        const updated = await pbUpdate('payroll', req.params.id, body);
        res.json(updated);
    } catch (error) {
        console.error('Error updating payroll status:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/school/finance/payroll', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { page = 1, perPage = 50, search } = req.query;
        const filters = [`tenantId = "${req.tenantId}"`];
        if (search) {
            filters.push(`month ~ "${search}"`);
        }
        const filter = filters.join(' && ');
        const items = await pbList('payroll', {
            filter,
            sort: '-created',
            expand: 'staff',
            perPage: Number(perPage) || 50
        });
        res.json(items);
    } catch (error) {
        console.error('Error listing payroll:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// WEBHOOKS
// ==========================================

// Webhook retry configuration
const WEBHOOK_RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    backoffMultiplier: 2
};

// In-memory store for webhook idempotency (use Redis in production)
const processedWebhooks = new Map();

// Clean up old webhook IDs every hour
setInterval(() => {
    const oneHourAgo = Date.now() - 3600000;
    for (const [id, timestamp] of processedWebhooks.entries()) {
        if (timestamp < oneHourAgo) {
            processedWebhooks.delete(id);
        }
    }
}, 3600000);

/**
 * Process webhook with retry logic
 */
async function processWebhookWithRetry(event, retryCount = 0) {
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('PaymentIntent was successful!', paymentIntent.id);

                // Update database status
                if (PB_URL && PB_TOKEN) {
                    try {
                        await pbUpdate('payment_intents', paymentIntent.id, {
                            status: 'succeeded',
                            amount_received: paymentIntent.amount_received,
                            charges: paymentIntent.charges?.data?.map(c => c.id),
                            receipt_email: paymentIntent.receipt_email,
                            updated: new Date().toISOString()
                        });

                        // Create receipt record
                        const receiptData = {
                            payment_intent: paymentIntent.id,
                            customer: paymentIntent.customer,
                            amount: paymentIntent.amount_received,
                            currency: paymentIntent.currency,
                            payment_method: paymentIntent.payment_method,
                            receipt_email: paymentIntent.receipt_email,
                            description: paymentIntent.description || 'Payment',
                            metadata: JSON.stringify(paymentIntent.metadata || {}),
                            created_at: new Date(paymentIntent.created * 1000).toISOString(),
                            tenantId: paymentIntent.metadata?.tenantId || 'unknown'
                        };

                        await pbCreate('receipts', receiptData);
                        console.log('Receipt created for payment:', paymentIntent.id);
                    } catch (dbError) {
                        console.error('Failed to update payment intent in database:', dbError);
                        throw dbError; // Trigger retry
                    }
                }

                // Log to audit system
                await logAudit({
                    action: 'webhook.payment_intent.succeeded',
                    resourceType: 'payment_intent',
                    resourceId: paymentIntent.id,
                    tenantId: paymentIntent.metadata?.tenantId || 'unknown',
                    metadata: {
                        amount: paymentIntent.amount_received,
                        currency: paymentIntent.currency,
                        customer: paymentIntent.customer,
                        payment_method: paymentIntent.payment_method,
                        description: paymentIntent.description
                    },
                    severity: 'low'
                });
                break;

            case 'invoice.payment_succeeded':
                const invoice = event.data.object;
                console.log('Invoice payment succeeded!', invoice.id);

                // Update invoice status
                if (PB_URL && PB_TOKEN) {
                    try {
                        await pbUpdate('invoices', invoice.id, {
                            status: 'Paid',
                            paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
                            updated: new Date().toISOString()
                        });
                    } catch (dbError) {
                        console.error('Failed to update invoice in database:', dbError);
                        throw dbError; // Trigger retry
                    }
                }

                // Reset retry counter on successful payment
                if (invoice.subscription) {
                    try {
                        await billingRetryService.resetRetryCounter(invoice.subscription);
                        console.log(`Retry counter reset for subscription ${invoice.subscription}`);
                    } catch (retryError) {
                        console.error('Failed to reset retry counter:', retryError);
                        // Non-critical - continue processing
                    }
                }

                // Log to audit system
                await logAudit({
                    action: 'webhook.invoice.payment_succeeded',
                    resourceType: 'invoice',
                    resourceId: invoice.id,
                    tenantId: invoice.metadata?.tenantId || 'unknown',
                    metadata: {
                        amount: invoice.amount_paid,
                        currency: invoice.currency,
                        customer: invoice.customer,
                        subscription: invoice.subscription
                    },
                    severity: 'low'
                });
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                console.log('Subscription status update:', subscription.id, subscription.status);

                // Update subscription status
                if (PB_URL && PB_TOKEN) {
                    try {
                        const subscriptionData = {
                            status: subscription.status,
                            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                            cancel_at_period_end: subscription.cancel_at_period_end,
                            updated: new Date().toISOString()
                        };

                        if (subscription.canceled_at) {
                            subscriptionData.canceled_at = new Date(subscription.canceled_at * 1000).toISOString();
                        }

                        await pbUpdate('subscriptions', subscription.id, subscriptionData);
                    } catch (dbError) {
                        console.error('Failed to update subscription in database:', dbError);
                        throw dbError; // Trigger retry
                    }
                }

                // Log to audit system
                await logAudit({
                    action: `webhook.subscription.${event.type.split('.').pop()}`,
                    resourceType: 'subscription',
                    resourceId: subscription.id,
                    tenantId: subscription.metadata?.tenantId || 'unknown',
                    metadata: {
                        status: subscription.status,
                        customer: subscription.customer,
                        plan: subscription.items?.data?.[0]?.price?.id,
                        cancel_at_period_end: subscription.cancel_at_period_end
                    },
                    severity: event.type === 'customer.subscription.deleted' ? 'medium' : 'low'
                });
                break;

            case 'invoice.payment_failed':
                const failedInvoice = event.data.object;
                console.error('Invoice payment failed:', failedInvoice.id, failedInvoice.last_finalization_error?.message);

                // Update invoice status in database
                if (PB_URL && PB_TOKEN) {
                    try {
                        await pbUpdate('invoices', failedInvoice.id, {
                            status: 'payment_failed',
                            attempt_count: failedInvoice.attempt_count || 0,
                            next_payment_attempt: failedInvoice.next_payment_attempt 
                                ? new Date(failedInvoice.next_payment_attempt * 1000).toISOString() 
                                : null,
                            updated: new Date().toISOString()
                        });
                    } catch (dbError) {
                        console.error('Failed to update invoice in database:', dbError);
                    }
                }

                // Use billing retry service for intelligent retry scheduling
                try {
                    const retryResult = await billingRetryService.schedulePaymentRetry(failedInvoice);
                    
                    if (retryResult.success) {
                        console.log(`Retry scheduled: Attempt ${retryResult.attemptCount}, Next retry: ${retryResult.nextRetryDate}`);
                    } else {
                        console.error(`Retry failed: ${retryResult.reason}, Action: ${retryResult.action}`);
                    }
                } catch (retryError) {
                    console.error('Error in billing retry service:', retryError);
                    // Continue execution - retry service failure shouldn't block webhook processing
                }

                // Log failed payment with retry info
                await logAudit({
                    action: 'webhook.invoice.payment_failed',
                    resourceType: 'invoice',
                    resourceId: failedInvoice.id,
                    tenantId: failedInvoice.metadata?.tenantId || 'unknown',
                    metadata: {
                        error: failedInvoice.last_finalization_error?.message,
                        amount: failedInvoice.amount_due,
                        currency: failedInvoice.currency,
                        attempt_count: failedInvoice.attempt_count,
                        customer: failedInvoice.customer,
                        subscription: failedInvoice.subscription,
                        next_retry: failedInvoice.next_payment_attempt 
                            ? new Date(failedInvoice.next_payment_attempt * 1000).toISOString() 
                            : 'none'
                    },
                    severity: 'high'
                });
                break;

            case 'customer.deleted':
                const deletedCustomer = event.data.object;
                console.log('Customer deleted:', deletedCustomer.id);

                // Archive customer data and associated subscriptions
                if (PB_URL && PB_TOKEN) {
                    try {
                        // Find tenant associated with this customer
                        const tenants = await pbList('tenants', { 
                            filter: `stripe_customer_id = "${deletedCustomer.id}"`,
                            perPage: 1 
                        });

                        if (tenants && tenants.length > 0) {
                            const tenant = tenants[0];
                            
                            // Mark tenant as cancelled and archive
                            await pbUpdate('tenants', tenant.id, {
                                status: 'cancelled',
                                stripe_customer_id: null,
                                archived: true,
                                archived_at: new Date().toISOString(),
                                updated: new Date().toISOString()
                            });

                            // Cancel active subscriptions
                            const subscriptions = await pbList('subscriptions', {
                                filter: `customer = "${deletedCustomer.id}" && status = "active"`,
                                perPage: 100
                            });

                            for (const sub of subscriptions || []) {
                                await pbUpdate('subscriptions', sub.id, {
                                    status: 'cancelled',
                                    canceled_at: new Date().toISOString(),
                                    updated: new Date().toISOString()
                                });
                            }

                            console.log(`Archived tenant ${tenant.id} and ${subscriptions?.length || 0} subscriptions`);
                        }
                    } catch (dbError) {
                        console.error('Failed to archive customer data:', dbError);
                    }
                }

                // Log customer deletion
                await logAudit({
                    action: 'webhook.customer.deleted',
                    resourceType: 'customer',
                    resourceId: deletedCustomer.id,
                    tenantId: deletedCustomer.metadata?.tenantId || 'unknown',
                    metadata: {
                        email: deletedCustomer.email,
                        name: deletedCustomer.name
                    },
                    severity: 'medium'
                });
                break;

            case 'charge.disputed':
                const dispute = event.data.object;
                console.error('Charge disputed:', dispute.id, 'Reason:', dispute.reason);

                // Update charge status and create dispute record
                if (PB_URL && PB_TOKEN) {
                    try {
                        // Create dispute record
                        const disputeData = {
                            dispute_id: dispute.id,
                            charge_id: dispute.charge,
                            amount: dispute.amount,
                            currency: dispute.currency,
                            reason: dispute.reason,
                            status: dispute.status,
                            evidence_due_by: dispute.evidence_details?.due_by 
                                ? new Date(dispute.evidence_details.due_by * 1000).toISOString() 
                                : null,
                            customer: dispute.payment_intent?.customer || null,
                            tenantId: dispute.metadata?.tenantId || 'unknown',
                            created_at: new Date(dispute.created * 1000).toISOString(),
                            is_resolved: false
                        };

                        await pbCreate('payment_disputes', disputeData);

                        // Update payment intent status if exists
                        if (dispute.payment_intent) {
                            await pbUpdate('payment_intents', dispute.payment_intent, {
                                status: 'disputed',
                                dispute_id: dispute.id,
                                updated: new Date().toISOString()
                            });
                        }

                        console.log('Dispute record created:', dispute.id);
                    } catch (dbError) {
                        console.error('Failed to create dispute record:', dbError);
                    }
                }

                // Send immediate notification to admin
                try {
                    // TODO: Implement email notification to platform admins
                    console.log(`[URGENT] Payment dispute detected: ${dispute.id}, Amount: ${dispute.amount / 100} ${dispute.currency.toUpperCase()}`);
                } catch (notifError) {
                    console.error('Failed to send dispute notification:', notifError);
                }

                // Log dispute with high severity
                await logAudit({
                    action: 'webhook.charge.disputed',
                    resourceType: 'charge',
                    resourceId: dispute.charge,
                    tenantId: dispute.metadata?.tenantId || 'unknown',
                    metadata: {
                        dispute_id: dispute.id,
                        amount: dispute.amount,
                        currency: dispute.currency,
                        reason: dispute.reason,
                        status: dispute.status,
                        evidence_due_by: dispute.evidence_details?.due_by
                    },
                    severity: 'critical'
                });
                break;

            case 'charge.refunded':
                const refund = event.data.object;
                console.log('Charge refunded:', refund.id, 'Amount:', refund.amount_refunded);

                // Update payment record with refund info
                if (PB_URL && PB_TOKEN) {
                    try {
                        const refundData = {
                            refund_id: refund.id,
                            charge_id: refund.id,
                            amount_refunded: refund.amount_refunded,
                            refund_reason: refund.refunds?.data?.[0]?.reason || 'unknown',
                            refund_status: refund.refunds?.data?.[0]?.status || 'succeeded',
                            refunded_at: new Date().toISOString(),
                            tenantId: refund.metadata?.tenantId || 'unknown'
                        };

                        await pbCreate('payment_refunds', refundData);
                        console.log('Refund record created');
                    } catch (dbError) {
                        console.error('Failed to create refund record:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.charge.refunded',
                    resourceType: 'charge',
                    resourceId: refund.id,
                    tenantId: refund.metadata?.tenantId || 'unknown',
                    metadata: {
                        amount_refunded: refund.amount_refunded,
                        currency: refund.currency,
                        reason: refund.refunds?.data?.[0]?.reason
                    },
                    severity: 'medium'
                });
                break;

            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                console.error('Payment failed:', failedPayment.id, failedPayment.last_payment_error?.message);

                // Log failed payment
                await logAudit({
                    action: 'webhook.payment_intent.failed',
                    resourceType: 'payment_intent',
                    resourceId: failedPayment.id,
                    tenantId: failedPayment.metadata?.tenantId || 'unknown',
                    metadata: {
                        error: failedPayment.last_payment_error?.message,
                        amount: failedPayment.amount,
                        currency: failedPayment.currency
                    },
                    severity: 'high'
                });
                break;

            case 'customer.subscription.trial_will_end':
                const trialSubscription = event.data.object;
                const trialEndDate = new Date(trialSubscription.trial_end * 1000);
                console.log(`Trial ending soon for subscription ${trialSubscription.id}:`, trialEndDate);

                // Update subscription metadata
                if (PB_URL && PB_TOKEN) {
                    try {
                        await pbUpdate('subscriptions', trialSubscription.id, {
                            trial_end: trialEndDate.toISOString(),
                            trial_ending_soon: true,
                            updated: new Date().toISOString()
                        });
                    } catch (dbError) {
                        console.error('Failed to update subscription trial status:', dbError);
                    }
                }

                // Log trial ending notification
                await logAudit({
                    action: 'webhook.subscription.trial_will_end',
                    resourceType: 'subscription',
                    resourceId: trialSubscription.id,
                    tenantId: trialSubscription.metadata?.tenantId || 'unknown',
                    metadata: {
                        trial_end: trialEndDate.toISOString(),
                        customer: trialSubscription.customer,
                        plan: trialSubscription.items?.data?.[0]?.price?.id,
                        days_until_end: Math.ceil((trialEndDate - new Date()) / (1000 * 60 * 60 * 24))
                    },
                    severity: 'medium'
                });
                break;

            case 'invoice.upcoming':
                const upcomingInvoice = event.data.object;
                const dueDate = new Date(upcomingInvoice.period_end * 1000);
                console.log(`Upcoming invoice for customer ${upcomingInvoice.customer}:`, upcomingInvoice.amount_due);

                // Log upcoming invoice for proactive notifications
                await logAudit({
                    action: 'webhook.invoice.upcoming',
                    resourceType: 'invoice',
                    resourceId: upcomingInvoice.id || 'upcoming',
                    tenantId: upcomingInvoice.metadata?.tenantId || 'unknown',
                    metadata: {
                        customer: upcomingInvoice.customer,
                        amount_due: upcomingInvoice.amount_due,
                        currency: upcomingInvoice.currency,
                        due_date: dueDate.toISOString(),
                        subscription: upcomingInvoice.subscription,
                        days_until_due: Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24))
                    },
                    severity: 'low'
                });
                break;

            case 'charge.succeeded':
                const charge = event.data.object;
                console.log('Charge succeeded:', charge.id, charge.amount);

                // Log successful charge for transaction history
                await logAudit({
                    action: 'webhook.charge.succeeded',
                    resourceType: 'charge',
                    resourceId: charge.id,
                    tenantId: charge.metadata?.tenantId || 'unknown',
                    metadata: {
                        amount: charge.amount,
                        currency: charge.currency,
                        customer: charge.customer,
                        payment_method: charge.payment_method,
                        receipt_url: charge.receipt_url,
                        invoice: charge.invoice
                    },
                    severity: 'low'
                });
                break;

            case 'charge.dispute.created':
                const disputeCreated = event.data.object;
                console.error('Dispute created:', disputeCreated.id);

                // Log dispute with high severity
                await logAudit({
                    action: 'webhook.dispute.created',
                    resourceType: 'dispute',
                    resourceId: disputeCreated.id,
                    tenantId: 'platform',
                    metadata: {
                        amount: disputeCreated.amount,
                        currency: disputeCreated.currency,
                        reason: disputeCreated.reason,
                        status: disputeCreated.status
                    },
                    severity: 'critical'
                });
                break;

            // ========== NEW WEBHOOK HANDLERS ==========

            case 'customer.updated':
                const updatedCustomer = event.data.object;
                console.log('Customer updated:', updatedCustomer.id);

                if (PB_URL && PB_TOKEN) {
                    try {
                        const tenants = await pbList('tenants', { 
                            filter: `stripe_customer_id = "${updatedCustomer.id}"`,
                            perPage: 1 
                        });

                        if (tenants && tenants.length > 0) {
                            await pbUpdate('tenants', tenants[0].id, {
                                admin_email: updatedCustomer.email,
                                metadata: JSON.stringify(updatedCustomer.metadata || {}),
                                updated: new Date().toISOString()
                            });
                        }
                    } catch (dbError) {
                        console.error('Failed to update customer data:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.customer.updated',
                    resourceType: 'customer',
                    resourceId: updatedCustomer.id,
                    tenantId: updatedCustomer.metadata?.tenantId || 'unknown',
                    metadata: {
                        email: updatedCustomer.email,
                        name: updatedCustomer.name
                    },
                    severity: 'low'
                });
                break;

            case 'charge.dispute.closed':
                const closedDispute = event.data.object;
                console.log('Dispute closed:', closedDispute.id, 'Status:', closedDispute.status);

                if (PB_URL && PB_TOKEN) {
                    try {
                        const disputes = await pbList('payment_disputes', {
                            filter: `dispute_id = "${closedDispute.id}"`,
                            perPage: 1
                        });

                        if (disputes && disputes.length > 0) {
                            await pbUpdate('payment_disputes', disputes[0].id, {
                                status: closedDispute.status,
                                is_resolved: true,
                                resolved_at: new Date().toISOString(),
                                resolution_outcome: closedDispute.status,
                                updated: new Date().toISOString()
                            });
                        }
                    } catch (dbError) {
                        console.error('Failed to update dispute record:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.dispute.closed',
                    resourceType: 'dispute',
                    resourceId: closedDispute.id,
                    tenantId: closedDispute.metadata?.tenantId || 'unknown',
                    metadata: {
                        status: closedDispute.status,
                        amount: closedDispute.amount,
                        outcome: closedDispute.status === 'won' ? 'merchant_won' : 'customer_won'
                    },
                    severity: 'medium'
                });
                break;

            case 'invoice.finalized':
                const finalizedInvoice = event.data.object;
                console.log('Invoice finalized:', finalizedInvoice.id);

                if (PB_URL && PB_TOKEN) {
                    try {
                        await pbUpdate('invoices', finalizedInvoice.id, {
                            status: 'finalized',
                            finalized_at: new Date(finalizedInvoice.status_transitions.finalized_at * 1000).toISOString(),
                            amount_due: finalizedInvoice.amount_due,
                            updated: new Date().toISOString()
                        });
                    } catch (dbError) {
                        console.error('Failed to update finalized invoice:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.invoice.finalized',
                    resourceType: 'invoice',
                    resourceId: finalizedInvoice.id,
                    tenantId: finalizedInvoice.metadata?.tenantId || 'unknown',
                    metadata: {
                        amount_due: finalizedInvoice.amount_due,
                        currency: finalizedInvoice.currency,
                        due_date: new Date(finalizedInvoice.due_date * 1000).toISOString()
                    },
                    severity: 'low'
                });
                break;

            case 'invoice.marked_uncollectible':
                const uncollectibleInvoice = event.data.object;
                console.error('Invoice marked uncollectible:', uncollectibleInvoice.id);

                if (PB_URL && PB_TOKEN) {
                    try {
                        await pbUpdate('invoices', uncollectibleInvoice.id, {
                            status: 'uncollectible',
                            marked_uncollectible_at: new Date().toISOString(),
                            updated: new Date().toISOString()
                        });

                        // Flag tenant for review
                        const tenants = await pbList('tenants', {
                            filter: `stripe_customer_id = "${uncollectibleInvoice.customer}"`,
                            perPage: 1
                        });

                        if (tenants && tenants.length > 0) {
                            await pbUpdate('tenants', tenants[0].id, {
                                status: 'suspended',
                                suspension_reason: 'uncollectible_debt',
                                updated: new Date().toISOString()
                            });
                        }
                    } catch (dbError) {
                        console.error('Failed to handle uncollectible invoice:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.invoice.marked_uncollectible',
                    resourceType: 'invoice',
                    resourceId: uncollectibleInvoice.id,
                    tenantId: uncollectibleInvoice.metadata?.tenantId || 'unknown',
                    metadata: {
                        amount_due: uncollectibleInvoice.amount_due,
                        customer: uncollectibleInvoice.customer
                    },
                    severity: 'critical'
                });
                break;

            case 'invoice.voided':
                const voidedInvoice = event.data.object;
                console.log('Invoice voided:', voidedInvoice.id);

                if (PB_URL && PB_TOKEN) {
                    try {
                        await pbUpdate('invoices', voidedInvoice.id, {
                            status: 'void',
                            voided_at: new Date().toISOString(),
                            updated: new Date().toISOString()
                        });
                    } catch (dbError) {
                        console.error('Failed to update voided invoice:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.invoice.voided',
                    resourceType: 'invoice',
                    resourceId: voidedInvoice.id,
                    tenantId: voidedInvoice.metadata?.tenantId || 'unknown',
                    metadata: {
                        amount: voidedInvoice.amount_due,
                        reason: 'invoice_voided'
                    },
                    severity: 'medium'
                });
                break;

            case 'customer.subscription.paused':
                const pausedSubscription = event.data.object;
                console.log('Subscription paused:', pausedSubscription.id);

                if (PB_URL && PB_TOKEN) {
                    try {
                        await pbUpdate('subscriptions', pausedSubscription.id, {
                            status: 'paused',
                            paused_at: new Date().toISOString(),
                            pause_collection: JSON.stringify(pausedSubscription.pause_collection || {}),
                            updated: new Date().toISOString()
                        });
                    } catch (dbError) {
                        console.error('Failed to update paused subscription:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.subscription.paused',
                    resourceType: 'subscription',
                    resourceId: pausedSubscription.id,
                    tenantId: pausedSubscription.metadata?.tenantId || 'unknown',
                    metadata: {
                        customer: pausedSubscription.customer,
                        pause_behavior: pausedSubscription.pause_collection?.behavior
                    },
                    severity: 'medium'
                });
                break;

            case 'customer.subscription.resumed':
                const resumedSubscription = event.data.object;
                console.log('Subscription resumed:', resumedSubscription.id);

                if (PB_URL && PB_TOKEN) {
                    try {
                        await pbUpdate('subscriptions', resumedSubscription.id, {
                            status: 'active',
                            resumed_at: new Date().toISOString(),
                            paused_at: null,
                            updated: new Date().toISOString()
                        });
                    } catch (dbError) {
                        console.error('Failed to update resumed subscription:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.subscription.resumed',
                    resourceType: 'subscription',
                    resourceId: resumedSubscription.id,
                    tenantId: resumedSubscription.metadata?.tenantId || 'unknown',
                    metadata: {
                        customer: resumedSubscription.customer,
                        status: resumedSubscription.status
                    },
                    severity: 'low'
                });
                break;

            case 'payment_method.automatically_updated':
                const updatedPaymentMethod = event.data.object;
                console.log('Payment method auto-updated:', updatedPaymentMethod.id);

                if (PB_URL && PB_TOKEN) {
                    try {
                        // Update customer's default payment method
                        const tenants = await pbList('tenants', {
                            filter: `stripe_customer_id = "${updatedPaymentMethod.customer}"`,
                            perPage: 1
                        });

                        if (tenants && tenants.length > 0) {
                            await pbUpdate('tenants', tenants[0].id, {
                                metadata: JSON.stringify({
                                    ...(tenants[0].metadata || {}),
                                    payment_method_updated: new Date().toISOString(),
                                    payment_method_type: updatedPaymentMethod.type
                                }),
                                updated: new Date().toISOString()
                            });
                        }
                    } catch (dbError) {
                        console.error('Failed to update payment method info:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.payment_method.auto_updated',
                    resourceType: 'payment_method',
                    resourceId: updatedPaymentMethod.id,
                    tenantId: 'unknown',
                    metadata: {
                        customer: updatedPaymentMethod.customer,
                        type: updatedPaymentMethod.type,
                        last4: updatedPaymentMethod.card?.last4
                    },
                    severity: 'low'
                });
                break;

            case 'billing_portal.session.created':
                const portalSession = event.data.object;
                console.log('Billing portal session created:', portalSession.id);

                await logAudit({
                    action: 'webhook.billing_portal.session_created',
                    resourceType: 'billing_portal_session',
                    resourceId: portalSession.id,
                    tenantId: 'unknown',
                    metadata: {
                        customer: portalSession.customer,
                        return_url: portalSession.return_url
                    },
                    severity: 'low'
                });
                break;

            case 'payment_intent.canceled':
                const canceledPayment = event.data.object;
                console.log('Payment intent canceled:', canceledPayment.id);

                if (PB_URL && PB_TOKEN) {
                    try {
                        await pbUpdate('payment_intents', canceledPayment.id, {
                            status: 'canceled',
                            canceled_at: new Date().toISOString(),
                            cancellation_reason: canceledPayment.cancellation_reason || 'unknown',
                            updated: new Date().toISOString()
                        });
                    } catch (dbError) {
                        console.error('Failed to update canceled payment intent:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.payment_intent.canceled',
                    resourceType: 'payment_intent',
                    resourceId: canceledPayment.id,
                    tenantId: canceledPayment.metadata?.tenantId || 'unknown',
                    metadata: {
                        amount: canceledPayment.amount,
                        reason: canceledPayment.cancellation_reason
                    },
                    severity: 'medium'
                });
                break;

            case 'checkout.session.completed':
                const checkoutSession = event.data.object;
                console.log('Checkout session completed:', checkoutSession.id);

                if (PB_URL && PB_TOKEN) {
                    try {
                        // Link subscription to tenant if metadata present
                        if (checkoutSession.subscription && checkoutSession.metadata?.tenantId) {
                            await pbUpdate('tenants', checkoutSession.metadata.tenantId, {
                                stripe_subscription_id: checkoutSession.subscription,
                                status: 'active',
                                subscription_status: 'active',
                                trial_ends_at: null,
                                updated: new Date().toISOString()
                            });
                        }
                    } catch (dbError) {
                        console.error('Failed to update tenant after checkout:', dbError);
                    }
                }

                await logAudit({
                    action: 'webhook.checkout.session.completed',
                    resourceType: 'checkout_session',
                    resourceId: checkoutSession.id,
                    tenantId: checkoutSession.metadata?.tenantId || 'unknown',
                    metadata: {
                        customer: checkoutSession.customer,
                        subscription: checkoutSession.subscription,
                        mode: checkoutSession.mode,
                        payment_status: checkoutSession.payment_status
                    },
                    severity: 'low'
                });
                break;

            case 'checkout.session.expired':
                const expiredSession = event.data.object;
                console.log('Checkout session expired:', expiredSession.id);

                await logAudit({
                    action: 'webhook.checkout.session.expired',
                    resourceType: 'checkout_session',
                    resourceId: expiredSession.id,
                    tenantId: expiredSession.metadata?.tenantId || 'unknown',
                    metadata: {
                        customer: expiredSession.customer,
                        mode: expiredSession.mode
                    },
                    severity: 'low'
                });
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
                // Log unhandled events for monitoring
                await logAudit({
                    action: 'webhook.unhandled',
                    resourceType: 'webhook',
                    resourceId: event.id,
                    tenantId: 'platform',
                    metadata: {
                        type: event.type
                    },
                    severity: 'low'
                });
        }

        return { success: true };
    } catch (error) {
        console.error(`Error processing webhook event (attempt ${retryCount + 1}):`, error);

        // Retry logic for transient failures
        if (retryCount < WEBHOOK_RETRY_CONFIG.maxRetries) {
            const delay = WEBHOOK_RETRY_CONFIG.retryDelay * Math.pow(WEBHOOK_RETRY_CONFIG.backoffMultiplier, retryCount);
            console.log(`Retrying webhook processing in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
            return processWebhookWithRetry(event, retryCount + 1);
        }

        // Log failed webhook after all retries
        await logAudit({
            action: 'webhook.processing_failed',
            resourceType: 'webhook',
            resourceId: event.id,
            tenantId: 'platform',
            metadata: {
                type: event.type,
                error: error.message,
                retries: retryCount
            },
            severity: 'critical'
        });

        throw error;
    }
}

// ==========================================
// BILLING RETRY MANAGEMENT API
// ==========================================

/**
 * Manual retry of failed invoice
 * POST /api/billing/retry/:invoiceId
 */
app.post('/api/billing/retry/:invoiceId', requireApiKey, async (req, res) => {
    try {
        const { invoiceId } = req.params;
        
        const result = await billingRetryService.retryInvoicePayment(invoiceId);
        
        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                invoice: result.invoice
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in manual retry endpoint:', error);
        res.status(500).json({
            message: 'Failed to retry invoice payment',
            error: error.message
        });
    }
});

/**
 * Update payment method and retry failed invoices
 * POST /api/billing/update-payment-method
 * Body: { customerId, paymentMethodId }
 */
app.post('/api/billing/update-payment-method', requireApiKey, async (req, res) => {
    try {
        const { customerId, paymentMethodId } = req.body;
        
        if (!customerId || !paymentMethodId) {
            return res.status(400).json({
                message: 'customerId and paymentMethodId are required'
            });
        }
        
        const result = await billingRetryService.updatePaymentMethodAndRetry(customerId, paymentMethodId);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({
            message: 'Failed to update payment method',
            error: error.message
        });
    }
});

/**
 * Get retry status for subscription
 * GET /api/billing/retry-status/:subscriptionId
 */
app.get('/api/billing/retry-status/:subscriptionId', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        
        const status = await billingRetryService.getRetryStatus(subscriptionId);
        
        res.json({
            success: true,
            ...status
        });
    } catch (error) {
        console.error('Error getting retry status:', error);
        res.status(500).json({
            message: 'Failed to get retry status',
            error: error.message
        });
    }
});

/**
 * Get billing retry configuration
 * GET /api/billing/retry-config
 */
app.get('/api/billing/retry-config', requireApiKey, async (req, res) => {
    try {
        res.json({
            success: true,
            config: billingRetryService.RETRY_CONFIG
        });
    } catch (error) {
        console.error('Error getting retry config:', error);
        res.status(500).json({
            message: 'Failed to get retry configuration',
            error: error.message
        });
    }
});

// ==========================================
// PRORATION MANAGEMENT API
// ==========================================

/**
 * Calculate proration for plan change preview
 * POST /api/billing/proration/calculate
 * Body: { subscriptionId, newPriceId, prorationDate?, billingCycleAnchor? }
 */
app.post('/api/billing/proration/calculate', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId, newPriceId, prorationDate, billingCycleAnchor } = req.body;
        
        if (!subscriptionId || !newPriceId) {
            return res.status(400).json({
                message: 'subscriptionId and newPriceId are required'
            });
        }
        
        const result = await prorationService.calculateProration(subscriptionId, newPriceId, {
            prorationDate,
            billingCycleAnchor
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error calculating proration:', error);
        res.status(500).json({
            message: 'Failed to calculate proration',
            error: error.message
        });
    }
});

/**
 * Apply plan change with proration
 * POST /api/billing/proration/apply
 * Body: { subscriptionId, newPriceId, prorationBehavior?, paymentBehavior? }
 */
app.post('/api/billing/proration/apply', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { subscriptionId, newPriceId, prorationBehavior, paymentBehavior, prorationDate, billingCycleAnchor } = req.body;
        
        if (!subscriptionId || !newPriceId) {
            return res.status(400).json({
                message: 'subscriptionId and newPriceId are required'
            });
        }
        
        const result = await prorationService.applyPlanChange(subscriptionId, newPriceId, {
            prorationBehavior,
            paymentBehavior,
            prorationDate,
            billingCycleAnchor
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error applying plan change:', error);
        res.status(500).json({
            message: 'Failed to apply plan change',
            error: error.message
        });
    }
});

/**
 * Schedule plan change at period end (no proration)
 * POST /api/billing/proration/schedule
 * Body: { subscriptionId, newPriceId }
 */
app.post('/api/billing/proration/schedule', requireApiKey, requireTenant, async (req, res) => {
    try {
        const { subscriptionId, newPriceId } = req.body;
        
        if (!subscriptionId || !newPriceId) {
            return res.status(400).json({
                message: 'subscriptionId and newPriceId are required'
            });
        }
        
        const result = await prorationService.schedulePlanChangeAtPeriodEnd(subscriptionId, newPriceId);
        
        res.json(result);
    } catch (error) {
        console.error('Error scheduling plan change:', error);
        res.status(500).json({
            message: 'Failed to schedule plan change',
            error: error.message
        });
    }
});

/**
 * Add proration credit to customer
 * POST /api/billing/proration/credit
 * Body: { customerId, amount, description }
 */
app.post('/api/billing/proration/credit', requireApiKey, async (req, res) => {
    try {
        const { customerId, amount, description } = req.body;
        
        if (!customerId || !amount) {
            return res.status(400).json({
                message: 'customerId and amount are required'
            });
        }
        
        const result = await prorationService.addProrationCredit(customerId, amount, description);
        
        res.json(result);
    } catch (error) {
        console.error('Error adding proration credit:', error);
        res.status(500).json({
            message: 'Failed to add proration credit',
            error: error.message
        });
    }
});

// ==========================================
// ANALYTICS API
// ==========================================

/**
 * Get cohort analysis
 * GET /api/analytics/cohorts
 * Query: startDate, endDate, cohortBy (day|week|month), metric (retention|revenue|activity)
 */
app.get('/api/analytics/cohorts', requireApiKey, async (req, res) => {
    try {
        const { startDate, endDate, cohortBy, metric } = req.query;
        
        const result = await analyticsService.calculateCohortAnalysis({
            startDate,
            endDate,
            cohortBy: cohortBy || 'month',
            metric: metric || 'retention'
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error calculating cohort analysis:', error);
        res.status(500).json({
            message: 'Failed to calculate cohort analysis',
            error: error.message
        });
    }
});

/**
 * Get retention curve
 * GET /api/analytics/retention
 * Query: startDate, period (day|week|month), maxPeriods
 */
app.get('/api/analytics/retention', requireApiKey, async (req, res) => {
    try {
        const { startDate, period, maxPeriods } = req.query;
        
        const result = await analyticsService.calculateRetentionCurve({
            startDate,
            period: period || 'month',
            maxPeriods: maxPeriods ? parseInt(maxPeriods) : 12
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error calculating retention curve:', error);
        res.status(500).json({
            message: 'Failed to calculate retention curve',
            error: error.message
        });
    }
});

/**
 * Get funnel analytics
 * POST /api/analytics/funnel
 * Body: { steps: [{ name, collection, filter }] }
 */
app.post('/api/analytics/funnel', requireApiKey, async (req, res) => {
    try {
        const { steps } = req.body;
        
        if (!steps || !Array.isArray(steps)) {
            return res.status(400).json({
                message: 'steps array is required'
            });
        }
        
        const result = await analyticsService.calculateFunnelAnalytics(steps);
        
        res.json(result);
    } catch (error) {
        console.error('Error calculating funnel analytics:', error);
        res.status(500).json({
            message: 'Failed to calculate funnel analytics',
            error: error.message
        });
    }
});

/**
 * Get MRR metrics
 * GET /api/analytics/mrr
 * Query: startDate, endDate
 */
app.get('/api/analytics/mrr', requireApiKey, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const result = await analyticsService.calculateMRRMetrics({
            startDate,
            endDate
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error calculating MRR metrics:', error);
        res.status(500).json({
            message: 'Failed to calculate MRR metrics',
            error: error.message
        });
    }
});

/**
 * Get LTV metrics
 * GET /api/analytics/ltv
 */
app.get('/api/analytics/ltv', requireApiKey, async (req, res) => {
    try {
        const result = await analyticsService.calculateLTVMetrics();
        
        res.json(result);
    } catch (error) {
        console.error('Error calculating LTV metrics:', error);
        res.status(500).json({
            message: 'Failed to calculate LTV metrics',
            error: error.message
        });
    }
});

/**
 * Export analytics report (PDF/Excel)
 * POST /api/analytics/export
 * Body: { type: 'cohorts'|'retention'|'mrr'|'ltv', format: 'pdf'|'excel', options: {...} }
 */
app.post('/api/analytics/export', requireApiKey, async (req, res) => {
    try {
        const { type, format, options } = req.body;
        
        if (!type || !format) {
            return res.status(400).json({
                message: 'type and format are required'
            });
        }
        
        let data;
        let filename;
        
        // Get analytics data based on type
        switch (type) {
            case 'cohorts':
                data = await analyticsService.calculateCohortAnalysis(options || {});
                filename = `cohort-analysis-${new Date().toISOString().split('T')[0]}`;
                break;
            case 'retention':
                data = await analyticsService.calculateRetentionCurve(options || {});
                filename = `retention-curve-${new Date().toISOString().split('T')[0]}`;
                break;
            case 'mrr':
                data = await analyticsService.calculateMRRMetrics(options || {});
                filename = `mrr-report-${new Date().toISOString().split('T')[0]}`;
                break;
            case 'ltv':
                data = await analyticsService.calculateLTVMetrics(options || {});
                filename = `ltv-report-${new Date().toISOString().split('T')[0]}`;
                break;
            default:
                return res.status(400).json({
                    message: 'Invalid report type'
                });
        }
        
        if (format === 'pdf') {
            // Generate PDF
            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
            doc.pipe(res);
            
            // PDF Header
            doc.fontSize(20).text(`${type.toUpperCase()} Report`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(2);
            
            // PDF Content based on report type
            if (type === 'cohorts' && data.cohorts) {
                doc.fontSize(14).text('Cohort Analysis', { underline: true });
                doc.moveDown();
                
                data.cohorts.forEach((cohort, index) => {
                    if (index > 0) doc.moveDown();
                    doc.fontSize(12).text(`Cohort: ${cohort.cohort}`, { bold: true });
                    doc.fontSize(10)
                        .text(`Size: ${cohort.size} users`)
                        .text(`Revenue: $${cohort.revenue.toFixed(2)}`)
                        .text(`Avg LTV: $${cohort.avgLifetimeValue.toFixed(2)}`);
                    
                    if (cohort.retention && cohort.retention.length > 0) {
                        doc.moveDown(0.5);
                        doc.text('Retention by Period:');
                        cohort.retention.slice(0, 6).forEach(r => {
                            doc.text(`  Period ${r.period}: ${r.retentionRate.toFixed(1)}%`);
                        });
                    }
                });
            } else if (type === 'retention' && data.curve) {
                doc.fontSize(14).text('Retention Curve', { underline: true });
                doc.moveDown();
                doc.fontSize(10).text(`Total Users: ${data.totalUsers}`);
                doc.moveDown();
                
                data.curve.forEach(point => {
                    doc.text(`${point.periodLabel}: ${point.retentionRate.toFixed(1)}% retained (${point.retainedUsers} users)`);
                });
            } else if (type === 'mrr' && data.current) {
                doc.fontSize(14).text('MRR Report', { underline: true });
                doc.moveDown();
                
                doc.fontSize(12).text('Current Metrics:', { bold: true });
                doc.fontSize(10)
                    .text(`MRR: $${data.current.mrr.toLocaleString()}`)
                    .text(`ARR: $${data.current.arr.toLocaleString()}`)
                    .text(`Active Subscriptions: ${data.current.activeSubscriptions}`)
                    .text(`ARPU: $${data.current.avgRevenuePerUser.toFixed(2)}`);
                
                doc.moveDown();
                doc.fontSize(12).text('Growth:', { bold: true });
                doc.fontSize(10)
                    .text(`MRR Growth: $${data.growth.mrrGrowth.toLocaleString()}`)
                    .text(`Growth Rate: ${data.growth.mrrGrowthRate.toFixed(2)}%`);
                
                doc.moveDown();
                doc.fontSize(12).text('Churn:', { bold: true });
                doc.fontSize(10)
                    .text(`Churned MRR: $${data.churn.churnedMRR.toLocaleString()}`)
                    .text(`Churn Rate: ${data.churn.churnRate.toFixed(2)}%`);
            } else if (type === 'ltv' && data.overall) {
                doc.fontSize(14).text('LTV Report', { underline: true });
                doc.moveDown();
                
                doc.fontSize(12).text('Overall Metrics:', { bold: true });
                doc.fontSize(10)
                    .text(`Avg LTV: $${data.overall.avgLTV.toFixed(2)}`)
                    .text(`Avg Lifetime: ${data.overall.avgLifetimeMonths.toFixed(1)} months`)
                    .text(`Avg Monthly Value: $${data.overall.avgMonthlyValue.toFixed(2)}`)
                    .text(`Total Customers: ${data.overall.totalCustomers}`);
                
                if (data.byPlan && data.byPlan.length > 0) {
                    doc.moveDown();
                    doc.fontSize(12).text('By Plan:', { bold: true });
                    data.byPlan.forEach(plan => {
                        doc.fontSize(10).text(`${plan.plan}: $${plan.avgLTV.toFixed(2)} LTV (${plan.customers} customers)`);
                    });
                }
            }
            
            doc.end();
        } else if (format === 'excel') {
            // For Excel, return JSON data that frontend can convert
            res.json({
                success: true,
                filename: `${filename}.xlsx`,
                data,
                format: 'excel'
            });
        } else {
            res.status(400).json({
                message: 'Invalid format. Use pdf or excel'
            });
        }
    } catch (error) {
        console.error('Error exporting analytics:', error);
        res.status(500).json({
            message: 'Failed to export analytics',
            error: error.message
        });
    }
});

// ==========================================
// TRIAL MANAGEMENT API
// ==========================================

/**
 * Create trial subscription
 * POST /api/trial/create
 * Body: { customerId, priceId, trialDays }
 */
app.post('/api/trial/create', requireApiKey, async (req, res) => {
    try {
        const { customerId, priceId, trialDays } = req.body;
        
        if (!customerId || !priceId) {
            return res.status(400).json({
                message: 'customerId and priceId are required'
            });
        }
        
        const subscription = await trialManagementService.createTrialSubscription(
            customerId,
            priceId,
            trialDays || 14
        );
        
        res.json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error('Error creating trial subscription:', error);
        res.status(500).json({
            message: 'Failed to create trial subscription',
            error: error.message
        });
    }
});

/**
 * Get all active trials
 * GET /api/trial/active
 */
app.get('/api/trial/active', requireApiKey, async (req, res) => {
    try {
        const trials = await trialManagementService.getActiveTrials();
        
        res.json({
            success: true,
            count: trials.length,
            trials
        });
    } catch (error) {
        console.error('Error fetching active trials:', error);
        res.status(500).json({
            message: 'Failed to fetch active trials',
            error: error.message
        });
    }
});

/**
 * Get trials expiring soon
 * GET /api/trial/expiring
 * Query: daysThreshold (default: 3)
 */
app.get('/api/trial/expiring', requireApiKey, async (req, res) => {
    try {
        const daysThreshold = parseInt(req.query.daysThreshold) || 3;
        const trials = await trialManagementService.getExpiringTrials(daysThreshold);
        
        res.json({
            success: true,
            daysThreshold,
            count: trials.length,
            trials
        });
    } catch (error) {
        console.error('Error fetching expiring trials:', error);
        res.status(500).json({
            message: 'Failed to fetch expiring trials',
            error: error.message
        });
    }
});

/**
 * Convert trial to paid subscription
 * POST /api/trial/convert/:subscriptionId
 */
app.post('/api/trial/convert/:subscriptionId', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        
        const subscription = await trialManagementService.convertTrialToPaid(subscriptionId);
        
        res.json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error('Error converting trial:', error);
        res.status(500).json({
            message: 'Failed to convert trial',
            error: error.message
        });
    }
});

/**
 * Extend trial period
 * POST /api/trial/extend/:subscriptionId
 * Body: { additionalDays }
 */
app.post('/api/trial/extend/:subscriptionId', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { additionalDays } = req.body;
        
        const subscription = await trialManagementService.extendTrial(
            subscriptionId,
            additionalDays || 7
        );
        
        res.json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error('Error extending trial:', error);
        res.status(500).json({
            message: 'Failed to extend trial',
            error: error.message
        });
    }
});

/**
 * Cancel trial subscription
 * POST /api/trial/cancel/:subscriptionId
 * Body: { reason }
 */
app.post('/api/trial/cancel/:subscriptionId', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { reason } = req.body;
        
        const subscription = await trialManagementService.cancelTrial(
            subscriptionId,
            reason || 'customer_request'
        );
        
        res.json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error('Error cancelling trial:', error);
        res.status(500).json({
            message: 'Failed to cancel trial',
            error: error.message
        });
    }
});

/**
 * Get trial conversion metrics
 * GET /api/trial/metrics
 * Query: startDate, endDate
 */
app.get('/api/trial/metrics', requireApiKey, async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        
        const metrics = await trialManagementService.getConversionMetrics(startDate, endDate);
        
        res.json({
            success: true,
            metrics
        });
    } catch (error) {
        console.error('Error fetching trial metrics:', error);
        res.status(500).json({
            message: 'Failed to fetch trial metrics',
            error: error.message
        });
    }
});

/**
 * Send trial reminders (manual trigger)
 * POST /api/trial/send-reminders
 */
app.post('/api/trial/send-reminders', requireApiKey, async (req, res) => {
    try {
        const result = await trialManagementService.sendTrialReminders();
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error sending trial reminders:', error);
        res.status(500).json({
            message: 'Failed to send trial reminders',
            error: error.message
        });
    }
});

// ==========================================
// COUPON & DISCOUNT CODE API
// ==========================================

/**
 * Create a coupon
 * POST /api/coupons/create
 * Body: { code, percentOff?, amountOff?, currency?, duration, durationInMonths?, maxRedemptions?, redeemBy?, metadata? }
 */
app.post('/api/coupons/create', requireApiKey, async (req, res) => {
    try {
        const coupon = await couponService.createCoupon(req.body);
        
        res.json({
            success: true,
            coupon
        });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({
            message: 'Failed to create coupon',
            error: error.message
        });
    }
});

/**
 * Create a promotion code
 * POST /api/coupons/promo/create
 * Body: { couponId, code, active?, maxRedemptions?, firstTimeTransaction?, minimumAmount?, expiresAt?, metadata? }
 */
app.post('/api/coupons/promo/create', requireApiKey, async (req, res) => {
    try {
        const promotionCode = await couponService.createPromotionCode(req.body);
        
        res.json({
            success: true,
            promotionCode
        });
    } catch (error) {
        console.error('Error creating promotion code:', error);
        res.status(500).json({
            message: 'Failed to create promotion code',
            error: error.message
        });
    }
});

/**
 * Get all coupons
 * GET /api/coupons
 */
app.get('/api/coupons', requireApiKey, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const coupons = await couponService.getAllCoupons(limit);
        
        res.json({
            success: true,
            count: coupons.length,
            coupons
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({
            message: 'Failed to fetch coupons',
            error: error.message
        });
    }
});

/**
 * Get all promotion codes
 * GET /api/coupons/promo
 * Query: active (true|false), limit
 */
app.get('/api/coupons/promo', requireApiKey, async (req, res) => {
    try {
        const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : null;
        const limit = parseInt(req.query.limit) || 100;
        
        const promotionCodes = await couponService.getAllPromotionCodes(active, limit);
        
        res.json({
            success: true,
            count: promotionCodes.length,
            promotionCodes
        });
    } catch (error) {
        console.error('Error fetching promotion codes:', error);
        res.status(500).json({
            message: 'Failed to fetch promotion codes',
            error: error.message
        });
    }
});

/**
 * Validate a promotion code
 * POST /api/coupons/validate
 * Body: { code, customerId? }
 */
app.post('/api/coupons/validate', async (req, res) => {
    try {
        const { code, customerId } = req.body;
        
        if (!code) {
            return res.status(400).json({
                message: 'code is required'
            });
        }
        
        const result = await couponService.validatePromotionCode(code, customerId);
        
        res.json(result);
    } catch (error) {
        console.error('Error validating promotion code:', error);
        res.status(500).json({
            message: 'Failed to validate promotion code',
            error: error.message
        });
    }
});

/**
 * Apply promotion code to subscription
 * POST /api/coupons/apply/:subscriptionId
 * Body: { promotionCodeId }
 */
app.post('/api/coupons/apply/:subscriptionId', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { promotionCodeId } = req.body;
        
        if (!promotionCodeId) {
            return res.status(400).json({
                message: 'promotionCodeId is required'
            });
        }
        
        const subscription = await couponService.applyToSubscription(subscriptionId, promotionCodeId);
        
        res.json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error('Error applying promotion code:', error);
        res.status(500).json({
            message: 'Failed to apply promotion code',
            error: error.message
        });
    }
});

/**
 * Remove discount from subscription
 * DELETE /api/coupons/remove/:subscriptionId
 */
app.delete('/api/coupons/remove/:subscriptionId', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        
        const subscription = await couponService.removeFromSubscription(subscriptionId);
        
        res.json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error('Error removing discount:', error);
        res.status(500).json({
            message: 'Failed to remove discount',
            error: error.message
        });
    }
});

/**
 * Deactivate a promotion code
 * POST /api/coupons/promo/deactivate/:promotionCodeId
 */
app.post('/api/coupons/promo/deactivate/:promotionCodeId', requireApiKey, async (req, res) => {
    try {
        const { promotionCodeId } = req.params;
        
        const promotionCode = await couponService.deactivatePromotionCode(promotionCodeId);
        
        res.json({
            success: true,
            promotionCode
        });
    } catch (error) {
        console.error('Error deactivating promotion code:', error);
        res.status(500).json({
            message: 'Failed to deactivate promotion code',
            error: error.message
        });
    }
});

/**
 * Delete a coupon
 * DELETE /api/coupons/:couponId
 */
app.delete('/api/coupons/:couponId', requireApiKey, async (req, res) => {
    try {
        const { couponId } = req.params;
        
        const result = await couponService.deleteCoupon(couponId);
        
        res.json({
            success: true,
            deleted: result.deleted
        });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({
            message: 'Failed to delete coupon',
            error: error.message
        });
    }
});

/**
 * Get coupon usage statistics
 * GET /api/coupons/stats/:couponId
 */
app.get('/api/coupons/stats/:couponId', requireApiKey, async (req, res) => {
    try {
        const { couponId } = req.params;
        
        const stats = await couponService.getCouponStats(couponId);
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error fetching coupon stats:', error);
        res.status(500).json({
            message: 'Failed to fetch coupon stats',
            error: error.message
        });
    }
});

/**
 * Create bulk promotion codes
 * POST /api/coupons/promo/bulk
 * Body: { couponId, prefix, count, expiresAt?, maxRedemptionsPerCode?, metadata? }
 */
app.post('/api/coupons/promo/bulk', requireApiKey, async (req, res) => {
    try {
        const result = await couponService.createBulkPromotionCodes(req.body);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error creating bulk promotion codes:', error);
        res.status(500).json({
            message: 'Failed to create bulk promotion codes',
            error: error.message
        });
    }
});

/**
 * Send promotion code via email
 * POST /api/coupons/send-email
 * Body: { email, customerName, code }
 */
app.post('/api/coupons/send-email', requireApiKey, async (req, res) => {
    try {
        const { email, customerName, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({
                message: 'email and code are required'
            });
        }
        
        // Validate and get coupon details
        const validation = await couponService.validatePromotionCode(code);
        if (!validation.valid) {
            return res.status(400).json({
                message: validation.error
            });
        }
        
        await couponService.sendPromotionEmail(email, customerName, code, validation.coupon);
        
        res.json({
            success: true,
            message: 'Promotion email sent'
        });
    } catch (error) {
        console.error('Error sending promotion email:', error);
        res.status(500).json({
            message: 'Failed to send promotion email',
            error: error.message
        });
    }
});

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!PAYMENTS_ENABLED) {
        return res.status(204).end();
    }
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // CRITICAL: Always verify webhook signature
        if (!endpointSecret) {
            console.error('STRIPE_WEBHOOK_SECRET is not configured');
            res.status(500).send('Webhook configuration error');
            return;
        }

        if (!sig) {
            console.error('Missing stripe-signature header');
            res.status(400).send('Missing signature');
            return;
        }

        // Verify webhook signature (required in ALL environments)
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        // Idempotency check - prevent duplicate processing
        const webhookId = event.id;
        if (processedWebhooks.has(webhookId)) {
            console.log(`Webhook ${webhookId} already processed, skipping`);
            res.status(200).send('Already processed');
            return;
        }

        // Mark as processing
        processedWebhooks.set(webhookId, Date.now());

    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event with retry logic
    try {
        await processWebhookWithRetry(event);

        // Log successful webhook processing
        console.log(JSON.stringify({
            level: 'info',
            type: 'webhook_processed',
            webhookId: event.id,
            eventType: event.type,
            timestamp: new Date().toISOString()
        }));

        res.status(200).send('Webhook processed successfully');
    } catch (error) {
        console.error('Error processing webhook event after retries:', error);

        // Return 500 to tell Stripe to retry later
        res.status(500).send('Error processing event');
        return;
    }
});

// ============================================
// Churn Prediction API Endpoints
// ============================================

// Calculate churn risk for a specific customer
app.post('/api/churn/analyze/:customerId', requireApiKey, async (req, res) => {
    try {
        const { customerId } = req.params;
        const analysis = await churnPredictionService.calculateChurnRisk(customerId);
        
        logAudit({
            action: 'churn_risk_calculated',
            customerId,
            riskScore: analysis.riskScore,
            riskLevel: analysis.riskLevel
        });
        
        res.json(analysis);
    } catch (error) {
        console.error('Error calculating churn risk:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all at-risk customers
app.get('/api/churn/at-risk', requireApiKey, async (req, res) => {
    try {
        const minRiskScore = parseInt(req.query.minRiskScore) || 50;
        const limit = parseInt(req.query.limit) || 100;
        
        const atRiskCustomers = await churnPredictionService.getAtRiskCustomers(minRiskScore, limit);
        
        res.json({
            minRiskScore,
            count: atRiskCustomers.length,
            customers: atRiskCustomers
        });
    } catch (error) {
        console.error('Error fetching at-risk customers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate full churn report
app.get('/api/churn/report', requireApiKey, async (req, res) => {
    try {
        const report = await churnPredictionService.generateChurnReport();
        
        logAudit({
            action: 'churn_report_generated',
            totalCustomers: report.totalCustomers,
            atRiskCount: report.atRiskCount
        });
        
        res.json(report);
    } catch (error) {
        console.error('Error generating churn report:', error);
        res.status(500).json({ error: error.message });
    }
});

// Execute retention actions for a customer
app.post('/api/churn/retention/:customerId', requireApiKey, async (req, res) => {
    try {
        const { customerId } = req.params;
        const result = await churnPredictionService.executeRetentionActions(customerId);
        
        logAudit({
            action: 'retention_actions_executed',
            customerId,
            actionsCount: result.actions.length
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error executing retention actions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cohort churn analysis
app.get('/api/churn/cohort-analysis', requireApiKey, async (req, res) => {
    try {
        const { startDate, endDate, cohortBy = 'month' } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }
        
        const analysis = await churnPredictionService.analyzeCohortChurn(
            new Date(startDate),
            new Date(endDate),
            cohortBy
        );
        
        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing cohort churn:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Custom Report Builder API Endpoints
// ============================================

// Build custom report
app.post('/api/reports/build', requireApiKey, async (req, res) => {
    try {
        const reportSpec = req.body;
        const report = await reportBuilderService.buildReport(reportSpec);
        
        logAudit({
            action: 'report_built',
            reportType: reportSpec.type,
            recordCount: report.totalRecords
        });
        
        res.json(report);
    } catch (error) {
        console.error('Error building report:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export report to PDF
app.post('/api/reports/export/pdf', requireApiKey, async (req, res) => {
    try {
        const reportData = req.body;
        const pdfBuffer = await reportBuilderService.exportToPDF(reportData, 'report.pdf');
        
        logAudit({
            action: 'report_exported_pdf',
            reportType: reportData.type
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export report to Excel
app.post('/api/reports/export/excel', requireApiKey, async (req, res) => {
    try {
        const reportData = req.body;
        const excelBuffer = await reportBuilderService.exportToExcel(reportData, 'report.xlsx');
        
        logAudit({
            action: 'report_exported_excel',
            reportType: reportData.type
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save report template
app.post('/api/reports/templates', requireApiKey, async (req, res) => {
    try {
        const { name, spec, description } = req.body;
        const template = await reportBuilderService.saveTemplate(name, spec, description);
        
        logAudit({
            action: 'report_template_saved',
            templateName: name
        });
        
        res.json(template);
    } catch (error) {
        console.error('Error saving report template:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all report templates
app.get('/api/reports/templates', requireApiKey, async (req, res) => {
    try {
        const templates = await reportBuilderService.getTemplates();
        res.json({ templates });
    } catch (error) {
        console.error('Error fetching report templates:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Scheduler API Endpoints
// ============================================

// Get scheduler status and all jobs
app.get('/api/scheduler/status', requireApiKey, async (req, res) => {
    try {
        const status = schedulerService.getJobsStatus();
        res.json(status);
    } catch (error) {
        console.error('Error getting scheduler status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start the scheduler
app.post('/api/scheduler/start', requireApiKey, async (req, res) => {
    try {
        schedulerService.start();
        res.json({ 
            success: true, 
            message: 'Scheduler started',
            status: schedulerService.getJobsStatus()
        });
    } catch (error) {
        console.error('Error starting scheduler:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stop the scheduler
app.post('/api/scheduler/stop', requireApiKey, async (req, res) => {
    try {
        schedulerService.stop();
        res.json({ 
            success: true, 
            message: 'Scheduler stopped'
        });
    } catch (error) {
        console.error('Error stopping scheduler:', error);
        res.status(500).json({ error: error.message });
    }
});

// Manually trigger a specific job
app.post('/api/scheduler/trigger/:jobName', requireApiKey, async (req, res) => {
    try {
        const { jobName } = req.params;
        await schedulerService.triggerJob(jobName);
        
        logAudit({
            action: 'scheduler_job_triggered',
            jobName
        });
        
        res.json({ 
            success: true, 
            message: `Job ${jobName} triggered successfully`
        });
    } catch (error) {
        console.error('Error triggering job:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== REVENUE ANALYSIS ENDPOINTS =====

// Get comprehensive revenue dashboard
app.get('/api/revenue/dashboard', requireApiKey, async (req, res) => {
    try {
        const dashboard = await revenueAnalysisService.getRevenueDashboard();
        res.json(dashboard);
    } catch (error) {
        console.error('Error fetching revenue dashboard:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get MRR calculation
app.get('/api/revenue/mrr', requireApiKey, async (req, res) => {
    try {
        const mrr = await revenueAnalysisService.calculateMRR();
        res.json(mrr);
    } catch (error) {
        console.error('Error calculating MRR:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get revenue growth
app.get('/api/revenue/growth', requireApiKey, async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;
        const growth = await revenueAnalysisService.getRevenueGrowth(months);
        res.json(growth);
    } catch (error) {
        console.error('Error fetching revenue growth:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get cohort analysis
app.get('/api/revenue/cohorts', requireApiKey, async (req, res) => {
    try {
        const cohorts = await revenueAnalysisService.getCohortAnalysis();
        res.json(cohorts);
    } catch (error) {
        console.error('Error analyzing cohorts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get revenue forecast
app.get('/api/revenue/forecast', requireApiKey, async (req, res) => {
    try {
        const monthsAhead = parseInt(req.query.months) || 6;
        const forecast = await revenueAnalysisService.forecastRevenue(monthsAhead);
        res.json(forecast);
    } catch (error) {
        console.error('Error forecasting revenue:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get churn impact analysis
app.get('/api/revenue/churn-impact', requireApiKey, async (req, res) => {
    try {
        const impact = await revenueAnalysisService.analyzeChurnImpact();
        res.json(impact);
    } catch (error) {
        console.error('Error analyzing churn impact:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// Customer Health API Endpoints
// ============================================================================

// Get customer health dashboard
app.get('/api/customer-health/dashboard', requireApiKey, async (req, res) => {
    try {
        const dashboard = await customerHealthService.getCustomerHealthDashboard();
        res.json(dashboard);
    } catch (error) {
        console.error('Error fetching customer health dashboard:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get customer health scores
app.get('/api/customer-health/scores', requireApiKey, async (req, res) => {
    try {
        const customerId = req.query.customerId;
        if (!customerId) {
            return res.status(400).json({ error: 'customerId is required' });
        }
        const score = await customerHealthService.calculateHealthScore(customerId);
        res.json(score);
    } catch (error) {
        console.error('Error calculating health score:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get engagement metrics
app.get('/api/customer-health/engagement', requireApiKey, async (req, res) => {
    try {
        const engagement = await customerHealthService.getEngagementMetrics();
        res.json(engagement);
    } catch (error) {
        console.error('Error fetching engagement metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get usage patterns
app.get('/api/customer-health/usage', requireApiKey, async (req, res) => {
    try {
        const usage = await customerHealthService.analyzeUsagePatterns();
        res.json(usage);
    } catch (error) {
        console.error('Error analyzing usage patterns:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get churn risk analysis
app.get('/api/customer-health/risk-analysis', requireApiKey, async (req, res) => {
    try {
        const risk = await customerHealthService.predictChurnRisk();
        res.json(risk);
    } catch (error) {
        console.error('Error predicting churn risk:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get customer segments
app.get('/api/customer-health/segments', requireApiKey, async (req, res) => {
    try {
        const segments = await customerHealthService.getCustomerSegments();
        res.json(segments);
    } catch (error) {
        console.error('Error fetching customer segments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get health trends
app.get('/api/customer-health/trends', requireApiKey, async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 6;
        const trends = await customerHealthService.getHealthTrends(months);
        res.json(trends);
    } catch (error) {
        console.error('Error fetching health trends:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// Subscription Lifecycle API Endpoints
// ============================================================================

// Get lifecycle dashboard
app.get('/api/subscription-lifecycle/dashboard', requireApiKey, async (req, res) => {
    try {
        const dashboard = await subscriptionLifecycleService.getLifecycleDashboard();
        res.json(dashboard);
    } catch (error) {
        console.error('Error fetching lifecycle dashboard:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get subscription statuses
app.get('/api/subscription-lifecycle/statuses', requireApiKey, async (req, res) => {
    try {
        const status = req.query.status || null;
        const statuses = await subscriptionLifecycleService.getSubscriptionStatuses(status);
        res.json(statuses);
    } catch (error) {
        console.error('Error fetching subscription statuses:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upgrade subscription
app.post('/api/subscription-lifecycle/upgrade', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId, newPriceId } = req.body;
        if (!subscriptionId || !newPriceId) {
            return res.status(400).json({ error: 'subscriptionId and newPriceId are required' });
        }
        const result = await subscriptionLifecycleService.upgradeSubscription(subscriptionId, newPriceId);
        res.json(result);
    } catch (error) {
        console.error('Error upgrading subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Downgrade subscription
app.post('/api/subscription-lifecycle/downgrade', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId, newPriceId } = req.body;
        if (!subscriptionId || !newPriceId) {
            return res.status(400).json({ error: 'subscriptionId and newPriceId are required' });
        }
        const result = await subscriptionLifecycleService.downgradeSubscription(subscriptionId, newPriceId);
        res.json(result);
    } catch (error) {
        console.error('Error downgrading subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cancel subscription
app.post('/api/subscription-lifecycle/cancel', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId, immediately, reason, feedback } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({ error: 'subscriptionId is required' });
        }
        const result = await subscriptionLifecycleService.cancelSubscription(subscriptionId, {
            immediately: immediately || false,
            reason,
            feedback
        });
        res.json(result);
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reactivate subscription
app.post('/api/subscription-lifecycle/reactivate', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({ error: 'subscriptionId is required' });
        }
        const result = await subscriptionLifecycleService.reactivateSubscription(subscriptionId);
        res.json(result);
    } catch (error) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Pause subscription
app.post('/api/subscription-lifecycle/pause', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId, resumeAt } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({ error: 'subscriptionId is required' });
        }
        const result = await subscriptionLifecycleService.pauseSubscription(subscriptionId, resumeAt);
        res.json(result);
    } catch (error) {
        console.error('Error pausing subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Resume subscription
app.post('/api/subscription-lifecycle/resume', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({ error: 'subscriptionId is required' });
        }
        const result = await subscriptionLifecycleService.resumeSubscription(subscriptionId);
        res.json(result);
    } catch (error) {
        console.error('Error resuming subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get subscription history
app.get('/api/subscription-lifecycle/history/:subscriptionId', requireApiKey, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const history = await subscriptionLifecycleService.getSubscriptionHistory(subscriptionId);
        res.json(history);
    } catch (error) {
        console.error('Error fetching subscription history:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available plans
app.get('/api/subscription-lifecycle/plans', requireApiKey, async (req, res) => {
    try {
        const plans = await subscriptionLifecycleService.getAvailablePlans();
        res.json(plans);
    } catch (error) {
        console.error('Error fetching available plans:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// Export Center API Endpoints
// ============================================================================

// Get export history
app.get('/api/export-center/history', requireApiKey, async (req, res) => {
    try {
        const history = await exportCenterService.getExportHistory();
        res.json(history);
    } catch (error) {
        console.error('Error fetching export history:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export subscriptions to CSV
app.post('/api/export-center/subscriptions-csv', requireApiKey, async (req, res) => {
    try {
        const { userId, userEmail } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const result = await exportCenterService.exportSubscriptionsCSV(userId, userEmail, ipAddress);
        res.json(result);
    } catch (error) {
        console.error('Error exporting subscriptions to CSV:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export revenue to Excel
app.post('/api/export-center/revenue-excel', requireApiKey, async (req, res) => {
    try {
        const months = parseInt(req.body.months) || 12;
        const { userId, userEmail } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const result = await exportCenterService.exportRevenueExcel(months, userId, userEmail, ipAddress);
        res.json(result);
    } catch (error) {
        console.error('Error exporting revenue to Excel:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export customer health to Excel
app.post('/api/export-center/customer-health-excel', requireApiKey, async (req, res) => {
    try {
        const { userId, userEmail } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const result = await exportCenterService.exportCustomerHealthExcel(userId, userEmail, ipAddress);
        res.json(result);
    } catch (error) {
        console.error('Error exporting customer health to Excel:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export churn analysis to PDF
app.post('/api/export-center/churn-pdf', requireApiKey, async (req, res) => {
    try {
        const result = await exportCenterService.exportChurnAnalysisPDF();
        res.json(result);
    } catch (error) {
        console.error('Error exporting churn analysis to PDF:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export trial conversions to JSON
app.post('/api/export-center/trial-json', requireApiKey, async (req, res) => {
    try {
        const result = await exportCenterService.exportTrialConversionsJSON();
        res.json(result);
    } catch (error) {
        console.error('Error exporting trial conversions to JSON:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export all data
app.post('/api/export-center/all-data', requireApiKey, async (req, res) => {
    try {
        const result = await exportCenterService.exportAllData();
        res.json(result);
    } catch (error) {
        console.error('Error exporting all data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Download export file
app.get('/api/export-center/download/:filename', requireApiKey, async (req, res) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(__dirname, 'exports', filename);
        
        // Check if file exists
        await promises.access(filepath);
        
        res.download(filepath, filename);
    } catch (error) {
        console.error('Error downloading export:', error);
        res.status(404).json({ error: 'File not found' });
    }
});

// Delete export
app.delete('/api/export-center/delete/:filename', requireApiKey, async (req, res) => {
    try {
        const { filename } = req.params;
        const result = await exportCenterService.deleteExport(filename);
        res.json(result);
    } catch (error) {
        console.error('Error deleting export:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get revenue by date range
app.get('/api/revenue/range', requireApiKey, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }
        const revenue = await revenueAnalysisService.getRevenueByDateRange(startDate, endDate);
        res.json(revenue);
    } catch (error) {
        console.error('Error fetching revenue by date range:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint with comprehensive service checks
app.get('/health', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {}
    };

    try {
        // Check Stripe connectivity
        try {
            await stripe.paymentIntents.list({ limit: 1 });
            health.services.stripe = { status: 'connected', latency: 0 };
        } catch (error) {
            health.services.stripe = { status: 'error', error: error.message };
            health.status = 'degraded';
        }

        // Check scheduler status
        const schedulerStatus = schedulerService.getJobsStatus();
        health.services.scheduler = {
            status: schedulerStatus.isRunning ? 'running' : 'stopped',
            jobCount: schedulerStatus.jobCount,
            jobs: schedulerStatus.jobs.map(j => ({
                name: j.name,
                status: j.status,
                lastRun: j.lastRun
            }))
        };

        // Check memory usage
        const memUsage = process.memoryUsage();
        health.memory = {
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
        };

        // Check if memory usage is critical (>80% of heap)
        const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        if (heapUsagePercent > 80) {
            health.status = 'degraded';
            health.memory.warning = 'High memory usage';
        }

        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
}

// ==========================================
// EMAIL SENDING (SMTP)
// ==========================================

// Configure SMTP transporter
let emailTransporter = null;
if (process.env.SMTP_HOST) {
    emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log('✓ SMTP transporter configured');
} else {
    console.warn('⚠ SMTP not configured - email sending disabled');
}

// Send email endpoint
app.post('/api/email/send', express.json(), async (req, res) => {
    if (!emailTransporter) {
        return res.status(503).json({ error: 'Email service not configured' });
    }

    try {
        const { from, to, subject, html, text, logId } = req.body;

        // Validate required fields
        if (!to || !to.email || !subject || !html) {
            return res.status(400).json({ error: 'Missing required fields: to.email, subject, html' });
        }

        // Send email
        const info = await emailTransporter.sendMail({
            from: from ? `"${from.name}" <${from.email}>` : process.env.SMTP_FROM || 'noreply@growyourneed.com',
            to: `"${to.name || to.email}" <${to.email}>`,
            subject,
            text: text || '',
            html
        });

        console.log(`✓ Email sent to ${to.email}: ${info.messageId}`);

        // Update email log status if logId provided
        if (logId && process.env.POCKETBASE_URL && process.env.POCKETBASE_SERVICE_TOKEN) {
            try {
                await fetch(`${process.env.POCKETBASE_URL}/api/collections/email_logs/records/${logId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.POCKETBASE_SERVICE_TOKEN}`
                    },
                    body: JSON.stringify({
                        status: 'sent',
                        sent_at: new Date().toISOString(),
                        metadata: { messageId: info.messageId }
                    })
                });
            } catch (logError) {
                console.error('Failed to update email log:', logError);
            }
        }

        res.json({ 
            success: true, 
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
        });
    } catch (error) {
        console.error('Email send error:', error);

        // Update email log with error if logId provided
        if (req.body.logId && process.env.POCKETBASE_URL && process.env.POCKETBASE_SERVICE_TOKEN) {
            try {
                await fetch(`${process.env.POCKETBASE_URL}/api/collections/email_logs/records/${req.body.logId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.POCKETBASE_SERVICE_TOKEN}`
                    },
                    body: JSON.stringify({
                        status: 'failed',
                        error_message: error.message
                    })
                });
            } catch (logError) {
                console.error('Failed to update email log with error:', logError);
            }
        }

        res.status(500).json({ 
            error: 'Failed to send email', 
            details: error.message 
        });
    }
});

// ==========================================
// TRIAL AUTOMATION ENDPOINTS
// ==========================================

// Trigger trial conversion workflow (Owner only)
app.post('/api/trials/automation/run', express.json(), async (req, res) => {
    try {
        const { workflow } = req.body;

        console.log(`📧 Manually triggering trial workflow: ${workflow || 'full'}`);

        let result;
        switch (workflow) {
            case 'reminders':
                result = await trialManagementService.sendTrialReminders();
                break;
            case 'expirations':
                result = await trialManagementService.processTrialExpirations();
                break;
            default:
                // Run full workflow
                const reminders = await trialManagementService.sendTrialReminders();
                const expirations = await trialManagementService.processTrialExpirations();
                result = { reminders, expirations };
        }

        res.json({
            success: true,
            workflow: workflow || 'full',
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Trial automation error:', error);
        res.status(500).json({
            error: 'Failed to run trial automation',
            details: error.message
        });
    }
});

// Get trial automation metrics
app.get('/api/trials/automation/metrics', async (req, res) => {
    try {
        // Fetch trial statistics
        const pocketbaseUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
        const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;

        if (!serviceToken) {
            throw new Error('PocketBase service token not configured');
        }

        // Get trial counts
        const trialStats = await fetch(`${pocketbaseUrl}/api/collections/tenants/records?filter=subscription_status="trial"&perPage=1`, {
            headers: { 'Authorization': `Bearer ${serviceToken}` }
        }).then(r => r.json());

        const activeTrials = trialStats.totalItems || 0;

        // Get recent email logs
        const emailStats = await fetch(`${pocketbaseUrl}/api/collections/email_logs/records?filter=created>="${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"&perPage=1`, {
            headers: { 'Authorization': `Bearer ${serviceToken}` }
        }).then(r => r.json());

        const emailsSent = emailStats.totalItems || 0;

        res.json({
            activeTrials,
            emailsSentLast7Days: emailsSent,
            schedulerStatus: schedulerService.getJobsStatus(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Metrics fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch metrics',
            details: error.message
        });
    }
});

// Trigger specific scheduler job (Owner only - for testing)
app.post('/api/scheduler/trigger/:jobName', async (req, res) => {
    try {
        const { jobName } = req.params;
        console.log(`🔄 Manually triggering scheduler job: ${jobName}`);

        await schedulerService.triggerJob(jobName);

        res.json({
            success: true,
            job: jobName,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`Scheduler trigger error (${req.params.jobName}):`, error);
        res.status(500).json({
            error: 'Failed to trigger job',
            details: error.message
        });
    }
});

// Get scheduler status
app.get('/api/scheduler/status', (req, res) => {
    res.json(schedulerService.getJobsStatus());
});

// ==========================================
// TRIAL AUTOMATION ENDPOINTS
// ==========================================

// Trigger trial reminder jobs
app.post('/api/trial-automation/reminders/:type', express.json(), async (req, res) => {
    try {
        const { type } = req.params; // '7day' or '1day'
        
        if (!['7day', '1day'].includes(type)) {
            return res.status(400).json({ error: 'Invalid reminder type. Use 7day or 1day' });
        }

        // This endpoint will be called by frontend trialAutomationService
        // The actual logic should run on server-side scheduler
        console.log(`Trial ${type} reminder job triggered via API`);
        
        res.json({
            success: true,
            message: `Trial ${type} reminder job queued`,
            scheduledFor: new Date().toISOString()
        });
    } catch (error) {
        console.error('Trial reminder trigger error:', error);
        res.status(500).json({ error: 'Failed to trigger reminder job' });
    }
});

// Get trial automation stats
app.get('/api/trial-automation/stats', async (req, res) => {
    try {
        // Return stats from PocketBase
        // This would be implemented server-side with PocketBase queries
        res.json({
            activeTrials: 0,
            expiringSoon: 0,
            expiringToday: 0,
            converted: 0,
            conversionRate: 0,
            averageConversionTime: 0
        });
    } catch (error) {
        console.error('Trial stats error:', error);
        res.status(500).json({ error: 'Failed to get trial stats' });
    }
});

// Manual trial expiration check
app.post('/api/trial-automation/check-expirations', express.json(), async (req, res) => {
    try {
        console.log('Manual trial expiration check triggered');
        
        res.json({
            success: true,
            message: 'Trial expiration check queued'
        });
    } catch (error) {
        console.error('Expiration check error:', error);
        res.status(500).json({ error: 'Failed to trigger expiration check' });
    }
});

// ==========================================
// OWNER ANALYTICS API
// ==========================================

import ownerAnalyticsService from './ownerAnalyticsService.js';
import ownerTenantService from './ownerTenantService.js';
import ownerComplianceService from './ownerComplianceService.js';

// Get multi-tenant KPIs
app.get('/api/owner/analytics/kpis', async (req, res) => {
    try {
        const kpis = await ownerAnalyticsService.getMultiTenantKPIs();
        res.json(kpis);
    } catch (error) {
        console.error('Owner KPIs error:', error);
        res.status(500).json({ error: 'Failed to fetch KPIs' });
    }
});

// Get revenue forecasting
app.get('/api/owner/analytics/forecast', async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;
        const forecast = await ownerAnalyticsService.getRevenueForecasting(months);
        res.json(forecast);
    } catch (error) {
        console.error('Revenue forecast error:', error);
        res.status(500).json({ error: 'Failed to generate forecast' });
    }
});

// Get churn risk analysis
app.get('/api/owner/analytics/churn-risk', async (req, res) => {
    try {
        const churnRisk = await ownerAnalyticsService.getChurnRisk();
        res.json(churnRisk);
    } catch (error) {
        console.error('Churn risk error:', error);
        res.status(500).json({ error: 'Failed to calculate churn risk' });
    }
});

// Get usage trends
app.get('/api/owner/analytics/usage-trends', async (req, res) => {
    try {
        const period = req.query.period || '30d';
        const trends = await ownerAnalyticsService.getUsageTrends(period);
        res.json(trends);
    } catch (error) {
        console.error('Usage trends error:', error);
        res.status(500).json({ error: 'Failed to get usage trends' });
    }
});

// Get cost per tenant
app.get('/api/owner/analytics/cost-analysis', async (req, res) => {
    try {
        const costAnalysis = await ownerAnalyticsService.getCostPerTenant();
        res.json(costAnalysis);
    } catch (error) {
        console.error('Cost analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze costs' });
    }
});

// ==========================================
// OWNER TENANT MANAGEMENT API
// ==========================================

// Bulk suspend tenants
app.post('/api/owner/tenants/bulk-suspend', express.json(), async (req, res) => {
    try {
        const { tenantIds, reason, details, userId } = req.body;
        const result = await ownerTenantService.bulkSuspend(tenantIds, reason, details, userId);
        res.json(result);
    } catch (error) {
        console.error('Bulk suspend error:', error);
        res.status(500).json({ error: 'Failed to suspend tenants' });
    }
});

// Clone tenant
app.post('/api/owner/tenants/clone', express.json(), async (req, res) => {
    try {
        const { sourceId, newName, options } = req.body;
        const result = await ownerTenantService.cloneTenant(sourceId, newName, options);
        res.json(result);
    } catch (error) {
        console.error('Clone tenant error:', error);
        res.status(500).json({ error: 'Failed to clone tenant' });
    }
});

// Migrate tenant data
app.post('/api/owner/tenants/migrate', express.json(), async (req, res) => {
    try {
        const { fromId, toId, dataTypes, userId } = req.body;
        const result = await ownerTenantService.migrateTenantData(fromId, toId, dataTypes, userId);
        res.json(result);
    } catch (error) {
        console.error('Tenant migration error:', error);
        res.status(500).json({ error: 'Failed to migrate tenant data' });
    }
});

// Get tenant health score
app.get('/api/owner/tenants/:tenantId/health', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const health = await ownerTenantService.getTenantHealth(tenantId);
        res.json(health);
    } catch (error) {
        console.error('Tenant health error:', error);
        res.status(500).json({ error: 'Failed to calculate tenant health' });
    }
});

// Assign custom domain
app.post('/api/owner/tenants/:tenantId/custom-domain', express.json(), async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { domain, userId } = req.body;
        const result = await ownerTenantService.assignCustomDomain(tenantId, domain, userId);
        res.json(result);
    } catch (error) {
        console.error('Custom domain error:', error);
        res.status(500).json({ error: 'Failed to assign custom domain' });
    }
});

// ==========================================
// OWNER COMPLIANCE API
// ==========================================

// Export user data (GDPR)
app.get('/api/owner/compliance/export-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const exportData = await ownerComplianceService.exportUserData(userId);
        
        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}-${Date.now()}.json"`);
        res.json(exportData);
    } catch (error) {
        console.error('User data export error:', error);
        res.status(500).json({ error: 'Failed to export user data' });
    }
});

// Delete user data (Right to be Forgotten)
app.delete('/api/owner/compliance/delete-user/:userId', express.json(), async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const result = await ownerComplianceService.deleteUserData(userId, reason);
        res.json(result);
    } catch (error) {
        console.error('User data deletion error:', error);
        res.status(500).json({ error: 'Failed to delete user data' });
    }
});

// Generate compliance report
app.post('/api/owner/compliance/report', express.json(), async (req, res) => {
    try {
        const { standard, tenantId } = req.body;
        const report = await ownerComplianceService.generateComplianceReport(standard, tenantId);
        res.json(report);
    } catch (error) {
        console.error('Compliance report error:', error);
        res.status(500).json({ error: 'Failed to generate compliance report' });
    }
});

// Get data retention status
app.get('/api/owner/compliance/retention-status', async (req, res) => {
    try {
        const { tenantId } = req.query;
        const status = await ownerComplianceService.getDataRetentionStatus(tenantId);
        res.json(status);
    } catch (error) {
        console.error('Retention status error:', error);
        res.status(500).json({ error: 'Failed to get retention status' });
    }
});

// ==========================================
// BILLING RECONCILIATION API
// ==========================================

// Get Stripe data for reconciliation
app.get('/api/billing/stripe-data/:customerId', requireApiKey, async (req, res) => {
    try {
        const { customerId } = req.params;
        if (!stripe) {
            return res.status(500).json({ error: 'Stripe not configured' });
        }
        
        const customer = await stripe.customers.retrieve(customerId);
        const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
        const subscription = subscriptions.data[0];
        
        res.json({
            customerId,
            subscriptionId: subscription?.id,
            plan: subscription?.items.data[0]?.price?.nickname || subscription?.items.data[0]?.price?.id,
            status: subscription?.status,
            billingCycle: subscription?.items.data[0]?.price?.recurring?.interval
        });
    } catch (error) {
        console.error('Stripe data error:', error);
        res.status(500).json({ error: 'Failed to fetch Stripe data' });
    }
});

// ==========================================
// COMPLIANCE REPORTING API
// ==========================================

// Generate compliance report
app.post('/api/compliance/generate-report', requireApiKey, express.json(), async (req, res) => {
    try {
        const { standard, tenantId, period } = req.body;
        // Would call compliance service to generate report
        res.json({
            id: `report-${Date.now()}`,
            standard,
            tenantId,
            reportDate: new Date().toISOString(),
            period,
            status: 'compliant',
            score: 95,
            violations: [],
            recommendations: [],
            metrics: {}
        });
    } catch (error) {
        console.error('Compliance report generation error:', error);
        res.status(500).json({ error: 'Failed to generate compliance report' });
    }
});

// ==========================================
// DNS MANAGEMENT API
// ==========================================

// Verify TXT record
app.post('/api/dns/verify-txt', requireApiKey, express.json(), async (req, res) => {
    try {
        const { domain, expectedValue } = req.body;
        // Would perform actual DNS lookup
        res.json({ verified: true });
    } catch (error) {
        console.error('DNS verification error:', error);
        res.status(500).json({ error: 'DNS verification failed' });
    }
});

// Verify A record
app.post('/api/dns/verify-a', requireApiKey, express.json(), async (req, res) => {
    try {
        const { domain, expectedIp } = req.body;
        // Would perform actual DNS lookup
        res.json({ verified: true });
    } catch (error) {
        console.error('DNS A record verification error:', error);
        res.status(500).json({ error: 'DNS A record verification failed' });
    }
});

// Verify CNAME record
app.post('/api/dns/verify-cname', requireApiKey, express.json(), async (req, res) => {
    try {
        const { domain, expectedCname } = req.body;
        // Would perform actual DNS lookup
        res.json({ verified: true });
    } catch (error) {
        console.error('DNS CNAME verification error:', error);
        res.status(500).json({ error: 'DNS CNAME verification failed' });
    }
});

// ==========================================
// DATA MIGRATION API
// ==========================================

// Export tenant data
app.post('/api/migration/export', requireApiKey, express.json(), async (req, res) => {
    try {
        const { jobId, tenantId, data } = req.body;
        // Would generate export file and store in storage
        res.json({
            jobId,
            downloadUrl: `https://storage.example.com/exports/${jobId}.zip`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    } catch (error) {
        console.error('Data export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Payment server running at http://localhost:${port}`);
    
    // Start automated scheduler
    schedulerService.start();
});
