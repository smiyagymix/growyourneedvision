/**
 * Input Sanitization Utilities
 * 
 * Provides XSS protection through DOMPurify sanitization
 * All user inputs should pass through these functions before rendering
 */

import DOMPurify from 'dompurify';
import React from 'react';

/**
 * Sanitization configuration profiles
 */
export const SANITIZE_CONFIG = {
    // Strict: Removes all HTML tags, only allows plain text
    STRICT: {
        ALLOWED_TAGS: [] as string[],
        ALLOWED_ATTR: [] as string[],
        KEEP_CONTENT: true,
    },
    
    // Basic: Allows safe formatting tags only
    BASIC: {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span'],
        ALLOWED_ATTR: ['class'],
    },
    
    // Rich: Allows rich text formatting with links and lists
    RICH: {
        ALLOWED_TAGS: [
            'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'div',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'blockquote', 'code', 'pre'
        ],
        ALLOWED_ATTR: ['href', 'class', 'id', 'target', 'rel'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    },
    
    // Media: Allows images and videos with strict attribute controls
    MEDIA: {
        ALLOWED_TAGS: [
            'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'div',
            'img', 'video', 'audio', 'source'
        ],
        ALLOWED_ATTR: [
            'src', 'alt', 'title', 'width', 'height', 'class', 'id',
            'controls', 'poster', 'preload', 'type'
        ],
    }
} as const;

/**
 * Sanitize HTML string with XSS protection
 * @param dirty - Untrusted HTML string
 * @param config - Sanitization profile (default: BASIC)
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(
    dirty: string,
    config: keyof typeof SANITIZE_CONFIG = 'BASIC'
): string {
    if (!dirty || typeof dirty !== 'string') return '';
    
    try {
        const result = DOMPurify.sanitize(dirty, { ...SANITIZE_CONFIG[config] as any, RETURN_TRUSTED_TYPE: false });
        return result as string;
    } catch (error) {
        console.error('Sanitization failed:', error);
        return ''; // Return empty string on error for safety
    }
}

/**
 * Sanitize plain text - removes ALL HTML tags
 * Use for displaying user input that should never contain markup
 * @param input - Untrusted text input
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    try {
        // Use STRICT config to strip all tags
        const result = DOMPurify.sanitize(input, { ...SANITIZE_CONFIG.STRICT as any, RETURN_TRUSTED_TYPE: false });
        const sanitized = result as string;
        // Additional escape for safety
        return sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    } catch (error) {
        console.error('Text sanitization failed:', error);
        return '';
    }
}

/**
 * Sanitize URL to prevent javascript: and data: URI attacks
 * @param url - Untrusted URL string
 * @param allowDataUri - Allow data: URIs (default: false)
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string, allowDataUri: boolean = false): string {
    if (!url || typeof url !== 'string') return '';
    
    const trimmed = url.trim();
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = trimmed.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
        if (protocol === 'data:' && allowDataUri) continue;
        if (lowerUrl.startsWith(protocol)) {
            console.warn('Blocked dangerous URL protocol:', protocol);
            return '';
        }
    }
    
    // Allow relative URLs, http, https, mailto, tel
    const safeProtocolRegex = /^(https?:\/\/|mailto:|tel:|\/|\.\/|#)/i;
    if (!safeProtocolRegex.test(trimmed)) {
        console.warn('Blocked URL with invalid protocol:', trimmed);
        return '';
    }
    
    try {
        // Additional validation using DOMPurify
        const anchor = document.createElement('a');
        anchor.href = DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [] });
        return anchor.href;
    } catch (error) {
        console.error('URL sanitization failed:', error);
        return '';
    }
}

/**
 * Sanitize filename to prevent path traversal attacks
 * @param filename - Untrusted filename
 * @returns Safe filename or null if invalid
 */
export function sanitizeFilename(filename: string): string | null {
    if (!filename || typeof filename !== 'string') return null;
    
    // Remove path traversal attempts
    const cleaned = filename
        .replace(/\.\./g, '') // Remove ..
        .replace(/[\/\\]/g, '') // Remove path separators
        .replace(/[<>:"|?*]/g, '') // Remove invalid filename chars
        .trim();
    
    if (!cleaned || cleaned.length === 0) return null;
    if (cleaned.length > 255) return null; // Max filename length
    
    return cleaned;
}

/**
 * Sanitize object properties recursively
 * Useful for sanitizing entire form data or API responses
 * @param obj - Object with potentially unsafe string values
 * @param config - Sanitization profile to apply to string values
 * @returns New object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, any>>(
    obj: T,
    config: keyof typeof SANITIZE_CONFIG = 'BASIC'
): T {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {} as T;
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key as keyof T] = sanitizeHtml(value, config) as any;
        } else if (Array.isArray(value)) {
            sanitized[key as keyof T] = value.map(item =>
                typeof item === 'string' ? sanitizeHtml(item, config) : item
            ) as any;
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key as keyof T] = sanitizeObject(value, config) as any;
        } else {
            sanitized[key as keyof T] = value;
        }
    }
    
    return sanitized;
}

/**
 * Sanitize array of strings
 * @param arr - Array of untrusted strings
 * @param config - Sanitization profile
 * @returns Array of sanitized strings
 */
export function sanitizeArray(
    arr: string[],
    config: keyof typeof SANITIZE_CONFIG = 'BASIC'
): string[] {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => sanitizeHtml(item, config));
}

/**
 * Create a safe React component for rendering user HTML
 * Usage: <SafeHtml html={userInput} config="RICH" />
 */
export interface SafeHtmlProps {
    html: string;
    config?: keyof typeof SANITIZE_CONFIG;
    className?: string;
    as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Safe HTML rendering with automatic sanitization
 * Prevents XSS by sanitizing content before rendering
 */
export function SafeHtml({ 
    html, 
    config = 'BASIC', 
    className = '',
    as: Component = 'div'
}: SafeHtmlProps): React.ReactElement {
    const sanitized = sanitizeHtml(html, config);
    
    return React.createElement(
        Component,
        {
            className,
            dangerouslySetInnerHTML: { __html: sanitized }
        }
    );
}

/**
 * Escape HTML entities for safe display
 * Use when you need to display code/markup as text
 * @param str - String to escape
 * @returns HTML entity escaped string
 */
export function escapeHtml(str: string): string {
    if (!str || typeof str !== 'string') return '';
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize JSON string to prevent injection attacks
 * @param jsonString - Untrusted JSON string
 * @returns Parsed and sanitized object or null if invalid
 */
export function sanitizeJson<T = any>(jsonString: string): T | null {
    try {
        const parsed = JSON.parse(jsonString);
        return sanitizeObject(parsed, 'STRICT') as T;
    } catch (error) {
        console.error('JSON sanitization failed:', error);
        return null;
    }
}

/**
 * Sanitize SQL-like input to prevent SQL injection
 * Note: This is a basic filter. Use parameterized queries in backend!
 * @param input - Potentially dangerous SQL input
 * @returns Sanitized string
 */
export function sanitizeSqlInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove SQL keywords and dangerous characters
    return input
        .replace(/['";\\]/g, '') // Remove quotes and backslash
        .replace(/--/g, '') // Remove SQL comments
        .replace(/\/\*/g, '') // Remove block comment start
        .replace(/\*\//g, '') // Remove block comment end
        .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '')
        .trim();
}

/**
 * Validate and sanitize email addresses
 * @param email - Email address to validate
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
    if (!email || typeof email !== 'string') return null;
    
    const trimmed = email.trim().toLowerCase();
    
    // Basic email regex (RFC 5322 simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(trimmed)) return null;
    if (trimmed.length > 254) return null; // Max email length
    
    return trimmed;
}

/**
 * Sanitize phone numbers - removes non-numeric characters
 * @param phone - Phone number string
 * @returns Sanitized phone number or null if invalid
 */
export function sanitizePhone(phone: string): string | null {
    if (!phone || typeof phone !== 'string') return null;
    
    // Keep only digits, +, and spaces
    const cleaned = phone.replace(/[^\d+\s()-]/g, '').trim();
    
    if (cleaned.length < 10 || cleaned.length > 20) return null;
    
    return cleaned;
}

/**
 * Hook to get sanitization functions with loading state
 * Useful for async sanitization operations
 */
export function useSanitization() {
    return {
        sanitizeHtml,
        sanitizeText,
        sanitizeUrl,
        sanitizeFilename,
        sanitizeObject,
        sanitizeArray,
        escapeHtml,
        sanitizeJson,
        sanitizeEmail,
        sanitizePhone,
        SafeHtml,
    };
}

export default {
    sanitizeHtml,
    sanitizeText,
    sanitizeUrl,
    sanitizeFilename,
    sanitizeObject,
    sanitizeArray,
    escapeHtml,
    sanitizeJson,
    sanitizeSqlInput,
    sanitizeEmail,
    sanitizePhone,
    SafeHtml,
    SANITIZE_CONFIG,
};
