import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, Button, Icon, Modal } from '../../../components/shared/ui/CommonUI';
import { gamificationService, Achievement, Reward } from '../../../services/gamificationService';
import { useToast } from '../../../hooks/useToast';

// Zod Validation Schemas
const achievementSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.string().min(1, "Category is required"),
    xp_reward: z.number().min(1, "XP reward must be at least 1"),
    requirement_type: z.string().min(1, "Requirement type is required"),
    requirement_value: z.number().min(1, "Requirement value must be at least 1"),
    rarity: z.enum(['Common', 'Rare', 'Epic', 'Legendary'])
});

const rewardSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    cost_xp: z.number().min(1, "Cost must be at least 1 XP"),
    category: z.string().min(1, "Category is required"),
    available: z.boolean()
});

export const GamificationContentManager: React.FC = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'achievements' | 'rewards'>('achievements');
    const [loading, setLoading] = useState(false);
    
    // Data
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);

    // Modals
    const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Forms
    const [achievementForm, setAchievementForm] = useState<Partial<Achievement>>({
        name: '',
        description: '',
        category: 'Activity',
        xp_reward: 100,
        requirement_type: 'count',
        requirement_value: 1,
        rarity: 'Common'
    });

    const [rewardForm, setRewardForm] = useState<Partial<Reward>>({
        name: '',
        description: '',
        cost_xp: 500,
        category: 'Badge',
        available: true
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'achievements') {
                const data = await gamificationService.getAllAchievements();
                setAchievements(data);
            } else if (activeTab === 'rewards') {
                const data = await gamificationService.getAllRewards();
                setRewards(data);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAchievement = async () => {
        try {
            const validation = achievementSchema.safeParse(achievementForm);
            if (!validation.success) {
                showToast(validation.error.issues[0].message, 'error');
                return;
            }

            if (editingItem) {
                await gamificationService.updateAchievement(editingItem.id, achievementForm);
                showToast('Achievement updated', 'success');
            } else {
                await gamificationService.createAchievement(achievementForm);
                showToast('Achievement created', 'success');
            }
            setIsAchievementModalOpen(false);
            setEditingItem(null);
            loadData();
        } catch (error) {
            showToast('Failed to save achievement', 'error');
        }
    };

    const handleSaveReward = async () => {
        try {
            const validation = rewardSchema.safeParse(rewardForm);
            if (!validation.success) {
                showToast(validation.error.issues[0].message, 'error');
                return;
            }

            if (editingItem) {
                await gamificationService.updateReward(editingItem.id, rewardForm);
                showToast('Reward updated', 'success');
            } else {
                await gamificationService.createReward(rewardForm);
                showToast('Reward created', 'success');
            }
            setIsRewardModalOpen(false);
            setEditingItem(null);
            loadData();
        } catch (error) {
            showToast('Failed to save reward', 'error');
        }
    };

    const openAchievementModal = (item?: Achievement) => {
        setEditingItem(item);
        setAchievementForm(item || {
            name: '',
            description: '',
            category: 'Activity',
            xp_reward: 100,
            requirement_type: 'count',
            requirement_value: 1,
            rarity: 'Common'
        });
        setIsAchievementModalOpen(true);
    };

    const openRewardModal = (item?: Reward) => {
        setEditingItem(item);
        setRewardForm(item || {
            name: '',
            description: '',
            cost_xp: 500,
            category: 'Badge',
            available: true
        });
        setIsRewardModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gamification Manager</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage achievements and rewards</p>
                </div>
                <div className="flex gap-2">
                    <Button name="refresh-gamification-data" variant="outline" onClick={loadData}>
                        <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {activeTab === 'achievements' && (
                        <Button name="open-add-achievement-modal" variant="primary" onClick={() => openAchievementModal()}>
                            <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                            Add Achievement
                        </Button>
                    )}
                    {activeTab === 'rewards' && (
                        <Button name="open-add-reward-modal" variant="primary" onClick={() => openRewardModal()}>
                            <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                            Add Reward
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-1">
                {[
                    { id: 'achievements', label: 'Achievements', icon: 'TrophyIcon' },
                    { id: 'rewards', label: 'Rewards', icon: 'GiftIcon' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        name={`gamification-tab-${tab.id}`}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative ${
                            activeTab === tab.id
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <Icon name={tab.icon} className="w-4 h-4" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <Card className="p-6 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'achievements' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Category</th>
                                            <th className="p-3">XP</th>
                                            <th className="p-3">Rarity</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {achievements.map(achievement => (
                                            <tr key={achievement.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="p-3 font-medium">{achievement.name}</td>
                                                <td className="p-3">{achievement.category}</td>
                                                <td className="p-3 font-bold text-amber-600">{achievement.xp_reward} XP</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        achievement.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-800' :
                                                        achievement.rarity === 'Epic' ? 'bg-purple-100 text-purple-800' :
                                                        achievement.rarity === 'Rare' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {achievement.rarity}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button name={`edit-achievement-${achievement.id}`} variant="ghost" size="sm" onClick={() => openAchievementModal(achievement)}>Edit</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {achievements.length === 0 && <div className="text-center py-8 text-gray-500">No achievements found.</div>}
                            </div>
                        )}

                        {activeTab === 'rewards' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Category</th>
                                            <th className="p-3">Cost</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {rewards.map(reward => (
                                            <tr key={reward.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="p-3 font-medium">{reward.name}</td>
                                                <td className="p-3">{reward.category}</td>
                                                <td className="p-3 font-bold text-amber-600">{reward.cost_xp} XP</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${reward.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {reward.available ? 'Available' : 'Unavailable'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button name={`edit-reward-${reward.id}`} variant="ghost" size="sm" onClick={() => openRewardModal(reward)}>Edit</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {rewards.length === 0 && <div className="text-center py-8 text-gray-500">No rewards found.</div>}
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Achievement Modal */}
            <Modal
                isOpen={isAchievementModalOpen}
                onClose={() => setIsAchievementModalOpen(false)}
                title={editingItem ? 'Edit Achievement' : 'Add Achievement'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            value={achievementForm.name}
                            onChange={e => setAchievementForm({...achievementForm, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            rows={2}
                            value={achievementForm.description}
                            onChange={e => setAchievementForm({...achievementForm, description: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">XP Reward</label>
                            <input 
                                type="number" 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                value={achievementForm.xp_reward}
                                onChange={e => setAchievementForm({...achievementForm, xp_reward: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Rarity</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                value={achievementForm.rarity}
                                onChange={e => setAchievementForm({...achievementForm, rarity: e.target.value as any})}
                            >
                                <option value="Common">Common</option>
                                <option value="Rare">Rare</option>
                                <option value="Epic">Epic</option>
                                <option value="Legendary">Legendary</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button name="cancel-achievement-modal" variant="ghost" onClick={() => setIsAchievementModalOpen(false)}>Cancel</Button>
                        <Button name="save-achievement" variant="primary" onClick={handleSaveAchievement}>Save Achievement</Button>
                    </div>
                </div>
            </Modal>

            {/* Reward Modal */}
            <Modal
                isOpen={isRewardModalOpen}
                onClose={() => setIsRewardModalOpen(false)}
                title={editingItem ? 'Edit Reward' : 'Add Reward'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            value={rewardForm.name}
                            onChange={e => setRewardForm({...rewardForm, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Cost (XP)</label>
                        <input 
                            type="number" 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            value={rewardForm.cost_xp}
                            onChange={e => setRewardForm({...rewardForm, cost_xp: parseInt(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            value={rewardForm.category}
                            onChange={e => setRewardForm({...rewardForm, category: e.target.value as any})}
                        >
                            <option value="Badge">Badge</option>
                            <option value="Avatar">Avatar</option>
                            <option value="Theme">Theme</option>
                            <option value="Power-Up">Power-Up</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button name="cancel-reward-modal" variant="ghost" onClick={() => setIsRewardModalOpen(false)}>Cancel</Button>
                        <Button name="save-reward" variant="primary" onClick={handleSaveReward}>Save Reward</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
