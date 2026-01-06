/**
 * Travel Planning - Itinerary Builder
 * Create and manage day-by-day travel itineraries
 */

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, Card, Button } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import { travelService, TravelItinerary, DayPlan, DayActivity } from '../../services/travelService';
import { Spinner } from '../../components/shared/ui/Spinner';
import { isMockEnv } from '../../utils/mockData';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const itinerarySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  destination: z.string().min(2, 'Destination is required').max(100, 'Destination too long'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  total_budget: z.number().min(0, 'Budget must be positive').optional()
}).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date']
});

interface ItineraryBuilderProps {
    destination?: string;
}

const MOCK_ITINERARIES: TravelItinerary[] = [
    {
        id: 'IT001',
        user: 'mock-user',
        title: 'Paris Adventure',
        destination: 'Paris, France',
        start_date: '2025-03-15',
        end_date: '2025-03-20',
        days: [
            {
                date: '2025-03-15',
                activities: [
                    { time: '09:00', activity: 'Arrival at CDG Airport', location: 'Charles de Gaulle Airport' },
                    { time: '12:00', activity: 'Check-in at Hotel', location: 'Le Marais District' },
                    { time: '15:00', activity: 'Walking tour of Le Marais', location: 'Le Marais' },
                    { time: '19:00', activity: 'Dinner', location: 'Café de Flore', cost: 50 }
                ]
            },
            {
                date: '2025-03-16',
                activities: [
                    { time: '09:00', activity: 'Eiffel Tower Visit', location: 'Champ de Mars', cost: 26 },
                    { time: '12:00', activity: 'Lunch at Trocadéro', location: 'Trocadéro', cost: 35 },
                    { time: '14:00', activity: 'Seine River Cruise', location: 'Pont de l\'Alma', cost: 18 },
                    { time: '18:00', activity: 'Montmartre exploration', location: 'Montmartre' }
                ]
            }
        ],
        total_budget: 2500,
        status: 'Planning',
        shared_with: [],
        created: new Date().toISOString()
    }
];

