/**
 * Tenant Isolation Middleware
 * Ensures all database queries are scoped to the authenticated user's tenant
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

/**
 * Tenant isolation middleware for Express routes
 */
export function tenantIsolationMiddleware(req, res, next) {
    // Extract tenant ID from authenticated user
    const user = req.user || pb.authStore.model;
    
    if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Attach tenant context to request
    req.tenantId = user.tenantId || user.id;
    req.tenantRole = user.role;
    
    // Owner role can access all tenants
    if (user.role === 'Owner') {
        req.canAccessAllTenants = true;
    }
    
    next();
}

/**
 * Build tenant-scoped filter for PocketBase queries
 */
export function buildTenantFilter(tenantId, additionalFilters = '') {
    if (!tenantId) {
        throw new Error('Tenant ID is required for tenant-scoped queries');
    }
    
    const tenantFilter = `tenantId = "${tenantId}"`;
    
    if (additionalFilters) {
        return `${tenantFilter} && (${additionalFilters})`;
    }
    
    return tenantFilter;
}

/**
 * Validate tenant access for a specific resource
 */
export async function validateTenantAccess(userId, tenantId, resourceId, collection) {
    try {
        // Fetch the resource
        const record = await pb.collection(collection).getOne(resourceId);
        
        // Check if record belongs to the user's tenant
        if (record.tenantId !== tenantId) {
            return {
                allowed: false,
                reason: 'Cross-tenant access denied'
            };
        }
        
        return {
            allowed: true,
            record
        };
    } catch (error) {
        return {
            allowed: false,
            reason: 'Resource not found or access denied'
        };
    }
}

/**
 * Ensure all queries include tenant filter
 */
export class TenantScopedPocketBase {
    constructor(tenantId, isOwner = false) {
        this.tenantId = tenantId;
        this.isOwner = isOwner;
        this.pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
    }

    /**
     * Get list with automatic tenant filtering
     */
    async getList(collection, page = 1, perPage = 50, options = {}) {
        const filter = this.isOwner 
            ? options.filter || ''
            : buildTenantFilter(this.tenantId, options.filter);

        return this.pb.collection(collection).getList(page, perPage, {
            ...options,
            filter
        });
    }

    /**
     * Get full list with automatic tenant filtering
     */
    async getFullList(collection, options = {}) {
        const filter = this.isOwner 
            ? options.filter || ''
            : buildTenantFilter(this.tenantId, options.filter);

        return this.pb.collection(collection).getFullList({
            ...options,
            filter
        });
    }

    /**
     * Get one record with tenant validation
     */
    async getOne(collection, id, options = {}) {
        const record = await this.pb.collection(collection).getOne(id, options);
        
        // Validate tenant access (skip for Owner)
        if (!this.isOwner && record.tenantId !== this.tenantId) {
            throw new Error('Cross-tenant access denied');
        }
        
        return record;
    }

    /**
     * Create record with automatic tenant assignment
     */
    async create(collection, data, options = {}) {
        // Automatically assign tenant ID
        const recordData = {
            ...data,
            tenantId: this.tenantId
        };

        return this.pb.collection(collection).create(recordData, options);
    }

    /**
     * Update record with tenant validation
     */
    async update(collection, id, data, options = {}) {
        // Validate tenant access first
        await this.getOne(collection, id);
        
        return this.pb.collection(collection).update(id, data, options);
    }

    /**
     * Delete record with tenant validation
     */
    async delete(collection, id) {
        // Validate tenant access first
        await this.getOne(collection, id);
        
        return this.pb.collection(collection).delete(id);
    }
}

/**
 * Create tenant-scoped PocketBase instance
 */
export function createTenantPB(user) {
    if (!user) {
        throw new Error('User required to create tenant-scoped PocketBase');
    }
    
    const tenantId = user.tenantId || user.id;
    const isOwner = user.role === 'Owner';
    
    return new TenantScopedPocketBase(tenantId, isOwner);
}

export default {
    tenantIsolationMiddleware,
    buildTenantFilter,
    validateTenantAccess,
    TenantScopedPocketBase,
    createTenantPB
};
