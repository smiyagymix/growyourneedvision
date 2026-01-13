/**
 * Advanced Database Utilities
 * Provides database operations, connection management, and query optimization
 */

import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { Logger } from './logging';

export interface DatabaseQuery<T = RecordModel> {
  filter?: string;
  sort?: string;
  expand?: string;
  fields?: string;
  page?: number;
  perPage?: number;
  requestKey?: string | null;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface BatchOperation<T> {
  id: string;
  action: 'create' | 'update' | 'delete';
  data?: Partial<T>;
  error?: Error;
  result?: T;
}

const logger = new Logger({ enableConsole: true });

/**
 * Database connection pool manager
 */
export class ConnectionPool {
  private static instance: ConnectionPool;
  private activeConnections: Map<string, number> = new Map();
  private connectionLimit: number = 100;
  private logger: Logger;

  private constructor() {
    this.logger = logger.createChild('ConnectionPool');
  }

  static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }

  /**
   * Get active connection count
   */
  getConnectionCount(): number {
    return Array.from(this.activeConnections.values()).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Track connection
   */
  trackConnection(identifier: string): void {
    const current = this.activeConnections.get(identifier) || 0;
    this.activeConnections.set(identifier, current + 1);
    this.logger.debug(`Connection tracked: ${identifier}`, { count: current + 1 });
  }

  /**
   * Release connection
   */
  releaseConnection(identifier: string): void {
    const current = this.activeConnections.get(identifier) || 0;
    if (current > 0) {
      this.activeConnections.set(identifier, current - 1);
    }
    this.logger.debug(`Connection released: ${identifier}`, { count: current - 1 });
  }

  /**
   * Get statistics
   */
  getStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [key, value] of this.activeConnections.entries()) {
      if (value > 0) {
        stats[key] = value;
      }
    }
    return stats;
  }
}

/**
 * Query builder for type-safe queries
 */
export class QueryBuilder<T extends RecordModel = RecordModel> {
  private query: DatabaseQuery<T> = {
    page: 1,
    perPage: 25,
    requestKey: null,
  };
  private collection: string;
  private logger: Logger;

  constructor(collection: string) {
    this.collection = collection;
    this.logger = logger.createChild(`QueryBuilder[${collection}]`);
  }

  /**
   * Add filter condition
   */
  where(filter: string): this {
    this.query.filter = filter;
    return this;
  }

  /**
   * Add sort order
   */
  orderBy(sort: string): this {
    this.query.sort = sort;
    return this;
  }

  /**
   * Add relation expansion
   */
  expand(...relations: string[]): this {
    this.query.expand = relations.join(',');
    return this;
  }

  /**
   * Select specific fields
   */
  select(...fields: string[]): this {
    this.query.fields = fields.join(',');
    return this;
  }

  /**
   * Set pagination
   */
  paginate(page: number, perPage: number = 25): this {
    this.query.page = page;
    this.query.perPage = perPage;
    return this;
  }

  /**
   * Set page size
   */
  limit(perPage: number): this {
    this.query.perPage = perPage;
    return this;
  }

  /**
   * Execute query and get first result
   */
  async first(): Promise<T | null> {
    try {
      const results = await pb.collection(this.collection).getList<T>(
        1,
        1,
        { filter: this.query.filter }
      );
      return results.items[0] || null;
    } catch (error) {
      this.logger.error('Query failed', error as Error, { collection: this.collection });
      throw error;
    }
  }

  /**
   * Execute query and get all results
   */
  async get(): Promise<T[]> {
    try {
      const page = this.query.page || 1;
      const perPage = this.query.perPage || 25;

      const results = await pb.collection(this.collection).getList<T>(page, perPage, {
        filter: this.query.filter,
        sort: this.query.sort,
        expand: this.query.expand,
        fields: this.query.fields,
        requestKey: this.query.requestKey,
      });

      return results.items;
    } catch (error) {
      this.logger.error('Query failed', error as Error, { collection: this.collection });
      throw error;
    }
  }

  /**
   * Execute query with pagination metadata
   */
  async paginated(): Promise<PaginatedResult<T>> {
    try {
      const page = this.query.page || 1;
      const perPage = this.query.perPage || 25;

      const results = await pb.collection(this.collection).getList<T>(page, perPage, {
        filter: this.query.filter,
        sort: this.query.sort,
        expand: this.query.expand,
        fields: this.query.fields,
        requestKey: this.query.requestKey,
      });

      return {
        items: results.items,
        meta: {
          page: results.page,
          perPage: results.perPage,
          totalPages: results.totalPages,
          totalItems: results.totalItems,
          hasMore: page < results.totalPages,
        },
      };
    } catch (error) {
      this.logger.error('Paginated query failed', error as Error, { collection: this.collection });
      throw error;
    }
  }

  /**
   * Execute query and get count
   */
  async count(): Promise<number> {
    try {
      const results = await pb.collection(this.collection).getList<T>(1, 1, {
        filter: this.query.filter,
        requestKey: this.query.requestKey,
      });
      return results.totalItems;
    } catch (error) {
      this.logger.error('Count query failed', error as Error, { collection: this.collection });
      throw error;
    }
  }

