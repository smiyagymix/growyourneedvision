/**
 * Advanced Search Service
 * 
 * Elasticsearch-like search capabilities with filters, facets, and relevance scoring
 * for multi-tenant data across all collections
 */

import pb from '../lib/pocketbase';
import * as Sentry from '@sentry/react';
import { isMockEnv } from '../utils/mockData';
import { z } from 'zod';

export interface SearchFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith' | 'endsWith';
    value: string | number | boolean;
}

export interface SearchFacet {
    field: string;
    values: { value: string; count: number }[];
}

export interface SearchQuery {
    query: string;
    collections?: string[];
    filters?: SearchFilter[];
    sort?: string;
    page?: number;
    perPage?: number;
    facets?: string[];
    tenantId?: string;
}

import { SearchRecord } from '../types/search';

export interface SearchResult {
    collection: string;
    record: SearchRecord;
    score: number;
    highlights?: { field: string; snippet: string }[];
}

export interface SearchResponse {
    results: SearchResult[];
    total: number;
    page: number;
    perPage: number;
    facets: SearchFacet[];
    suggestions?: string[];
}

export interface SavedSearch {
    id: string;
    name: string;
    query: SearchQuery;
    userId: string;
    isPublic: boolean;
    created: string;
    updated: string;
}

// Zod schemas for validation
const searchFilterSchema = z.object({
    field: z.string(),
    operator: z.union([z.literal('eq'), z.literal('ne'), z.literal('gt'), z.literal('gte'), z.literal('lt'), z.literal('lte'), z.literal('in'), z.literal('contains'), z.literal('startsWith'), z.literal('endsWith')]),
    value: z.any()
});

const searchQuerySchema = z.object({
    query: z.string().optional().default(''),
    collections: z.array(z.string()).optional(),
    filters: z.array(searchFilterSchema).optional(),
    sort: z.string().optional(),
    page: z.number().optional(),
    perPage: z.number().optional(),
    facets: z.array(z.string()).optional(),
    tenantId: z.string().optional()
});

const savedSearchSchema = z.object({
    id: z.string(),
    name: z.string(),
    query: z.union([z.string(), searchQuerySchema]),
    userId: z.string(),
    isPublic: z.boolean(),
    created: z.string(),
    updated: z.string()
});

function parseSavedSearch(record: unknown): SavedSearch | null {
    const parsed = savedSearchSchema.safeParse(record);
    if (!parsed.success) {
        console.error('advancedSearchService: failed to parse saved search', parsed.error, record);
        return null;
    }

    // Normalize query field to SearchQuery
    const raw = parsed.data;
    const query = typeof raw.query === 'string' ? (() => {
        try { return JSON.parse(raw.query as string); } catch { return { query: String(raw.query) }; }
    })() : raw.query as SearchQuery;

    const normalized = { ...raw, query } as SavedSearch;
    return normalized;
}

// Mock data for development
const MOCK_RESULTS: SearchResult[] = [
    {
        collection: 'tenants',
        record: { id: '1', collectionId: 'mock', collectionName: 'tenants', name: 'Acme School', plan: 'professional', status: 'active' },
        score: 0.95,
        highlights: [{ field: 'name', snippet: '<em>Acme</em> School' }]
    },
    {
        collection: 'users',
        record: { id: '2', collectionId: 'mock', collectionName: 'users', name: 'John Doe', email: 'john@acme.com', role: 'Teacher' },
        score: 0.87,
        highlights: [{ field: 'email', snippet: 'john@<em>acme</em>.com' }]
    }
];

const SEARCHABLE_COLLECTIONS = [
    { name: 'tenants', fields: ['name', 'subdomain', 'description'] },
    { name: 'users', fields: ['name', 'email', 'username'] },
    { name: 'courses', fields: ['title', 'description', 'code'] },
    { name: 'classes', fields: ['name', 'description'] },
    { name: 'assignments', fields: ['title', 'description'] },
    { name: 'lessons', fields: ['title', 'content'] },
    { name: 'announcements', fields: ['title', 'content'] },
    { name: 'resources', fields: ['title', 'description'] }
];

