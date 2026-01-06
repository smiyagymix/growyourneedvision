import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../../../components/shared/ui/CommonUI';

interface BossData {
    id: string;
    name: string;
    universe: string;
    health: number;
    maxHealth: number;
    level: number;
    abilities: string[];
    rewards: {
        xp: number;
        coins: number;
        items: string[];
    };
    defeatedBy: string[];
}

export const BossBattle: React.FC<{ boss: BossData; onVictory: () => void }> = ({ boss, onVictory }) => {
    const [playerHealth, setPlayerHealth] = useState(100);
    const [bossHealth, setBossHealth] = useState(boss.health);
    const [turn, setTurn] = useState<'player' | 'boss'>('player');
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [selectedAbility, setSelectedAbility] = useState<string>('');

    const playerAbilities = [
        { name: 'Quick Strike', damage: 15, description: 'Fast attack dealing moderate damage' },
        { name: 'Power Slam', damage: 30, description: 'Heavy attack with high damage' },
        { name: 'Heal', damage: -20, description: 'Restore 20 HP' },
        { name: 'Shield Block', damage: 0, description: 'Reduce next attack by 50%' }
    ];

    const playerAttack = (ability: typeof playerAbilities[0]) => {
        if (turn !== 'player') return;

        if (ability.name === 'Heal') {
            setPlayerHealth(prev => Math.min(100, prev - ability.damage));
            addLog(`You healed for ${-ability.damage} HP!`);
        } else if (ability.name === 'Shield Block') {
            addLog('You raised your shield!');
        } else {
            const damage = ability.damage + Math.floor(Math.random() * 10);
            setBossHealth(prev => Math.max(0, prev - damage));
            addLog(`You used ${ability.name} for ${damage} damage!`);
        }

        setTurn('boss');
        setTimeout(bossAttack, 1500);
    };

    const bossAttack = () => {
        const damage = 10 + Math.floor(Math.random() * 15);
        setPlayerHealth(prev => Math.max(0, prev - damage));
        addLog(`${boss.name} attacked for ${damage} damage!`);
        setTurn('player');
    };

    const addLog = (message: string) => {
        setBattleLog(prev => [message, ...prev].slice(0, 5));
    };

    useEffect(() => {
        if (bossHealth <= 0) {
            addLog(`🎉 Victory! You defeated ${boss.name}!`);
            setTimeout(onVictory, 2000);
        } else if (playerHealth <= 0) {
            addLog('💀 Defeated! Try again...');
        }
    }, [bossHealth, playerHealth]);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <div className="max-w-6xl w-full p-8">
                {/* Boss */}
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-8"
                >
                    <div className="relative inline-block">
                        <div className="w-64 h-64 bg-gradient-to-br from-purple-600 to-red-600 rounded-full flex items-center justify-center">
                            <span className="text-8xl">👾</span>
                        </div>
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-bold">
                            {boss.name} - Lv.{boss.level}
                        </div>
                    </div>
                    <div className="mt-4 max-w-md mx-auto">
                        <div className="bg-gray-800 rounded-full h-8 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm"
                                initial={{ width: '100%' }}
                                animate={{ width: `${(bossHealth / boss.maxHealth) * 100}%` }}
                            >
                                {bossHealth}/{boss.maxHealth}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Battle Log */}
                <div className="bg-gray-900/80 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                    <h3 className="text-white font-bold mb-2">Battle Log</h3>
                    <div className="space-y-1 text-sm">
                        {battleLog.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="text-gray-300"
                            >
                                {log}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Player */}
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-800 rounded-full h-6 overflow-hidden mb-4">
                        <motion.div
                            className="h-full bg-gradient-to-r from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-xs"
                            animate={{ width: `${playerHealth}%` }}
                        >
                            Your HP: {playerHealth}/100
                        </motion.div>
                    </div>

                    {/* Abilities */}
                    <div className="grid grid-cols-4 gap-4">
                        {playerAbilities.map(ability => (
                            <motion.button
                                key={ability.name}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => playerAttack(ability)}
                                disabled={turn !== 'player' || bossHealth <= 0 || playerHealth <= 0}
                                className={`p-4 rounded-lg font-bold text-white transition-all ${turn === 'player' && bossHealth > 0 && playerHealth > 0
                                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 hover:shadow-lg cursor-pointer'
                                        : 'bg-gray-700 cursor-not-allowed opacity-50'
                                    }`}
                            >
                                <div className="text-lg mb-1">{ability.name}</div>
                                <div className="text-xs opacity-80">{ability.description}</div>
                                {ability.damage > 0 && (
                                    <div className="text-xs mt-1 text-yellow-300">DMG: {ability.damage}</div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Victory Screen */}
                {bossHealth <= 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
                    >
                        <div className="text-center">
                            <div className="text-9xl mb-6">🏆</div>
                            <h2 className="text-6xl font-black text-yellow-400 mb-4">VICTORY!</h2>
                            <div className="text-white space-y-2 text-xl">
                                <p>+{boss.rewards.xp} XP</p>
                                <p>+{boss.rewards.coins} Coins</p>
                                <p>Unlocked: {boss.rewards.items.join(', ')}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
