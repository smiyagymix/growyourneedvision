import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface SportActivity {
    id: string;
    user: string;
    sport: string;
    activity_type: 'Training' | 'Match' | 'Practice';
    duration: number;
    calories: number;
    date: string;
    notes?: string;
    created: string;
}

export interface SportTeam {
    id: string;
    name: string;
    sport: string;
    league?: string;
    logo_url?: string;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    members: string[];
    coach?: string;
    created: string;
}

export interface SportMatch {
    id: string;
    team_home: string;
    team_away: string;
    score_home: number;
    score_away: number;
    status: 'Scheduled' | 'Live' | 'Finished' | 'Cancelled';
    match_date: string;
    venue?: string;
    sport: string;
    created: string;
    expand?: {
        team_home?: SportTeam;
        team_away?: SportTeam;
        venue?: SportVenue;
    };
}

export interface SportVenue {
    id: string;
    name: string;
    address: string;
    capacity?: number;
    sport_types: string[];
    facilities: string[];
    booking_available: boolean;
    created: string;
}

export interface PlayerStats {
    id: string;
    user: string;
    sport: string;
    games_played: number;
    goals?: number;
    assists?: number;
    points?: number;
    season: string;
    created: string;
}

// Mock Data
const MOCK_TEAMS: SportTeam[] = [
    {
        id: 'team-1',
        name: 'Manchester United',
        sport: 'Football',
        league: 'Premier League',
        logo_url: 'https://example.com/mu-logo.png',
        wins: 15,
        losses: 5,
        draws: 3,
        points: 48,
        members: ['player-1', 'player-2'],
        coach: 'coach-1',
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'team-2',
        name: 'Real Madrid',
        sport: 'Football',
        league: 'La Liga',
        logo_url: 'https://example.com/rm-logo.png',
        wins: 18,
        losses: 2,
        draws: 4,
        points: 58,
        members: ['player-3', 'player-4'],
        coach: 'coach-2',
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'team-3',
        name: 'Lakers',
        sport: 'Basketball',
        league: 'NBA',
        logo_url: 'https://example.com/lakers-logo.png',
        wins: 30,
        losses: 15,
        draws: 0,
        points: 0,
        members: ['player-5', 'player-6'],
        coach: 'coach-3',
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'team-4',
        name: 'Warriors',
        sport: 'Basketball',
        league: 'NBA',
        logo_url: 'https://example.com/warriors-logo.png',
        wins: 35,
        losses: 10,
        draws: 0,
        points: 0,
        members: ['player-7', 'player-8'],
        coach: 'coach-4',
        created: '2024-01-01T00:00:00Z'
    }
];

const MOCK_MATCHES: SportMatch[] = [
    {
        id: 'match-1',
        team_home: 'team-1',
        team_away: 'team-2',
        score_home: 2,
        score_away: 1,
        status: 'Live',
        match_date: new Date().toISOString(),
        venue: 'venue-1',
        sport: 'Football',
        created: '2024-01-25T00:00:00Z'
    },
    {
        id: 'match-2',
        team_home: 'team-3',
        team_away: 'team-4',
        score_home: 98,
        score_away: 102,
        status: 'Live',
        match_date: new Date().toISOString(),
        venue: 'venue-2',
        sport: 'Basketball',
        created: '2024-01-25T00:00:00Z'
    },
    {
        id: 'match-3',
        team_home: 'team-2',
        team_away: 'team-1',
        score_home: 0,
        score_away: 0,
        status: 'Scheduled',
        match_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'venue-3',
        sport: 'Football',
        created: '2024-01-20T00:00:00Z'
    },
    {
        id: 'match-4',
        team_home: 'team-1',
        team_away: 'team-2',
        score_home: 3,
        score_away: 0,
        status: 'Finished',
        match_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'venue-1',
        sport: 'Football',
        created: '2024-01-18T00:00:00Z'
    }
];

