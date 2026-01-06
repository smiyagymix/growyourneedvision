import React, { useState, useEffect } from 'react';
import { Icon, Button, Card } from '../components/shared/ui/CommonUI';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import { travelService, TravelDestination, TravelBooking } from '../services/travelService';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/shared/LoadingScreen';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/useToast';

interface TravelAppProps {
    activeTab: string;
    activeSubNav: string;
}

const TravelApp: React.FC<TravelAppProps> = ({ activeTab, activeSubNav }) => {
    const { user } = useAuth();
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [searchParams, setSearchParams] = useState({ from: '', to: '', date: '' });
    const [destinations, setDestinations] = useState<TravelDestination[]>([]);
    const [bookings, setBookings] = useState<TravelBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            if (activeTab === 'Explore' || activeTab === 'Home') {
                const featuredDest = await travelService.getFeaturedDestinations(6);
                setDestinations(featuredDest);
            } else if (activeTab === 'My Trips') {
                const userBookings = await travelService.getUserBookings(user.id);
                setBookings(userBookings);
            }
        } catch (error) {
            console.error('Failed to load travel data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchParams.from || !searchParams.to) {
            showToast('Please enter both origin and destination', 'error');
            return;
        }

        try {
            setLoading(true);
            // In production, this would search real flight APIs
            const results = await travelService.searchFlights(
                searchParams.from,
                searchParams.to,
                searchParams.date
            );
            console.log('Search results:', results);
            alert(`Found ${results.length} options! (Check console for details)`);
                    showToast(`Found ${results.length} options! (Check console for details)`, 'success');
        } catch (error) {
            console.error('Search failed:', error);
            showToast('Search failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && activeTab !== 'Home' && activeTab !== 'Explore') {
        return <LoadingScreen />;
    }

    const renderMyTrips = () => {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Trips</h2>
                    <Button variant="primary">
                        <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                        New Booking
                    </Button>
                </div>

                {bookings.length > 0 ? (
                    <div className="space-y-4">
                        {bookings.map((booking, index) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl
                        ${booking.type === 'Flight' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                    booking.type === 'Hotel' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                                        'bg-green-100 dark:bg-green-900/30'}`}>
                                                {booking.type === 'Flight' ? '✈️' : booking.type === 'Hotel' ? '🏨' : '🚗'}
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                                    {booking.origin ? `${booking.origin} → ` : ''}{booking.destination}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(booking.start_date).toLocaleDateString()}
                                                    {booking.end_date && ` - ${new Date(booking.end_date).toLocaleDateString()}`}
                                                </p>
                                                {booking.confirmation_code && (
                                                    <p className="text-xs text-gray-500 font-mono mt-1">
                                                        Confirmation: {booking.confirmation_code}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                ${booking.total_cost.toLocaleString()}
                                            </div>
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold
                        ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        booking.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-gray-100 text-gray-700'}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <Icon name="GlobeAltIcon" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No trips yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Start planning your next adventure!</p>
                        <Button variant="primary">
                            Search Destinations
                        </Button>
                    </Card>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col animate-fadeIn">
            {/* Hero Section with Search */}
            <div className="h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative rounded-xl overflow-hidden mb-6 flex items-center justify-center group shrink-0">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 text-center text-white">
                    <h1 className="text-5xl font-black drop-shadow-2xl mb-2">
                        {activeTab === 'Maps' ? 'Navigate Your World' :
                            activeTab === 'My Trips' ? 'Your Journeys' :
                                'Explore the World'}
                    </h1>
                    <p className="text-xl opacity-90 drop-shadow-lg">
                        {activeSubNav || 'Your next adventure awaits'}
                    </p>
                </div>
            </div>

            {/* Search Widget */}
            {activeTab !== 'My Trips' && (
                <Card variant="default" className="p-6 mb-8">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
                                From
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="New York (JFK)"
                                value={searchParams.from}
                                onChange={e => setSearchParams({ ...searchParams, from: e.target.value })}
                            />
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
                                To
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Tokyo (HND)"
                                value={searchParams.to}
                                onChange={e => setSearchParams({ ...searchParams, to: e.target.value })}
                            />
                        </div>

                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchParams.date}
                                onChange={e => setSearchParams({ ...searchParams, date: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="h-[50px] px-4 border-purple-300 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                onClick={() => setIsAIModalOpen(true)}
                                title="Generate Itinerary with AI"
                            >
                                <Icon name="Sparkles" className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="primary"
                                className="h-[50px] px-8"
                                onClick={handleSearch}
                            >
                                <Icon name="MagnifyingGlassIcon" className="w-5 h-5 mr-2" />
                                Search
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Content Based on Tab */}
            {activeTab === 'My Trips' ? (
                renderMyTrips()
            ) : (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Icon name="SparklesIcon" className="w-6 h-6 text-yellow-500" />
                        Featured Destinations
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {destinations.map((dest, index) => (
                            <motion.div
                                key={dest.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card variant="default" className="overflow-hidden hover:shadow-xl transition-all p-0 cursor-pointer group">
                                    <div className="h-48 bg-gradient-to-br from-blue-200 to-purple-300 dark:from-blue-800 dark:to-purple-900 relative overflow-hidden">
                                        {dest.image_url && (
                                            <img src={dest.image_url} alt={dest.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <h3 className="font-bold text-xl text-white drop-shadow-lg">{dest.name}</h3>
                                            <p className="text-sm text-white/90">{dest.country}</p>
                                        </div>
                                        <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-800/95 px-3 py-1 rounded-full text-xs font-bold text-gray-900 dark:text-white">
                                            From ${dest.average_cost_per_day}/day
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                            {dest.description}
                                        </p>

                                        <div className="flex items-center gap-2 text-xs mb-3">
                                            <Icon name="CalendarIcon" className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600 dark:text-gray-400">Best: {dest.best_season}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-1">
                                            {dest.popular_activities.slice(0, 3).map((activity, i) => (
                                                <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                                    {activity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {destinations.length === 0 && !loading && (
                        <Card className="text-center py-12">
                            <Icon name="MapIcon" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No destinations found</h3>
                            <p className="text-gray-600 dark:text-gray-400">Check back later for featured destinations!</p>
                        </Card>
                    )}
                </div>
            )}

            {/* AI Modal */}
            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={(content) => {
                    console.log("Itinerary:", content);
                    setIsAIModalOpen(false);
                    alert("Itinerary Generated! (Check console)");
                }}
                title="Generate Travel Itinerary"
                promptTemplate={`Create a detailed 5-day travel itinerary for a trip from ${searchParams.from || '[Origin]'} to ${searchParams.to || '[Destination]'}.
        
        For each day include:
        - Morning activities (with locations and timing)
        - Afternoon activities
        - Evening activities
        - Restaurant recommendations
        - Estimated daily budget
        
        Also provide:
        - Must-visit landmarks
        - Local transportation tips
        - Best time to visit each attraction
        - Cultural etiquette tips`}
                contextData={searchParams}
            />
        </div>
    );
};

export default TravelApp;