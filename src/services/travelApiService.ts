/**
 * Travel API Service
 * Integrates with real travel APIs and provides mock fallbacks for testing
 */

import { isMockEnv } from '../utils/mockData';

// ============ Types ============

export interface FlightSearchResult {
    id: string;
    airline: string;
    flightNumber: string;
    origin: string;
    originAirport: string;
    destination: string;
    destinationAirport: string;
    departureTime: string;
    arrivalTime: string;
    duration: number; // minutes
    stops: number;
    price: number;
    currency: string;
    cabinClass: 'Economy' | 'Premium Economy' | 'Business' | 'First';
    seatsAvailable: number;
    baggage: { carry: number; checked: number };
}

export interface HotelSearchResult {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    rating: number;
    stars: number;
    pricePerNight: number;
    currency: string;
    amenities: string[];
    images: string[];
    latitude: number;
    longitude: number;
    reviewCount: number;
    availableRooms: number;
}

export interface TransitRoute {
    id: string;
    type: 'bus' | 'train' | 'metro' | 'tram' | 'ferry';
    line: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration: number;
    price: number;
    stops: string[];
    frequency: string;
}

export interface RideShareOption {
    id: string;
    provider: 'uber' | 'lyft' | 'bolt' | 'grab' | 'local';
    type: 'economy' | 'comfort' | 'premium' | 'xl' | 'pool';
    estimatedPrice: { min: number; max: number };
    currency: string;
    estimatedTime: number; // minutes
    eta: number; // pickup ETA in minutes
    surge: number; // multiplier
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
    address?: string;
}

export interface WeatherData {
    temp: number;
    feels_like: number;
    description: string;
    icon: string;
    humidity: number;
    wind_speed: number;
    city: string;
    country: string;
}

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    rate: number; // relative to USD
}

export interface TravelAlert {
    id: string;
    type: 'advisory' | 'warning' | 'restriction' | 'info';
    country: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    validFrom: string;
    validUntil?: string;
}

// ============ Mock Data ============

const MOCK_FLIGHTS: FlightSearchResult[] = [
    {
        id: 'FL001',
        airline: 'United Airlines',
        flightNumber: 'UA 123',
        origin: 'New York',
        originAirport: 'JFK',
        destination: 'London',
        destinationAirport: 'LHR',
        departureTime: '2025-01-15T08:00:00',
        arrivalTime: '2025-01-15T20:00:00',
        duration: 420,
        stops: 0,
        price: 850,
        currency: 'USD',
        cabinClass: 'Economy',
        seatsAvailable: 45,
        baggage: { carry: 1, checked: 1 }
    },
    {
        id: 'FL002',
        airline: 'British Airways',
        flightNumber: 'BA 178',
        origin: 'New York',
        originAirport: 'JFK',
        destination: 'London',
        destinationAirport: 'LHR',
        departureTime: '2025-01-15T10:30:00',
        arrivalTime: '2025-01-15T22:30:00',
        duration: 420,
        stops: 0,
        price: 920,
        currency: 'USD',
        cabinClass: 'Economy',
        seatsAvailable: 32,
        baggage: { carry: 1, checked: 2 }
    },
    {
        id: 'FL003',
        airline: 'Delta',
        flightNumber: 'DL 456',
        origin: 'New York',
        originAirport: 'JFK',
        destination: 'Paris',
        destinationAirport: 'CDG',
        departureTime: '2025-01-15T14:00:00',
        arrivalTime: '2025-01-16T04:00:00',
        duration: 480,
        stops: 1,
        price: 680,
        currency: 'USD',
        cabinClass: 'Economy',
        seatsAvailable: 18,
        baggage: { carry: 1, checked: 1 }
    },
    {
        id: 'FL004',
        airline: 'Emirates',
        flightNumber: 'EK 201',
        origin: 'New York',
        originAirport: 'JFK',
        destination: 'Dubai',
        destinationAirport: 'DXB',
        departureTime: '2025-01-15T22:00:00',
        arrivalTime: '2025-01-16T19:30:00',
        duration: 750,
        stops: 0,
        price: 1200,
        currency: 'USD',
        cabinClass: 'Business',
        seatsAvailable: 12,
        baggage: { carry: 2, checked: 2 }
    }
];

