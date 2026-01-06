import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { multiverseService } from '../services/multiverseService';
import { Timeline, Mission } from '../types/gamification';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';
import { Icon } from '../../../components/shared/ui/CommonUI';

export const ParallelClassrooms: React.FC = () => {
    const { universeId } = useParams<{ universeId: string }>();
    const navigate = useNavigate();
    const [timelines, setTimelines] = useState<Timeline[]>([]);
    const [missions, setMissions] = useState<Record<string, Mission[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (universeId) {
            loadData(universeId);
        }
    }, [universeId]);

    const loadData = async (id: string) => {
        setLoading(true);
        try {
            // 1. Fetch Timelines
            const tData = await multiverseService.getTimelines(id);
            setTimelines(tData);

            // 2. Fetch Missions for each timeline
            const missionMap: Record<string, Mission[]> = {};
            await Promise.all(tData.map(async (t) => {
                const mData = await multiverseService.getMissions(id, t.id);
                missionMap[t.id] = mData;
            }));
            setMissions(missionMap);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden font-sans">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 backdrop-blur sticky top-0 z-50 shadow-lg">
                <button
                    onClick={() => navigate(-1)}
                    className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                >
                    <Icon name="ArrowLeft" className="w-4 h-4" /> Back to Map
                </button>
                <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    PARALLEL TIMELINES
                </h2>
                <div className="w-24"></div> {/* Spacer */}
            </div>

            {/* Content */}
            {timelines.length > 0 ? (
                <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-x-auto overflow-y-hidden">
                    {timelines.map((timeline) => (
                        <TimelineTrack
                            key={timeline.id}
                            timeline={timeline}
                            missions={missions[timeline.id] || []}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                    <Icon name="CubeTransparent" className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">No timelines found in this universe.</p>
                </div>
            )}
        </div>
    );
};

const TimelineTrack: React.FC<{ timeline: Timeline; missions: Mission[] }> = ({ timeline, missions }) => {
    const getTheme = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'border-green-500/30 bg-green-900/5 hover:bg-green-900/10';
            case 'Medium': return 'border-blue-500/30 bg-blue-900/5 hover:bg-blue-900/10';
            case 'Hard': return 'border-red-500/30 bg-red-900/5 hover:bg-red-900/10';
            case 'Nightmare': return 'border-purple-500/30 bg-purple-900/5 hover:bg-purple-900/10';
            default: return 'border-slate-500/30';
        }
    };

    const getColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'text-green-400';
            case 'Medium': return 'text-blue-400';
            case 'Hard': return 'text-red-400';
            case 'Nightmare': return 'text-purple-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className={`flex-1 border-r ${getTheme(timeline.difficulty)} p-4 overflow-y-auto min-w-[320px] transition-colors custom-scrollbar`}>
            <div className="mb-8 text-center sticky top-0 bg-slate-900/95 backdrop-blur py-4 z-20 border-b border-slate-800">
                <h3 className={`text-xl font-black uppercase tracking-wider mb-1 ${getColor(timeline.difficulty)}`}>
                    {timeline.name}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${getTheme(timeline.difficulty)} ${getColor(timeline.difficulty)} font-bold`}>
                    {timeline.difficulty} MODE
                </span>
            </div>

            <div className="space-y-8 relative px-2 pb-10">
                {/* Vertical Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-800 -z-10 transform -translate-x-1/2"></div>

                {missions.length > 0 ? (
                    missions.map((mission, idx) => (
                        <MissionNode key={mission.id} mission={mission} index={idx} difficulty={timeline.difficulty} />
                    ))
                ) : (
                    <div className="text-center text-slate-600 text-sm py-10 italic">
                        No missions available yet.
                    </div>
                )}
            </div>
        </div>
    );
};

const MissionNode: React.FC<{ mission: Mission; index: number; difficulty: string }> = ({ mission, index, difficulty }) => {
    const navigate = useNavigate();

    const getBorderColor = () => {
        switch (difficulty) {
            case 'Easy': return 'hover:border-green-500';
            case 'Medium': return 'hover:border-blue-500';
            case 'Hard': return 'hover:border-red-500';
            case 'Nightmare': return 'hover:border-purple-500';
            default: return 'hover:border-slate-400';
        }
    };

    const handleStartMission = () => {
        if (mission.status === 'locked') return;
        navigate('/apps/edumultiverse/time-loop', { state: { mission } });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={handleStartMission}
            className={`bg-slate-800 p-5 rounded-xl border border-slate-700 ${getBorderColor()} transition-all cursor-pointer relative z-10 shadow-lg group ${mission.status === 'locked' ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
        >
            {/* Connector Dot */}
            <div className="absolute left-1/2 -top-4 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-900 transform -translate-x-1/2 z-0"></div>

            <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-900/20 px-1.5 py-0.5 rounded border border-cyan-500/20">
                    {mission.type}
                </span>
                <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                    <Icon name="Star" className="w-3 h-3" />
                    +{mission.xp_reward} XP
                </span>
            </div>

            <h4 className="font-bold text-base mb-2 text-white group-hover:text-cyan-300 transition-colors">
                {mission.title}
            </h4>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {mission.description}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Start Mission</span>
                <Icon name="Play" className="w-4 h-4 text-cyan-400" />
            </div>
        </motion.div>
    );
};