export const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({ destination }) => {
    const { user } = useAuth();
    const [itineraries, setItineraries] = useState<TravelItinerary[]>([]);
    const [selectedItinerary, setSelectedItinerary] = useState<TravelItinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newItinerary, setNewItinerary] = useState({
        title: '',
        destination: destination || '',
        start_date: '',
        end_date: '',
        total_budget: 0
    });

    useEffect(() => {
        loadItineraries();
    }, [user]);

    const loadItineraries = async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (isMockEnv()) {
                setItineraries(MOCK_ITINERARIES);
            } else {
                const results = await travelService.getUserItineraries(user.id);
                setItineraries(results);
            }
        } catch (error) {
            console.error('Failed to load itineraries:', error);
            setItineraries(MOCK_ITINERARIES);
        } finally {
            setLoading(false);
        }
    };

    const { showToast } = useToast();
    
    const handleCreateItinerary = async () => {
        if (!user) {
            showToast('User not authenticated', 'error');
            return;
        }
        
        // Sanitize inputs
        const sanitized = {
            title: sanitizeText(newItinerary.title),
            destination: sanitizeText(newItinerary.destination),
            start_date: newItinerary.start_date,
            end_date: newItinerary.end_date,
            total_budget: newItinerary.total_budget
        };
        
        // Validate
        const result = itinerarySchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        try {
            const startDate = new Date(result.data.start_date);
            const endDate = new Date(result.data.end_date);
            const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            const days: DayPlan[] = Array.from({ length: dayCount }, (_, i) => {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                return {
                    date: date.toISOString().split('T')[0],
                    activities: []
                };
            });

            if (isMockEnv()) {
                const mockItinerary: TravelItinerary = {
                    id: `IT${Date.now()}`,
                    user: user.id,
                    title: result.data.title,
                    destination: result.data.destination,
                    start_date: result.data.start_date,
                    end_date: result.data.end_date,
                    days,
                    total_budget: result.data.total_budget || 0,
                    status: 'Planning',
                    shared_with: [],
                    created: new Date().toISOString()
                };
                setItineraries([mockItinerary, ...itineraries]);
                setSelectedItinerary(mockItinerary);
            } else {
                const created = await travelService.createItinerary({
                    user: user.id,
                    ...newItinerary,
                    days,
                    status: 'Planning',
                    shared_with: []
                });
                const newItineraryRecord = created as unknown as TravelItinerary;
                setItineraries([newItineraryRecord, ...itineraries]);
                setSelectedItinerary(newItineraryRecord);
            }

            setIsCreating(false);
            setNewItinerary({ title: '', destination: '', start_date: '', end_date: '', total_budget: 0 });
        } catch (error) {
            console.error('Failed to create itinerary:', error);
            alert('Failed to create itinerary');
        }
    };

    const addActivity = (dayIndex: number) => {
        if (!selectedItinerary) return;

        const activity: DayActivity = {
            time: '12:00',
            activity: 'New Activity',
            location: '',
            cost: 0
        };

        const updatedDays = [...selectedItinerary.days];
        updatedDays[dayIndex] = {
            ...updatedDays[dayIndex],
            activities: [...updatedDays[dayIndex].activities, activity]
        };

        setSelectedItinerary({
            ...selectedItinerary,
            days: updatedDays
        });
    };

    const updateActivity = (dayIndex: number, activityIndex: number, field: keyof DayActivity, value: string | number) => {
        if (!selectedItinerary) return;

        const updatedDays = [...selectedItinerary.days];
        updatedDays[dayIndex].activities[activityIndex] = {
            ...updatedDays[dayIndex].activities[activityIndex],
            [field]: value
        };

        setSelectedItinerary({
            ...selectedItinerary,
            days: updatedDays
        });
    };

    const removeActivity = (dayIndex: number, activityIndex: number) => {
        if (!selectedItinerary) return;

        const updatedDays = [...selectedItinerary.days];
        updatedDays[dayIndex].activities.splice(activityIndex, 1);

        setSelectedItinerary({
            ...selectedItinerary,
            days: updatedDays
        });
    };

    const calculateTotalCost = () => {
        if (!selectedItinerary) return 0;
        return selectedItinerary.days.reduce((total, day) => {
            return total + day.activities.reduce((dayTotal, act) => dayTotal + (act.cost || 0), 0);
        }, 0);
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Itineraries</h2>
                    <p className="text-gray-600 dark:text-gray-400">Plan your trips day by day</p>
                </div>
                <Button variant="primary" onClick={() => setIsCreating(true)}>
                    <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                    New Itinerary
                </Button>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setIsCreating(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Itinerary</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Trip Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={newItinerary.title}
                                        onChange={(e) => setNewItinerary({ ...newItinerary, title: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., Summer in Paris"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Destination
                                    </label>
                                    <input
                                        type="text"
                                        value={newItinerary.destination}
                                        onChange={(e) => setNewItinerary({ ...newItinerary, destination: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., Paris, France"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Start Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={newItinerary.start_date}
                                            onChange={(e) => setNewItinerary({ ...newItinerary, start_date: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            End Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={newItinerary.end_date}
                                            onChange={(e) => setNewItinerary({ ...newItinerary, end_date: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Budget ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={newItinerary.total_budget || ''}
                                        onChange={(e) => setNewItinerary({ ...newItinerary, total_budget: parseInt(e.target.value) || 0 })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="outline" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleCreateItinerary}>
                                    Create Itinerary
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Itinerary List */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Your Trips</h3>
                    {itineraries.map((itinerary) => (
                        <Card
                            key={itinerary.id}
                            className={`cursor-pointer transition-all ${
                                selectedItinerary?.id === itinerary.id
                                    ? 'ring-2 ring-blue-500'
                                    : 'hover:shadow-md'
                            }`}
                            onClick={() => setSelectedItinerary(itinerary)}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{itinerary.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{itinerary.destination}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    itinerary.status === 'Planning' ? 'bg-yellow-100 text-yellow-700' :
                                    itinerary.status === 'Booked' ? 'bg-green-100 text-green-700' :
                                    itinerary.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {itinerary.status}
                                </span>
                            </div>
                        </Card>
                    ))}

                    {itineraries.length === 0 && (
                        <Card className="text-center py-8">
                            <Icon name="CalendarIcon" className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-600 dark:text-gray-400">No itineraries yet</p>
                            <Button variant="outline" className="mt-3" onClick={() => setIsCreating(true)}>
                                Create your first
                            </Button>
                        </Card>
                    )}
                </div>

                {/* Itinerary Detail */}
                <div className="lg:col-span-2">
                    {selectedItinerary ? (
                        <Card className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedItinerary.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">{selectedItinerary.destination}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Estimated Cost</p>
                                    <p className="text-2xl font-bold text-green-600">${calculateTotalCost()}</p>
                                    {selectedItinerary.total_budget > 0 && (
                                        <p className="text-xs text-gray-500">
                                            of ${selectedItinerary.total_budget} budget
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Day-by-Day View */}
                            <div className="space-y-6">
                                {selectedItinerary.days.map((day, dayIndex) => (
                                    <div key={day.date} className="border-l-4 border-blue-500 pl-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                Day {dayIndex + 1} - {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </h4>
                                            <Button variant="outline" size="sm" onClick={() => addActivity(dayIndex)}>
                                                <Icon name="PlusIcon" className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            {day.activities.map((activity, actIndex) => (
                                                <div key={actIndex} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                                    <input
                                                        type="time"
                                                        value={activity.time}
                                                        onChange={(e) => updateActivity(dayIndex, actIndex, 'time', e.target.value)}
                                                        className="w-24 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={activity.activity}
                                                        onChange={(e) => updateActivity(dayIndex, actIndex, 'activity', e.target.value)}
                                                        className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                                        placeholder="Activity"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={activity.location || ''}
                                                        onChange={(e) => updateActivity(dayIndex, actIndex, 'location', e.target.value)}
                                                        className="w-32 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                                        placeholder="Location"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={activity.cost || ''}
                                                        onChange={(e) => updateActivity(dayIndex, actIndex, 'cost', parseInt(e.target.value) || 0)}
                                                        className="w-20 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                                        placeholder="$0"
                                                    />
                                                    <button
                                                        onClick={() => removeActivity(dayIndex, actIndex)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                    >
                                                        <Icon name="TrashIcon" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            {day.activities.length === 0 && (
                                                <p className="text-sm text-gray-500 italic">No activities planned</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <Card className="p-6 text-center">
                            <Icon name="MapIcon" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select an Itinerary</h3>
                            <p className="text-gray-600 dark:text-gray-400">Choose an itinerary from the list or create a new one</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItineraryBuilder;
