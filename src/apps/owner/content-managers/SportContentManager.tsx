import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, Button, Icon, Modal } from '../../../components/shared/ui/CommonUI';
import { sportService } from '../../../services/sportService';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../context/AuthContext';
import { sanitizeText } from '../../../utils/sanitization';

const teamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(100, 'Team name too long'),
  sport: z.string().min(1, 'Sport is required'),
  league: z.string().max(100, 'League name too long').optional(),
  description: z.string().max(500, 'Description too long').optional()
});

const matchSchema = z.object({
  home_team: z.string().min(1, 'Home team is required'),
  away_team: z.string().min(1, 'Away team is required'),
  sport: z.string().min(1, 'Sport is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  venue: z.string().max(200, 'Venue name too long').optional(),
  status: z.enum(['Scheduled', 'Live', 'Finished', 'Cancelled'])
}).refine((data) => data.home_team !== data.away_team, {
  message: 'Home team and away team must be different',
  path: ['away_team']
});

const venueSchema = z.object({
  name: z.string().min(2, 'Venue name must be at least 2 characters').max(200, 'Venue name too long'),
  address: z.string().max(300, 'Address too long').optional(),
  capacity: z.string().optional(),
  sport_types: z.array(z.string()).optional(),
  facilities: z.array(z.string()).optional()
});

export const SportContentManager: React.FC = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'teams' | 'matches' | 'venues'>('teams');
    const [teams, setTeams] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [venues, setVenues] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [teamFormData, setTeamFormData] = useState({
        name: '',
        sport: '',
        league: '',
        description: ''
    });

    const [matchFormData, setMatchFormData] = useState<{
        home_team: string;
        away_team: string;
        sport: string;
        date: string;
        time: string;
        venue: string;
        status: 'Scheduled' | 'Live' | 'Finished' | 'Cancelled';
    }>({
        home_team: '',
        away_team: '',
        sport: '',
        date: '',
        time: '',
        venue: '',
        status: 'Scheduled'
    });

    const [venueFormData, setVenueFormData] = useState({
        name: '',
        address: '',
        capacity: '',
        sport_types: [],
        facilities: []
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'teams') {
                const data = await sportService.getTeams();
                setTeams(data);
            } else if (activeTab === 'matches') {
                const data = await sportService.getMatches();
                setMatches(data);
            } else {
                const data = await sportService.getVenues();
                setVenues(data);
            }
        } catch (error) {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeam = async () => {
        // Sanitize inputs
        const sanitized = {
            name: sanitizeText(teamFormData.name),
            sport: sanitizeText(teamFormData.sport),
            league: sanitizeText(teamFormData.league),
            description: sanitizeText(teamFormData.description)
        };
        
        // Validate
        const result = teamSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            await sportService.createTeam({
                ...result.data,
                wins: 0,
                losses: 0,
                draws: 0,
                points: 0,
                members: []
            });
            showToast('Team added successfully!', 'success');
            setIsAddModalOpen(false);
            resetTeamForm();
            loadData();
        } catch (error) {
            showToast('Failed to add team', 'error');
        }
    };

    const handleAddMatch = async () => {
        // Sanitize inputs
        const sanitized = {
            home_team: sanitizeText(matchFormData.home_team),
            away_team: sanitizeText(matchFormData.away_team),
            sport: sanitizeText(matchFormData.sport),
            date: matchFormData.date,
            time: matchFormData.time,
            venue: sanitizeText(matchFormData.venue),
            status: matchFormData.status
        };
        
        // Validate
        const result = matchSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            await sportService.createMatch({
                ...result.data,
                score_home: 0,
                score_away: 0
            });
            showToast('Match added successfully!', 'success');
            setIsAddModalOpen(false);
            resetMatchForm();
            loadData();
        } catch (error) {
            showToast('Failed to add match', 'error');
        }
    };

    const handleAddVenue = async () => {
        try {
            await sportService.createVenue({
                ...venueFormData,
                capacity: parseInt(venueFormData.capacity) || 0,
                booking_available: true
            });
            showToast('Venue added successfully!', 'success');
            setIsAddModalOpen(false);
            resetVenueForm();
            loadData();
        } catch (error) {
            showToast('Failed to add venue', 'error');
        }
    };

    const resetTeamForm = () => {
        setTeamFormData({ name: '', sport: '', league: '', description: '' });
    };

    const resetMatchForm = () => {
        setMatchFormData({ home_team: '', away_team: '', sport: '', date: '', time: '', venue: '', status: 'Scheduled' });
    };

    const resetVenueForm = () => {
        setVenueFormData({ name: '', address: '', capacity: '', sport_types: [], facilities: [] });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Sport Content Manager
                </h2>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    Add {activeTab === 'teams' ? 'Team' : activeTab === 'matches' ? 'Match' : 'Venue'}
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                {['teams', 'matches', 'venues'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-3 font-semibold transition-colors border-b-2 capitalize ${activeTab === tab
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <>
                    {activeTab === 'teams' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teams.map(team => (
                                <Card key={team.id} className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{team.name}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{team.sport} • {team.league}</p>
                                            <div className="flex gap-4 mt-3 text-sm">
                                                <span className="text-green-600">W: {team.wins}</span>
                                                <span className="text-red-600">L: {team.losses}</span>
                                                <span className="text-gray-600">D: {team.draws}</span>
                                                <span className="font-bold">Pts: {team.points}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {teams.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-500">
                                    No teams yet. Click "Add Team" to get started.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'matches' && (
                        <div className="grid grid-cols-1 gap-4">
                            {matches.map(match => (
                                <Card key={match.id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold">{match.home_team?.name || 'TBD'}</span>
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {match.home_score} - {match.away_score}
                                                </span>
                                                <span className="font-bold">{match.away_team?.name || 'TBD'}</span>
                                            </div>
                                            <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                <span>{new Date(match.date).toLocaleDateString()}</span>
                                                <span>{match.time}</span>
                                                <span>{match.venue?.name}</span>
                                                <span className={`px-2 py-1 rounded ${match.status === 'live' ? 'bg-red-100 text-red-700' :
                                                        match.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {match.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {matches.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No matches yet. Click "Add Match" to schedule one.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'venues' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {venues.map(venue => (
                                <Card key={venue.id} className="p-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{venue.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{venue.address}</p>
                                    <div className="mt-3">
                                        <p className="text-sm"><strong>Capacity:</strong> {venue.capacity?.toLocaleString()}</p>
                                        <p className="text-sm"><strong>Sports:</strong> {venue.sport_types?.join(', ')}</p>
                                    </div>
                                </Card>
                            ))}
                            {venues.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-500">
                                    No venues yet. Click "Add Venue" to create one.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Add ${activeTab === 'teams' ? 'Team' : activeTab === 'matches' ? 'Match' : 'Venue'}`}
            >
                {activeTab === 'teams' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Team Name *</label>
                            <input
                                type="text"
                                className="w-full border-2 p-3 rounded-lg"
                                value={teamFormData.name}
                                onChange={e => setTeamFormData({ ...teamFormData, name: e.target.value })}
                                placeholder="Thunder FC"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Sport *</label>
                                <input
                                    type="text"
                                    className="w-full border-2 p-3 rounded-lg"
                                    value={teamFormData.sport}
                                    onChange={e => setTeamFormData({ ...teamFormData, sport: e.target.value })}
                                    placeholder="Football, Basketball, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">League</label>
                                <input
                                    type="text"
                                    className="w-full border-2 p-3 rounded-lg"
                                    value={teamFormData.league}
                                    onChange={e => setTeamFormData({ ...teamFormData, league: e.target.value })}
                                    placeholder="Premier League"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="primary" onClick={handleAddTeam} className="flex-1">Add Team</Button>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                )}

                {activeTab === 'matches' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Date *</label>
                                <input
                                    type="date"
                                    className="w-full border-2 p-3 rounded-lg"
                                    value={matchFormData.date}
                                    onChange={e => setMatchFormData({ ...matchFormData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Time *</label>
                                <input
                                    type="time"
                                    className="w-full border-2 p-3 rounded-lg"
                                    value={matchFormData.time}
                                    onChange={e => setMatchFormData({ ...matchFormData, time: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Sport *</label>
                            <input
                                type="text"
                                className="w-full border-2 p-3 rounded-lg"
                                value={matchFormData.sport}
                                onChange={e => setMatchFormData({ ...matchFormData, sport: e.target.value })}
                                placeholder="Football, Basketball, etc."
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="primary" onClick={handleAddMatch} className="flex-1">Add Match</Button>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                )}

                {activeTab === 'venues' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Venue Name *</label>
                            <input
                                type="text"
                                className="w-full border-2 p-3 rounded-lg"
                                value={venueFormData.name}
                                onChange={e => setVenueFormData({ ...venueFormData, name: e.target.value })}
                                placeholder="Central Sports Arena"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Address *</label>
                            <input
                                type="text"
                                className="w-full border-2 p-3 rounded-lg"
                                value={venueFormData.address}
                                onChange={e => setVenueFormData({ ...venueFormData, address: e.target.value })}
                                placeholder="123 Main St, City"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Capacity</label>
                            <input
                                type="number"
                                className="w-full border-2 p-3 rounded-lg"
                                value={venueFormData.capacity}
                                onChange={e => setVenueFormData({ ...venueFormData, capacity: e.target.value })}
                                placeholder="50000"
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="primary" onClick={handleAddVenue} className="flex-1">Add Venue</Button>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
