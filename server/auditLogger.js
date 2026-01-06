import { v4 as uuid } from 'uuid';

const PB_URL = process.env.POCKETBASE_URL;
const PB_TOKEN = process.env.POCKETBASE_SERVICE_TOKEN;

// In-memory audit log buffer for when PocketBase is unavailable
const auditBuffer = [];
const MAX_BUFFER_SIZE = 1000;

// Severity levels with numeric values for filtering and alerting
const SEVERITY_LEVELS = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
};

// Critical actions that should trigger alerts
const CRITICAL_ACTIONS = [
    'webhook.dispute.created',
    'webhook.processing_failed',
    'payment.intent.failed',
    'subscription.cancel',
    'tenant.delete',
    'user.role.change',
    'security.breach',
    'data.export',
    'credentials.rotate'
];

/**
 * Extract IP address from request object
 */
function getClientIp(req) {
    if (!req) return null;

    // Check various headers for real IP (behind proxies/load balancers)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp) return realIp;

    const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare
    if (cfConnectingIp) return cfConnectingIp;

    return req.ip || req.connection?.remoteAddress || null;
}

/**
 * Extract user agent from request object
 */
function getUserAgent(req) {
    if (!req) return null;
    return req.headers['user-agent'] || null;
}

/**
 * Get geolocation from IP (ENABLED - using free ip-api.com service)
 */
async function getGeolocation(ip) {
    if (!ip) return null;

    // Skip for local/private IPs
    if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        return {
            country: 'Local',
            countryCode: 'LOCAL',
            region: 'Development',
            city: 'Localhost',
            lat: 0,
            lon: 0,
            timezone: 'UTC',
            isp: 'Local Network'
        };
    }

    try {
        const baseUrl = process.env.GEOLOCATION_API_URL || 'http://ip-api.com/json/';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch(`${baseUrl}${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success') {
            return {
                country: data.country,
                countryCode: data.countryCode,
                region: data.regionName,
                city: data.city,
                lat: data.lat,
                lon: data.lon,
                timezone: data.timezone,
                isp: data.isp
            };
        }

        console.warn('[auditLogger] Geolocation lookup failed:', data.message || 'Unknown error');
        return null;
    } catch (error) {
        console.warn('[auditLogger] Geolocation lookup error:', error.message);
        return null;
    }
}

/**
 * Post audit log to PocketBase
 */
async function postPocketBase(collection, body) {
    if (!PB_URL || !PB_TOKEN) return false;
    const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': PB_TOKEN.startsWith('Bearer ')
                ? PB_TOKEN
                : `Bearer ${PB_TOKEN}`
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PocketBase error (${res.status}): ${text}`);
    }
    return true;
}

/**
 * Send alert for critical audit events
 */
async function sendAlert(entry) {
    const alertPayload = {
        level: 'alert',
        type: 'critical_audit_event',
        action: entry.action,
        severity: entry.severity,
        resourceType: entry.resource_type,
        resourceId: entry.resource_id,
        tenantId: entry.tenant_id,
        userId: entry.user_id,
        timestamp: entry.timestamp,
        ip: entry.ip_address,
        userAgent: entry.user_agent
    };

    // Always log to console error in structured format
    console.error(JSON.stringify(alertPayload));

    // Slack integration
    if (process.env.SLACK_WEBHOOK_URL) {
        try {
            await fetch(process.env.SLACK_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `🚨 *Critical Audit Event*: ${entry.action}`,
                    attachments: [{
                        color: 'danger',
                        fields: [
                            { title: 'Action', value: entry.action, short: true },
                            { title: 'Severity', value: entry.severity, short: true },
                            { title: 'User', value: entry.user_id || 'system', short: true },
                            { title: 'Tenant', value: entry.tenant_id || 'N/A', short: true },
                            { title: 'IP', value: entry.ip_address || 'unknown', short: true },
                            { title: 'Time', value: entry.timestamp, short: true }
                        ]
                    }]
                })
            });
        } catch (err) {
            console.warn('[auditLogger] Failed to send Slack alert:', err.message);
        }
    }

    // Generic Webhook integration for other monitoring tools
    if (process.env.ALERT_WEBHOOK_URL) {
        try {
            await fetch(process.env.ALERT_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alertPayload)
            });
        } catch (err) {
            console.warn('[auditLogger] Failed to send generic webhook alert:', err.message);
        }
    }
}

