/**
 * Security Headers Configuration
 * 
 * Content Security Policy and security header utilities
 * These should be configured on the server (nginx, Node.js) but
 * can be validated/reported from the client side
 */

/**
 * Content Security Policy directives
 */
export const CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for some React patterns
        "'unsafe-eval'", // Required for development
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and CSS-in-JS
        'https://fonts.googleapis.com',
    ],
    'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:',
    ],
    'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'http://localhost:8090', // PocketBase
        'http://127.0.0.1:8090',
    ],
    'media-src': [
        "'self'",
        'blob:',
        'data:',
    ],
    'connect-src': [
        "'self'",
        'http://localhost:*',
        'http://127.0.0.1:*',
        'ws://localhost:*',
        'ws://127.0.0.1:*',
        'https://api.openai.com',
        'https://api.stripe.com',
    ],
    'frame-src': [
        "'self'",
        'https://js.stripe.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': [],
} as const;

/**
 * Build CSP header string from directives
 * @param directives - CSP directives object
 * @returns CSP header value
 */
export function buildCspHeader(
    directives: Record<string, string[]> = CSP_DIRECTIVES as any
): string {
    return Object.entries(directives)
        .map(([directive, values]) => {
            if (values.length === 0) return directive;
            return `${directive} ${values.join(' ')}`;
        })
        .join('; ');
}

/**
 * Generate nonce for inline scripts
 * @returns Base64 nonce string
 */
export function generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
    // Content Security Policy
    'Content-Security-Policy': buildCspHeader(),
    
    // Prevent clickjacking
    'X-Frame-Options': 'SAMEORIGIN',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS filter
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // HSTS (only for production HTTPS)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Permissions policy
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const;

/**
 * Check if CSP is enabled in current environment
 * @returns True if CSP meta tag or header exists
 */
export function isCspEnabled(): boolean {
    // Check for CSP meta tag
    const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    if (metaTags.length > 0) return true;
    
    // Check if CSP header was sent (check for violations)
    return typeof window !== 'undefined' && 'SecurityPolicyViolationEvent' in window;
}

/**
 * Report CSP violations to console
 * Set up listener for CSP violation events
 */
export function setupCspViolationReporting(): void {
    if (typeof window === 'undefined') return;
    
    document.addEventListener('securitypolicyviolation', (event) => {
        console.error('CSP Violation:', {
            blockedURI: event.blockedURI,
            violatedDirective: event.violatedDirective,
            effectiveDirective: event.effectiveDirective,
            originalPolicy: event.originalPolicy,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber,
            columnNumber: event.columnNumber,
        });
        
        // In production, send to monitoring service
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to Sentry or other monitoring service
        }
    });
}

/**
 * Validate security headers are present
 * Useful for debugging and security audits
 * @returns Object with header presence status
 */
export async function validateSecurityHeaders(url: string = window.location.href): Promise<{
    present: string[];
    missing: string[];
    warnings: string[];
}> {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const headers = response.headers;
        
        const present: string[] = [];
        const missing: string[] = [];
        const warnings: string[] = [];
        
        // Check each security header
        for (const [header, _] of Object.entries(SECURITY_HEADERS)) {
            if (headers.has(header)) {
                present.push(header);
            } else {
                missing.push(header);
            }
        }
        
        // Check for common issues
        if (!headers.has('Content-Security-Policy') && !headers.has('Content-Security-Policy-Report-Only')) {
            warnings.push('No CSP policy detected - XSS attacks may be possible');
        }
        
        if (!headers.has('X-Frame-Options') && !headers.has('Content-Security-Policy')) {
            warnings.push('No clickjacking protection detected');
        }
        
        if (window.location.protocol === 'http:') {
            warnings.push('Not using HTTPS - data transmitted insecurely');
        }
        
        return { present, missing, warnings };
    } catch (error) {
        console.error('Failed to validate security headers:', error);
        return { present: [], missing: Object.keys(SECURITY_HEADERS), warnings: ['Failed to fetch headers'] };
    }
}

/**
 * Check if running in secure context (HTTPS)
 * @returns True if HTTPS or localhost
 */
export function isSecureContext(): boolean {
    return window.isSecureContext;
}

/**
 * Validate Origin header for CSRF protection
 * @param origin - Origin header value
 * @param allowedOrigins - List of allowed origins
 * @returns True if origin is allowed
 */
export function validateOrigin(origin: string, allowedOrigins: string[]): boolean {
    if (!origin) return false;
    return allowedOrigins.includes(origin);
}

/**
 * Get allowed origins for current environment
 * @returns Array of allowed origin URLs
 */
export function getAllowedOrigins(): string[] {
    const origins = [window.location.origin];
    
    // Add development origins
    if (process.env.NODE_ENV === 'development') {
        origins.push('http://localhost:3001', 'http://127.0.0.1:3001');
        origins.push('http://localhost:8090', 'http://127.0.0.1:8090');
    }
    
    // Add configured origins from env
    const customOrigins = process.env.VITE_ALLOWED_ORIGINS;
    if (customOrigins) {
        origins.push(...customOrigins.split(','));
    }
    
    return origins;
}

/**
 * Initialize security headers validation on page load
 * Logs warnings if headers are missing
 */
export function initializeSecurityValidation(): void {
    if (process.env.NODE_ENV === 'development') {
        validateSecurityHeaders().then(result => {
            if (result.missing.length > 0) {
                console.warn('Missing security headers:', result.missing);
            }
            if (result.warnings.length > 0) {
                console.warn('Security warnings:', result.warnings);
            }
        });
    }
    
    // Setup CSP violation reporting
    setupCspViolationReporting();
}

/**
 * Create meta tag for CSP (client-side fallback)
 * Note: Server-side headers are preferred
 * @param policy - CSP policy string
 */
export function addCspMetaTag(policy: string = buildCspHeader()): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = policy;
    document.head.appendChild(meta);
}

/**
 * Subresource Integrity (SRI) hash generator
 * @param content - Script/style content
 * @returns SRI hash string
 */
export async function generateSriHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-384', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    return `sha384-${hashBase64}`;
}

/**
 * Add SRI to external script tag
 * @param scriptUrl - URL of external script
 * @param integrity - SRI hash
 */
export function addSriToScript(scriptUrl: string, integrity: string): void {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.integrity = integrity;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
}

export default {
    CSP_DIRECTIVES,
    SECURITY_HEADERS,
    buildCspHeader,
    generateNonce,
    isCspEnabled,
    setupCspViolationReporting,
    validateSecurityHeaders,
    isSecureContext,
    validateOrigin,
    getAllowedOrigins,
    initializeSecurityValidation,
    addCspMetaTag,
    generateSriHash,
    addSriToScript,
};
