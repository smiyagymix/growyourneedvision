import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../../components/shared/ui/CommonUI';

interface AchievementData {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    xp_reward: number;
}

interface AchievementPopupProps {
    achievement: AchievementData;
    onClose: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 500);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'from-yellow-400 via-yellow-500 to-orange-500';
            case 'Epic': return 'from-purple-400 via-purple-500 to-pink-500';
            case 'Rare': return 'from-blue-400 via-blue-500 to-cyan-500';
            default: return 'from-gray-400 via-gray-500 to-gray-600';
        }
    };

    const getRarityGlow = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'shadow-[0_0_30px_rgba(251,191,36,0.8)]';
            case 'Epic': return 'shadow-[0_0_30px_rgba(168,85,247,0.8)]';
            case 'Rare': return 'shadow-[0_0_30px_rgba(59,130,246,0.8)]';
            default: return 'shadow-[0_0_20px_rgba(156,163,175,0.6)]';
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ scale: 0, y: -100, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0, y: -100, opacity: 0 }}
                    transition={{ type: 'spring', duration: 0.6 }}
                    className="fixed top-8 left-1/2 -translate-x-1/2 z-50"
                >
                    <div className={`bg-gradient-to-br ${getRarityColor(achievement.rarity)} p-1 rounded-2xl ${getRarityGlow(achievement.rarity)}`}>
                        <div className="bg-gray-900 rounded-2xl p-6 min-w-[400px]">
                            {/* Particles Effect */}
                            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                                {[...Array(20)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                        initial={{
                                            x: 200,
                                            y: 100,
                                            opacity: 1
                                        }}
                                        animate={{
                                            x: Math.random() * 400 - 200,
                                            y: Math.random() * 200 - 100,
                                            opacity: 0
                                        }}
                                        transition={{
                                            duration: 2,
                                            delay: i * 0.1,
                                            repeat: Infinity
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="text-center mb-4">
                                    <motion.div
                                        initial={{ rotate: 0 }}
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="text-8xl mb-4"
                                    >
                                        {achievement.icon}
                                    </motion.div>
                                    <h2 className="text-2xl font-black text-white mb-2">
                                        Achievement Unlocked!
                                    </h2>
                                    <div className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white font-bold text-sm mb-3`}>
                                        {achievement.rarity}
                                    </div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                                    <h3 className="text-xl font-bold text-white mb-2">{achievement.name}</h3>
                                    <p className="text-gray-300 text-sm">{achievement.description}</p>
                                </div>

                                <div className="flex items-center justify-center gap-6 text-white">
                                    <div className="flex items-center gap-2">
                                        <Icon name="SparklesIcon" className="w-5 h-5 text-yellow-400" />
                                        <span className="font-bold">+{achievement.xp_reward} XP</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <motion.div
                                    className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden"
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 5 }}
                                >
                                    <div className={`h-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}`} />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Achievement Toast (smaller notification)
export const AchievementToast: React.FC<AchievementPopupProps> = ({ achievement, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed bottom-8 right-8 z-50 bg-gray-900 rounded-lg p-4 shadow-2xl border-2 border-yellow-400 max-w-sm"
        >
            <div className="flex items-center gap-4">
                <div className="text-4xl">{achievement.icon}</div>
                <div className="flex-1">
                    <p className="text-xs text-yellow-400 font-bold">Achievement Unlocked!</p>
                    <h4 className="text-white font-bold">{achievement.name}</h4>
                    <p className="text-gray-400 text-xs">+{achievement.xp_reward} XP</p>
                </div>
                <Icon name="SparklesIcon" className="w-6 h-6 text-yellow-400" />
            </div>
        </motion.div>
    );
};