class AdvancedSearchService {
    /**
     * Execute advanced search across collections
     */
    async search(searchQuery: SearchQuery): Promise<SearchResponse> {
        return await Sentry.startSpan(
            { name: 'advancedSearch', op: 'search' },
            async () => {
                try {
                    if (isMockEnv()) {
                return {
                    results: MOCK_RESULTS,
                    total: MOCK_RESULTS.length,
                    page: 1,
                    perPage: 20,
                    facets: [
                        {
                            field: 'collection',
                            values: [
                                { value: 'tenants', count: 1 },
                                { value: 'users', count: 1 }
                            ]
                        }
                    ],
                    suggestions: ['acme school', 'acme university']
                };
            }

            const {
                query,
                collections = SEARCHABLE_COLLECTIONS.map(c => c.name),
                filters = [],
                sort = '-created',
                page = 1,
                perPage = 20,
                facets = ['collection'],
                tenantId
            } = searchQuery;

            // Search across multiple collections
            const results: SearchResult[] = [];
            const facetCounts: Record<string, Record<string, number>> = {};

            // Initialize facet counts
            facets.forEach(facet => {
                facetCounts[facet] = {};
            });

            for (const collectionName of collections) {
                const collectionConfig = SEARCHABLE_COLLECTIONS.find(c => c.name === collectionName);
                if (!collectionConfig) continue;

                try {
                    // Build search filter
                    const searchFilters: string[] = [];

                    // Add text search across all searchable fields
                    if (query) {
                        const fieldFilters = collectionConfig.fields.map(
                            field => `${field} ~ "${query}"`
                        );
                        searchFilters.push(`(${fieldFilters.join(' || ')})`);
                    }

                    // Add tenant filter if provided
                    if (tenantId) {
                        searchFilters.push(`tenantId = "${tenantId}"`);
                    }

                    // Add custom filters
                    filters.forEach(filter => {
                        const filterStr = this.buildFilterString(filter);
                        if (filterStr) searchFilters.push(filterStr);
                    });

                    const filterString = searchFilters.join(' && ');

                    // Execute search
                            const records = await pb.collection(collectionName).getList(1, 100, {
                                filter: filterString || undefined,
                                sort,
                                requestKey: null
                            });

                    // Calculate relevance scores and add to results
                    records.items.forEach(record => {
                        const score = this.calculateRelevanceScore(record, query, collectionConfig.fields);
                        const highlights = this.generateHighlights(record, query, collectionConfig.fields);

                        results.push({
                            collection: collectionName,
                            record: record as SearchRecord,
                            score,
                            highlights
                        });

                        // Update facet counts
                        facets.forEach(facetField => {
                            if (facetField === 'collection') {
                                facetCounts['collection'][collectionName] = (facetCounts['collection'][collectionName] || 0) + 1;
                            } else if (record[facetField]) {
                                const value = String(record[facetField]);
                                if (!facetCounts[facetField]) facetCounts[facetField] = {};
                                facetCounts[facetField][value] = (facetCounts[facetField][value] || 0) + 1;
                            }
                        });
                    });
                } catch (error) {
                    console.error(`Error searching collection ${collectionName}:`, error);
                }
            }

            // Sort by relevance score
            results.sort((a, b) => b.score - a.score);

            // Paginate results
            const start = (page - 1) * perPage;
            const end = start + perPage;
            const paginatedResults = results.slice(start, end);

            // Build facets response
            const facetsResponse: SearchFacet[] = Object.entries(facetCounts).map(([field, counts]) => ({
                field,
                values: Object.entries(counts)
                    .map(([value, count]) => ({ value, count }))
                    .sort((a, b) => b.count - a.count)
            }));

            // Generate suggestions (simplified - in production use proper fuzzy matching)
            const suggestions = this.generateSuggestions(query, results);

            return {
                results: paginatedResults,
                total: results.length,
                page,
                perPage,
                facets: facetsResponse,
                suggestions
            };
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
            }
        );
    }

    /**
     * Get search history for a user
     */
    async getSearchHistory(userId: string, limit: number = 10): Promise<any[]> {
        try {
            if (isMockEnv()) {
                return [
                    { query: 'acme school', timestamp: new Date().toISOString(), results: 2 },
                    { query: 'teacher assignments', timestamp: new Date().toISOString(), results: 15 }
                ];
            }

            return await pb.collection('search_history').getList(1, limit, {
                filter: `userId = "${userId}"`,
                sort: '-created',
                requestKey: null
            }).then(res => res.items);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Save search to history
     */
    async saveToHistory(userId: string, query: SearchQuery, resultsCount: number): Promise<void> {
        try {
            if (isMockEnv()) return;

            await pb.collection('search_history').create({
                userId,
                query: JSON.stringify(query),
                resultsCount,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    /**
     * Get saved searches for a user
     */
    async getSavedSearches(userId: string): Promise<SavedSearch[]> {
        try {
            if (isMockEnv()) {
                return [
                    {
                        id: '1',
                        name: 'Active Professional Tenants',
                        query: { query: '', filters: [{ field: 'plan', operator: 'eq', value: 'professional' }] },
                        userId,
                        isPublic: false,
                        created: new Date().toISOString(),
                        updated: new Date().toISOString()
                    }
                ];
            }

            const records = await pb.collection('saved_searches').getList(1, 50, {
                filter: `userId = "${userId}" || isPublic = true`,
                sort: '-created',
                requestKey: null
            });

            const parsed = records.items.map(parseSavedSearch).filter((s): s is SavedSearch => s !== null);
            return parsed;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Save a search for later use
     */
    async saveSearch(data: Omit<SavedSearch, 'id' | 'created' | 'updated'>): Promise<SavedSearch> {
        try {
            if (isMockEnv()) {
                return {
                    ...data,
                    id: 'mock-' + Date.now(),
                    created: new Date().toISOString(),
                    updated: new Date().toISOString()
                };
            }

            const record = await pb.collection('saved_searches').create({
                ...data,
                query: JSON.stringify(data.query)
            });

            const parsed = parseSavedSearch(record);
            if (parsed) return parsed;

            // Fallback: normalize manually
            return {
                id: record.id,
                name: (record as any).name || data.name,
                query: typeof (record as any).query === 'string' ? JSON.parse((record as any).query) : (record as any).query,
                userId: data.userId,
                isPublic: data.isPublic,
                created: record.created || new Date().toISOString(),
                updated: record.updated || new Date().toISOString()
            } as SavedSearch;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Delete a saved search
     */
    async deleteSavedSearch(searchId: string): Promise<void> {
        try {
            if (isMockEnv()) return;
            await pb.collection('saved_searches').delete(searchId);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Get popular searches across platform
     */
    async getPopularSearches(limit: number = 10): Promise<{ query: string; count: number }[]> {
        try {
            if (isMockEnv()) {
                return [
                    { query: 'assignment', count: 150 },
                    { query: 'teacher', count: 120 },
                    { query: 'grade', count: 95 }
                ];
            }

            // In production, this would aggregate search_history
            const history = await pb.collection('search_history').getList(1, 1000, {
                sort: '-created',
                requestKey: null
            });

            const queryCounts: Record<string, number> = {};
            history.items.forEach(item => {
                const queryObj = typeof item.query === 'string' ? JSON.parse(item.query) : item.query;
                const queryText = queryObj.query || '';
                if (queryText) {
                    queryCounts[queryText] = (queryCounts[queryText] || 0) + 1;
                }
            });

            return Object.entries(queryCounts)
                .map(([query, count]) => ({ query, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Build filter string for PocketBase
     */
    private buildFilterString(filter: SearchFilter): string {
        const { field, operator, value } = filter;

        switch (operator) {
            case 'eq':
                return `${field} = "${value}"`;
            case 'ne':
                return `${field} != "${value}"`;
            case 'gt':
                return `${field} > ${value}`;
            case 'gte':
                return `${field} >= ${value}`;
            case 'lt':
                return `${field} < ${value}`;
            case 'lte':
                return `${field} <= ${value}`;
            case 'in':
                const values = Array.isArray(value) ? value : [value];
                return `${field} ?~ "${values.join('|')}"`;
            case 'contains':
                return `${field} ~ "${value}"`;
            case 'startsWith':
                return `${field} ~ "^${value}"`;
            case 'endsWith':
                return `${field} ~ "${value}$"`;
            default:
                return '';
        }
    }

    /**
     * Calculate relevance score based on query match
     */
    private calculateRelevanceScore(record: SearchRecord, query: string, fields: string[]): number {
        if (!query) return 1;

        let score = 0;
        const queryLower = query.toLowerCase();

        fields.forEach(field => {
            const value = String(record[field] || '').toLowerCase();
            
            if (value === queryLower) {
                score += 1.0; // Exact match
            } else if (value.startsWith(queryLower)) {
                score += 0.8; // Starts with
            } else if (value.includes(queryLower)) {
                score += 0.5; // Contains
            } else {
                // Fuzzy match (simple word matching)
                const queryWords = queryLower.split(/\s+/);
                const matches = queryWords.filter(word => value.includes(word));
                score += (matches.length / queryWords.length) * 0.3;
            }
        });

        return Math.min(score / fields.length, 1);
    }

    /**
     * Generate highlights for matched fields
     */
    private generateHighlights(record: SearchRecord, query: string, fields: string[]): { field: string; snippet: string }[] {
        if (!query) return [];

        const highlights: { field: string; snippet: string }[] = [];
        const queryLower = query.toLowerCase();

        fields.forEach(field => {
            const value = String(record[field] || '');
            const valueLower = value.toLowerCase();

            if (valueLower.includes(queryLower)) {
                // Find position of match
                const matchIndex = valueLower.indexOf(queryLower);
                const start = Math.max(0, matchIndex - 30);
                const end = Math.min(value.length, matchIndex + query.length + 30);

                let snippet = value.substring(start, end);
                
                // Add ellipsis
                if (start > 0) snippet = '...' + snippet;
                if (end < value.length) snippet = snippet + '...';

                // Highlight the match
                const regex = new RegExp(`(${query})`, 'gi');
                snippet = snippet.replace(regex, '<em>$1</em>');

                highlights.push({ field, snippet });
            }
        });

        return highlights;
    }

    /**
     * Generate search suggestions based on results
     */
    private generateSuggestions(query: string, results: SearchResult[]): string[] {
        if (!query || results.length === 0) return [];

        const suggestions = new Set<string>();
        const queryLower = query.toLowerCase();

        results.slice(0, 10).forEach(result => {
            const config = SEARCHABLE_COLLECTIONS.find(c => c.name === result.collection);
            if (!config) return;

            config.fields.forEach(field => {
                const value = String(result.record[field] || '');
                if (value.toLowerCase().includes(queryLower) && value !== query) {
                    suggestions.add(value);
                }
            });
        });

        return Array.from(suggestions).slice(0, 5);
    }
}

export const advancedSearchService = new AdvancedSearchService();