const MOCK_HOTELS: HotelSearchResult[] = [
    {
        id: 'H001',
        name: 'The Grand Plaza',
        address: '123 Main Street',
        city: 'London',
        country: 'UK',
        rating: 4.8,
        stars: 5,
        pricePerNight: 350,
        currency: 'USD',
        amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Room Service'],
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
        latitude: 51.5074,
        longitude: -0.1278,
        reviewCount: 2456,
        availableRooms: 15
    },
    {
        id: 'H002',
        name: 'City Center Inn',
        address: '456 Central Ave',
        city: 'London',
        country: 'UK',
        rating: 4.2,
        stars: 3,
        pricePerNight: 120,
        currency: 'USD',
        amenities: ['WiFi', 'Breakfast', 'Parking'],
        images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'],
        latitude: 51.5099,
        longitude: -0.1337,
        reviewCount: 892,
        availableRooms: 8
    },
    {
        id: 'H003',
        name: 'Riverside Resort',
        address: '789 Thames Walk',
        city: 'London',
        country: 'UK',
        rating: 4.6,
        stars: 4,
        pricePerNight: 220,
        currency: 'USD',
        amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'River View'],
        images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'],
        latitude: 51.5015,
        longitude: -0.1195,
        reviewCount: 1543,
        availableRooms: 22
    }
];

const MOCK_TRANSIT: TransitRoute[] = [
    {
        id: 'T001',
        type: 'metro',
        line: 'Victoria Line',
        origin: 'Kings Cross',
        destination: 'Oxford Circus',
        departureTime: '08:00',
        arrivalTime: '08:12',
        duration: 12,
        price: 2.40,
        stops: ['Euston', 'Warren Street'],
        frequency: 'Every 2 mins'
    },
    {
        id: 'T002',
        type: 'bus',
        line: 'Route 73',
        origin: 'Victoria Station',
        destination: 'Stoke Newington',
        departureTime: '08:15',
        arrivalTime: '09:05',
        duration: 50,
        price: 1.65,
        stops: ['Marble Arch', 'Oxford Street', 'Angel', 'Dalston'],
        frequency: 'Every 5 mins'
    },
    {
        id: 'T003',
        type: 'train',
        line: 'Elizabeth Line',
        origin: 'Paddington',
        destination: 'Liverpool Street',
        departureTime: '08:30',
        arrivalTime: '08:45',
        duration: 15,
        price: 3.10,
        stops: ['Bond Street', 'Tottenham Court Road', 'Farringdon'],
        frequency: 'Every 3 mins'
    }
];

const MOCK_RIDESHARE: RideShareOption[] = [
    {
        id: 'RS001',
        provider: 'uber',
        type: 'economy',
        estimatedPrice: { min: 12, max: 16 },
        currency: 'USD',
        estimatedTime: 18,
        eta: 3,
        surge: 1.0
    },
    {
        id: 'RS002',
        provider: 'uber',
        type: 'comfort',
        estimatedPrice: { min: 18, max: 24 },
        currency: 'USD',
        estimatedTime: 18,
        eta: 5,
        surge: 1.0
    },
    {
        id: 'RS003',
        provider: 'lyft',
        type: 'economy',
        estimatedPrice: { min: 11, max: 15 },
        currency: 'USD',
        estimatedTime: 20,
        eta: 4,
        surge: 1.2
    },
    {
        id: 'RS004',
        provider: 'bolt',
        type: 'economy',
        estimatedPrice: { min: 10, max: 13 },
        currency: 'USD',
        estimatedTime: 19,
        eta: 2,
        surge: 1.0
    }
];

