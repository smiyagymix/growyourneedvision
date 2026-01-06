import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface FlightDetails {
    airline: string;
    flightNumber: string;
    seat?: string;
    gate?: string;
}

export interface HotelDetails {
    hotelName: string;
    roomType: string;
    address: string;
}

export type BookingDetails = FlightDetails | HotelDetails | Record<string, unknown>;

export interface DayActivity {
    time: string;
    activity: string;
    location?: string;
    cost?: number;
}

export interface DayPlan {
    date: string;
    activities: DayActivity[];
    notes?: string;
}

export interface TravelBooking {
    id: string;
    user: string;
    type: 'Flight' | 'Hotel' | 'Car' | 'Package';
    destination: string;
    origin?: string;
    start_date: string;
    end_date?: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
    total_cost: number;
    details: BookingDetails;
    confirmation_code?: string;
    created: string;
}

export interface TravelDestination {
    id: string;
    name: string;
    country: string;
    region: string;
    description: string;
    image_url?: string;
    featured: boolean;
    average_cost_per_day: number;
    popular_activities: string[];
    best_season: string;
    created: string;
}

export interface TravelItinerary {
    id: string;
    user: string;
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    days: DayPlan[];
    total_budget: number;
    status: 'Planning' | 'Booked' | 'Active' | 'Completed';
    shared_with: string[];
    created: string;
}

export interface TransportOption {
    id: string;
    type: 'Ride' | 'Public Transit' | 'Rental' | 'Shared';
    name: string;
    provider: string;
    origin: string;
    destination: string;
    estimated_cost: number;
    estimated_duration: number;
    available: boolean;
    created: string;
}

// Mock Data
const MOCK_DESTINATIONS: TravelDestination[] = [
    {
        id: 'dest-1',
        name: 'Paris',
        country: 'France',
        region: 'Europe',
        description: 'The City of Light, famous for the Eiffel Tower, art museums, and romantic atmosphere.',
        image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
        featured: true,
        average_cost_per_day: 150,
        popular_activities: ['Eiffel Tower', 'Louvre Museum', 'Seine River Cruise'],
        best_season: 'Spring',
        created: '2024-01-15T00:00:00Z'
    },
    {
        id: 'dest-2',
        name: 'Tokyo',
        country: 'Japan',
        region: 'Asia',
        description: 'A vibrant mix of traditional culture and cutting-edge technology.',
        image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
        featured: true,
        average_cost_per_day: 120,
        popular_activities: ['Shibuya Crossing', 'Senso-ji Temple', 'Tsukiji Market'],
        best_season: 'Spring',
        created: '2024-01-16T00:00:00Z'
    },
    {
        id: 'dest-3',
        name: 'New York',
        country: 'USA',
        region: 'North America',
        description: 'The Big Apple, home to world-class entertainment, dining, and attractions.',
        image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
        featured: true,
        average_cost_per_day: 200,
        popular_activities: ['Statue of Liberty', 'Central Park', 'Broadway Shows'],
        best_season: 'Fall',
        created: '2024-01-17T00:00:00Z'
    },
    {
        id: 'dest-4',
        name: 'Bali',
        country: 'Indonesia',
        region: 'Asia',
        description: 'A tropical paradise with beautiful beaches, temples, and rice terraces.',
        image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
        featured: true,
        average_cost_per_day: 80,
        popular_activities: ['Ubud Rice Terraces', 'Uluwatu Temple', 'Beach Clubs'],
        best_season: 'Summer',
        created: '2024-01-18T00:00:00Z'
    },
    {
        id: 'dest-5',
        name: 'Dubai',
        country: 'UAE',
        region: 'Middle East',
        description: 'A futuristic city with luxury shopping, stunning architecture, and desert adventures.',
        image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
        featured: true,
        average_cost_per_day: 180,
        popular_activities: ['Burj Khalifa', 'Desert Safari', 'Dubai Mall'],
        best_season: 'Winter',
        created: '2024-01-19T00:00:00Z'
    }
];

