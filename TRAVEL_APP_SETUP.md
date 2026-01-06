# Travel & Transport App - PocketBase Collections Setup

## Required Collections

### 1. `travel_destinations`
**Purpose**: Store travel destinations with details

```javascript
{
  "name": "text (required)",
  "country": "text (required)",
  "region": "select (Asia, Europe, Americas, Africa, Oceania)",
  "description": "text (required)",
  "image_url": "url (optional)",
  "featured": "bool (default: false)",
  "average_cost_per_day": "number (required)",
  "popular_activities": "json (array of strings)",
  "best_season": "text (e.g., 'Spring', 'All Year')"
}
```

**Indexes**: `featured`, `region`, `country`

### 2. `travel_bookings`
**Purpose**: Store user travel bookings

```javascript
{
  "user": "relation (users, required)",
  "type": "select (Flight, Hotel, Car, Package)",
  "destination": "text (required)",
  "origin": "text (optional)",
  "start_date": "date (required)",
  "end_date": "date (optional)",
  "status": "select (Pending, Confirmed, Cancelled, Completed)",
  "total_cost": "number (required)",
  "details": "json (booking-specific details)",
  "confirmation_code": "text (unique, optional)"
}
```

**Indexes**: `user`, `status`, `start_date`

### 3. `travel_itineraries`
**Purpose**: User travel plans and itineraries

```javascript
{
  "user": "relation (users, required)",
  "title": "text (required)",
  "destination": "text (required)",
  "start_date": "date (required)",
  "end_date": "date (required)",
  "days": "json (array of day plans)",
  "total_budget": "number",
  "status": "select (Planning, Booked, Active, Completed)",
  "shared_with": "relation (users, multiple, optional)"
}
```

**Indexes**: `user`, `status`

### 4. `travel_transport`
**Purpose**: Local transport options

```javascript
{
  "type": "select (Ride, Public Transit, Rental, Shared)",
  "name": "text (required)",
  "provider": "text (required)",
  "origin": "text (required)",
  "destination": "text (required)",
  "estimated_cost": "number (required)",
  "estimated_duration": "number (minutes)",
  "available": "bool (default: true)"
}
```

**Indexes**: `type`, `available`

---

## Sample Data

### Sample Destinations

```javascript
// Tokyo, Japan
{
  "name": "Tokyo",
  "country": "Japan",
  "region": "Asia",
  "description": "Experience the perfect blend of traditional culture and futuristic technology in Japan's vibrant capital city.",
  "image_url": "https://example.com/tokyo.jpg",
  "featured": true,
  "average_cost_per_day": 150,
  "popular_activities": ["Temples", "Sushi", "Shopping", "Anime"],
  "best_season": "Spring (Cherry Blossoms)"
}

// Paris, France
{
  "name": "Paris",
  "country": "France",
  "region": "Europe",
  "description": "The City of Light offers world-class museums, iconic landmarks, and unparalleled cuisine.",
  "featured": true,
  "average_cost_per_day": 200,
  "popular_activities": ["Museums", "Cafes", "Architecture", "Art"],
  "best_season": "Spring & Fall"
}

// Dubai, UAE
{
  "name": "Dubai",
  "country": "United Arab Emirates",
  "region": "Asia",
  "description": "A modern metropolis with stunning architecture, luxury shopping, and desert adventures.",
  "featured": true,
  "average_cost_per_day": 250,
  "popular_activities": ["Skyscrapers", "Desert Safari", "Shopping", "Beaches"],
  "best_season": "Winter"
}
```

### Sample Bookings

```javascript
// Flight Booking
{
  "user": "user_id_123",
  "type": "Flight",
  "destination": "Tokyo",
  "origin": "New York",
  "start_date": "2025-12-15",
  "end_date": "2025-12-22",
  "status": "Confirmed",
  "total_cost": 1200,
  "details": {
    "airline": "ANA",
    "flight_number": "NH110",
    "class": "Economy",
    "baggage": "2 pieces"
  },
  "confirmation_code": "ABC123XYZ"
}

// Hotel Booking
{
  "user": "user_id_123",
  "type": "Hotel",
  "destination": "Paris",
  "start_date": "2026-01-10",
  "end_date": "2026-01-15",
  "status": "Confirmed",
  "total_cost": 800,
  "details": {
    "hotel_name": "Hotel Plaza Athénée",
    "room_type": "Deluxe Double",
    "nights": 5,
    "breakfast": true
  },
  "confirmation_code": "HTL456DEF"
}
```

### Sample Itinerary

```javascript
{
  "user": "user_id_123",
  "title": "Amazing Tokyo Adventure",
  "destination": "Tokyo",
  "start_date": "2025-12-15",
  "end_date": "2025-12-20",
  "total_budget": 3000,
  "status": "Planning",
  "days": [
    {
      "day": 1,
      "title": "Arrival & Shibuya",
      "activities": [
        { "time": "Morning", "title": "Arrive at Narita Airport", "notes": "Take Narita Express to city" },
        { "time": "Afternoon", "title": "Check into hotel", "location": "Shibuya" },
        { "time": "Evening", "title": "Shibuya Crossing & Shopping", "budget": 100 }
      ]
    },
    {
      "day": 2,
      "title": "Traditional Tokyo",
      "activities": [
        { "time": "Morning", "title": "Senso-ji Temple", "location": "Asakusa" },
        { "time": "Afternoon", "title": "Tsukiji Outer Market", "budget": 50 },
        { "time": "Evening", "title": "Tokyo Skytree", "budget": 30 }
      ]
    }
  ],
  "shared_with": []
}
```

---

## API Rules (PocketBase)

### `travel_destinations`
```javascript
// List/View
@request.auth.id != ""

// Create/Update/Delete
@request.auth.role = "Admin"
```

### `travel_bookings`
```javascript
// List/View
@request.auth.id = user.id || @request.auth.role = "Admin"

// Create
@request.auth.id = @request.data.user

// Update
@request.auth.id = user.id || @request.auth.role ~ "Admin|Teacher"

// Delete
@request.auth.id = user.id || @request.auth.role = "Admin"
```

### `travel_itineraries`
```javascript
// List/View
@request.auth.id = user.id || 
shared_with ?~ @request.auth.id || 
@request.auth.role = "Admin"

// Create
@request.auth.id = @request.data.user

// Update
@request.auth.id = user.id

// Delete
@request.auth.id = user.id
```

### `travel_transport`
```javascript
// List/View
@request.auth.id != "" && available = true

// Create/Update/Delete
@request.auth.role = "Admin"
```

---

## Future Enhancements

### Real API Integrations (Production)

1. **Flight Search**: Amadeus, Skyscanner, or Kiwi.com API
2. **Hotel Booking**: Booking.com or Hotels.com API
3. **Maps**: Google Maps API or Mapbox
4. **Weather**: OpenWeather API for destination weather
5. **Currency**: Exchange rates API

### Example Flight API Integration:
```typescript
// In production, replace mock search with:
const searchFlights = async (from: string, to: string, date: string) => {
  const response = await fetch(`https://api.amadeus.com/v2/shopping/flight-offers`, {
    headers: {
      'Authorization': `Bearer ${AMADEUS_API_KEY}`
    },
    // ... params
  });
  return await response.json();
};
```

---

**Status**: Collections defined, ready for setup  
**Setup Time**: 20-25 minutes  
**Next Step**: Create collections in PocketBase admin panel