const MOCK_DESTINATIONS = [
    {
        id: 'D001',
        name: 'Paris',
        country: 'France',
        region: 'Europe',
        description: 'The City of Light offers iconic landmarks, world-class cuisine, and romantic ambiance.',
        image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
        featured: true,
        average_cost_per_day: 180,
        popular_activities: ['Eiffel Tower', 'Louvre Museum', 'Seine Cruise', 'Montmartre'],
        best_season: 'Spring/Fall',
        climate: 'Temperate',
        currency: 'EUR',
        language: 'French',
        timezone: 'CET'
    },
    {
        id: 'D002',
        name: 'Tokyo',
        country: 'Japan',
        region: 'Asia',
        description: 'A perfect blend of ancient traditions and cutting-edge technology.',
        image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
        featured: true,
        average_cost_per_day: 150,
        popular_activities: ['Shibuya Crossing', 'Senso-ji Temple', 'Mount Fuji', 'Akihabara'],
        best_season: 'Spring (Cherry Blossom)',
        climate: 'Humid Subtropical',
        currency: 'JPY',
        language: 'Japanese',
        timezone: 'JST'
    },
    {
        id: 'D003',
        name: 'New York City',
        country: 'USA',
        region: 'North America',
        description: 'The city that never sleeps offers endless entertainment, dining, and cultural experiences.',
        image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
        featured: true,
        average_cost_per_day: 250,
        popular_activities: ['Times Square', 'Central Park', 'Statue of Liberty', 'Broadway'],
        best_season: 'Fall',
        climate: 'Humid Continental',
        currency: 'USD',
        language: 'English',
        timezone: 'EST'
    },
    {
        id: 'D004',
        name: 'Barcelona',
        country: 'Spain',
        region: 'Europe',
        description: 'Vibrant city known for stunning architecture, beaches, and rich cultural heritage.',
        image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
        featured: true,
        average_cost_per_day: 140,
        popular_activities: ['Sagrada Familia', 'Park Güell', 'La Rambla', 'Gothic Quarter'],
        best_season: 'Late Spring/Early Fall',
        climate: 'Mediterranean',
        currency: 'EUR',
        language: 'Spanish/Catalan',
        timezone: 'CET'
    },
    {
        id: 'D005',
        name: 'Dubai',
        country: 'UAE',
        region: 'Middle East',
        description: 'Ultra-modern city with luxury shopping, towering skyscrapers, and desert adventures.',
        image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
        featured: true,
        average_cost_per_day: 200,
        popular_activities: ['Burj Khalifa', 'Dubai Mall', 'Desert Safari', 'Palm Jumeirah'],
        best_season: 'Winter (Nov-Mar)',
        climate: 'Desert',
        currency: 'AED',
        language: 'Arabic/English',
        timezone: 'GST'
    },
    {
        id: 'D006',
        name: 'Bali',
        country: 'Indonesia',
        region: 'Southeast Asia',
        description: 'Island paradise with beautiful temples, rice terraces, and stunning beaches.',
        image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        featured: true,
        average_cost_per_day: 80,
        popular_activities: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Kuta Beach', 'Spa Retreats'],
        best_season: 'Dry Season (Apr-Oct)',
        climate: 'Tropical',
        currency: 'IDR',
        language: 'Indonesian',
        timezone: 'WITA'
    }
];

// ============ API Service ============

class TravelApiService {
    private openWeatherApiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
    private exchangeRateApiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY || '';

    // ============ Flight Search ============
    async searchFlights(
        origin: string,
        destination: string,
        date: string,
        passengers: number = 1
    ): Promise<FlightSearchResult[]> {
        if (isMockEnv()) {
            // Filter mock flights by origin/destination (case insensitive partial match)
            return MOCK_FLIGHTS.filter(f =>
                f.origin.toLowerCase().includes(origin.toLowerCase()) ||
                f.originAirport.toLowerCase().includes(origin.toLowerCase())
            ).filter(f =>
                f.destination.toLowerCase().includes(destination.toLowerCase()) ||
                f.destinationAirport.toLowerCase().includes(destination.toLowerCase())
            ).map(f => ({ ...f, price: f.price * passengers }));
        }

        try {
            // In production, integrate with Amadeus, Skyscanner, or similar
            // For now, return mock data as fallback
            console.log('Flight search:', { origin, destination, date, passengers });
            return MOCK_FLIGHTS;
        } catch (error) {
            console.error('Flight search failed:', error);
            return MOCK_FLIGHTS;
        }
    }

    // ============ Hotel Search ============
    async searchHotels(
        location: string,
        checkIn: string,
        checkOut: string,
        guests: number = 2
    ): Promise<HotelSearchResult[]> {
        if (isMockEnv()) {
            return MOCK_HOTELS.filter(h =>
                h.city.toLowerCase().includes(location.toLowerCase()) ||
                h.country.toLowerCase().includes(location.toLowerCase())
            );
        }

        try {
            // In production, integrate with Booking.com, Hotels.com API
            console.log('Hotel search:', { location, checkIn, checkOut, guests });
            return MOCK_HOTELS;
        } catch (error) {
            console.error('Hotel search failed:', error);
            return MOCK_HOTELS;
        }
    }

    // ============ Public Transit ============
    async getPublicTransit(
        origin: string,
        destination: string
    ): Promise<TransitRoute[]> {
        if (isMockEnv()) {
            return MOCK_TRANSIT;
        }

        try {
            // In production, integrate with Google Maps Transit API or local transit APIs
            console.log('Transit search:', { origin, destination });
            return MOCK_TRANSIT;
        } catch (error) {
            console.error('Transit search failed:', error);
            return MOCK_TRANSIT;
        }
    }

    // ============ Ride Share Options ============
    async getRideShareOptions(
        origin: GeoLocation,
        destination: GeoLocation
    ): Promise<RideShareOption[]> {
        if (isMockEnv()) {
            return MOCK_RIDESHARE;
        }

        try {
            // In production, integrate with Uber, Lyft, etc. APIs
            console.log('Ride share search:', { origin, destination });
            return MOCK_RIDESHARE;
        } catch (error) {
            console.error('Ride share search failed:', error);
            return MOCK_RIDESHARE;
        }
    }

