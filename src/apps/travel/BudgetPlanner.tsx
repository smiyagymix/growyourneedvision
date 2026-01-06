/**
 * Travel Planning - Budget Planner
 * Track and manage travel expenses
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon, Card, Button } from '../../components/shared/ui/CommonUI';
import { travelApiService, Currency } from '../../services/travelApiService';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/shared/ui/Spinner';

interface ExpenseCategory {
    name: string;
    icon: string;
    color: string;
    planned: number;
    actual: number;
}

interface TripBudget {
    id: string;
    tripName: string;
    destination: string;
    startDate: string;
    endDate: string;
    totalBudget: number;
    currency: string;
    categories: ExpenseCategory[];
}

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
    { name: 'Flights', icon: 'PaperAirplaneIcon', color: 'bg-blue-500', planned: 0, actual: 0 },
    { name: 'Accommodation', icon: 'BuildingOfficeIcon', color: 'bg-purple-500', planned: 0, actual: 0 },
    { name: 'Food & Dining', icon: 'FireIcon', color: 'bg-orange-500', planned: 0, actual: 0 },
    { name: 'Transportation', icon: 'TruckIcon', color: 'bg-green-500', planned: 0, actual: 0 },
    { name: 'Activities', icon: 'TicketIcon', color: 'bg-pink-500', planned: 0, actual: 0 },
    { name: 'Shopping', icon: 'ShoppingBagIcon', color: 'bg-yellow-500', planned: 0, actual: 0 },
    { name: 'Miscellaneous', icon: 'EllipsisHorizontalIcon', color: 'bg-gray-500', planned: 0, actual: 0 }
];

const MOCK_BUDGETS: TripBudget[] = [
    {
        id: 'B001',
        tripName: 'Paris Spring Trip',
        destination: 'Paris, France',
        startDate: '2025-03-15',
        endDate: '2025-03-22',
        totalBudget: 3000,
        currency: 'USD',
        categories: [
            { name: 'Flights', icon: 'PaperAirplaneIcon', color: 'bg-blue-500', planned: 800, actual: 750 },
            { name: 'Accommodation', icon: 'BuildingOfficeIcon', color: 'bg-purple-500', planned: 900, actual: 850 },
            { name: 'Food & Dining', icon: 'FireIcon', color: 'bg-orange-500', planned: 500, actual: 420 },
            { name: 'Transportation', icon: 'TruckIcon', color: 'bg-green-500', planned: 200, actual: 180 },
            { name: 'Activities', icon: 'TicketIcon', color: 'bg-pink-500', planned: 400, actual: 350 },
            { name: 'Shopping', icon: 'ShoppingBagIcon', color: 'bg-yellow-500', planned: 150, actual: 200 },
            { name: 'Miscellaneous', icon: 'EllipsisHorizontalIcon', color: 'bg-gray-500', planned: 50, actual: 30 }
        ]
    }
];

export const BudgetPlanner: React.FC = () => {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<TripBudget[]>(MOCK_BUDGETS);
    const [selectedBudget, setSelectedBudget] = useState<TripBudget | null>(MOCK_BUDGETS[0]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const rates = await travelApiService.getExchangeRates('USD');
            setCurrencies(rates);
        } catch (error) {
            console.error('Failed to load currencies:', error);
        } finally {
            setLoading(false);
        }
    };

    const convertCurrency = (amount: number, fromCurrency: string = 'USD') => {
        if (fromCurrency === selectedCurrency) return amount;
        const targetRate = currencies.find(c => c.code === selectedCurrency)?.rate || 1;
        return Math.round(amount * targetRate * 100) / 100;
    };

    const getCurrencySymbol = () => {
        return currencies.find(c => c.code === selectedCurrency)?.symbol || '$';
    };

    const calculateTotals = (budget: TripBudget) => {
        const planned = budget.categories.reduce((sum, cat) => sum + cat.planned, 0);
        const actual = budget.categories.reduce((sum, cat) => sum + cat.actual, 0);
        return {
            planned,
            actual,
            remaining: budget.totalBudget - actual,
            percentUsed: Math.round((actual / budget.totalBudget) * 100)
        };
    };

    const updateCategory = (categoryName: string, field: 'planned' | 'actual', value: number) => {
        if (!selectedBudget) return;

        const updatedCategories = selectedBudget.categories.map(cat =>
            cat.name === categoryName ? { ...cat, [field]: value } : cat
        );

        const updatedBudget = { ...selectedBudget, categories: updatedCategories };
        setSelectedBudget(updatedBudget);
        setBudgets(budgets.map(b => b.id === updatedBudget.id ? updatedBudget : b));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner />
            </div>
        );
    }

    const totals = selectedBudget ? calculateTotals(selectedBudget) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Planner</h2>
                    <p className="text-gray-600 dark:text-gray-400">Track your travel expenses</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        {currencies.map(curr => (
                            <option key={curr.code} value={curr.code}>
                                {curr.code} ({curr.symbol})
                            </option>
                        ))}
                    </select>
                    <Button variant="primary" onClick={() => setIsCreating(true)}>
                        <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                        New Budget
                    </Button>
                </div>
            </div>

            {/* Budget Selection */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {budgets.map(budget => (
                    <button
                        key={budget.id}
                        onClick={() => setSelectedBudget(budget)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedBudget?.id === budget.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {budget.tripName}
                    </button>
                ))}
            </div>

            {selectedBudget && totals && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            <p className="text-sm opacity-80">Total Budget</p>
                            <p className="text-3xl font-bold">
                                {getCurrencySymbol()}{convertCurrency(selectedBudget.totalBudget).toLocaleString()}
                            </p>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                            <p className="text-sm opacity-80">Planned</p>
                            <p className="text-3xl font-bold">
                                {getCurrencySymbol()}{convertCurrency(totals.planned).toLocaleString()}
                            </p>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                            <p className="text-sm opacity-80">Spent</p>
                            <p className="text-3xl font-bold">
                                {getCurrencySymbol()}{convertCurrency(totals.actual).toLocaleString()}
                            </p>
                        </Card>

                        <Card className={`bg-gradient-to-br ${totals.remaining >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white`}>
                            <p className="text-sm opacity-80">Remaining</p>
                            <p className="text-3xl font-bold">
                                {getCurrencySymbol()}{convertCurrency(totals.remaining).toLocaleString()}
                            </p>
                        </Card>
                    </div>

                    {/* Progress Bar */}
                    <Card className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget Usage</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{totals.percentUsed}%</span>
                        </div>
                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(totals.percentUsed, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full rounded-full ${
                                    totals.percentUsed <= 50 ? 'bg-green-500' :
                                    totals.percentUsed <= 80 ? 'bg-yellow-500' :
                                    totals.percentUsed <= 100 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                            />
                        </div>
                    </Card>

                    {/* Category Breakdown */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Expense Categories</h3>
                        <div className="space-y-4">
                            {selectedBudget.categories.map((category, index) => (
                                <motion.div
                                    key={category.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center text-white`}>
                                        <Icon name={category.icon} className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {getCurrencySymbol()}{convertCurrency(category.actual)} / {getCurrencySymbol()}{convertCurrency(category.planned)}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${category.color} rounded-full transition-all`}
                                                style={{ width: `${Math.min((category.actual / Math.max(category.planned, 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={category.planned}
                                            onChange={(e) => updateCategory(category.name, 'planned', parseInt(e.target.value) || 0)}
                                            className="w-24 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                            placeholder="Planned"
                                            title="Planned amount"
                                        />
                                        <input
                                            type="number"
                                            value={category.actual}
                                            onChange={(e) => updateCategory(category.name, 'actual', parseInt(e.target.value) || 0)}
                                            className="w-24 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                                            placeholder="Actual"
                                            title="Actual amount"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    {/* Visual Breakdown */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Spending Distribution</h3>
                        <div className="flex h-8 rounded-lg overflow-hidden">
                            {selectedBudget.categories.map((category, index) => {
                                const width = totals.actual > 0 ? (category.actual / totals.actual) * 100 : 0;
                                if (width === 0) return null;
                                return (
                                    <motion.div
                                        key={category.name}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${width}%` }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className={`${category.color} relative group`}
                                        title={`${category.name}: ${getCurrencySymbol()}${convertCurrency(category.actual)}`}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {category.name}: {getCurrencySymbol()}{convertCurrency(category.actual)}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-4">
                            {selectedBudget.categories.filter(c => c.actual > 0).map(category => (
                                <div key={category.name} className="flex items-center gap-2 text-sm">
                                    <div className={`w-3 h-3 ${category.color} rounded`} />
                                    <span className="text-gray-600 dark:text-gray-400">{category.name}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};

export default BudgetPlanner;
