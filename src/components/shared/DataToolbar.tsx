import React, { useState, useEffect } from 'react';

export interface SavedView {
    id: string;
    name: string;
    filter: string;
    sort: string;
}

export interface FilterOption {
    field: string;
    label: string;
    type: 'select' | 'text' | 'date' | 'boolean';
    options?: { label: string; value: string }[];
}

interface DataToolbarProps {
    onSearch?: (term: string) => void; // Legacy/Simple
    onFilterChange?: (filterString: string) => void; // Advanced
    onExport: () => void;
    onRefresh: () => void;
    onLoadView?: (view: SavedView) => void;
    loading?: boolean;
    placeholder?: string;
    collectionName: string;
    filterOptions?: FilterOption[];
    totalCount?: number;
    lastRefreshed?: string;
}

export const DataToolbar: React.FC<DataToolbarProps> = ({
    onSearch,
    onFilterChange,
    onExport,
    onRefresh,
    onLoadView,
    loading,
    placeholder = "Search...",
    collectionName,
    filterOptions = [],
    totalCount,
    lastRefreshed,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [showViewsMenu, setShowViewsMenu] = useState(false);
    const [showFiltersMenu, setShowFiltersMenu] = useState(false);
    const [newViewName, setNewViewName] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem(`views_${collectionName}`);
        if (saved) {
            try {
                setSavedViews(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved views", e);
            }
        }
    }, [collectionName]);

    // Construct and emit filter string whenever search or filters change
    useEffect(() => {
        if (!onFilterChange) return;

        const parts: string[] = [];
        
        // 1. Search Term (Heuristic: search in generic fields if not specified)
        // Ideally, the parent should define what "search" means.
        // But for now, let's assume if onSearch is NOT provided, we handle it here.
        // If onSearch IS provided, we assume the parent handles the search term separately or we just pass it.
        // Actually, let's just pass the raw search term if onSearch is used.
        // But if onFilterChange is used, we want to combine everything.
        
        if (searchTerm) {
             // We don't know which fields to search without config.
             // So we'll just emit the search term separately via onSearch if available.
             // If onFilterChange is the only one, we might need a 'searchField' prop.
             // For now, let's assume the consumer handles 'searchTerm' via onSearch,
             // and 'activeFilters' via onFilterChange.
             // Wait, that splits the logic.
             
             // Let's try to be smart:
             // If filterOptions are present, we assume we are in "Advanced Mode".
             // We will construct a filter string for the *filters* only, 
             // and let the parent combine it with search if they want, 
             // OR we can try to combine it here if we knew the search fields.
        }

        const filterParts = Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            return `${key} = "${value}"`;
        }).filter(Boolean) as string[];

        const filterString = filterParts.join(' && ');
        onFilterChange(filterString);

    }, [activeFilters, onFilterChange]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (onSearch) onSearch(val);
    };

    const handleFilterValueChange = (field: string, value: string) => {
        setActiveFilters(prev => {
            const next = { ...prev, [field]: value };
            if (!value) delete next[field];
            return next;
        });
    };

    const saveCurrentView = () => {
        if (!newViewName.trim()) return;
        
        // Construct full filter string for saving
        const filterParts = Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            return `${key} = "${value}"`;
        }).filter(Boolean) as string[];
        const filterString = filterParts.join(' && ');

        const newView: SavedView = {
            id: Date.now().toString(),
            name: newViewName,
            filter: filterString, // We save the structured filter
            sort: '' 
        };
        // Note: We aren't saving the 'searchTerm' here in the filter string 
        // unless we merge it. For now, saved views only save the "Advanced Filters".
        
        const updated = [...savedViews, newView];
        setSavedViews(updated);
        localStorage.setItem(`views_${collectionName}`, JSON.stringify(updated));
        setNewViewName('');
    };

    const deleteView = (id: string) => {
        const updated = savedViews.filter(v => v.id !== id);
        setSavedViews(updated);
        localStorage.setItem(`views_${collectionName}`, JSON.stringify(updated));
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            {/* Search */}
            <div className="relative w-full sm:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 mr-2">
                    {typeof totalCount === 'number' && (
                        <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Total: {totalCount.toLocaleString()}</span>
                    )}
                    {lastRefreshed && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Updated {lastRefreshed}</span>
                    )}
                </div>
                {/* Filters Dropdown */}
                {filterOptions.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                Object.keys(activeFilters).length > 0
                                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-900 dark:text-indigo-200'
                                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                        >
                            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {Object.keys(activeFilters).length > 0 && (
                                <span className="ml-2 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200 py-0.5 px-2 rounded-full text-xs">
                                    {Object.keys(activeFilters).length}
                                </span>
                            )}
                        </button>

                        {showFiltersMenu && (
                            <div className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10 p-4">
                                <div className="space-y-4">
                                    {filterOptions.map((option) => (
                                        <div key={option.field}>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                {option.label}
                                            </label>
                                            {option.type === 'select' && option.options ? (
                                                <select
                                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    value={activeFilters[option.field] || ''}
                                                    onChange={(e) => handleFilterValueChange(option.field, e.target.value)}
                                                >
                                                    <option value="">All</option>
                                                    {option.options.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={option.type === 'date' ? 'date' : 'text'}
                                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 border"
                                                    value={activeFilters[option.field] || ''}
                                                    onChange={(e) => handleFilterValueChange(option.field, e.target.value)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={() => {
                                                setActiveFilters({});
                                                setShowFiltersMenu(false);
                                            }}
                                            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 mr-3"
                                        >
                                            Clear All
                                        </button>
                                        <button
                                            onClick={() => setShowFiltersMenu(false)}
                                            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Saved Views Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowViewsMenu(!showViewsMenu)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Views
                    </button>
                    
                    {showViewsMenu && (
                        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                            <div className="p-2">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Saved Views</div>
                                {savedViews.length === 0 ? (
                                    <div className="text-sm text-gray-500 italic px-2 py-1">No saved views</div>
                                ) : (
                                    <ul className="space-y-1">
                                        {savedViews.map(view => (
                                            <li key={view.id} className="flex justify-between items-center group px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                                <button
                                                    onClick={() => {
                                                        setSearchTerm(view.filter);
                                                        onSearch?.(view.filter);
                                                        if (onLoadView) onLoadView(view);
                                                        setShowViewsMenu(false);
                                                    }}
                                                    className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1 text-left"
                                                >
                                                    {view.name}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteView(view.id);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                                >
                                                    &times;
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="View name"
                                        className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-transparent"
                                        value={newViewName}
                                        onChange={(e) => setNewViewName(e.target.value)}
                                    />
                                    <button
                                        onClick={saveCurrentView}
                                        disabled={!newViewName.trim()}
                                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={onRefresh}
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                >
                    <svg className={`mr-2 h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>

                <button
                    onClick={onExport}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                >
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                </button>
            </div>
        </div>
    );
};
