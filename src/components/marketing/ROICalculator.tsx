import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator, DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3,
  ArrowRight, Plus, Trash2, Info, Download, RefreshCw, Target, Percent,
  Users, Eye, MousePointer, ShoppingCart, Calendar, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { marketingService } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';

interface ROIData {
  campaigns?: Campaign[];
  forecasts?: ForecastScenario[];
}

interface Campaign {
  id: string;
  name: string;
  channel: string;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number;
  roas: number;
  ctr?: number;
  conversionRate?: number;
  startDate?: string;
  endDate?: string;
}

interface ROIMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalROI: number;
  totalRoas: number;
  avgCpa: number;
  totalConversions: number;
  blendedCac: number;
  ltv: number;
  ltvCacRatio: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgConversionRate: number;
  roiTrend: 'up' | 'down' | 'stable';
}

interface ForecastScenario {
  name: string;
  budgetChange: number;
  expectedROI: number;
  expectedRevenue: number;
  confidence: number;
}

export const ROICalculator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [forecastScenarios, setForecastScenarios] = useState<ForecastScenario[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'calculator' | 'forecast'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [customLTV, setCustomLTV] = useState(500);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    channel: 'Google Ads',
    spend: 0,
    revenue: 0,
    conversions: 0,
    impressions: 0,
    clicks: 0,
    startDate: '',
  });
  const [savingCampaign, setSavingCampaign] = useState(false);

  const handleAddCampaign = async () => {
    if (!newCampaign.name || newCampaign.spend <= 0 || newCampaign.revenue <= 0) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    setSavingCampaign(true);
    try {
      const ctr = newCampaign.impressions > 0 ? (newCampaign.clicks / newCampaign.impressions) * 100 : 0;
      const conversionRate = newCampaign.clicks > 0 ? (newCampaign.conversions / newCampaign.clicks) * 100 : 0;
      const cpa = newCampaign.conversions > 0 ? newCampaign.spend / newCampaign.conversions : 0;
      const roas = newCampaign.spend > 0 ? newCampaign.revenue / newCampaign.spend : 0;

      const campaign: Campaign = {
        id: `calc-${Date.now()}`,
        name: newCampaign.name,
        channel: newCampaign.channel,
        spend: newCampaign.spend,
        revenue: newCampaign.revenue,
        impressions: newCampaign.impressions,
        clicks: newCampaign.clicks,
        conversions: newCampaign.conversions,
        cpa,
        roas,
        ctr,
        conversionRate,
        startDate: newCampaign.startDate || new Date().toISOString(),
      };

      setCampaigns(prev => [campaign, ...prev]);
      
      // Reset form
      setNewCampaign({
        name: '',
        channel: 'Google Ads',
        spend: 0,
        revenue: 0,
        conversions: 0,
        impressions: 0,
        clicks: 0,
        startDate: '',
      });
    } catch (error) {
      console.error('Failed to add campaign:', error);
      alert('Failed to add campaign');
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleDeleteCampaign = (id: string) => {
    if (window.confirm('Remove this campaign from the calculator?')) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await marketingService.getROIData();
      // Add startDate to campaigns for Calendar icon display
      const campaignsData = Array.isArray(data) ? data : (data as ROIData).campaigns || [];
      const campaignsWithDates = campaignsData.map((c: Campaign, idx: number) => ({
        ...c,
        startDate: new Date(Date.now() - (idx + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      setCampaigns(campaignsWithDates);
      const forecastsData = Array.isArray(data) ? [] : (data as ROIData).forecasts || [];
      setForecastScenarios(forecastsData);
    } catch (error) {
      console.error('Error fetching ROI data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportReport = () => {
    const exportData = campaigns.map(c => ({
      Campaign: c.name,
      Channel: c.channel,
      Spend: c.spend,
      Revenue: c.revenue,
      ROAS: c.roas,
      CPA: c.cpa,
      Conversions: c.conversions,
      Impressions: c.impressions,
      Clicks: c.clicks,
    }));
    marketingExportService.exportROIToExcel(exportData);
  };

  const calculateMetrics = (): ROIMetrics => {
    const totalSpend = campaigns.reduce((a, b) => a + b.spend, 0);
    const totalRevenue = campaigns.reduce((a, b) => a + b.revenue, 0);
    const totalConversions = campaigns.reduce((a, b) => a + b.conversions, 0);
    const totalImpressions = campaigns.reduce((a, b) => a + b.impressions, 0);
    const totalClicks = campaigns.reduce((a, b) => a + b.clicks, 0);
    const totalROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const blendedCac = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const ltvCacRatio = blendedCac > 0 ? customLTV / blendedCac : 0;
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    
    // Determine ROI trend based on recent performance
    const roiTrend: 'up' | 'down' | 'stable' = totalROI > 50 ? 'up' : totalROI < 0 ? 'down' : 'stable';

    return {
      totalSpend,
      totalRevenue,
      totalROI,
      totalRoas,
      avgCpa,
      totalConversions,
      blendedCac,
      ltv: customLTV,
      ltvCacRatio,
      totalImpressions,
      totalClicks,
      avgCtr,
      avgConversionRate,
      roiTrend,
    };
  };

  const metrics = calculateMetrics();

  const channelBreakdown = campaigns.reduce((acc, camp) => {
    if (!acc[camp.channel]) {
      acc[camp.channel] = { spend: 0, revenue: 0, conversions: 0 };
    }
    acc[camp.channel].spend += camp.spend;
    acc[camp.channel].revenue += camp.revenue;
    acc[camp.channel].conversions += camp.conversions;
    return acc;
  }, {} as Record<string, { spend: number; revenue: number; conversions: number }>);

  const handleRemoveCampaign = (id: string) => {
    setCampaigns(campaigns.filter(c => c.id !== id));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-7 h-7 text-green-500" />
            Marketing ROI Calculator
          </h1>
          <p className="text-gray-500 mt-1">Analyze campaign performance and forecast returns</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">Year to Date</option>
          </select>
          <button 
            onClick={handleExportReport}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Spend', value: formatCurrency(metrics.totalSpend), icon: DollarSign, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
          { label: 'Total Revenue', value: formatCurrency(metrics.totalRevenue), icon: metrics.roiTrend === 'down' ? TrendingDown : TrendingUp, color: metrics.roiTrend === 'down' ? 'text-red-500' : 'text-green-500', bg: metrics.roiTrend === 'down' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30' },
          { label: 'Impressions', value: formatNumber(metrics.totalImpressions), icon: Eye, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
          { label: 'Total Clicks', value: formatNumber(metrics.totalClicks), icon: MousePointer, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
          { label: 'Conversions', value: formatNumber(metrics.totalConversions), icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'LTV:CAC', value: `${metrics.ltvCacRatio.toFixed(2)}:1`, icon: PieChart, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30' },
        ].map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
          >
            <div className={cn("p-2 rounded-lg inline-block mb-2", metric.bg)}>
              <metric.icon className={cn("w-5 h-5", metric.color)} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
            <div className="text-xs text-gray-500">{metric.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', label: 'Campaign Overview', icon: BarChart3 },
          { id: 'calculator', label: 'ROI Calculator', icon: Calculator },
          { id: 'forecast', label: 'Budget Forecast', icon: Sparkles },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "px-4 py-3 flex items-center gap-2 border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-green-500 text-green-600 dark:text-green-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Campaign Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Campaign</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      <span className="flex items-center justify-end gap-1"><Eye className="w-3 h-3" /> Impr.</span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      <span className="flex items-center justify-end gap-1"><MousePointer className="w-3 h-3" /> Clicks</span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      <span className="flex items-center justify-end gap-1"><ShoppingCart className="w-3 h-3" /> Conv.</span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Spend</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ROAS</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {campaigns.map((camp) => {
                    const ctr = camp.impressions > 0 ? (camp.clicks / camp.impressions) * 100 : 0;
                    const convRate = camp.clicks > 0 ? (camp.conversions / camp.clicks) * 100 : 0;
                    const isNegativeROI = camp.revenue < camp.spend;
                    return (
                      <tr key={camp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isNegativeROI && <TrendingDown className="w-4 h-4 text-red-500" />}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{camp.name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                {camp.channel}
                                {camp.startDate && (
                                  <span className="flex items-center gap-1 ml-2 text-gray-400">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(camp.startDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div>{formatNumber(camp.impressions)}</div>
                        </td>
                        <td className="text-right px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div>{formatNumber(camp.clicks)}</div>
                          <div className="text-xs text-gray-400">{ctr.toFixed(2)}% CTR</div>
                        </td>
                        <td className="text-right px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div>{formatNumber(camp.conversions)}</div>
                          <div className="text-xs text-gray-400">{convRate.toFixed(2)}%</div>
                        </td>
                        <td className="text-right px-4 py-3 text-gray-700 dark:text-gray-300">{formatCurrency(camp.spend)}</td>
                        <td className="text-right px-4 py-3">
                          <span className={cn(
                            "font-medium",
                            isNegativeROI ? "text-red-600" : "text-green-600"
                          )}>
                            {formatCurrency(camp.revenue)}
                          </span>
                        </td>
                        <td className="text-right px-4 py-3">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1",
                            camp.roas >= 4 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            camp.roas >= 2 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {camp.roas < 1 && <TrendingDown className="w-3 h-3" />}
                            {camp.roas.toFixed(1)}x
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemoveCampaign(camp.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Channel Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Channel Performance</h3>
            <div className="space-y-4">
              {Object.entries(channelBreakdown).map(([channel, data]) => {
                const roas = data.revenue / data.spend;
                return (
                  <div key={channel} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">{channel}</span>
                      <span className={cn(
                        "text-sm font-bold",
                        roas >= 4 ? "text-green-600" : roas >= 2 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {roas.toFixed(1)}x ROAS
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500">Spend</div>
                        <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(data.spend)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Revenue</div>
                        <div className="font-medium text-green-600">{formatCurrency(data.revenue)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Conv.</div>
                        <div className="font-medium text-gray-900 dark:text-white">{data.conversions}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Campaign Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Add Campaign Data</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g., Spring Promotion"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel</label>
                <select
                  value={newCampaign.channel}
                  onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <option>Google Ads</option>
                  <option>Facebook</option>
                  <option>Instagram</option>
                  <option>LinkedIn</option>
                  <option>Email</option>
                  <option>TikTok</option>
                  <option>Other</option>
                </select>
              </div>
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Campaign Start Date
                </label>
                <input
                  type="date"
                  value={newCampaign.startDate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>

              {/* Funnel Metrics Row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Eye className="w-4 h-4" /> Impressions
                  </label>
                  <input
                    type="number"
                    value={newCampaign.impressions || ''}
                    onChange={(e) => setNewCampaign({ ...newCampaign, impressions: Number(e.target.value) })}
                    placeholder="50000"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <MousePointer className="w-4 h-4" /> Clicks
                  </label>
                  <input
                    type="number"
                    value={newCampaign.clicks || ''}
                    onChange={(e) => setNewCampaign({ ...newCampaign, clicks: Number(e.target.value) })}
                    placeholder="1000"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <ShoppingCart className="w-4 h-4" /> Conversions
                  </label>
                  <input
                    type="number"
                    value={newCampaign.conversions || ''}
                    onChange={(e) => setNewCampaign({ ...newCampaign, conversions: Number(e.target.value) })}
                    placeholder="100"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
              </div>

              {/* Financial Metrics Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spend ($)</label>
                  <input
                    type="number"
                    value={newCampaign.spend || ''}
                    onChange={(e) => setNewCampaign({ ...newCampaign, spend: Number(e.target.value) })}
                    placeholder="5000"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Revenue ($)</label>
                  <input
                    type="number"
                    value={newCampaign.revenue || ''}
                    onChange={(e) => setNewCampaign({ ...newCampaign, revenue: Number(e.target.value) })}
                    placeholder="20000"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
              </div>

              {/* Live CTR/Conversion Preview */}
              {(newCampaign.impressions > 0 || newCampaign.clicks > 0) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div className="text-gray-500">Est. CTR</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {newCampaign.impressions > 0 ? ((newCampaign.clicks / newCampaign.impressions) * 100).toFixed(2) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-cyan-500" />
                    <div>
                      <div className="text-gray-500">Conv. Rate</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {newCampaign.clicks > 0 ? ((newCampaign.conversions / newCampaign.clicks) * 100).toFixed(2) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {newCampaign.revenue < newCampaign.spend ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    )}
                    <div>
                      <div className="text-gray-500">Est. ROAS</div>
                      <div className={cn(
                        "font-medium",
                        newCampaign.revenue < newCampaign.spend ? "text-red-600" : "text-green-600"
                      )}>
                        {newCampaign.spend > 0 ? (newCampaign.revenue / newCampaign.spend).toFixed(2) : 0}x
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleAddCampaign}
                disabled={!newCampaign.name || newCampaign.spend <= 0}
                className={cn(
                  "w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2",
                  newCampaign.name && newCampaign.spend > 0
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                )}
              >
                <Plus className="w-5 h-5" />
                Add Campaign
              </button>
            </div>
          </motion.div>

          {/* LTV Calculator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              LTV:CAC Calculator
              <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <Info className="w-4 h-4 text-gray-400" />
              </button>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Lifetime Value ($)
                </label>
                <input
                  type="number"
                  value={customLTV}
                  onChange={(e) => setCustomLTV(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Blended CAC</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.blendedCac)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">LTV</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(customLTV)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">LTV:CAC Ratio</span>
                    <span className={cn(
                      "text-2xl font-bold",
                      metrics.ltvCacRatio >= 3 ? "text-green-600" :
                      metrics.ltvCacRatio >= 1 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {metrics.ltvCacRatio.toFixed(2)}:1
                    </span>
                  </div>
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-lg border-l-4",
                metrics.ltvCacRatio >= 3 ? "bg-green-50 dark:bg-green-900/20 border-green-500" :
                metrics.ltvCacRatio >= 1 ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500" :
                "bg-red-50 dark:bg-red-900/20 border-red-500"
              )}>
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {metrics.ltvCacRatio >= 3 ? 'Excellent!' : metrics.ltvCacRatio >= 1 ? 'Needs Improvement' : 'Warning'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {metrics.ltvCacRatio >= 3
                    ? 'Your LTV:CAC ratio is healthy. Consider scaling your marketing spend.'
                    : metrics.ltvCacRatio >= 1
                    ? 'Your ratio is below the 3:1 benchmark. Focus on reducing CAC or increasing LTV.'
                    : 'Your CAC exceeds LTV. Immediate optimization needed.'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forecast Scenarios */}
          {forecastScenarios.map((scenario, idx) => (
            <motion.div
              key={scenario.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{scenario.name}</h3>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  scenario.confidence >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  scenario.confidence >= 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                )}>
                  {scenario.confidence}% confidence
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Budget Change</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">+{scenario.budgetChange}%</span>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(metrics.totalSpend * (1 + scenario.budgetChange / 100))}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Expected ROI</div>
                    <div className="text-xl font-bold text-green-600">{scenario.expectedROI}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Expected Revenue</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(scenario.expectedRevenue)}</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Projected Profit</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(scenario.expectedRevenue - metrics.totalSpend * (1 + scenario.budgetChange / 100))}
                    </span>
                  </div>
                </div>

                <button className="w-full py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 font-medium transition-colors">
                  Apply This Scenario
                </button>
              </div>
            </motion.div>
          ))}

          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-green-500" />
              AI-Powered Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">Scale Email Channel</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email shows 15x ROAS - highest in your mix. Consider increasing budget by 50% for maximum impact.
                </p>
              </div>
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">Optimize LinkedIn Targeting</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  LinkedIn CPA is $100 vs $33 average. Test narrower audience segments to reduce acquisition cost.
                </p>
              </div>
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">Reallocate Influencer Budget</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Instagram influencer campaign underperforming at 3x ROAS. Shift budget to retargeting (6x ROAS).
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ROICalculator;
