import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Calendar,
  ArrowUp, ArrowDown, Minus, RefreshCw, BarChart3, PieChart,
  Target, Zap, AlertCircle
} from 'lucide-react';
import env from '../../config/environment';

interface RevenueAnalysisProps {}

interface RevenueSummary {
  mrr: number;
  arr: number;
  averageRevenuePerAccount: number;
  monthOverMonthGrowth: number;
  totalRevenueLast12Months: number;
  activeSubscriptions: number;
}

interface GrowthData {
  month: string;
  totalRevenue: number;
  subscriptionRevenue: number;
  oneTimeRevenue: number;
  growthRate?: number;
}

interface ChurnImpact {
  lostMRR: number;
  lostARR: number;
  churnedSubscriptions: number;
  recoveredRevenue: number;
  cancellationReasons: Record<string, number>;
}

interface Breakdown {
  byPlan: Record<string, number>;
  byInterval: { monthly: number; yearly: number; other: number };
}

const RevenueAnalysis: React.FC<RevenueAnalysisProps> = () => {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [growth, setGrowth] = useState<GrowthData[]>([]);
  const [churnImpact, setChurnImpact] = useState<ChurnImpact | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const paymentServerUrl = env.get('paymentServerUrl') || 'http://localhost:3001';
  const serviceApiKey = env.get('serviceApiKey');

  const fetchRevenueData = async () => {
    try {
      const response = await fetch(`${paymentServerUrl}/api/revenue/dashboard`, {
        headers: { 'x-api-key': serviceApiKey }
      });
      const data = await response.json();
      
      setSummary(data.summary);
      setGrowth(data.growth);
      setChurnImpact(data.churnImpact);
      setBreakdown(data.breakdown);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRevenueData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="w-4 h-4" />;
    if (value < 0) return <ArrowDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Revenue Analysis</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Comprehensive revenue metrics and forecasting
          </p>
        </div>
        <button
          name="refresh-revenue-data"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className={`flex items-center gap-1 ${getTrendColor(summary.monthOverMonthGrowth)}`}>
                {getTrendIcon(summary.monthOverMonthGrowth)}
                <span className="text-sm font-semibold">
                  {formatPercentage(summary.monthOverMonthGrowth)}
                </span>
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
              Monthly Recurring Revenue
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {formatCurrency(summary.mrr)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              MoM Growth Rate
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
              Annual Recurring Revenue
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {formatCurrency(summary.arr)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {formatCurrency(summary.mrr)} × 12 months
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
              Average Revenue Per Account
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {formatCurrency(summary.averageRevenuePerAccount)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {summary.activeSubscriptions} active subscriptions
            </p>
          </motion.div>
        </div>
      )}

      {/* Revenue Growth Chart */}
      {growth.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Revenue Growth (Last 12 Months)
            </h2>
          </div>

          <div className="space-y-3">
            {growth.slice(-6).map((month, index) => {
              const maxRevenue = Math.max(...growth.map(m => m.totalRevenue));
              const percentage = (month.totalRevenue / maxRevenue) * 100;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {month.month}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-800 dark:text-white font-semibold">
                        {formatCurrency(month.totalRevenue)}
                      </span>
                      {month.growthRate !== undefined && (
                        <span className={`text-xs font-semibold ${getTrendColor(month.growthRate)}`}>
                          {formatPercentage(month.growthRate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full"
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Subscription: {formatCurrency(month.subscriptionRevenue)}</span>
                    <span>One-time: {formatCurrency(month.oneTimeRevenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Revenue Breakdown */}
      {breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Revenue by Plan
            </h2>
            <div className="space-y-3">
              {Object.entries(breakdown.byPlan).map(([plan, revenue], index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{plan}</span>
                  <span className="text-gray-800 dark:text-white font-semibold">
                    {formatCurrency(revenue)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Revenue by Billing Interval
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Monthly</span>
                <span className="text-gray-800 dark:text-white font-semibold">
                  {formatCurrency(breakdown.byInterval.monthly)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Yearly (normalized)</span>
                <span className="text-gray-800 dark:text-white font-semibold">
                  {formatCurrency(breakdown.byInterval.yearly)}
                </span>
              </div>
              {breakdown.byInterval.other > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Other</span>
                  <span className="text-gray-800 dark:text-white font-semibold">
                    {formatCurrency(breakdown.byInterval.other)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Churn Impact */}
      {churnImpact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Churn Impact (Last 30 Days)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 mb-1">Lost MRR</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(churnImpact.lostMRR)}
              </p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Lost ARR</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {formatCurrency(churnImpact.lostARR)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Churned Subs</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {churnImpact.churnedSubscriptions}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">Recovered</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(churnImpact.recoveredRevenue)}
              </p>
            </div>
          </div>

          {Object.keys(churnImpact.cancellationReasons).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Cancellation Reasons
              </h3>
              <div className="space-y-2">
                {Object.entries(churnImpact.cancellationReasons).map(([reason, count], index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {reason.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-800 dark:text-white font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Summary Card */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold">Annual Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Revenue (12 months)</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.totalRevenueLast12Months)}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Active Subscriptions</p>
              <p className="text-3xl font-bold">{summary.activeSubscriptions}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Average Revenue/Account</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.averageRevenuePerAccount)}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RevenueAnalysis;
