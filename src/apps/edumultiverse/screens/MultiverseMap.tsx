import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { multiverseService } from '../services/multiverseService';
import { Universe } from '../types/gamification';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';
import { Icon } from '../../../components/shared/ui/CommonUI';
import { useGamification } from '../../../hooks/useGamification';

export const MultiverseMap: React.FC = () => {
    const [universes, setUniverses] = useState<Universe[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { canAccess } = useGamification();

    useEffect(() => {
        loadUniverses();
    }, []);

    const loadUniverses = async () => {
        try {
            const data = await multiverseService.getUniverses();
            setUniverses(data);
        } catch (e) {
            console.error("Failed to load universes", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-900 pointer-events-none"></div>

            <header className="mb-12 text-center relative z-10">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-4 drop-shadow-lg"
                >
                    MULTIVERSE MAP
                </motion.h1>
                <p className="text-slate-400 text-lg font-medium tracking-wide">Select a reality to explore</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12 relative z-10">
                {universes.length > 0 ? (
                    universes.map((universe, index) => (
                        <UniverseCard
                            key={universe.id}
                            universe={universe}
                            index={index}
                            isLocked={!canAccess(universe.min_level)}
                            onClick={() => navigate(`/apps/edumultiverse/universe/${universe.id}`)}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-20">
                        <Icon name="CubeTransparent" className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl text-slate-500">No Universes Discovered Yet</h3>
                        <p className="text-slate-600">Check back later for new realities.</p>
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <h2 className="text-2xl font-bold mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">
                    <Icon name="LightningBolt" className="w-6 h-6 text-yellow-400" />
                    SPECIAL ANOMALIES
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/apps/edumultiverse/glitch-hunter')}
                        className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl cursor-pointer hover:bg-green-900/40 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-xl font-bold text-green-400 mb-2 group-hover:translate-x-2 transition-transform flex items-center gap-2">
                            <Icon name="Code" className="w-5 h-5" />
                            GLITCH HUNTER
                        </h3>
                        <p className="text-slate-400 text-sm">Reality is fracturing. Find and fix the errors in the database before they spread.</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/apps/edumultiverse/time-loop')}
                        className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-xl cursor-pointer hover:bg-indigo-900/40 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-xl font-bold text-indigo-400 mb-2 group-hover:translate-x-2 transition-transform flex items-center gap-2">
                            <Icon name="Clock" className="w-5 h-5" />
                            TIME LOOP
                        </h3>
                        <p className="text-slate-400 text-sm">Trapped in a temporal anomaly. Master the concept to break the cycle.</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/apps/edumultiverse/quantum-quiz')}
                        className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-xl cursor-pointer hover:bg-purple-900/40 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-xl font-bold text-purple-400 mb-2 group-hover:translate-x-2 transition-transform flex items-center gap-2">
                            <Icon name="Brain" className="w-5 h-5" />
                            QUANTUM QUIZ
                        </h3>
                        <p className="text-slate-400 text-sm">Test your knowledge across dimensions. Stabilize the timeline with correct answers.</p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const UniverseCard: React.FC<{ universe: Universe; index: number; isLocked: boolean; onClick: () => void }> = ({ universe, index, isLocked, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLocked ? 0.5 : 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={!isLocked ? { scale: 1.05, boxShadow: "0 0 25px rgba(168, 85, 247, 0.4)" } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            className={`bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border ${isLocked ? 'border-slate-700 cursor-not-allowed grayscale' : 'border-slate-700 cursor-pointer'} relative overflow-hidden group`}
            onClick={!isLocked ? onClick : undefined}
        >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity transform group-hover:rotate-12 duration-500">
                <span className="text-6xl filter grayscale group-hover:grayscale-0 transition-all">{universe.icon}</span>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${universe.type === 'SchoolClass' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30'
                        }`}>
                        {universe.type === 'SchoolClass' ? 'Class Reality' : 'Solo Track'}
                    </span>
                    {isLocked && (
                        <span className="bg-red-900/50 text-red-300 border border-red-500/30 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                            <Icon name="LockClosedIcon" className="w-3 h-3" />
                            LVL {universe.min_level}
                        </span>
                    )}
                </div>

                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-cyan-300 transition-colors">{universe.name}</h3>
                <p className="text-slate-400 mb-6 text-sm line-clamp-2">{universe.description}</p>

                <div className="flex items-center justify-between mt-4 border-t border-slate-700 pt-4">
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-500' : 'bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]'}`}></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{isLocked ? 'Locked' : 'Online'}</span>
                    </div>
                    {!isLocked && (
                        <span className="text-cyan-400 text-xs font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            ENTER <Icon name="ArrowRight" className="w-3 h-3" />
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