const MOCK_VENUES: SportVenue[] = [
    {
        id: 'venue-1',
        name: 'Old Trafford',
        address: 'Sir Matt Busby Way, Manchester',
        capacity: 74000,
        sport_types: ['Football'],
        facilities: ['Parking', 'VIP Lounge', 'Restaurant', 'Medical Center'],
        booking_available: false,
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'venue-2',
        name: 'Staples Center',
        address: '1111 S Figueroa St, Los Angeles',
        capacity: 19000,
        sport_types: ['Basketball', 'Hockey', 'Concert'],
        facilities: ['Parking', 'VIP Lounge', 'Multiple Restaurants', 'Shop'],
        booking_available: false,
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'venue-3',
        name: 'Santiago Bernabéu',
        address: 'Av. de Concha Espina, Madrid',
        capacity: 81000,
        sport_types: ['Football'],
        facilities: ['Museum', 'Restaurant', 'Shop', 'Tour'],
        booking_available: false,
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'venue-4',
        name: 'Local Community Center',
        address: '123 Main Street',
        capacity: 500,
        sport_types: ['Basketball', 'Volleyball', 'Badminton'],
        facilities: ['Parking', 'Changing Rooms', 'Cafeteria'],
        booking_available: true,
        created: '2024-01-01T00:00:00Z'
    }
];

const MOCK_ACTIVITIES: SportActivity[] = [
    {
        id: 'activity-1',
        user: 'user-1',
        sport: 'Football',
        activity_type: 'Training',
        duration: 90,
        calories: 650,
        date: new Date().toISOString().split('T')[0],
        notes: 'Focused on passing drills',
        created: new Date().toISOString()
    },
    {
        id: 'activity-2',
        user: 'user-1',
        sport: 'Running',
        activity_type: 'Practice',
        duration: 45,
        calories: 450,
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        notes: '5K run around the park',
        created: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 'activity-3',
        user: 'user-1',
        sport: 'Basketball',
        activity_type: 'Match',
        duration: 60,
        calories: 500,
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        notes: 'Friendly match with coworkers',
        created: new Date(Date.now() - 172800000).toISOString()
    }
];

const MOCK_PLAYER_STATS: PlayerStats[] = [
    {
        id: 'stats-1',
        user: 'user-1',
        sport: 'Football',
        games_played: 15,
        goals: 8,
        assists: 5,
        points: 0,
        season: '2024',
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'stats-2',
        user: 'user-2',
        sport: 'Football',
        games_played: 18,
        goals: 12,
        assists: 3,
        points: 0,
        season: '2024',
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'stats-3',
        user: 'user-1',
        sport: 'Basketball',
        games_played: 10,
        goals: 0,
        assists: 25,
        points: 180,
        season: '2024',
        created: '2024-01-01T00:00:00Z'
    }
];

