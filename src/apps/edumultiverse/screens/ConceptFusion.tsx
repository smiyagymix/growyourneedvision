import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { multiverseService } from '../services/multiverseService';
import { Fragment, Recipe, UserFragment } from '../types/gamification';
import { useAuth } from '../../../context/AuthContext';
import { Icon } from '../../../components/shared/ui/CommonUI';

export const ConceptFusion: React.FC = () => {
    const { user } = useAuth();
    const [userFragments, setUserFragments] = useState<UserFragment[]>([]);
    const [selectedFragments, setSelectedFragments] = useState<UserFragment[]>([]);
    const [isFusing, setIsFusing] = useState(false);
    const [fusionResult, setFusionResult] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadInventory();
        }
    }, [user]);

    const loadInventory = async () => {
        if (!user) return;
        try {
            const data = await multiverseService.getUserFragments(user.id);
            setUserFragments(data);
        } catch (e) {
            console.error("Failed to load inventory", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (uFragment: UserFragment) => {
        if (selectedFragments.find(f => f.id === uFragment.id)) {
            setSelectedFragments(prev => prev.filter(f => f.id !== uFragment.id));
        } else {
            if (selectedFragments.length < 2) { // Limit to 2 for now as per recipes
                setSelectedFragments(prev => [...prev, uFragment]);
            }
        }
    };

    const handleFuse = async () => {
        if (!user || selectedFragments.length === 0) return;
        
        setIsFusing(true);
        setFusionResult(null);

        try {
            const result = await multiverseService.fuseFragments(user.id, selectedFragments.map(f => f.id));
            
            // Simulate delay for effect
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (result) {
                setFusionResult(result);
                // Refresh inventory
                await loadInventory();
                setSelectedFragments([]);
            } else {
                setFusionResult({
                    id: 'fail',
                    name: 'Unstable Matter',
                    ingredients: [],
                    result_description: 'The concepts refused to merge. Try a different combination.',
                    xp_reward: 10
                });
                setSelectedFragments([]);
            }
        } catch (error) {
            console.error("Fusion failed", error);
        } finally {
            setIsFusing(false);
        }
    };

    // Debug: Add random fragment
    const debugLoot = async () => {
        if (!user) return;
        const allFragments = await multiverseService.getAllFragments();
        const random = allFragments[Math.floor(Math.random() * allFragments.length)];
        await multiverseService.debugAddFragment(user.id, random.id);
        loadInventory();
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 relative overflow-hidden">
            {/* Background Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute rounded-full bg-cyan-500/10 blur-xl"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 300}px`,
                            height: `${Math.random() * 300}px`,
                            animation: `float ${10 + Math.random() * 20}s infinite linear`
                        }}
                    />
                ))}
            </div>

            <header className="relative z-10 mb-12 text-center">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center gap-3">
                    <Icon name="Sparkles" className="w-10 h-10 text-pink-500" />
                    CONCEPT FUSION LAB
                </h1>
                <p className="text-slate-400">Combine knowledge fragments to create new artifacts.</p>
                <button onClick={debugLoot} className="mt-4 text-xs bg-slate-800 px-3 py-1.5 rounded hover:bg-slate-700 flex items-center gap-2 mx-auto border border-slate-700">
                    <Icon name="WrenchScrewdriverIcon" className="w-3 h-3" />
                    [DEBUG] Find Fragment
                </button>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                {/* Inventory Panel */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <Icon name="ArchiveBoxIcon" className="w-5 h-5 text-cyan-400" />
                            FRAGMENT STORAGE
                        </span>
                        <span className="text-sm text-slate-400">{userFragments.reduce((acc, curr) => acc + curr.quantity, 0)} ITEMS</span>
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {userFragments.map(uFragment => (
                            <motion.div
                                key={uFragment.id}
                                onClick={() => toggleSelection(uFragment)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    relative p-4 rounded-xl border cursor-pointer transition-all
                                    ${selectedFragments.find(f => f.id === uFragment.id) 
                                        ? 'bg-cyan-900/40 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}
                                `}
                            >
                                <div className="absolute top-2 right-2 text-[10px] font-bold bg-slate-800 px-1.5 rounded text-slate-300">
                                    x{uFragment.quantity}
                                </div>
                                <div className="text-2xl mb-2 text-center">{uFragment.expand?.fragment.icon || '📦'}</div>
                                <div className="text-xs font-bold text-center truncate">{uFragment.expand?.fragment.name}</div>
                                <div className="text-[10px] text-center text-slate-500 uppercase mt-1">{uFragment.expand?.fragment.type}</div>
                            </motion.div>
                        ))}
                        {userFragments.length === 0 && (
                            <div className="col-span-full text-center py-10 text-slate-500 italic">
                                No fragments found. Try completing missions or use the debug button.
                            </div>
                        )}
                    </div>
                </div>
                {/* Fusion Chamber */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative w-80 h-80 mb-8">
                        {/* Chamber Circle */}
                        <div className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-1000 ${
                            isFusing ? 'border-cyan-400 animate-spin-slow' : 'border-slate-700'
                        }`}></div>
                        
                        {/* Slots */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <AnimatePresence>
                                {selectedFragments.map((uFrag, i) => {
                                    const angle = (i / selectedFragments.length) * 2 * Math.PI - Math.PI / 2;
                                    const radius = 100;
                                    const x = Math.cos(angle) * radius;
                                    const y = Math.sin(angle) * radius;
                                    
                                    return (
                                        <motion.div
                                            key={uFrag.id}
                                            initial={{ scale: 0, x: 0, y: 0 }}
                                            animate={isFusing ? { x: 0, y: 0, scale: 0 } : { x, y, scale: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute w-16 h-16 bg-slate-800 rounded-full border-2 border-cyan-500 flex items-center justify-center shadow-lg z-10"
                                        >
                                            {uFrag.expand?.fragment.icon || '📦'}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            
                            {/* Core */}
                            <div className={`w-32 h-32 rounded-full bg-slate-900 border-4 flex items-center justify-center z-0 ${
                                isFusing ? 'border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.5)]' : 'border-slate-600'
                            }`}>
                                {isFusing ? (
                                    <Icon name="BoltIcon" className="w-16 h-16 text-yellow-400 animate-pulse" />
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Icon name="CpuChipIcon" className="w-10 h-10 text-slate-600 mb-1" />
                                        <span className="text-slate-600 text-[10px] font-bold">FUSION CORE</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleFuse}
                        disabled={selectedFragments.length < 2 || isFusing}
                        className={`px-12 py-4 rounded-full font-bold text-xl tracking-widest transition-all flex items-center gap-3 ${
                            selectedFragments.length >= 2 && !isFusing
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105 shadow-lg text-white'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        <Icon name="Sparkles" className="w-6 h-6" />
                        {isFusing ? 'FUSING...' : 'INITIATE FUSION'}
                    </button>
                </div>
            </div>

            {/* Result Modal */}
            <AnimatePresence>
                {fusionResult && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-slate-900 border border-cyan-500/50 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(34,211,238,0.2)]"
                        >
                            <div className="flex justify-center mb-4">
                                {fusionResult.id === 'fail' ? (
                                    <Icon name="XCircleIcon" className="w-24 h-24 text-red-500" />
                                ) : (
                                    <Icon name="CheckCircleIcon" className="w-24 h-24 text-green-400" />
                                )}
                            </div>
                            <h2 className={`text-3xl font-bold mb-2 ${fusionResult.id === 'fail' ? 'text-red-400' : 'text-cyan-400'}`}>
                                {fusionResult.name}
                            </h2>
                            <p className="text-slate-300 mb-6">{fusionResult.result_description}</p>
                            
                            {fusionResult.id !== 'fail' && (
                                <div className="inline-block px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-300 font-bold mb-6">
                                    +{fusionResult.xp_reward} XP
                                </div>
                            )}

                            <button
                                onClick={() => setFusionResult(null)}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold transition-colors"
                            >
                                {fusionResult.id === 'fail' ? 'TRY AGAIN' : 'COLLECT ARTIFACT'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
