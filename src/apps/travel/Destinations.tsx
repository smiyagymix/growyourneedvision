/**
 * Travel Planning - Destinations Explorer
 * Browse and discover travel destinations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon, Card, Button } from '../../components/shared/ui/CommonUI';
import { travelApiService } from '../../services/travelApiService';
import { useRateLimit, RateLimitPresets } from '../../hooks/useRateLimit';
import { sanitizeText } from '../../utils/sanitization';
import { Spinner } from '../../components/shared/ui/Spinner';

interface DestinationsProps {
    onSelectDestination?: (destination: any) => void;
}

export const Destinations: React.FC<DestinationsProps> = ({ onSelectDestination }) => {
    const [destinations, setDestinations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    const { executeIfAllowed } = useRateLimit(RateLimitPresets.API_SEARCH);

    const regions = ['Europe', 'Asia', 'North America', 'South America', 'Middle East', 'Africa', 'Oceania'];

    useEffect(() => {
        loadDestinations();
    }, [selectedRegion]);

    const loadDestinations = async () => {
        setLoading(true);
        try {
            const results = await travelApiService.getFeaturedDestinations(12);
            if (selectedRegion) {
                setDestinations(results.filter(d => d.region === selectedRegion));
            } else {
                setDestinations(results);
            }
        } catch (error) {
            console.error('Failed to load destinations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadDestinations();
            return;
        }

        await executeIfAllowed(async () => {
            setLoading(true);
            try {
                // Sanitize search query to prevent injection
                const sanitizedQuery = sanitizeText(searchQuery);
                const results = await travelApiService.searchDestinations(sanitizedQuery);
                setDestinations(results);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[250px]">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search destinations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <Icon name="MagnifyingGlassIcon" className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <Button variant="primary" onClick={handleSearch}>
                        Search
                    </Button>
                </div>

                {/* Region Pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <button
                        onClick={() => setSelectedRegion(null)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            !selectedRegion
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        All Regions
                    </button>
                    {regions.map((region) => (
                        <button
                            key={region}
                            onClick={() => setSelectedRegion(region)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                selectedRegion === region
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {region}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Destinations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {destinations.map((dest, index) => (
                    <motion.div
                        key={dest.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card
                            className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                            padding="none"
                            onClick={() => onSelectDestination?.(dest)}
                        >
                            <div className="h-48 relative overflow-hidden">
                                {dest.image_url ? (
                                    <img
                                        src={dest.image_url}
                                        alt={dest.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3">
                                    <h3 className="font-bold text-xl text-white">{dest.name}</h3>
                                    <p className="text-white/80 text-sm">{dest.country}</p>
                                </div>
                                <div className="absolute top-3 right-3 bg-white/95 px-3 py-1 rounded-full text-xs font-bold">
                                    ${dest.average_cost_per_day}/day
                                </div>
                            </div>

                            <div className="p-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                    {dest.description}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                    <span className="flex items-center gap-1">
                                        <Icon name="SunIcon" className="w-4 h-4" />
                                        {dest.best_season}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Icon name="GlobeAltIcon" className="w-4 h-4" />
                                        {dest.region}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {dest.popular_activities?.slice(0, 3).map((activity: string, i: number) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                                        >
                                            {activity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {destinations.length === 0 && (
                <Card className="text-center py-12">
                    <Icon name="MapIcon" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No destinations found</h3>
                    <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
                </Card>
            )}
        </div>
    );
};

export default Destinations;
