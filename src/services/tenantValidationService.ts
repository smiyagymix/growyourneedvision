/**
 * Tenant Validation Service
 * Ensures subdomain uniqueness and validates tenant data
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface TenantValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validate subdomain format
 * - Must be lowercase
 * - Only alphanumeric and hyphens
 * - 3-63 characters
 * - Cannot start or end with hyphen
 */
export function validateSubdomainFormat(subdomain: string): TenantValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check length
    if (subdomain.length < 3) {
        errors.push('Subdomain must be at least 3 characters');
    }
    if (subdomain.length > 63) {
        errors.push('Subdomain cannot exceed 63 characters');
    }

    // Check format
    const validPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!validPattern.test(subdomain)) {
        errors.push('Subdomain must contain only lowercase letters, numbers, and hyphens (cannot start/end with hyphen)');
    }

    // Check for consecutive hyphens
    if (subdomain.includes('--')) {
        warnings.push('Subdomain contains consecutive hyphens which may be confusing');
    }

    // Reserved subdomains
    const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost', 'test', 'staging', 'production', 'dev', 'owner', 'support', 'help', 'blog', 'docs', 'status'];
    if (reserved.includes(subdomain)) {
        errors.push(`Subdomain "${subdomain}" is reserved and cannot be used`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Check if subdomain is unique across all tenants
 */
export async function checkSubdomainUniqueness(
    subdomain: string,
    excludeTenantId?: string
): Promise<TenantValidationResult> {
    if (isMockEnv()) {
        return { isValid: true, errors: [], warnings: [] };
    }

    try {
        const filter = excludeTenantId 
            ? `subdomain = "${subdomain}" && id != "${excludeTenantId}"`
            : `subdomain = "${subdomain}"`;

        const existing = await pb.collection('tenants').getList(1, 1, {
            filter,
            requestKey: null
        });

        if (existing.totalItems > 0) {
            return {
                isValid: false,
                errors: ['This subdomain is already taken'],
                warnings: []
            };
        }

        return { isValid: true, errors: [], warnings: [] };
    } catch (error) {
        console.error('Failed to check subdomain uniqueness:', error);
        return {
            isValid: false,
            errors: ['Unable to verify subdomain availability. Please try again.'],
            warnings: []
        };
    }
}

/**
 * Complete subdomain validation (format + uniqueness)
 */
export async function validateSubdomain(
    subdomain: string,
    excludeTenantId?: string
): Promise<TenantValidationResult> {
    // First check format
    const formatResult = validateSubdomainFormat(subdomain);
    if (!formatResult.isValid) {
        return formatResult;
    }

    // Then check uniqueness
    const uniquenessResult = await checkSubdomainUniqueness(subdomain, excludeTenantId);
    
    return {
        isValid: uniquenessResult.isValid,
        errors: [...formatResult.errors, ...uniquenessResult.errors],
        warnings: [...formatResult.warnings, ...uniquenessResult.warnings]
    };
}

/**
 * Validate tenant name
 */
export function validateTenantName(name: string): TenantValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name || name.trim().length === 0) {
        errors.push('Tenant name is required');
    }

    if (name.length < 2) {
        errors.push('Tenant name must be at least 2 characters');
    }

    if (name.length > 100) {
        errors.push('Tenant name cannot exceed 100 characters');
    }

    // Check for special characters
    const hasSpecialChars = /[<>{}\\|^~\[\]`]/.test(name);
    if (hasSpecialChars) {
        errors.push('Tenant name contains invalid special characters');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate tenant plan
 */
export function validateTenantPlan(plan: string): TenantValidationResult {
    const validPlans = ['free', 'basic', 'pro', 'enterprise'];
    
    if (!validPlans.includes(plan)) {
        return {
            isValid: false,
            errors: [`Invalid plan. Must be one of: ${validPlans.join(', ')}`],
            warnings: []
        };
    }

    return { isValid: true, errors: [], warnings: [] };
}

/**
 * Validate tenant status
 */
export function validateTenantStatus(status: string): TenantValidationResult {
    const validStatuses = ['active', 'trial', 'suspended', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
        return {
            isValid: false,
            errors: [`Invalid status. Must be one of: ${validStatuses.join(', ')}`],
            warnings: []
        };
    }

    return { isValid: true, errors: [], warnings: [] };
}

/**
 * Validate complete tenant data before creation/update
 */
export async function validateTenantData(
    data: {
        name: string;
        subdomain: string;
        plan?: string;
        status?: string;
        max_users?: number;
        max_storage_gb?: number;
    },
    isUpdate: boolean = false,
    tenantId?: string
): Promise<TenantValidationResult> {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validate name
    const nameResult = validateTenantName(data.name);
    allErrors.push(...nameResult.errors);
    allWarnings.push(...nameResult.warnings);

    // Validate subdomain
    const subdomainResult = await validateSubdomain(data.subdomain, isUpdate ? tenantId : undefined);
    allErrors.push(...subdomainResult.errors);
    allWarnings.push(...subdomainResult.warnings);

    // Validate plan if provided
    if (data.plan) {
        const planResult = validateTenantPlan(data.plan);
        allErrors.push(...planResult.errors);
        allWarnings.push(...planResult.warnings);
    }

    // Validate status if provided
    if (data.status) {
        const statusResult = validateTenantStatus(data.status);
        allErrors.push(...statusResult.errors);
        allWarnings.push(...statusResult.warnings);
    }

    // Validate limits
    if (data.max_users !== undefined && data.max_users < 1) {
        allErrors.push('Maximum users must be at least 1');
    }

    if (data.max_storage_gb !== undefined && data.max_storage_gb < 1) {
        allErrors.push('Maximum storage must be at least 1 GB');
    }

    // Business rule warnings
    if (data.plan === 'free' && data.max_users && data.max_users > 10) {
        allWarnings.push('Free plan typically limits users to 10. Consider upgrading plan.');
    }

    return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
    };
}

/**
 * Generate available subdomain suggestions
 */
export async function suggestAvailableSubdomains(baseName: string, count: number = 5): Promise<string[]> {
    const suggestions: string[] = [];
    const cleanBase = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    // Try base name first
    const baseResult = await checkSubdomainUniqueness(cleanBase);
    if (baseResult.isValid) {
        suggestions.push(cleanBase);
    }

    // Generate variations
    const suffixes = ['inc', 'org', 'edu', 'app', 'hub', 'io', 'tech', 'school'];
    for (const suffix of suffixes) {
        if (suggestions.length >= count) break;
        
        const variant = `${cleanBase}-${suffix}`;
        const result = await checkSubdomainUniqueness(variant);
        if (result.isValid) {
            suggestions.push(variant);
        }
    }

    // Try numeric suffixes
    for (let i = 1; i <= 99 && suggestions.length < count; i++) {
        const variant = `${cleanBase}${i}`;
        const result = await checkSubdomainUniqueness(variant);
        if (result.isValid) {
            suggestions.push(variant);
        }
    }

    return suggestions.slice(0, count);
}
