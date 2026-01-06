import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { multiverseService } from '../services/multiverseService';
import { Glitch } from '../types/gamification';
import { useAuth } from '../../../context/AuthContext';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';
import { Icon } from '../../../components/shared/ui/CommonUI';

export const GlitchHunter: React.FC = () => {
    const { user } = useAuth();
    const [glitches, setGlitches] = useState<Glitch[]>([]);
    const [activeGlitch, setActiveGlitch] = useState<Glitch | null>(null);
    const [fixedCount, setFixedCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGlitches();
    }, []);

    const loadGlitches = async () => {
        try {
            const data = await multiverseService.getActiveGlitches();
            setGlitches(data);
        } catch (e) {
            console.error("Failed to load glitches", e);
        } finally {
            setLoading(false);
        }
    };

    const handleFix = async (glitch: Glitch) => {
        if (!user) return;

        try {
            // Call service to record fix and award XP
            await multiverseService.fixGlitch(user.id, glitch.id);

            // Update UI
            setFixedCount(prev => prev + 1);
            setGlitches(prev => prev.filter(g => g.id !== glitch.id));
            setActiveGlitch(null);

            // Play sound or show success toast here
        } catch (error) {
            console.error("Failed to fix glitch", error);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-black text-green-400 font-mono p-8 relative overflow-hidden">
            {/* CRT Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%] opacity-20"></div>
            <div className="absolute inset-0 pointer-events-none animate-flicker bg-green-500/5 mix-blend-overlay"></div>

            <header className="flex justify-between items-center mb-12 border-b border-green-900 pb-4 relative z-10">
                <div>
                    <h1 className="text-4xl font-bold glitch-text tracking-tighter flex items-center gap-3">
                        <Icon name="CommandLineIcon" className="w-10 h-10 text-green-500" />
                        GLITCH HUNTER_
                    </h1>
                    <p className="text-sm opacity-70 mt-1 flex items-center gap-2">
                        <Icon name="ShieldCheckIcon" className="w-4 h-4" />
                        SYSTEM INTEGRITY: {Math.min(100, 60 + fixedCount * 10)}%
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-green-500 flex items-center justify-end gap-2">
                        {fixedCount} <span className="text-sm text-green-700">FIXED</span>
                    </div>
                    <div className="text-xs tracking-widest opacity-60">PATCHES APPLIED</div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                <AnimatePresence>
                    {glitches.length > 0 ? (
                        glitches.map((glitch) => (
                            <motion.div
                                key={glitch.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0, rotate: 20 }}
                                onClick={() => setActiveGlitch(glitch)}
                                className="border border-green-500/50 bg-green-900/10 p-6 rounded cursor-pointer hover:bg-green-900/20 hover:border-green-400 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] border border-green-500 px-1">Lvl {glitch.difficulty}</span>
                                </div>

                                <div className="flex justify-between mb-4">
                                    <span className="text-xs border border-green-500/30 px-2 py-1 rounded bg-black/40 font-mono">
                                        ERR_{glitch.id.slice(0, 4).toUpperCase()}
                                    </span>
                                    <span className="text-red-500 animate-pulse font-bold text-xs flex items-center gap-1">
                                        <Icon name="ExclamationCircleIcon" className="w-3 h-3" />
                                        UNSTABLE
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:underline text-green-300">{glitch.title}</h3>
                                <div className="bg-black/50 p-3 rounded text-sm font-mono text-red-300 mb-4 border-l-2 border-red-500/50">
                                    {glitch.broken_content}
                                </div>
                                <button className="w-full py-2 bg-green-900/30 border border-green-500/50 hover:bg-green-500 hover:text-black transition-colors uppercase text-sm font-bold tracking-wider flex items-center justify-center gap-2">
                                    <Icon name="WrenchScrewdriverIcon" className="w-4 h-4" />
                                    Initialize Patch
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 border border-green-900/30 rounded-lg bg-green-900/5 flex flex-col items-center">
                            <Icon name="CheckCircleIcon" className="w-16 h-16 text-green-500/50 mb-4" />
                            <h3 className="text-xl text-green-500">ALL SYSTEMS NOMINAL</h3>
                            <p className="text-green-700">No active glitches detected in this sector.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {activeGlitch && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-green-500 p-8 max-w-2xl w-full rounded-lg shadow-[0_0_50px_rgba(0,255,0,0.2)] relative">
                        {/* Scanlines */}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-10 rounded-lg"></div>

                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                            <span className="animate-pulse text-green-500">█</span> PATCHING REALITY...
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h4 className="text-red-400 text-xs font-bold mb-2 uppercase tracking-wider">Corrupted Data Segment</h4>
                                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded text-red-200 font-mono text-sm h-full">
                                    {activeGlitch.broken_content}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-green-400 text-xs font-bold mb-2 uppercase tracking-wider">Target Output</h4>
                                <div className="bg-green-900/20 border border-green-500/30 p-4 rounded text-green-200 font-mono text-sm h-full">
                                    {activeGlitch.correct_content}
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={() => setActiveGlitch(null)}
                                className="flex-1 py-3 border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors font-bold tracking-wider"
                            >
                                ABORT
                            </button>
                            <button
                                onClick={() => handleFix(activeGlitch)}
                                className="flex-1 py-3 bg-green-600 text-white font-bold hover:bg-green-500 shadow-[0_0_20px_rgba(0,255,0,0.4)] transition-all transform hover:scale-[1.02] tracking-wider"
                            >
                                APPLY PATCH
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

