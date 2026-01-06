import React, { useState } from 'react';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import {
    useCurrentMonthCosts,
    useBudgetAlerts,
    useMonthlyCostForecast,
    useTopTenants,
    useSetBudget
} from '../../hooks/useAICosts';
import { aiCostService } from '../../services/aiCostService';
import { useToast } from '../../hooks/useToast';

const AICostDashboard: React.FC = () => {
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [newBudget, setNewBudget] = useState('');

    const { data: costs, isLoading } = useCurrentMonthCosts();
    const { data: alerts } = useBudgetAlerts();
    const { data: forecast } = useMonthlyCostForecast();
    const { data: topTenants } = useTopTenants(5);
    const setBudgetMutation = useSetBudget();

    const budget = aiCostService.getBudget();
    const usagePercentage = costs ? (costs.total_cost / budget) * 100 : 0;

    const handleSetBudget = async () => {
        const amount = parseFloat(newBudget);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid budget amount');
            return;
        }

        try {
            await setBudgetMutation.mutateAsync(amount);
            setShowBudgetModal(false);
            setNewBudget('');
        } catch (error) {
            alert('Failed to set budget');
        }
    };

    const formatCost = (cost: number) => {
        return `$${cost.toFixed(2)}`;
    };

    const getAlertColor = (threshold: number) => {
        if (threshold === 100) return 'danger';
        if (threshold === 90) return 'warning';
        return 'info';
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Cost Dashboard</h2>
                    <p className="text-sm text-gray-500 mt-1">Track usage costs and manage budgets</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowBudgetModal(true)}>
                    <Icon name="CogIcon" className="w-4 h-4 mr-2" />
                    Set Budget
                </Button>
            </div>

            {/* Budget Alerts */}
            {alerts && alerts.some(a => a.triggered) && (
                <div className="space-y-2">
                    {alerts.filter(a => a.triggered).map(alert => (
                        <Card key={alert.id} className={`p-4 ${alert.threshold === 100
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200'
                                : alert.threshold === 90
                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'
                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                            }`}>
                            <div className="flex items-center gap-3">
                                <Icon
                                    name={alert.threshold === 100 ? 'ExclamationTriangleIcon' : 'InformationCircleIcon'}
                                    className={`w-6 h-6 ${alert.threshold === 100 ? 'text-red-600' : 'text-yellow-600'
                                        }`}
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {alert.threshold}% Budget Alert
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        You've reached {alert.threshold}% of your monthly budget ({formatCost(alert.amount)})
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Budget Overview */}
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm text-gray-600">This Month</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {formatCost(costs?.total_cost || 0)} <span className="text-lg text-gray-500">/ {formatCost(budget)}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Forecast</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {formatCost(forecast || 0)}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${usagePercentage >= 100
                                ? 'bg-red-500'
                                : usagePercentage >= 90
                                    ? 'bg-yellow-500'
                                    : 'bg-gradient-to-r from-purple-500 to-blue-500'
                            }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                </div>
                <p className="text-xs text-gray-600 mt-2 text-right">
                    {usagePercentage.toFixed(1)}% of budget used
                </p>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="CurrencyDollarIcon" className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Spent</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {formatCost(costs?.total_cost || 0)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="CubeIcon" className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Tokens</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {(costs?.total_tokens || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="BoltIcon" className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Requests</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {(costs?.total_requests || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Cost by Model */}
            <Card className="p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Cost by Model</h3>
                <div className="space-y-3">
                    {costs && Object.entries(costs.by_model)
                        .sort(([, a], [, b]) => b.cost - a.cost)
                        .map(([model, data]) => (
                            <div key={model}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {model}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">
                                            {data.percentage.toFixed(1)}%
                                        </span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {formatCost(data.cost)}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                        style={{ width: `${data.percentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {data.tokens.toLocaleString()} tokens • {data.requests.toLocaleString()} requests
                                </p>
                            </div>
                        ))}
                </div>
            </Card>

            {/* Top Tenants */}
            <Card className="p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Top Spending Tenants</h3>
                <div className="space-y-3">
                    {topTenants?.map((tenant, idx) => (
                        <div key={tenant.tenant_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-purple-600">#{idx + 1}</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {tenant.tenant_id}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {tenant.tokens.toLocaleString()} tokens
                                    </p>
                                </div>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white">
                                {formatCost(tenant.cost)}
                            </p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Cost by Feature */}
            <Card className="p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Cost by Feature</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {costs && Object.entries(costs.by_feature).map(([feature, data]) => (
                        <div key={feature} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                            <p className="text-sm text-gray-600 mb-1 capitalize">{feature}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {formatCost(data.cost)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {data.requests.toLocaleString()} requests
                            </p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Budget Modal */}
            {showBudgetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 w-full max-w-md">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4">
                            Set Monthly Budget
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Set your monthly AI usage budget to receive alerts when you reach 80%, 90%, and 100%.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Budget Amount (USD)
                            </label>
                            <input
                                type="number"
                                value={newBudget}
                                onChange={(e) => setNewBudget(e.target.value)}
                                placeholder={budget.toString()}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowBudgetModal(false);
                                    setNewBudget('');
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSetBudget}
                                disabled={setBudgetMutation.isPending}
                                className="flex-1"
                            >
                                {setBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AICostDashboard;