export const sportService = {
    // Activity Logging
    getActivityLog: async (userId: string): Promise<SportActivity[]> => {
        if (isMockEnv()) {
            return MOCK_ACTIVITIES.filter(a => a.user === userId);
        }

        return await pb.collection('sport_activities').getFullList<SportActivity>({
            filter: `user = "${userId}"`,
            sort: '-date'
        });
    },

    getActivityById: async (id: string): Promise<SportActivity | null> => {
        if (isMockEnv()) {
            return MOCK_ACTIVITIES.find(a => a.id === id) || null;
        }

        try {
            return await pb.collection('sport_activities').getOne<SportActivity>(id);
        } catch {
            return null;
        }
    },

    createActivity: async (data: Partial<SportActivity>): Promise<SportActivity> => {
        if (isMockEnv()) {
            const newActivity: SportActivity = {
                id: `activity-${Date.now()}`,
                user: data.user || '',
                sport: data.sport || 'Other',
                activity_type: data.activity_type || 'Practice',
                duration: data.duration || 0,
                calories: data.calories || 0,
                date: data.date || new Date().toISOString().split('T')[0],
                notes: data.notes,
                created: new Date().toISOString()
            };
            MOCK_ACTIVITIES.unshift(newActivity);
            return newActivity;
        }

        return await pb.collection('sport_activities').create(data);
    },

    updateActivity: async (id: string, data: Partial<SportActivity>): Promise<SportActivity | null> => {
        if (isMockEnv()) {
            const activity = MOCK_ACTIVITIES.find(a => a.id === id);
            if (activity) {
                Object.assign(activity, data);
            }
            return activity || null;
        }

        return await pb.collection('sport_activities').update(id, data);
    },

    deleteActivity: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_ACTIVITIES.findIndex(a => a.id === id);
            if (index !== -1) {
                MOCK_ACTIVITIES.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('sport_activities').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    getActivityStats: async (userId: string): Promise<{
        totalActivities: number;
        totalDuration: number;
        totalCalories: number;
        bySport: Record<string, number>;
    }> => {
        if (isMockEnv()) {
            const activities = MOCK_ACTIVITIES.filter(a => a.user === userId);
            const bySport: Record<string, number> = {};
            activities.forEach(a => {
                bySport[a.sport] = (bySport[a.sport] || 0) + 1;
            });

            return {
                totalActivities: activities.length,
                totalDuration: activities.reduce((sum, a) => sum + a.duration, 0),
                totalCalories: activities.reduce((sum, a) => sum + a.calories, 0),
                bySport
            };
        }

        try {
            const activities = await pb.collection('sport_activities').getFullList<SportActivity>({
                filter: `user = "${userId}"`
            });

            const bySport: Record<string, number> = {};
            activities.forEach(a => {
                bySport[a.sport] = (bySport[a.sport] || 0) + 1;
            });

            return {
                totalActivities: activities.length,
                totalDuration: activities.reduce((sum, a) => sum + a.duration, 0),
                totalCalories: activities.reduce((sum, a) => sum + a.calories, 0),
                bySport
            };
        } catch {
            return {
                totalActivities: 0,
                totalDuration: 0,
                totalCalories: 0,
                bySport: {}
            };
        }
    },

    // Teams
    getTeams: async (sport?: string): Promise<SportTeam[]> => {
        if (isMockEnv()) {
            if (sport) {
                return MOCK_TEAMS.filter(t => t.sport === sport);
            }
            return [...MOCK_TEAMS];
        }

        try {
            const filter = sport ? `sport = "${sport}"` : '';
            const result = await pb.collection('sport_teams').getFullList<SportTeam>({
                filter,
                sort: '-points'
            });
            return result;
        } catch (error) {
            console.error('Failed to fetch teams:', error);
            return [];
        }
    },

    getTeamById: async (id: string): Promise<SportTeam | null> => {
        if (isMockEnv()) {
            return MOCK_TEAMS.find(t => t.id === id) || null;
        }

        try {
            return await pb.collection('sport_teams').getOne<SportTeam>(id, {
                expand: 'members,coach'
            });
        } catch {
            return null;
        }
    },

    createTeam: async (data: Partial<SportTeam>): Promise<SportTeam> => {
        if (isMockEnv()) {
            const newTeam: SportTeam = {
                id: `team-${Date.now()}`,
                name: data.name || 'New Team',
                sport: data.sport || 'Football',
                league: data.league,
                logo_url: data.logo_url,
                wins: 0,
                losses: 0,
                draws: 0,
                points: 0,
                members: data.members || [],
                coach: data.coach,
                created: new Date().toISOString()
            };
            MOCK_TEAMS.push(newTeam);
            return newTeam;
        }

        return await pb.collection('sport_teams').create(data);
    },

    updateTeam: async (id: string, data: Partial<SportTeam>): Promise<SportTeam | null> => {
        if (isMockEnv()) {
            const team = MOCK_TEAMS.find(t => t.id === id);
            if (team) {
                Object.assign(team, data);
            }
            return team || null;
        }

        return await pb.collection('sport_teams').update(id, data);
    },

    // Matches
    getMatches: async (sport?: string, status?: string): Promise<SportMatch[]> => {
        if (isMockEnv()) {
            let matches = [...MOCK_MATCHES];
            if (sport) {
                matches = matches.filter(m => m.sport === sport);
            }
            if (status) {
                matches = matches.filter(m => m.status === status);
            }
            
            // Expand team data
            return matches.map(m => ({
                ...m,
                expand: {
                    team_home: MOCK_TEAMS.find(t => t.id === m.team_home),
                    team_away: MOCK_TEAMS.find(t => t.id === m.team_away),
                    venue: MOCK_VENUES.find(v => v.id === m.venue)
                }
            }));
        }

        const filters = [];
        if (sport) filters.push(`sport = "${sport}"`);
        if (status) filters.push(`status = "${status}"`);

        return await pb.collection('sport_matches').getFullList<SportMatch>({
            filter: filters.join(' && '),
            sort: '-match_date',
            expand: 'team_home,team_away,venue'
        });
    },

    getLiveMatches: async (): Promise<SportMatch[]> => {
        if (isMockEnv()) {
            return MOCK_MATCHES
                .filter(m => m.status === 'Live')
                .map(m => ({
                    ...m,
                    expand: {
                        team_home: MOCK_TEAMS.find(t => t.id === m.team_home),
                        team_away: MOCK_TEAMS.find(t => t.id === m.team_away)
                    }
                }));
        }

        try {
            const result = await pb.collection('sport_matches').getFullList<SportMatch>({
                filter: 'status = "Live"',
                expand: 'team_home,team_away'
            });
            return result;
        } catch (error) {
            console.error('Failed to fetch live matches:', error);
            return [];
        }
    },

    getUpcomingMatches: async (sport?: string): Promise<SportMatch[]> => {
        if (isMockEnv()) {
            let matches = MOCK_MATCHES.filter(m => m.status === 'Scheduled');
            if (sport) {
                matches = matches.filter(m => m.sport === sport);
            }
            return matches.map(m => ({
                ...m,
                expand: {
                    team_home: MOCK_TEAMS.find(t => t.id === m.team_home),
                    team_away: MOCK_TEAMS.find(t => t.id === m.team_away),
                    venue: MOCK_VENUES.find(v => v.id === m.venue)
                }
            }));
        }

        try {
            const filter = sport
                ? `status = "Scheduled" && sport = "${sport}"`
                : 'status = "Scheduled"';

            const result = await pb.collection('sport_matches').getFullList<SportMatch>({
                filter,
                sort: 'match_date',
                expand: 'team_home,team_away,venue'
            });
            return result;
        } catch (error) {
            console.error('Failed to fetch upcoming matches:', error);
            return [];
        }
    },

    getFinishedMatches: async (sport?: string, limit: number = 10): Promise<SportMatch[]> => {
        if (isMockEnv()) {
            let matches = MOCK_MATCHES.filter(m => m.status === 'Finished');
            if (sport) {
                matches = matches.filter(m => m.sport === sport);
            }
            return matches.slice(0, limit).map(m => ({
                ...m,
                expand: {
                    team_home: MOCK_TEAMS.find(t => t.id === m.team_home),
                    team_away: MOCK_TEAMS.find(t => t.id === m.team_away)
                }
            }));
        }

        try {
            const filter = sport
                ? `status = "Finished" && sport = "${sport}"`
                : 'status = "Finished"';

            const result = await pb.collection('sport_matches').getList<SportMatch>(1, limit, {
                filter,
                sort: '-match_date',
                expand: 'team_home,team_away'
            });
            return result.items;
        } catch {
            return [];
        }
    },

    createMatch: async (data: Partial<SportMatch>): Promise<SportMatch> => {
        if (isMockEnv()) {
            const newMatch: SportMatch = {
                id: `match-${Date.now()}`,
                team_home: data.team_home || '',
                team_away: data.team_away || '',
                score_home: data.score_home || 0,
                score_away: data.score_away || 0,
                status: data.status || 'Scheduled',
                match_date: data.match_date || new Date().toISOString(),
                venue: data.venue,
                sport: data.sport || 'Football',
                created: new Date().toISOString()
            };
            MOCK_MATCHES.push(newMatch);
            return newMatch;
        }

        return await pb.collection('sport_matches').create(data);
    },

    updateMatch: async (id: string, data: Partial<SportMatch>): Promise<SportMatch | null> => {
        if (isMockEnv()) {
            const match = MOCK_MATCHES.find(m => m.id === id);
            if (match) {
                Object.assign(match, data);
            }
            return match || null;
        }

        return await pb.collection('sport_matches').update(id, data);
    },

    updateMatchScore: async (id: string, scoreHome: number, scoreAway: number): Promise<SportMatch | null> => {
        return sportService.updateMatch(id, { score_home: scoreHome, score_away: scoreAway });
    },

    // Venues
    getVenues: async (sportType?: string): Promise<SportVenue[]> => {
        if (isMockEnv()) {
            if (sportType) {
                return MOCK_VENUES.filter(v => v.sport_types.includes(sportType));
            }
            return [...MOCK_VENUES];
        }

        const filter = sportType ? `sport_types ~ "${sportType}"` : '';
        return await pb.collection('sport_venues').getFullList<SportVenue>({ filter });
    },

    getVenueById: async (id: string): Promise<SportVenue | null> => {
        if (isMockEnv()) {
            return MOCK_VENUES.find(v => v.id === id) || null;
        }

        try {
            return await pb.collection('sport_venues').getOne<SportVenue>(id);
        } catch {
            return null;
        }
    },

    getBookableVenues: async (): Promise<SportVenue[]> => {
        if (isMockEnv()) {
            return MOCK_VENUES.filter(v => v.booking_available);
        }

        return await pb.collection('sport_venues').getFullList<SportVenue>({
            filter: 'booking_available = true'
        });
    },

    createVenue: async (data: Partial<SportVenue>): Promise<SportVenue> => {
        if (isMockEnv()) {
            const newVenue: SportVenue = {
                id: `venue-${Date.now()}`,
                name: data.name || 'New Venue',
                address: data.address || '',
                capacity: data.capacity,
                sport_types: data.sport_types || [],
                facilities: data.facilities || [],
                booking_available: data.booking_available ?? true,
                created: new Date().toISOString()
            };
            MOCK_VENUES.push(newVenue);
            return newVenue;
        }

        return await pb.collection('sport_venues').create(data);
    },

    // Player Stats
    getPlayerStats: async (userId: string, sport?: string): Promise<PlayerStats[]> => {
        if (isMockEnv()) {
            let stats = MOCK_PLAYER_STATS.filter(s => s.user === userId);
            if (sport) {
                stats = stats.filter(s => s.sport === sport);
            }
            return stats;
        }

        const filter = sport
            ? `user = "${userId}" && sport = "${sport}"`
            : `user = "${userId}"`;

        return await pb.collection('player_stats').getFullList<PlayerStats>({
            filter,
            sort: '-season'
        });
    },

    updatePlayerStats: async (id: string, data: Partial<PlayerStats>): Promise<PlayerStats | null> => {
        if (isMockEnv()) {
            const stats = MOCK_PLAYER_STATS.find(s => s.id === id);
            if (stats) {
                Object.assign(stats, data);
            }
            return stats || null;
        }

        return await pb.collection('player_stats').update(id, data);
    },

    // Leaderboard
    getLeaderboard: async (sport: string, stat: 'goals' | 'assists' | 'points'): Promise<PlayerStats[]> => {
        if (isMockEnv()) {
            return MOCK_PLAYER_STATS
                .filter(s => s.sport === sport)
                .sort((a, b) => (b[stat] || 0) - (a[stat] || 0));
        }

        return await pb.collection('player_stats').getFullList<PlayerStats>({
            filter: `sport = "${sport}"`,
            sort: `-${stat}`,
            expand: 'user'
        });
    },

    // Get available sports
    getSports: async (): Promise<string[]> => {
        if (isMockEnv()) {
            return [...new Set(MOCK_TEAMS.map(t => t.sport))];
        }

        try {
            const teams = await pb.collection('sport_teams').getFullList<SportTeam>({
                fields: 'sport'
            });
            return [...new Set(teams.map(t => t.sport))];
        } catch {
            return ['Football', 'Basketball', 'Tennis', 'Swimming'];
        }
    }
};