    // ============ Weather ============
    async getWeather(city: string): Promise<WeatherData | null> {
        if (isMockEnv()) {
            return {
                temp: 22,
                feels_like: 24,
                description: 'Partly cloudy',
                icon: '02d',
                humidity: 65,
                wind_speed: 12,
                city: city,
                country: 'UK'
            };
        }

        try {
            if (!this.openWeatherApiKey) {
                throw new Error('OpenWeather API key not configured');
            }

            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.openWeatherApiKey}&units=metric`
            );

            if (!response.ok) throw new Error('Weather API failed');

            const data = await response.json();
            return {
                temp: data.main.temp,
                feels_like: data.main.feels_like,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                humidity: data.main.humidity,
                wind_speed: data.wind.speed,
                city: data.name,
                country: data.sys.country
            };
        } catch (error) {
            console.error('Weather fetch failed:', error);
            return null;
        }
    }

    // ============ Currency Exchange ============
    async getExchangeRates(baseCurrency: string = 'USD'): Promise<Currency[]> {
        if (isMockEnv()) {
            return [
                { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0 },
                { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
                { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79 },
                { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 149.5 },
                { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 3.67 },
                { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.12 }
            ];
        }

        try {
            // Free exchange rate API
            const response = await fetch(
                `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
            );

            if (!response.ok) throw new Error('Exchange rate API failed');

            const data = await response.json();
            const currencies: Currency[] = [
                { code: 'USD', name: 'US Dollar', symbol: '$', rate: data.rates.USD || 1 },
                { code: 'EUR', name: 'Euro', symbol: '€', rate: data.rates.EUR },
                { code: 'GBP', name: 'British Pound', symbol: '£', rate: data.rates.GBP },
                { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: data.rates.JPY },
                { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: data.rates.AED },
                { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: data.rates.INR },
                { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: data.rates.CAD },
                { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: data.rates.AUD }
            ];
            return currencies;
        } catch (error) {
            console.error('Exchange rate fetch failed:', error);
            return [
                { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0 },
                { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
                { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79 }
            ];
        }
    }

    // ============ Destinations ============
    async getFeaturedDestinations(limit: number = 6) {
        return MOCK_DESTINATIONS.filter(d => d.featured).slice(0, limit);
    }

    async searchDestinations(query: string) {
        const q = query.toLowerCase();
        return MOCK_DESTINATIONS.filter(d =>
            d.name.toLowerCase().includes(q) ||
            d.country.toLowerCase().includes(q) ||
            d.region.toLowerCase().includes(q)
        );
    }

    async getDestinationById(id: string) {
        return MOCK_DESTINATIONS.find(d => d.id === id);
    }

    // ============ Travel Alerts ============
    async getTravelAlerts(country?: string): Promise<TravelAlert[]> {
        const alerts: TravelAlert[] = [
            {
                id: 'TA001',
                type: 'advisory',
                country: 'Japan',
                title: 'Entry Requirements Update',
                description: 'New visa-free entry requirements in effect. Check latest documentation needed.',
                severity: 'low',
                validFrom: '2025-01-01'
            },
            {
                id: 'TA002',
                type: 'info',
                country: 'France',
                title: 'Paris Olympics Preparations',
                description: 'Increased security measures in major cities. Allow extra time for transportation.',
                severity: 'medium',
                validFrom: '2025-06-01',
                validUntil: '2025-09-30'
            }
        ];

        if (country) {
            return alerts.filter(a => a.country.toLowerCase() === country.toLowerCase());
        }
        return alerts;
    }

    // ============ Geocoding ============
    async geocode(address: string): Promise<GeoLocation | null> {
        if (isMockEnv()) {
            // Return London coordinates as default
            return {
                latitude: 51.5074,
                longitude: -0.1278,
                city: 'London',
                country: 'UK',
                address
            };
        }

        try {
            // Using OpenStreetMap Nominatim (free, no API key needed)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'GrowYourNeed/1.0'
                    }
                }
            );

            if (!response.ok) throw new Error('Geocoding failed');

            const data = await response.json();
            if (data.length === 0) return null;

            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                address: data[0].display_name
            };
        } catch (error) {
            console.error('Geocoding failed:', error);
            return null;
        }
    }

    // ============ Distance Calculation ============
    calculateDistance(
        origin: GeoLocation,
        destination: GeoLocation
    ): { km: number; miles: number } {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(destination.latitude - origin.latitude);
        const dLon = this.toRad(destination.longitude - origin.longitude);
        const lat1 = this.toRad(origin.latitude);
        const lat2 = this.toRad(destination.latitude);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const km = R * c;

        return {
            km: Math.round(km),
            miles: Math.round(km * 0.621371)
        };
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}

export const travelApiService = new TravelApiService();