const MOCK_BOOKINGS: TravelBooking[] = [
    {
        id: 'book-1',
        user: 'user-1',
        type: 'Flight',
        destination: 'Paris',
        origin: 'New York',
        start_date: '2024-06-15',
        end_date: '2024-06-15',
        status: 'Confirmed',
        total_cost: 850,
        details: {
            airline: 'Air France',
            flightNumber: 'AF123',
            seat: '12A',
            gate: 'B22'
        } as FlightDetails,
        confirmation_code: 'AF123XYZ',
        created: '2024-05-01T10:00:00Z'
    },
    {
        id: 'book-2',
        user: 'user-1',
        type: 'Hotel',
        destination: 'Paris',
        start_date: '2024-06-15',
        end_date: '2024-06-20',
        status: 'Confirmed',
        total_cost: 1200,
        details: {
            hotelName: 'Le Grand Hotel',
            roomType: 'Deluxe Suite',
            address: '12 Rue de Rivoli, Paris'
        } as HotelDetails,
        confirmation_code: 'LGH456ABC',
        created: '2024-05-01T11:00:00Z'
    },
    {
        id: 'book-3',
        user: 'user-1',
        type: 'Car',
        destination: 'Paris',
        start_date: '2024-06-15',
        end_date: '2024-06-20',
        status: 'Pending',
        total_cost: 350,
        details: {
            company: 'Europcar',
            carType: 'Sedan',
            pickupLocation: 'CDG Airport'
        },
        created: '2024-05-02T09:00:00Z'
    }
];

const MOCK_ITINERARIES: TravelItinerary[] = [
    {
        id: 'itin-1',
        user: 'user-1',
        title: 'Paris Romantic Getaway',
        destination: 'Paris',
        start_date: '2024-06-15',
        end_date: '2024-06-20',
        days: [
            {
                date: '2024-06-15',
                activities: [
                    { time: '14:00', activity: 'Arrive at CDG Airport', location: 'Paris CDG' },
                    { time: '17:00', activity: 'Check into hotel', location: 'Le Grand Hotel' },
                    { time: '19:00', activity: 'Dinner at Le Jules Verne', location: 'Eiffel Tower', cost: 150 }
                ],
                notes: 'First day - arrival and settling in'
            },
            {
                date: '2024-06-16',
                activities: [
                    { time: '09:00', activity: 'Breakfast at hotel', location: 'Le Grand Hotel' },
                    { time: '10:30', activity: 'Visit Louvre Museum', location: 'Louvre', cost: 20 },
                    { time: '14:00', activity: 'Lunch at Café de Flore', location: 'Saint-Germain', cost: 50 },
                    { time: '16:00', activity: 'Seine River Cruise', location: 'Pont Neuf', cost: 35 }
                ]
            }
        ],
        total_budget: 3500,
        status: 'Booked',
        shared_with: [],
        created: '2024-05-01T12:00:00Z'
    }
];

const MOCK_TRANSPORT: TransportOption[] = [
    {
        id: 'trans-1',
        type: 'Ride',
        name: 'Uber Black',
        provider: 'Uber',
        origin: 'CDG Airport',
        destination: 'Paris City Center',
        estimated_cost: 65,
        estimated_duration: 45,
        available: true,
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'trans-2',
        type: 'Public Transit',
        name: 'RER B Train',
        provider: 'RATP',
        origin: 'CDG Airport',
        destination: 'Paris City Center',
        estimated_cost: 12,
        estimated_duration: 35,
        available: true,
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'trans-3',
        type: 'Rental',
        name: 'Sedan - Europcar',
        provider: 'Europcar',
        origin: 'CDG Airport',
        destination: 'Flexible',
        estimated_cost: 70,
        estimated_duration: 0,
        available: true,
        created: '2024-01-01T00:00:00Z'
    }
];

