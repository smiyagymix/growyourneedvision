import React, { useEffect, useState } from 'react';
import { Card, Button, Badge, Icon } from '../../components/shared/ui/CommonUI';
import { aiManagementService, AIObjective } from '../../services/aiManagementService';

export const AIStrategy: React.FC = () => {
    const [objectives, setObjectives] = useState<AIObjective[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadObjectives();
    }, []);

    const loadObjectives = async () => {
        try {
            const data = await aiManagementService.getObjectives();
            setObjectives(data);
        } catch (error) {
            console.error("Failed to load objectives", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">AI Strategy & Objectives</h2>
                    <p className="text-gray-500">Define and track high-level goals for the AI assistant.</p>
                </div>
                <Button variant="primary" icon="PlusIcon" onClick={() => alert("Feature coming soon: Add Objective")}>New Objective</Button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading objectives...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {objectives.map((obj) => (
                        <Card key={obj.id} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{obj.title}</h3>
                                    <p className="text-sm text-gray-500">Target: {obj.target}</p>
                                </div>
                                <Badge variant={obj.status === 'On Track' || obj.status === 'Completed' ? 'success' : 'warning'}>{obj.status}</Badge>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mb-1">
                                <div 
                                    className={`h-2.5 rounded-full ${obj.status === 'On Track' || obj.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`} 
                                    style={{ width: `${Math.min(100, (obj.current_value / obj.target_value) * 100)}%` }}
                                ></div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                                {obj.current_value} / {obj.target_value} {obj.unit} ({Math.round((obj.current_value / obj.target_value) * 100)}%)
                            </div>
                        </Card>
                    ))}
                    
                    {objectives.length === 0 && (
                        <div className="text-center py-10 text-gray-500">No objectives defined yet.</div>
                    )}
                </div>
            )}

            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <Icon name="LightBulbIcon" className="w-5 h-5" />
                    Strategic Insight
                </h3>
                <p className="text-blue-700 dark:text-blue-200 text-sm">
                    Based on current trends, focusing on "Personalized Recommendations" could yield a 15% increase in user retention. Consider adding this to your objectives for Q3.
                </p>
            </Card>
        </div>
    );
};
