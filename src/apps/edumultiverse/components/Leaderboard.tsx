import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Icon } from '../../../components/shared/ui/CommonUI';
import pb from '../../../lib/pocketbase';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    userName: string;
    avatar?: string;
    level: number;
    totalXP: number;
    achievements: number;
    classId?: string;
    className?: string;
}

type LeaderboardType = 'global' | 'class' | 'grade' | 'weekly';

export const Leaderboard: React.FC = () => {
    const [type, setType] = useState<LeaderboardType>('global');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');

    useEffect(() => {
        loadLeaderboard();
    }, [type, period]);

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            let filter = '';
            if (type === 'weekly') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                filter = `created >= "${weekAgo.toISOString()}"`;
            }

            const progress = await pb.collection('gamification_progress').getList(1, 100, {
                filter,
                sort: '-total_xp',
                expand: 'user'
            });

            const leaderboardData: LeaderboardEntry[] = progress.items.map((item: any, index) => ({
                rank: index + 1,
                userId: item.user,
                userName: item.expand?.user?.name || 'Unknown',
                avatar: item.expand?.user?.avatar,
                level: item.level || 1,
                totalXP: item.total_xp || 0,
                achievements: item.achievements_unlocked || 0,
                classId: item.expand?.user?.class,
                className: item.expand?.user?.expand?.class?.name
            }));

            setEntries(leaderboardData);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'from-yellow-400 to-yellow-600';
        if (rank === 2) return 'from-gray-300 to-gray-500';
        if (rank === 3) return 'from-orange-400 to-orange-600';
        return 'from-blue-500 to-purple-600';
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return '👑';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Leaderboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Compete with your classmates!</p>
                </div>

                {/* Type Selector */}
                <div className="flex gap-2">
                    {(['global', 'class', 'grade', 'weekly'] as LeaderboardType[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`px-4 py-2 rounded-lg font-semibold capitalize transition-all ${type === t
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Period Selector */}
            {type !== 'weekly' && (
                <div className="flex gap-2 mb-6">
                    {(['all', 'week', 'month'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold capitalize ${period === p
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {p === 'all' ? 'All Time' : `This ${p}`}
                        </button>
                    ))}
                </div>
            )}

            {/* Top 3 Podium */}
            {entries.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
                    {/* 2nd Place */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col items-center order-1"
                    >
                        <Card className={`w-full p-6 bg-gradient-to-br ${getRankColor(2)} text-white text-center`}>
                            <div className="text-6xl mb-2">{getRankIcon(2)}</div>
                            <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center text-3xl">
                                {entries[1].avatar ? (
                                    <img src={entries[1].avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    '👤'
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-1">{entries[1].userName}</h3>
                            <p className="text-sm opacity-90">Level {entries[1].level}</p>
                            <p className="text-2xl font-black mt-2">{entries[1].totalXP.toLocaleString()} XP</p>
                        </Card>
                    </motion.div>

                    {/* 1st Place */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col items-center order-0 -mt-4"
                    >
                        <Card className={`w-full p-8 bg-gradient-to-br ${getRankColor(1)} text-white text-center shadow-2xl`}>
                            <div className="text-8xl mb-2">{getRankIcon(1)}</div>
                            <div className="w-24 h-24 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center text-4xl border-4 border-white/50">
                                {entries[0].avatar ? (
                                    <img src={entries[0].avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    '👤'
                                )}
                            </div>
                            <h3 className="font-bold text-2xl mb-1">{entries[0].userName}</h3>
                            <p className="text-base opacity-90">Level {entries[0].level}</p>
                            <p className="text-3xl font-black mt-3">{entries[0].totalXP.toLocaleString()} XP</p>
                        </Card>
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center order-2"
                    >
                        <Card className={`w-full p-6 bg-gradient-to-br ${getRankColor(3)} text-white text-center`}>
                            <div className="text-6xl mb-2">{getRankIcon(3)}</div>
                            <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center text-3xl">
                                {entries[2].avatar ? (
                                    <img src={entries[2].avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    '👤'
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-1">{entries[2].userName}</h3>
                            <p className="text-sm opacity-90">Level {entries[2].level}</p>
                            <p className="text-2xl font-black mt-2">{entries[2].totalXP.toLocaleString()} XP</p>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* Rest of Leaderboard */}
            <div className="space-y-2">
                {entries.slice(3).map((entry, index) => (
                    <motion.div
                        key={entry.userId}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="p-4 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold">
                                        #{entry.rank}
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl">
                                        {entry.avatar ? (
                                            <img src={entry.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            '👤'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{entry.userName}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Level {entry.level} • {entry.achievements} achievements
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {entry.totalXP.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">XP</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {loading && (
                <div className="text-center py-12">
                    <Icon name="ArrowPathIcon" className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                    <p className="text-gray-500 mt-2">Loading leaderboard...</p>
                </div>
            )}

            {!loading && entries.length === 0 && (
                <Card className="p-12 text-center">
                    <Icon name="TrophyIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Rankings Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Be the first to earn XP and climb the leaderboard!
                    </p>
                </Card>
            )}
        </div>
    );
};
