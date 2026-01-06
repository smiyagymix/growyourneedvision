import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGamification } from '../../../hooks/useGamification';

export const MultiverseHUD: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { progress, levelProgress, loading } = useGamification();
    
    const xp = progress?.current_xp || 0;
    const level = progress?.level || 1;
    const streak = progress?.streak_days || 0;
    const progressPercent = levelProgress();
    const nextLevelXp = level * 1000; // Assuming 1000 XP per level based on hook logic

    // Only show HUD on multiverse routes
    if (!location.pathname.includes('/apps/edumultiverse')) {
        return <>{children}</>;
    }

    return (
        <div className="relative min-h-screen bg-slate-950">
            {/* Top HUD Bar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-[100] flex items-center justify-between px-6 shadow-lg">
                <div className="flex items-center space-x-6">
                    <div 
                        onClick={() => navigate('/apps/edumultiverse')}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                            EDU-MULTIVERSE
                        </span>
                    </div>
                    
                    <nav className="hidden md:flex space-x-1">
                        <NavButton to="/apps/edumultiverse" label="MAP" active={location.pathname === '/apps/edumultiverse'} />
                        <NavButton to="/apps/edumultiverse/concept-fusion" label="FUSION LAB" active={location.pathname.includes('fusion')} />
                        <NavButton to="/apps/edumultiverse/glitch-hunter" label="GLITCHES" active={location.pathname.includes('glitch')} />
                        <NavButton to="/apps/edumultiverse/quantum-quiz" label="QUIZ" active={location.pathname.includes('quiz')} />
                        <NavButton to="/apps/edumultiverse/time-loop" label="TIME LOOP" active={location.pathname.includes('time-loop')} />
                    </nav>
                </div>

                <div className="flex items-center space-x-6">
                    {/* Streak */}
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400 font-bold">STREAK</span>
                        <span className="text-orange-400 font-mono font-bold">🔥 {streak} DAYS</span>
                    </div>

                    {/* Level & XP */}
                    <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white border-2 border-slate-600">
                            {level}
                        </div>
                        <div className="flex flex-col w-32">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-300 font-bold">XP</span>
                                <span className="text-cyan-400">{xp} / {nextLevelXp}</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area with padding for HUD */}
            <div className="pt-16">
                {children}
            </div>
        </div>
    );
};

const NavButton: React.FC<{ to: string; label: string; active: boolean }> = ({ to, label, active }) => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(to)}
            className={`px-4 py-2 rounded text-sm font-bold transition-all ${
                active 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
        >
            {label}
        </button>
    );
};
