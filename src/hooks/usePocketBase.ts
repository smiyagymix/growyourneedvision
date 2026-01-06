import { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';

interface UsePocketBaseOptions {
    sort?: string;
    filter?: string;
    expand?: string;
    page?: number;
    perPage?: number;
    realtime?: boolean;
}

export function usePocketBase<T extends RecordModel>(collectionName: string, options: UsePocketBaseOptions = {}) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [totalItems, setTotalItems] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (options.page && options.perPage) {
                const result = await pb.collection(collectionName).getList<T>(options.page, options.perPage, {
                    sort: options.sort,
                    filter: options.filter,
                    expand: options.expand,
                });
                setData(result.items);
                setTotalItems(result.totalItems);
            } else {
                const result = await pb.collection(collectionName).getFullList<T>({
                    sort: options.sort,
                    filter: options.filter,
                    expand: options.expand,
                });
                setData(result);
                setTotalItems(result.length);
            }
            setError(null);
        } catch (err: any) {
            console.error(`Error fetching ${collectionName}:`, err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        if (options.realtime) {
            pb.collection(collectionName).subscribe('*', (e) => {
                // Optimistic update or refetch
                // For simplicity, we refetch. In production, you might want to merge changes.
                fetchData();
            });

            return () => {
                pb.collection(collectionName).unsubscribe('*');
            };
        }
    }, [collectionName, options.sort, options.filter, options.expand, options.page, options.perPage, options.realtime]);

    return { data, loading, error, totalItems, refetch: fetchData };
}
