import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Badge } from '../../components/shared/ui/CommonUI';
import { businessService, BusinessPlan, BusinessRule, CustomerSegment } from '../../services/businessService';

export const BusinessLogic: React.FC = () => {
    const [plans, setPlans] = useState<BusinessPlan[]>([]);
    const [rules, setRules] = useState<BusinessRule[]>([]);
    const [segments, setSegments] = useState<CustomerSegment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [p, r, s] = await Promise.all([
                    businessService.getPlans(),
                    businessService.getRules(),
                    businessService.getSegments()
                ]);
                setPlans(p);
                setRules(r);
                setSegments(s);
            } catch (error) {
                console.error("Failed to fetch business data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading business logic...</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white">Business Logic</h2>
                    <p className="text-gray-500 dark:text-gray-400">Configure pricing models, automation rules, and customer segmentation.</p>
                </div>
                <Button variant="primary" icon="PlusCircle" className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-md">New Rule</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pricing Models */}
                <Card className="lg:col-span-2">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Icon name="CurrencyDollarIcon" className="w-5 h-5 text-blue-500" />
                            Pricing Tiers
                        </h3>
                        <Button size="sm" variant="ghost">Manage Plans</Button>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan, i) => (
                            <div key={plan.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-500 transition-colors cursor-pointer relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon name="PencilIcon" className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                                </div>
                                <h4 className="font-bold text-gray-800 dark:text-white mb-1">{plan.name}</h4>
                                <div className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                    ${plan.price}
                                    <span className="text-xs font-medium text-gray-400">/{plan.billing_cycle === 'Monthly' ? 'mo' : 'yr'}</span>
                                </div>
                                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                                    {plan.features && plan.features.map((feature: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-2"><Icon name="CheckIcon" className="w-3 h-3 text-green-500" /> {feature}</li>
                                    ))}
                                </ul>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: `${plan.adoption_rate}%` }}></div>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1 text-right">{plan.adoption_rate}% adoption</div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Automation Rules */}
                <Card className="row-span-2">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Icon name="BoltIcon" className="w-5 h-5 text-yellow-500" />
                            Active Rules
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {rules.map((rule, i) => (
                            <div key={rule.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-sm text-gray-800 dark:text-white">{rule.name}</h4>
                                    <div className={`w-2 h-2 rounded-full ${rule.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Trigger: {rule.trigger}</p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" className="py-0.5 px-2 text-[10px] h-6">Edit</Button>
                                    <Button size="sm" variant="secondary" className="py-0.5 px-2 text-[10px] h-6">Logs</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <Button variant="outline" className="w-full" icon="PlusIcon">Add Automation</Button>
                    </div>
                </Card>

                {/* Segmentation */}
                <Card className="lg:col-span-2">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Icon name="UserGroupIcon" className="w-5 h-5 text-purple-500" />
                            Customer Segments
                        </h3>
                        <Button size="sm" variant="ghost">View All</Button>
                    </div>
                    <div className="p-4">
                        <div className="space-y-4">
                            {segments.map((seg, i) => (
                                <div key={seg.id} className="flex items-center gap-4">
                                    <div className={`w-1 h-10 rounded-full ${seg.color}`}></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <h4 className="font-bold text-gray-800 dark:text-white">{seg.name}</h4>
                                            <span className={`text-xs font-bold ${seg.growth.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{seg.growth}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{seg.count} Customers</span>
                                            <span>Last updated: Today</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
