/**
 * Security Utilities Index
 * 
 * Centralized export for all security-related utilities:
 * - Input sanitization (XSS protection)
 * - CSRF protection
 * - Rate limiting
 * - Security headers
 * - Content Security Policy
 */

// Export all sanitization utilities
export * from './sanitization';
import sanitization from './sanitization';

// Export all CSRF protection utilities
export * from './csrfProtection';
import csrfProtection from './csrfProtection';

// Export all rate limiting utilities
export * from './rateLimiting';
import rateLimiting from './rateLimiting';

// Export all security headers utilities
export * from './securityHeaders';
import securityHeaders from './securityHeaders';

/**
 * Initialize all security features
 * Call this in App.tsx or main entry point
 */
export function initializeSecurity(): void {
    // Initialize CSRF protection
    csrfProtection.initializeCsrfProtection();
    
    // Validate security headers (development only)
    if (process.env.NODE_ENV === 'development') {
        securityHeaders.initializeSecurityValidation();
    }
    
    console.log('✓ Security features initialized');
}

/**
 * Comprehensive security utilities object
 * Provides all security functions in one namespace
 */
export const Security = {
    // Sanitization
    sanitize: sanitization,
    
    // CSRF
    csrf: csrfProtection,
    
    // Rate limiting
    rateLimit: rateLimiting,
    
    // Headers
    headers: securityHeaders,
    
    // Initialize all
    init: initializeSecurity,
};

export default Security;
