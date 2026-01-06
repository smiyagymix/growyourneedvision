# Sport App - PocketBase Collections Setup

## Required Collections

### 1. `sport_activities`
**Purpose**: Track individual user sport activities and workouts

```javascript
{
  "user": "relation (users)",
  "sport": "text",
  "activity_type": "select (Training, Match, Practice)",
  "duration": "number",
  "calories": "number",
  "date": "date",
  "notes": "text (optional)"
}
```

**Indexes**: `user`, `date`, `sport`

###2. `sport_teams`
**Purpose**: Manage sport teams

```javascript
{
  "name": "text (required, unique)",
  "sport": "text (required)",
  "league": "text (optional)",
  "logo_url": "url (optional)",
  "wins": "number (default: 0)",
  "losses": "number (default: 0)",
  "draws": "number (default: 0)",
  "points": "number (default: 0)",
  "members": "relation (users, multiple)",
  "coach": "relation (users, single, optional)"
}
```

**Indexes**: `sport`, `points`

### 3. `sport_matches`
**Purpose**: Store match/game data

```javascript
{
  "team_home": "relation (sport_teams)",
  "team_away": "relation (sport_teams)",
  "score_home": "number (default: 0)",
  "score_away": "number (default: 0)",
  "status": "select (Scheduled, Live, Finished, Cancelled)",
  "match_date": "date (required)",
  "venue": "relation (sport_venues, optional)",
  "sport": "text (required)"
}
```

**Indexes**: `status`, `match_date`, `sport`

### 4. `sport_venues`
**Purpose**: Store venue/location information

```javascript
{
  "name": "text (required)",
  "address": "text (required)",
  "capacity": "number (optional)",
  "sport_types": "json (array of strings)",
  "facilities": "json (array of strings)",
  "booking_available": "bool (default: true)"
}
```

### 5. `player_stats`
**Purpose**: Track individual player statistics

```javascript
{
  "user": "relation (users)",
  "sport": "text (required)",
  "games_played": "number (default: 0)",
  "goals": "number (default: 0, optional)",
  "assists": "number (default: 0, optional)",
  "points": "number (default: 0, optional)",
  "season": "text (e.g., '2024', '2024-2025')"
}
```

**Indexes**: `user`, `sport`, `season`

---

## Sample Data

### Sample Teams
```javascript
// Football Team
{
  "name": "Thunder FC",
  "sport": "Football",
  "league": "Premier League",
  "wins": 15,
  "losses": 3,
  "draws": 2,
  "points": 47
}

// Basketball Team
{
  "name": "Sky Hawks",
  "sport": "Basketball",
  "league": "NBA",
  "wins": 42,
  "losses": 18,
  "draws": 0,
  "points": 84
}
```

### Sample Live Match
```javascript
{
  "team_home": "team_id_1",
  "team_away": "team_id_2",
  "score_home": 2,
  "score_away": 1,
  "status": "Live",
  "match_date": "2025-12-05T18:00:00Z",
  "sport": "Football"
}
```

### Sample Venue
```javascript
{
  "name": "Central Sports Arena",
  "address": "123 Main Street, City",
  "capacity": 50000,
  "sport_types": ["Football", "Rugby", "Athletics"],
  "facilities": ["Parking", "Food Courts", "VIP Boxes"],
  "booking_available": true
}
```

---

## API Rules (PocketBase)

### `sport_teams`
```javascript
// List/View
@request.auth.id != ""

// Create
@request.auth.id != "" && @request.auth.role = "Admin"

// Update
@request.auth.id != "" && (
  @request.auth.role = "Admin" ||
  coach.id = @request.auth.id
)

// Delete
@request.auth.role = "Admin"
```

### `sport_matches`
```javascript
// List/View
@request.auth.id != ""

// Create/Update
@request.auth.role ~ "Admin|Teacher"

// Delete
@request.auth.role = "Admin"
```

### `sport_activities`
```javascript
// List/View
@request.auth.id = user.id || @request.auth.role ~ "Admin|Teacher"

// Create
@request.auth.id = @request.data.user

// Update/Delete
@request.auth.id = user.id
```

---

## Quick Setup Script

Run this in PocketBase admin panel (Collections → Import):

```json
[
  {
    "name": "sport_activities",
    "type": "base",
    "schema": [
      {"name": "user", "type": "relation", "required": true, "options": {"collectionId": "users"}},
      {"name": "sport", "type": "text", "required": true},
      {"name": "activity_type", "type": "select", "required": true, "options": {"values": ["Training", "Match", "Practice"]}},
      {"name": "duration", "type": "number", "required": true},
      {"name": "calories", "type": "number"},
      {"name": "date", "type": "date", "required": true},
      {"name": "notes", "type": "text"}
    ]
  },
  {
    "name": "sport_teams",
    "type": "base",
    "schema": [
      {"name": "name", "type": "text", "required": true, "unique": true},
      {"name": "sport", "type": "text", "required": true},
      {"name": "league", "type": "text"},
      {"name": "logo_url", "type": "url"},
      {"name": "wins", "type": "number"},
      {"name": "losses", "type": "number"},
      {"name": "draws", "type": "number"},
      {"name": "points", "type": "number"},
      {"name": "members", "type": "relation", "options": {"collectionId": "users", "maxSelect": null}},
      {"name": "coach", "type": "relation", "options": {"collectionId": "users", "maxSelect": 1}}
    ]
  }
]
```

---

**Status**: Collections defined, ready for PocketBase setup  
**Next Step**: Create collections in PocketBase admin panel