export const travelService = {
    // Destinations
    getFeaturedDestinations: async (limit: number = 10): Promise<TravelDestination[]> => {
        if (isMockEnv()) {
            return MOCK_DESTINATIONS.filter(d => d.featured).slice(0, limit);
        }

        return await pb.collection('travel_destinations').getFullList<TravelDestination>({
            filter: 'featured = true',
            sort: '-created',
            // Note: PocketBase doesn't support limit in getFullList, we handle it differently
        });
    },

    getAllDestinations: async (): Promise<TravelDestination[]> => {
        if (isMockEnv()) {
            return MOCK_DESTINATIONS;
        }

        return await pb.collection('travel_destinations').getFullList<TravelDestination>({
            sort: 'name'
        });
    },

    getDestinationById: async (id: string): Promise<TravelDestination | null> => {
        if (isMockEnv()) {
            return MOCK_DESTINATIONS.find(d => d.id === id) || null;
        }

        try {
            return await pb.collection('travel_destinations').getOne<TravelDestination>(id);
        } catch {
            return null;
        }
    },

    searchDestinations: async (query: string): Promise<TravelDestination[]> => {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_DESTINATIONS.filter(d => 
                d.name.toLowerCase().includes(lowerQuery) ||
                d.country.toLowerCase().includes(lowerQuery) ||
                d.region.toLowerCase().includes(lowerQuery)
            );
        }

        return await pb.collection('travel_destinations').getFullList<TravelDestination>({
            filter: `name ~ "${query}" || country ~ "${query}" || region ~ "${query}"`,
            sort: 'name'
        });
    },

    getDestinationsByRegion: async (region: string): Promise<TravelDestination[]> => {
        if (isMockEnv()) {
            return MOCK_DESTINATIONS.filter(d => d.region === region);
        }

        return await pb.collection('travel_destinations').getFullList<TravelDestination>({
            filter: `region = "${region}"`,
            sort: 'name'
        });
    },

    getRegions: async (): Promise<string[]> => {
        if (isMockEnv()) {
            return [...new Set(MOCK_DESTINATIONS.map(d => d.region))];
        }

        const destinations = await pb.collection('travel_destinations').getFullList<TravelDestination>({
            fields: 'region'
        });
        return [...new Set(destinations.map(d => d.region))];
    },

    // Bookings
    getUserBookings: async (userId: string, status?: string): Promise<TravelBooking[]> => {
        if (isMockEnv()) {
            let bookings = MOCK_BOOKINGS.filter(b => b.user === userId);
            if (status) {
                bookings = bookings.filter(b => b.status === status);
            }
            return bookings;
        }

        const filter = status
            ? `user = "${userId}" && status = "${status}"`
            : `user = "${userId}"`;

        return await pb.collection('travel_bookings').getFullList<TravelBooking>({
            filter,
            sort: '-start_date',
            expand: 'user'
        });
    },

    getBookingById: async (id: string): Promise<TravelBooking | null> => {
        if (isMockEnv()) {
            return MOCK_BOOKINGS.find(b => b.id === id) || null;
        }

        try {
            return await pb.collection('travel_bookings').getOne<TravelBooking>(id);
        } catch {
            return null;
        }
    },

    createBooking: async (data: Partial<TravelBooking>): Promise<TravelBooking> => {
        if (isMockEnv()) {
            const newBooking: TravelBooking = {
                id: `book-${Date.now()}`,
                user: data.user || '',
                type: data.type || 'Flight',
                destination: data.destination || '',
                origin: data.origin,
                start_date: data.start_date || new Date().toISOString().split('T')[0],
                end_date: data.end_date,
                status: 'Pending',
                total_cost: data.total_cost || 0,
                details: data.details || {},
                confirmation_code: `GYN${Date.now().toString(36).toUpperCase()}`,
                created: new Date().toISOString()
            };
            MOCK_BOOKINGS.push(newBooking);
            return newBooking;
        }

        return await pb.collection('travel_bookings').create(data);
    },

    updateBooking: async (id: string, data: Partial<TravelBooking>): Promise<TravelBooking | null> => {
        if (isMockEnv()) {
            const booking = MOCK_BOOKINGS.find(b => b.id === id);
            if (booking) {
                Object.assign(booking, data);
            }
            return booking || null;
        }

        return await pb.collection('travel_bookings').update(id, data);
    },

    cancelBooking: async (id: string): Promise<TravelBooking | null> => {
        if (isMockEnv()) {
            const booking = MOCK_BOOKINGS.find(b => b.id === id);
            if (booking) {
                booking.status = 'Cancelled';
            }
            return booking || null;
        }

        return await pb.collection('travel_bookings').update(id, {
            status: 'Cancelled'
        });
    },

    confirmBooking: async (id: string, confirmationCode?: string): Promise<TravelBooking | null> => {
        if (isMockEnv()) {
            const booking = MOCK_BOOKINGS.find(b => b.id === id);
            if (booking) {
                booking.status = 'Confirmed';
                if (confirmationCode) {
                    booking.confirmation_code = confirmationCode;
                }
            }
            return booking || null;
        }

        return await pb.collection('travel_bookings').update(id, {
            status: 'Confirmed',
            ...(confirmationCode && { confirmation_code: confirmationCode })
        });
    },

    // Itineraries
    getUserItineraries: async (userId: string): Promise<TravelItinerary[]> => {
        if (isMockEnv()) {
            return MOCK_ITINERARIES.filter(i => i.user === userId || i.shared_with.includes(userId));
        }

        return await pb.collection('travel_itineraries').getFullList<TravelItinerary>({
            filter: `user = "${userId}"`,
            sort: '-start_date'
        });
    },

    getItineraryById: async (id: string): Promise<TravelItinerary | null> => {
        if (isMockEnv()) {
            return MOCK_ITINERARIES.find(i => i.id === id) || null;
        }

        try {
            return await pb.collection('travel_itineraries').getOne<TravelItinerary>(id);
        } catch {
            return null;
        }
    },

    createItinerary: async (data: Partial<TravelItinerary>): Promise<TravelItinerary> => {
        if (isMockEnv()) {
            const newItinerary: TravelItinerary = {
                id: `itin-${Date.now()}`,
                user: data.user || '',
                title: data.title || 'New Trip',
                destination: data.destination || '',
                start_date: data.start_date || new Date().toISOString().split('T')[0],
                end_date: data.end_date || new Date().toISOString().split('T')[0],
                days: data.days || [],
                total_budget: data.total_budget || 0,
                status: 'Planning',
                shared_with: [],
                created: new Date().toISOString()
            };
            MOCK_ITINERARIES.push(newItinerary);
            return newItinerary;
        }

        return await pb.collection('travel_itineraries').create(data);
    },

    updateItinerary: async (id: string, data: Partial<TravelItinerary>): Promise<TravelItinerary | null> => {
        if (isMockEnv()) {
            const itinerary = MOCK_ITINERARIES.find(i => i.id === id);
            if (itinerary) {
                Object.assign(itinerary, data);
            }
            return itinerary || null;
        }

        return await pb.collection('travel_itineraries').update(id, data);
    },

    deleteItinerary: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_ITINERARIES.findIndex(i => i.id === id);
            if (index !== -1) {
                MOCK_ITINERARIES.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('travel_itineraries').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    addDayToItinerary: async (itineraryId: string, dayPlan: DayPlan): Promise<TravelItinerary | null> => {
        if (isMockEnv()) {
            const itinerary = MOCK_ITINERARIES.find(i => i.id === itineraryId);
            if (itinerary) {
                itinerary.days.push(dayPlan);
            }
            return itinerary || null;
        }

        const itinerary = await pb.collection('travel_itineraries').getOne<TravelItinerary>(itineraryId);
        return await pb.collection('travel_itineraries').update(itineraryId, {
            days: [...itinerary.days, dayPlan]
        });
    },

    shareItinerary: async (itineraryId: string, userIds: string[]): Promise<TravelItinerary | null> => {
        if (isMockEnv()) {
            const itinerary = MOCK_ITINERARIES.find(i => i.id === itineraryId);
            if (itinerary) {
                itinerary.shared_with = [...new Set([...itinerary.shared_with, ...userIds])];
            }
            return itinerary || null;
        }

        const itinerary = await pb.collection('travel_itineraries').getOne(itineraryId);
        return await pb.collection('travel_itineraries').update(itineraryId, {
            shared_with: [...new Set([...itinerary.shared_with, ...userIds])]
        });
    },

    // Transport
    getLocalTransport: async (location: string): Promise<TransportOption[]> => {
        if (isMockEnv()) {
            return MOCK_TRANSPORT.filter(t => 
                t.origin.toLowerCase().includes(location.toLowerCase()) ||
                t.destination.toLowerCase().includes(location.toLowerCase())
            );
        }

        return await pb.collection('travel_transport').getFullList<TransportOption>({
            filter: `origin ~ "${location}" || destination ~ "${location}"`,
            sort: 'estimated_cost'
        });
    },

    searchTransport: async (origin: string, destination: string): Promise<TransportOption[]> => {
        if (isMockEnv()) {
            return MOCK_TRANSPORT.filter(t => 
                t.origin.toLowerCase().includes(origin.toLowerCase()) &&
                (t.destination.toLowerCase().includes(destination.toLowerCase()) || t.destination === 'Flexible') &&
                t.available
            );
        }

        return await pb.collection('travel_transport').getFullList<TransportOption>({
            filter: `origin ~ "${origin}" && destination ~ "${destination}" && available = true`,
            sort: 'estimated_cost'
        });
    },

    // Flight Search
    searchFlights: async (from: string, to: string, _date: string): Promise<TravelBooking[]> => {
        if (isMockEnv()) {
            return MOCK_BOOKINGS.filter(b => 
                b.type === 'Flight' &&
                b.origin?.toLowerCase().includes(from.toLowerCase()) &&
                b.destination.toLowerCase().includes(to.toLowerCase())
            );
        }

        return await pb.collection('travel_bookings').getFullList({
            filter: `type = "Flight" && origin ~ "${from}" && destination ~ "${to}"`,
            // Note: Removed 'limit' as it's not valid for getFullList
        }) as TravelBooking[];
    },

    // Hotel Search
    searchHotels: async (location: string, _checkIn: string, _checkOut: string): Promise<TravelBooking[]> => {
        if (isMockEnv()) {
            return MOCK_BOOKINGS.filter(b => 
                b.type === 'Hotel' &&
                b.destination.toLowerCase().includes(location.toLowerCase())
            );
        }

        return await pb.collection('travel_bookings').getFullList({
            filter: `type = "Hotel" && destination ~ "${location}"`,
            // Note: Removed 'limit' as it's not valid for getFullList
        }) as TravelBooking[];
    },

    // Statistics
    getPopularRoutes: async (): Promise<{ route: string; bookings: number; origin: string; destination: string }[]> => {
        if (isMockEnv()) {
            const routeCounts: { [key: string]: number } = {};
            MOCK_BOOKINGS.filter(b => b.type === 'Flight' && b.origin).forEach(booking => {
                const route = `${booking.origin}-${booking.destination}`;
                routeCounts[route] = (routeCounts[route] || 0) + 1;
            });

            return Object.entries(routeCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([route, count]) => ({
                    route,
                    bookings: count,
                    origin: route.split('-')[0],
                    destination: route.split('-')[1]
                }));
        }

        try {
            const bookings = await pb.collection('travel_bookings').getFullList<TravelBooking>({
                filter: 'type = "Flight"',
                sort: '-created',
                // Note: Removed 'limit' as it's not valid for getFullList
            });

            const routeCounts: { [key: string]: number } = {};
            bookings.slice(0, 100).forEach(booking => {
                if (booking.origin && booking.destination) {
                    const route = `${booking.origin}-${booking.destination}`;
                    routeCounts[route] = (routeCounts[route] || 0) + 1;
                }
            });

            return Object.entries(routeCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([route, count]) => ({
                    route,
                    bookings: count,
                    origin: route.split('-')[0],
                    destination: route.split('-')[1]
                }));
        } catch (error) {
            console.error('Failed to get popular routes:', error);
            return [];
        }
    },

    getTravelStats: async (userId: string) => {
        if (isMockEnv()) {
            const userBookings = MOCK_BOOKINGS.filter(b => b.user === userId);
            const userItineraries = MOCK_ITINERARIES.filter(i => i.user === userId);

            return {
                totalBookings: userBookings.length,
                confirmedBookings: userBookings.filter(b => b.status === 'Confirmed').length,
                totalSpent: userBookings.reduce((sum, b) => sum + b.total_cost, 0),
                totalItineraries: userItineraries.length,
                upcomingTrips: userBookings.filter(b => 
                    b.status === 'Confirmed' && new Date(b.start_date) > new Date()
                ).length,
                countriesVisited: [...new Set(userBookings.filter(b => b.status === 'Completed').map(b => b.destination))].length
            };
        }

        try {
            const [bookings, itineraries] = await Promise.all([
                pb.collection('travel_bookings').getFullList<TravelBooking>({ filter: `user = "${userId}"` }),
                pb.collection('travel_itineraries').getFullList<TravelItinerary>({ filter: `user = "${userId}"` })
            ]);

            return {
                totalBookings: bookings.length,
                confirmedBookings: bookings.filter(b => b.status === 'Confirmed').length,
                totalSpent: bookings.reduce((sum, b) => sum + b.total_cost, 0),
                totalItineraries: itineraries.length,
                upcomingTrips: bookings.filter(b => 
                    b.status === 'Confirmed' && new Date(b.start_date) > new Date()
                ).length,
                countriesVisited: [...new Set(bookings.filter(b => b.status === 'Completed').map(b => b.destination))].length
            };
        } catch (error) {
            console.error('Failed to get travel stats:', error);
            return {
                totalBookings: 0,
                confirmedBookings: 0,
                totalSpent: 0,
                totalItineraries: 0,
                upcomingTrips: 0,
                countriesVisited: 0
            };
        }
    }
};