/**
 * Enhanced audit logging with IP tracking, user agent, and severity levels
 * 
 * @param {Object} options - Audit log options
 * @param {string} options.action - Action being performed (e.g., 'user.login', 'payment.create')
 * @param {string} options.resourceType - Type of resource (e.g., 'user', 'payment', 'tenant')
 * @param {string} options.resourceId - ID of the resource
 * @param {string} options.tenantId - Tenant ID
 * @param {string} [options.userId] - User ID performing the action
 * @param {string} [options.severity='low'] - Severity level: 'low', 'medium', 'high', 'critical'
 * @param {Object} [options.metadata={}] - Additional metadata
 * @param {Object} [options.req] - Express request object (for IP and user agent extraction)
 * @param {string} [options.ipAddress] - Manual IP address override
 * @param {string} [options.userAgent] - Manual user agent override
 */
export async function logAudit({
    action,
    resourceType,
    resourceId,
    tenantId,
    userId,
    severity = 'low',
    metadata = {},
    req = null,
    ipAddress = null,
    userAgent = null
}) {
    // Validate severity level
    const validSeverity = ['low', 'medium', 'high', 'critical'].includes(severity) ? severity : 'low';

    // Extract IP and user agent from request if available
    const ip = ipAddress || getClientIp(req);
    const ua = userAgent || getUserAgent(req);

    // Get geolocation (ENABLED by default, can disable with DISABLE_GEOLOCATION=true)
    let geolocation = null;
    if (ip && process.env.DISABLE_GEOLOCATION !== 'true') {
        try {
            geolocation = await getGeolocation(ip);
        } catch (error) {
            console.warn('[auditLogger] Geolocation lookup failed:', error.message);
        }
    }

    const entry = {
        idempotency_key: uuid(),
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        tenant_id: tenantId,
        user_id: userId || 'system',
        severity: validSeverity,
        ip_address: ip,
        user_agent: ua,
        geolocation: geolocation,
        metadata: {
            ...metadata,
            timestamp_ms: Date.now()
        },
        timestamp: new Date().toISOString()
    };

    // Log to console with appropriate level
    const logLevel = SEVERITY_LEVELS[validSeverity] >= SEVERITY_LEVELS.high ? 'warn' : 'info';
    console[logLevel](JSON.stringify({
        level: logLevel,
        type: 'audit_log',
        ...entry
    }));

    try {
        // Attempt to send to PocketBase
        const sent = await postPocketBase('audit_logs', entry);

        if (!sent) {
            // Buffer audit log if PocketBase is not configured
            auditBuffer.push(entry);
            if (auditBuffer.length > MAX_BUFFER_SIZE) {
                auditBuffer.shift(); // Remove oldest entry
            }
            console.warn('[auditLogger] PocketBase not configured; audit buffered locally');
        }

        // Send alert for critical events
        if (validSeverity === 'critical' || CRITICAL_ACTIONS.includes(action)) {
            await sendAlert(entry);
        }

    } catch (err) {
        console.error('[auditLogger] Failed to send audit:', err.message);

        // Buffer failed audit logs
        auditBuffer.push(entry);
        if (auditBuffer.length > MAX_BUFFER_SIZE) {
            auditBuffer.shift();
        }
    }
}

/**
 * Get buffered audit logs (for debugging or manual sync)
 */
export function getAuditBuffer() {
    return [...auditBuffer];
}

/**
 * Clear audit buffer
 */
export function clearAuditBuffer() {
    auditBuffer.length = 0;
}

/**
 * Flush buffered audit logs to PocketBase
 */
export async function flushAuditBuffer() {
    if (auditBuffer.length === 0) return { flushed: 0, failed: 0 };

    let flushed = 0;
    let failed = 0;

    const logsToFlush = [...auditBuffer];
    auditBuffer.length = 0;

    for (const entry of logsToFlush) {
        try {
            await postPocketBase('audit_logs', entry);
            flushed++;
        } catch (error) {
            console.error('[auditLogger] Failed to flush audit log:', error.message);
            auditBuffer.push(entry); // Re-add to buffer
            failed++;
        }
    }

    return { flushed, failed };
}

/**
 * Middleware to automatically add request context to audit logs
 */
export function auditMiddleware(req, res, next) {
    const impersonatedUserId = req.header('x-impersonate-user') || req.header('x-impersonate-user-id');

    // Attach audit logger to request object with pre-filled context
    req.auditLog = (options) => {
        const metadata = {
            ...options.metadata,
            impersonated_by: impersonatedUserId ? (req.user?.id || 'admin') : null,
            impersonated_user_id: impersonatedUserId || null
        };

        return logAudit({
            ...options,
            req,
            userId: req.user?.id || req.header('x-user-id') || options.userId,
            tenantId: req.tenantId || req.header('x-tenant-id') || options.tenantId,
            metadata
        });
    };
    next();
}

/**
 * Get audit statistics
 */
export function getAuditStats() {
    const stats = {
        buffered: auditBuffer.length,
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        byAction: {}
    };

    auditBuffer.forEach(entry => {
        stats.bySeverity[entry.severity]++;
        stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
    });

    return stats;
}
