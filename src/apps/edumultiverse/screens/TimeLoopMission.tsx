import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { multiverseService } from '../services/multiverseService';
import { Mission } from '../types/gamification';
import { Icon } from '../../../components/shared/ui/CommonUI';
import { useAuth } from '../../../context/AuthContext';

export const TimeLoopMission: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [mission, setMission] = useState<Mission | null>(location.state?.mission || null);
    const [loading, setLoading] = useState(!location.state?.mission);

    const [loopCount, setLoopCount] = useState(1);
    const [timeLeft, setTimeLeft] = useState(60);
    const [isActive, setIsActive] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!mission) {
            loadMission();
        }
    }, []);

    const loadMission = async () => {
        try {
            const missions = await multiverseService.getMissionsByType('TimeLoop');
            if (missions.length > 0) {
                // Pick a random one or the first one
                setMission(missions[0]);
            } else {
                // No missions found
                console.warn("No TimeLoop missions found");
            }
        } catch (e) {
            console.error("Failed to load TimeLoop mission", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval: any;
        if (isActive && timeLeft > 0 && !isCompleted) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive && !isCompleted) {
            handleLoopReset();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, isCompleted]);

    const handleLoopReset = () => {
        setIsActive(false);
        setLoopCount(prev => prev + 1);
        setTimeLeft(60);
        // Trigger visual reset effect
    };

    const startLoop = () => {
        setIsActive(true);
    };

    const handleSuccess = async () => {
        if (!user || !mission) return;
        setIsActive(false);
        setIsProcessing(true);
        try {
            await multiverseService.completeMission(mission.id, user.id, 100);
            setIsCompleted(true);
        } catch (error) {
            console.error("Failed to complete mission", error);
            // Handle error (maybe retry or show message)
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-indigo-950 flex items-center justify-center text-white">Loading Temporal Data...</div>;

    if (!mission) return (
        <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center text-white p-8 text-center">
            <Icon name="Clock" className="w-16 h-16 text-indigo-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Time Loops Detected</h2>
            <p className="text-indigo-300 mb-6">The timeline appears stable... for now.</p>
            <button 
                onClick={() => navigate('/apps/edumultiverse')}
                className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
            >
                Return to Map
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-indigo-950 text-white flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Spiral Effect */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] border-[40px] border-indigo-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow"></div>
                <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] border-[30px] border-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-spin-reverse"></div>
            </div>

            <button 
                onClick={() => navigate(-1)} 
                className="absolute top-8 left-8 z-20 flex items-center text-indigo-300 hover:text-white transition-colors"
            >
                <Icon name="ArrowLeft" className="w-5 h-5 mr-2" />
                Abort Mission
            </button>

            <AnimatePresence mode="wait">
                {isCompleted ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="z-10 text-center max-w-2xl w-full p-12 bg-green-900/20 backdrop-blur-xl rounded-3xl border border-green-500/30 shadow-2xl"
                    >
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                            <Icon name="Check" className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-5xl font-bold mb-4 text-green-400">TIMELINE STABILIZED</h1>
                        <p className="text-xl text-green-200 mb-8">The anomaly has been corrected.</p>
                        
                        <div className="flex justify-center gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-sm text-green-300 uppercase tracking-wider mb-1">Loops</div>
                                <div className="text-3xl font-mono font-bold">{loopCount}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-green-300 uppercase tracking-wider mb-1">XP Earned</div>
                                <div className="text-3xl font-mono font-bold text-yellow-400">+{mission.xp_reward}</div>
                            </div>
                        </div>

                        <button 
                            onClick={() => navigate(-1)}
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full transition-colors"
                        >
                            Return to Multiverse
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="game-ui"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="z-10 text-center max-w-2xl w-full p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-2xl"
                    >
                        <div className="mb-8">
                            <span className="inline-block px-4 py-1 rounded-full bg-indigo-500/30 border border-indigo-400 text-indigo-200 text-sm font-bold mb-4">
                                TEMPORAL ANOMALY DETECTED
                            </span>
                            <h1 className="text-4xl font-bold mb-2">TIME LOOP #{loopCount}</h1>
                            <p className="text-indigo-200">{mission.description}</p>
                        </div>

                        <div className="flex justify-center mb-12">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                                    <circle 
                                        cx="80" cy="80" r="70" 
                                        stroke={timeLeft < 10 ? "#ef4444" : "#a855f7"} 
                                        strokeWidth="8" 
                                        fill="none" 
                                        strokeDasharray="440"
                                        strokeDashoffset={440 - (440 * timeLeft) / 60}
                                        className="transition-all duration-1000 ease-linear"
                                    />
                                </svg>
                                <div className="text-4xl font-mono font-bold">{timeLeft}s</div>
                            </div>
                        </div>

                        {!isActive ? (
                            <button 
                                onClick={startLoop}
                                className="px-12 py-4 bg-white text-indigo-900 font-bold rounded-full text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                            >
                                {loopCount > 1 ? 'RESTART LOOP' : 'ENTER LOOP'}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-indigo-900/50 p-6 rounded-xl border border-indigo-500/30">
                                    <h3 className="text-xl font-bold mb-4">{mission.title}</h3>
                                    {/* 
                                        TODO: In a real app, this would render different mini-games based on mission.type 
                                        For now, we keep the math puzzle as a placeholder for all missions.
                                    */}
                                    <div className="text-3xl font-mono mb-6">x² - 5x + 6 = 0</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            '(x-2)(x-3)', 
                                            '(x+2)(x+3)', 
                                            '(x-1)(x-6)', 
                                            '(x+1)(x-6)'
                                        ].map((opt, i) => (
                                            <button 
                                                key={i}
                                                disabled={isProcessing}
                                                onClick={() => {
                                                    if (i === 0) {
                                                        handleSuccess();
                                                    } else {
                                                        handleLoopReset();
                                                    }
                                                }}
                                                className="p-4 bg-white/10 hover:bg-white/20 rounded-lg font-mono text-lg transition-colors disabled:opacity-50"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
