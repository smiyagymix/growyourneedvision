import { useState, useEffect, useCallback, useRef } from 'react';
import pb from '../lib/pocketbase';
import { ListResult } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

// Lightweight canned data to keep UIs rendering in e2e/mock environments
// when PocketBase is unavailable. Add more collections here as needed.
const MOCK_COLLECTIONS: Record<string, any[]> = {
    crm_inquiries: [
        { id: 'inq1', collectionId: 'mock', collectionName: 'crm_inquiries', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Taylor Morgan', email: 'taylor@example.com', grade_interest: 'Grade 9', status: 'New Inquiry', source: 'Website' },
        { id: 'inq2', collectionId: 'mock', collectionName: 'crm_inquiries', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Jordan Lee', email: 'jordan@example.com', grade_interest: 'Grade 10', status: 'Contacted', source: 'Open House' },
        { id: 'inq3', collectionId: 'mock', collectionName: 'crm_inquiries', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Sam Rivera', email: 'sam@example.com', grade_interest: 'Grade 8', status: 'Offer Sent', source: 'Referral' },
    ],
    crm_interactions: [
        { id: 'int1', collectionId: 'mock', collectionName: 'crm_interactions', created: new Date().toISOString(), updated: new Date().toISOString(), summary: 'Intro call completed', type: 'call', inquiry: 'inq1', owner: 'Owner Admin' },
        { id: 'int2', collectionId: 'mock', collectionName: 'crm_interactions', created: new Date().toISOString(), updated: new Date().toISOString(), summary: 'Campus tour scheduled', type: 'meeting', inquiry: 'inq2', owner: 'Owner Admin' },
    ],
    classes: [
        { id: 'cls1', collectionId: 'mock', collectionName: 'classes', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Algebra I', teacher: 'Ms. Parker', room: '201', schedule: 'MWF 9:00' },
        { id: 'cls2', collectionId: 'mock', collectionName: 'classes', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Biology', teacher: 'Dr. Singh', room: '305', schedule: 'TTh 10:30' },
    ],
};

export interface DataQueryOptions {
    page?: number;
    perPage?: number;
    sort?: string;
    filter?: string;
    expand?: string;
    fields?: string;
    requestKey?: string | null;
}

export interface DataQueryResult<T> {
    items: T[];
    totalItems: number;
    totalPages: number;
    loading: boolean;
    error: Error | null;
    page: number;
    perPage: number;
    sort: string;
    filter: string;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    setSort: (sort: string) => void;
    setFilter: (filter: string) => void;
    refresh: () => Promise<void>;
    exportData: (filename?: string) => Promise<void>;
}

export function useDataQuery<T = any>(
    collectionName: string, 
    initialOptions: DataQueryOptions = {}
): DataQueryResult<T> {
    const [items, setItems] = useState<T[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    
    const [page, setPage] = useState(initialOptions.page || 1);
    const [perPage, setPerPage] = useState(initialOptions.perPage || 20);
    const [sort, setSort] = useState(initialOptions.sort || '-created');
    const [filter, setFilter] = useState(initialOptions.filter || '');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Debounce filter changes
    const [debouncedFilter, setDebouncedFilter] = useState(filter);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilter(filter);
            setPage(1); // Reset to page 1 on filter change
        }, 500);
        return () => clearTimeout(handler);
    }, [filter]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Short-circuit with mock data when in e2e/mock environments
        if (isMockEnv() && MOCK_COLLECTIONS[collectionName]) {
            const mockItems = MOCK_COLLECTIONS[collectionName];
            setItems(mockItems);
            setTotalItems(mockItems.length);
            setTotalPages(1);
            setLoading(false);
            return;
        }

        try {
            const listOptions: any = {
                sort,
                expand: initialOptions.expand,
                fields: initialOptions.fields,
                requestKey: initialOptions.requestKey ?? null // Allow override
            };

            if (debouncedFilter && debouncedFilter.trim().length > 0) {
                listOptions.filter = debouncedFilter.trim();
            }

            const result = await pb.collection(collectionName).getList<T>(page, perPage, listOptions);
            
            setItems(result.items);
            setTotalItems(result.totalItems);
            setTotalPages(result.totalPages);
        } catch (err: any) {
            console.error(`Error fetching data from ${collectionName}:`, err);
            setError(err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [collectionName, page, perPage, sort, debouncedFilter, initialOptions.expand, initialOptions.fields, initialOptions.requestKey]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = async () => {
        await fetchData();
    };

    const exportData = async (filename = 'export.csv') => {
        try {
            // Use mock data when available in mock environments
            if (isMockEnv() && MOCK_COLLECTIONS[collectionName]) {
                const result = MOCK_COLLECTIONS[collectionName];
                if (!result.length) return;
                const headers = Object.keys(result[0] as object).join(',');
                const rows = result.map(row => 
                    Object.values(row as object).map(val => 
                        typeof val === 'object' ? JSON.stringify(val) : String(val)
                    ).join(',')
                );
                const csvContent = [headers, ...rows].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // Fetch all data matching current filter/sort
            const fullListOptions: any = {
                sort,
                expand: initialOptions.expand,
                fields: initialOptions.fields,
            };

            if (debouncedFilter && debouncedFilter.trim().length > 0) {
                fullListOptions.filter = debouncedFilter.trim();
            }

            const result = await pb.collection(collectionName).getFullList<T>(fullListOptions);

            if (!result.length) return;

            // Convert to CSV
            const headers = Object.keys(result[0] as object).join(',');
            const rows = result.map(row => 
                Object.values(row as object).map(val => 
                    typeof val === 'object' ? JSON.stringify(val) : String(val)
                ).join(',')
            );
            const csvContent = [headers, ...rows].join('\n');

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed. See console for details.");
        }
    };

    return {
        items,
        totalItems,
        totalPages,
        loading,
        error,
        page,
        perPage,
        sort,
        filter,
        setPage,
        setPerPage,
        setSort,
        setFilter,
        refresh,
        exportData
    };
}
