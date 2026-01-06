import React, { useState, useEffect } from 'react';
import { Icon, Card, Button, Modal, Input } from '../components/shared/ui/CommonUI';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import { sportService, SportMatch, SportTeam, SportActivity } from '../services/sportService';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/shared/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';

interface SportAppProps {
    activeTab: string;
    activeSubNav: string;
}

const SportApp: React.FC<SportAppProps> = ({ activeTab, activeSubNav }) => {
    const { user } = useAuth();
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [liveMatches, setLiveMatches] = useState<SportMatch[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<SportMatch[]>([]);
    const [teams, setTeams] = useState<SportTeam[]>([]);
    const [activities, setActivities] = useState<SportActivity[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Betting State
    const [bettingMatch, setBettingMatch] = useState<SportMatch | null>(null);
    const [betAmount, setBetAmount] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');

    useEffect(() => {
        loadData();
        
        // Simulate live score updates
        const interval = setInterval(() => {
            setLiveMatches(prev => prev.map(match => {
                if (Math.random() > 0.7) { // 30% chance to update score
                    const isHome = Math.random() > 0.5;
                    return {
                        ...match,
                        score_home: isHome ? match.score_home + 1 : match.score_home,
                        score_away: !isHome ? match.score_away + 1 : match.score_away
                    };
                }
                return match;
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, [activeSubNav, user]);

    const handlePlaceBet = () => {
        if (!bettingMatch || !selectedTeam || !betAmount) return;
        
        // Simulate bet placement
        alert(`Bet placed! $${betAmount} on ${(bettingMatch as any).expand?.[selectedTeam === bettingMatch.team_home ? 'team_home' : 'team_away']?.name}`);
        setBettingMatch(null);
        setBetAmount('');
        setSelectedTeam('');
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const sportFilter = activeSubNav !== 'Dashboard' ? activeSubNav : undefined;
            
            const promises: Promise<SportMatch[] | SportTeam[] | SportActivity[]>[] = [
                sportService.getLiveMatches(),
                sportService.getUpcomingMatches(sportFilter),
                sportService.getTeams(sportFilter)
            ];

            if (user) {
                promises.push(sportService.getActivityLog(user.id));
            }

            const results = await Promise.all(promises);
            
            setLiveMatches(results[0] as SportMatch[]);
            setUpcomingMatches(results[1] as SportMatch[]);
            setTeams(results[2] as SportTeam[]);
            if (user) {
                setActivities(results[3] as SportActivity[]);
            }

        } catch (error) {
            console.error('Failed to load sport data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Icon name="TrophyIcon" className="w-8 h-8 text-yellow-500" />
                            Live Sports
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {activeSubNav} • Real-time updates
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAIModalOpen(true)}
                        className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                        <Icon name="Sparkles" className="w-4 h-4" />
                        AI Match Analysis
                    </Button>
                </div>

                {/* Live Scoreboard */}
                {liveMatches.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {liveMatches.map((match, index) => (
                            <motion.div
                                key={match.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="min-w-[280px] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-gray-900 dark:to-gray-800 text-white rounded-xl p-4 shadow-xl border border-gray-700"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs text-red-400 font-bold flex items-center gap-1 animate-pulse">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        LIVE
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono">{match.sport}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col items-center gap-2 flex-1">
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white/20">
                                            {(match as any).expand?.team_home?.name?.substring(0, 3).toUpperCase() || 'HOM'}
                                        </div>
                                        <span className="text-xs text-gray-300 text-center line-clamp-1">
                                            {(match as any).expand?.team_home?.name || 'Home Team'}
                                        </span>
                                        <span className="font-bold text-2xl">{match.score_home}</span>
                                    </div>

                                    <div className="px-3">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xs text-gray-500">VS</span>
                                            <div className="w-px h-8 bg-gray-700"></div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-2 flex-1">
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white/20">
                                            {(match as any).expand?.team_away?.name?.substring(0, 3).toUpperCase() || 'AWY'}
                                        </div>
                                        <span className="text-xs text-gray-300 text-center line-clamp-1">
                                            {(match as any).expand?.team_away?.name || 'Away Team'}
                                        </span>
                                        <span className="font-bold text-2xl">{match.score_away}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-8">
                        <Icon name="ClockIcon" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">No live matches at the moment</p>
                        <p className="text-sm text-gray-500 mt-1">Check back soon for live updates</p>
                    </Card>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Featured Content */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Upcoming Matches Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Icon name="CalendarIcon" className="w-5 h-5 text-blue-500" />
                                        Upcoming Matches
                                    </h2>
                                    <Button variant="ghost" size="sm" className="text-xs">View Schedule</Button>
                                </div>
                                
                                {upcomingMatches.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingMatches.slice(0, 3).map((match) => (
                                            <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex flex-col items-center w-16">
                                                        <span className="text-xs font-bold text-gray-500 uppercase">
                                                            {new Date(match.match_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {new Date(match.match_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                                {(match as any).expand?.team_home?.name?.substring(0, 1) || 'H'}
                                                            </div>
                                                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                                {(match as any).expand?.team_home?.name || 'Home Team'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                                {(match as any).expand?.team_away?.name?.substring(0, 1) || 'A'}
                                                            </div>
                                                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                                {(match as any).expand?.team_away?.name || 'Away Team'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col gap-2 items-end">
                                                    <span className="text-xs text-gray-500 block mb-1">{match.venue ? 'Stadium Arena' : 'TBA'}</span>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="primary" 
                                                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 border-none"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setBettingMatch(match);
                                                            }}
                                                        >
                                                            Bet
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-7 text-xs">Tickets</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <p>No upcoming matches scheduled.</p>
                                    </div>
                                )}
                            </Card>
                        </motion.div>

                        {/* My Activities Section */}
                        {user && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Icon name="ChartBarIcon" className="w-5 h-5 text-green-500" />
                                            My Activity
                                        </h2>
                                        <Button variant="ghost" size="sm" className="text-xs">Log Activity</Button>
                                    </div>
                                    
                                    {activities.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {activities.slice(0, 4).map((activity) => (
                                                <div key={activity.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                        activity.activity_type === 'Match' ? 'bg-blue-100 text-blue-600' :
                                                        activity.activity_type === 'Training' ? 'bg-green-100 text-green-600' :
                                                        'bg-orange-100 text-orange-600'
                                                    }`}>
                                                        <Icon name={
                                                            activity.activity_type === 'Match' ? 'TrophyIcon' :
                                                            activity.activity_type === 'Training' ? 'BoltIcon' : 'ClockIcon'
                                                        } className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-900 dark:text-white">{activity.activity_type}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {activity.duration} mins • {activity.calories} cal
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                            <p className="mb-2">No activities recorded yet.</p>
                                            <Button size="sm" variant="primary">Start Tracking</Button>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Icon name="FireIcon" className="w-5 h-5 text-red-500" />
                                    {activeSubNav} Highlights
                                </h2>
                            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer">
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all"></div>
                                <Icon name="Play CircleIcon" className="w-20 h-20 text-white/90 group-hover:text-white group-hover:scale-110 transition-all z-10 drop-shadow-2xl" />
                            </div>
                            <h3 className="mt-4 font-bold text-lg text-gray-900 dark:text-white">
                                Championship Finals: Epic Showdown
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                Relive the most exciting moments from today's championship finale. Full highlights, key plays, and post-game analysis.
                            </p>
                            <div className="flex gap-2 mt-4">
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                                    2.4M views
                                </span>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold">
                                    2 hours ago
                                </span>
                            </div>
                        </Card>
                        </motion.div>

                        {/* Recent Highlights Grid */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {[
                                { title: 'Top 10 plays from the season', views: '1.2M', time: '5 hours ago' },
                                { title: 'Player of the Week breakdown', views: '890K', time: '1 day ago' },
                                { title: 'Game-winning goal analysis', views: '654K', time: '2 days ago' },
                                { title: 'Best defensive saves compilation', views: '445K', time: '3 days ago' }
                            ].map((video, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    className="flex gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div className="w-28 h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-md shrink-0 flex items-center justify-center">
                                        <Icon name="PlayCircleIcon" className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm line-clamp-2 text-gray-900 dark:text-white mb-2">
                                            {video.title}
                                        </h4>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] text-gray-500">{video.views} views</span>
                                            <span className="text-[10px] text-gray-400">• {video.time}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right Column - Standings */}
                    <div className="space-y-6">
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm tracking-wider flex items-center gap-2">
                                    <Icon name="ChartBarIcon" className="w-4 h-4" />
                                    Standings
                                </h3>
                                <span className="text-xs text-gray-500">{activeSubNav}</span>
                            </div>

                            <div className="space-y-1">
                                {teams.length > 0 ? (
                                    teams.slice(0, 8).map((team, i) => (
                                        <div
                                            key={team.id}
                                            className="flex items-center justify-between text-sm py-3 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`font-mono w-6 text-center font-bold ${i < 3 ? 'text-yellow-600' : 'text-gray-400'
                                                    }`}>
                                                    {i + 1}
                                                </span>
                                                {i < 3 && <Icon name="TrophyIcon" className="w-4 h-4 text-yellow-500" />}
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                    {team.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-gray-500">
                                                    {team.wins}W - {team.losses}L - {team.draws}D
                                                </span>
                                                <span className="font-mono font-bold text-gray-900 dark:text-white">
                                                    {team.points}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Icon name="InformationCircleIcon" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No teams available</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 uppercase text-sm tracking-wider">
                                Quick Stats
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Matches Today</span>
                                    <span className="font-bold text-xl text-gray-900 dark:text-white">{liveMatches.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Teams</span>
                                    <span className="font-bold text-xl text-gray-900 dark:text-white">{teams.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Viewers</span>
                                    <span className="font-bold text-xl text-gray-900 dark:text-white">24.5K</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Betting Modal */}
            <Modal
                isOpen={!!bettingMatch}
                onClose={() => setBettingMatch(null)}
                title="Place Your Bet"
                size="md"
            >
                {bettingMatch && (
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                            <div className="text-center flex-1">
                                <div className="font-bold text-lg">{(bettingMatch as any).expand?.team_home?.name}</div>
                                <div className="text-sm text-gray-500">Home</div>
                            </div>
                            <div className="font-black text-xl text-gray-300">VS</div>
                            <div className="text-center flex-1">
                                <div className="font-bold text-lg">{(bettingMatch as any).expand?.team_away?.name}</div>
                                <div className="text-sm text-gray-500">Away</div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Select Winner</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setSelectedTeam(bettingMatch.team_home)}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        selectedTeam === bettingMatch.team_home
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="font-bold">{(bettingMatch as any).expand?.team_home?.name}</div>
                                    <div className="text-sm text-emerald-600 font-bold">1.85x</div>
                                </button>
                                <button
                                    onClick={() => setSelectedTeam(bettingMatch.team_away)}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        selectedTeam === bettingMatch.team_away
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="font-bold">{(bettingMatch as any).expand?.team_away?.name}</div>
                                    <div className="text-sm text-emerald-600 font-bold">2.10x</div>
                                </button>
                            </div>
                        </div>

                        <div>
                            <Input 
                                label="Bet Amount ($)" 
                                type="number" 
                                placeholder="0.00"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                            />
                            <div className="mt-2 text-sm text-gray-500 flex justify-between">
                                <span>Potential Win:</span>
                                <span className="font-bold text-emerald-600">
                                    ${(parseFloat(betAmount || '0') * (selectedTeam === bettingMatch.team_home ? 1.85 : 2.10)).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setBettingMatch(null)}>Cancel</Button>
                            <Button 
                                variant="primary" 
                                onClick={handlePlaceBet}
                                disabled={!selectedTeam || !betAmount}
                            >
                                Place Bet
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* AI Modal */}
            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={(content) => {
                    console.log("Match Analysis:", content);
                    setIsAIModalOpen(false);
                    alert("Analysis Generated! (Check console)");
                }}
                title="AI Match Analysis"
                promptTemplate={`Analyze the current ${activeSubNav} game situation:
        
        Provide:
        - Key Tactical Insights
        - Statistical Analysis
        - Predicted Outcome
        - Players to Watch
        - Strategic Recommendations`}
                contextData={{ sport: activeSubNav }}
            />
        </>
    );
};

export default SportApp;