  /**
   * Check if any records exist
   */
  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Get query string for debugging
   */
  toString(): string {
    const params = new URLSearchParams();
    if (this.query.filter) params.append('filter', this.query.filter);
    if (this.query.sort) params.append('sort', this.query.sort);
    if (this.query.expand) params.append('expand', this.query.expand);
    if (this.query.fields) params.append('fields', this.query.fields);
    params.append('page', String(this.query.page || 1));
    params.append('perPage', String(this.query.perPage || 25));

    return `${this.collection}?${params.toString()}`;
  }
}

/**
 * Database transaction manager
 */
export class Transaction {
  private operations: BatchOperation<any>[] = [];
  private logger: Logger;

  constructor() {
    this.logger = logger.createChild('Transaction');
  }

  /**
   * Add create operation
   */
  create<T extends RecordModel>(collection: string, data: Partial<T>): this {
    this.operations.push({
      id: `create-${Date.now()}-${Math.random()}`,
      action: 'create',
      data: { ...data, collection } as any,
    });
    return this;
  }

  /**
   * Add update operation
   */
  update<T extends RecordModel>(collection: string, id: string, data: Partial<T>): this {
    this.operations.push({
      id: `update-${id}`,
      action: 'update',
      data: { ...data, collection, id } as any,
    });
    return this;
  }

  /**
   * Add delete operation
   */
  delete(collection: string, id: string): this {
    this.operations.push({
      id: `delete-${id}`,
      action: 'delete',
      data: { collection, id } as any,
    });
    return this;
  }

  /**
   * Execute transaction
   */
  async execute(): Promise<BatchOperation<any>[]> {
    this.logger.startTimer('transaction-execution');

    for (const operation of this.operations) {
      try {
        const { collection, id, ...data } = operation.data as any;

        if (operation.action === 'create') {
          const created = await pb.collection(collection).create(data);
          operation.result = created;
          this.logger.debug(`Created record: ${collection}/${created.id}`);
        } else if (operation.action === 'update' && id) {
          const updated = await pb.collection(collection).update(id, data);
          operation.result = updated;
          this.logger.debug(`Updated record: ${collection}/${id}`);
        } else if (operation.action === 'delete' && id) {
          await pb.collection(collection).delete(id);
          this.logger.debug(`Deleted record: ${collection}/${id}`);
        }
      } catch (error) {
        operation.error = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Operation failed: ${operation.id}`, operation.error);
      }
    }

    this.logger.endTimer('transaction-execution');
    return this.operations;
  }

  /**
   * Check if all operations succeeded
   */
  allSucceeded(): boolean {
    return this.operations.every((op) => !op.error);
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): BatchOperation<any>[] {
    return this.operations.filter((op) => op.error);
  }
}

/**
 * Database cache manager
 */
export class DatabaseCache {
  private static instance: DatabaseCache;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes default
  private logger: Logger;

  private constructor() {
    this.logger = logger.createChild('DatabaseCache');
  }

  static getInstance(): DatabaseCache {
    if (!DatabaseCache.instance) {
      DatabaseCache.instance = new DatabaseCache();
    }
    return DatabaseCache.instance;
  }

  /**
   * Set cache with TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    this.logger.debug(`Cache set: ${key}`, { ttl: ttlMs || this.ttl });

    if (ttlMs) {
      setTimeout(() => this.delete(key), ttlMs);
    } else {
      setTimeout(() => this.delete(key), this.ttl);
    }
  }

  /**
   * Get from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.logger.debug(`Cache miss: ${key}`);
      return null;
    }

    const age = Date.now() - entry.timestamp;
    this.logger.debug(`Cache hit: ${key}`, { ageMs: age });
    return entry.data as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info(`Cache cleared`, { itemsCleared: size });
  }

  /**
   * Get cache statistics
   */
  getStatistics(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Helper function to create a query builder
 */
export function query<T extends RecordModel = RecordModel>(
  collection: string
): QueryBuilder<T> {
  return new QueryBuilder<T>(collection);
}

/**
 * Helper function to get a single record
 */
export async function getRecord<T extends RecordModel>(
  collection: string,
  id: string,
  options?: { expand?: string; fields?: string }
): Promise<T | null> {
  try {
    return await pb.collection(collection).getOne<T>(id, options);
  } catch (error) {
    logger.warn(`Record not found: ${collection}/${id}`, error as Error);
    return null;
  }
}

/**
 * Helper function to create a transaction
 */
export function transaction(): Transaction {
  return new Transaction();
}

/**
 * Helper function to get cache instance
 */
export function getCache(): DatabaseCache {
  return DatabaseCache.getInstance();
}

/**
 * Helper function to get connection pool
 */
export function getConnectionPool(): ConnectionPool {
  return ConnectionPool.getInstance();
}

export default {
  ConnectionPool,
  QueryBuilder,
  Transaction,
  DatabaseCache,
  query,
  getRecord,
  transaction,
  getCache,
  getConnectionPool,
};
