import React, { useState } from 'react';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import {
    useDeals,
    useUpdateDealValue,
    useUpdateProbability,
    useUpdateCloseDate,
    useForecastedRevenue
} from '../../hooks/useCRMDeals';
import { Deal } from '../../services/crmDealService';

const DealEnhancements: React.FC = () => {
    const { data: deals, isLoading } = useDeals();
    const updateValue = useUpdateDealValue();
    const updateProbability = useUpdateProbability();
    const updateCloseDate = useUpdateCloseDate();

    // Forecast for current month
    const currentDate = new Date();
    const { data: forecast } = useForecastedRevenue(currentDate.getMonth() + 1, currentDate.getFullYear());

    const [editingDeal, setEditingDeal] = useState<string | null>(null);

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Forecast */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deal Enhancements</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage deal values, probabilities, and forecasts</p>
                </div>
                <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                            <Icon name="CurrencyDollarIcon" className="w-6 h-6 text-green-600 dark:text-green-300" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Current Month Forecast</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(forecast || 0)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Deals List */}
            <Card className="overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white">Active Deals Pipeline</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                                <th className="p-4 font-semibold">Deal Name</th>
                                <th className="p-4 font-semibold">Stage</th>
                                <th className="p-4 font-semibold">Value</th>
                                <th className="p-4 font-semibold">Probability</th>
                                <th className="p-4 font-semibold">Weighted Value</th>
                                <th className="p-4 font-semibold">Close Date</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {deals?.map((deal: Deal) => (
                                <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-medium text-gray-900 dark:text-white">{deal.title}</p>
                                        <p className="text-xs text-gray-500">ID: {deal.id.substring(0, 8)}</p>
                                    </td>
                                    <td className="p-4">
                                        <Badge>{deal.stage}</Badge>
                                    </td>
                                    <td className="p-4">
                                        {editingDeal === deal.id ? (
                                            <input
                                                type="number"
                                                defaultValue={deal.value}
                                                className="w-24 px-2 py-1 text-sm border rounded"
                                                onBlur={(e) => updateValue.mutate({
                                                    id: deal.id,
                                                    value: parseFloat(e.target.value),
                                                    currency: deal.currency
                                                })}
                                            />
                                        ) : (
                                            <span
                                                className="cursor-pointer hover:underline decoration-dashed"
                                                onClick={() => setEditingDeal(deal.id)}
                                            >
                                                {formatCurrency(deal.value, deal.currency)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-purple-600 h-2 rounded-full"
                                                    style={{ width: `${deal.probability}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium">{deal.probability}%</span>
                                        </div>
                                        <div className="mt-1">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                defaultValue={deal.probability}
                                                className="w-24 accent-purple-600"
                                                onChange={(e) => updateProbability.mutate({
                                                    id: deal.id,
                                                    probability: parseInt(e.target.value)
                                                })}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(deal.weighted_value, deal.currency)}
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="date"
                                            defaultValue={deal.expected_close_date ? new Date(deal.expected_close_date).toISOString().split('T')[0] : ''}
                                            className="text-sm bg-transparent border-none focus:ring-0 p-0 text-gray-600 dark:text-gray-300"
                                            onChange={(e) => updateCloseDate.mutate({
                                                id: deal.id,
                                                date: new Date(e.target.value).toISOString()
                                            })}
                                        />
                                    </td>
                                    <td className="p-4">
                                        {/* Additional actions can go here */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default DealEnhancements;
