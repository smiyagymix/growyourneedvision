/**
 * Travel Service Types
 * Proper types for travel booking details
 */

export interface FlightDetails {
    airline: string;
    flightNumber: string;
    departure: string;
    arrival: string;
    class: string;
}

export interface HotelDetails {
    name: string;
    checkIn: string;
    checkOut: string;
    address: string;
}

export type BookingDetails = FlightDetails | HotelDetails | {
    type: string;
    [key: string]: string | number | boolean | undefined;
};
