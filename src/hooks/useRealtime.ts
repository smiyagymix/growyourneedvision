import { useEffect, useState } from 'react';
import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';

export function useRealtime<T extends RecordModel>(collection: string, filter?: string) {
    const [records, setRecords] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchInitial = async () => {
            try {
                const result = await pb.collection(collection).getList<T>(1, 50, {
                    sort: '-created',
                    filter: filter || '',
                });
                if (isMounted) {
                    setRecords(result.items);
                    setLoading(false);
                }
            } catch (error) {
                console.error(`Error fetching initial data for ${collection}:`, error);
                if (isMounted) setLoading(false);
            }
        };

        fetchInitial();

        const subscribe = async () => {
            try {
                await pb.collection(collection).subscribe<T>('*', (e) => {
                    if (!isMounted) return;

                    setRecords((prev) => {
                        let newRecords = [...prev];
                        
                        if (e.action === 'create') {
                            // Ideally check filter here
                            newRecords = [e.record, ...newRecords];
                        } else if (e.action === 'update') {
                            newRecords = newRecords.map((r) => (r.id === e.record.id ? e.record : r));
                        } else if (e.action === 'delete') {
                            newRecords = newRecords.filter((r) => r.id !== e.record.id);
                        }
                        return newRecords;
                    });
                });
            } catch (error) {
                console.error(`Error subscribing to ${collection}:`, error);
            }
        };

        subscribe();

        return () => {
            isMounted = false;
            pb.collection(collection).unsubscribe('*');
        };
    }, [collection, filter]);

    return { records, loading };
}
