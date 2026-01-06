import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '../../lib/pocketbase';
import { useHotkeys } from '../../hooks/useHotkeys';

interface SearchResult {
    id: string;
    collectionId: string;
    collectionName: string;
    title: string; // mapped from name, title, etc.
    description?: string;
    link: string;
}

export const GlobalSearch: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Toggle with Ctrl+K or Cmd+K
    useHotkeys(['ctrl+k', 'meta+k'], (e) => {
        e.preventDefault();
        setIsOpen(prev => !prev);
    });

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const handler = setTimeout(async () => {
            setLoading(true);
            try {
                // Parallel search across collections
                // Adjust collections based on actual schema
                const collections = [
                    { name: 'users', titleField: 'name', linkPrefix: '/profile' },
                    // Add other collections here as they become available
                    // { name: 'activities', titleField: 'title', linkPrefix: '/activities' },
                    // { name: 'events', titleField: 'name', linkPrefix: '/events' },
                ];

                const promises = collections.map(async (col) => {
                    try {
                        const res = await pb.collection(col.name).getList(1, 5, {
                            filter: `${col.titleField} ~ "${query}"`,
                        });
                        return res.items.map(item => ({
                            id: item.id,
                            collectionId: item.collectionId,
                            collectionName: col.name,
                            title: item[col.titleField],
                            description: col.name, // Simple description
                            link: `${col.linkPrefix}/${item.id}`
                        }));
                    } catch (e) {
                        return [];
                    }
                });

                const allResults = (await Promise.all(promises)).flat();
                setResults(allResults);
            } catch (err) {
                console.error("Global search failed", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" 
                aria-hidden="true"
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Modal Panel */}
            <div className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
                <div className="relative">
                    <svg className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-0 sm:text-sm"
                        placeholder="Search users, activities, events..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setIsOpen(false);
                        }}
                    />
                </div>

                {/* Results */}
                {(query !== '' || results.length > 0) && (
                    <ul className="max-h-72 scroll-py-2 overflow-y-auto py-2 text-sm text-gray-800 dark:text-gray-200">
                        {loading ? (
                            <li className="px-4 py-2 text-gray-500">Searching...</li>
                        ) : results.length === 0 && query !== '' ? (
                            <li className="px-4 py-2 text-gray-500">No results found.</li>
                        ) : (
                            results.map((result) => (
                                <li 
                                    key={result.id}
                                    className="cursor-pointer select-none px-4 py-2 hover:bg-indigo-600 hover:text-white"
                                    onClick={() => {
                                        navigate(result.link);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="font-medium">{result.title}</div>
                                    <div className="text-xs opacity-70 capitalize">{result.collectionName}</div>
                                </li>
                            ))
                        )}
                    </ul>
                )}
                
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>Type to search</span>
                    <span><kbd className="font-sans">ESC</kbd> to close</span>
                </div>
            </div>
        </div>
    );
};
