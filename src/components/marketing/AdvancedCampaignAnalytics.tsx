import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Target, Users, DollarSign,
  Eye, MousePointer, ShoppingCart, ArrowUpRight, Calendar, Filter,
  Download, RefreshCw, Layers, Zap, Award, PieChart, X, Info,
  Clock, CheckCircle, AlertCircle, Pause, Play
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { marketingService, Campaign } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';
import { useAuth } from '../../context/AuthContext';

interface CampaignMetric {
  id: string;
  name: string;
  channel: string;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  roi: number;
  ctr: number;
  cvr: number;
  cpa: number;
  trend: 'up' | 'down' | 'stable';
  budget?: number;
  start_date?: string;
  end_date?: string;
}

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ChannelPerformance {
  channel: string;
  spend: number;
  revenue: number;
  roi: number;
  conversions: number;
  trend: number;
}

interface AnalyticsData {
  campaigns: CampaignMetric[];
  totals: {
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    avgROI: number;
    avgCTR: number;
    avgCVR: number;
  };
  channelPerformance: Array<{
    channel: string;
    spend: number;
    revenue: number;
    roi: number;
    conversions: number;
  }>;
  funnelData: {
    impressions: number;
    clicks: number;
    leads: number;
    conversions: number;
  };
}

type SortField = 'name' | 'spend' | 'revenue' | 'roi' | 'conversions' | 'impressions' | 'clicks';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: string;
  channel: string;
  minROI: number;
  maxSpend: number;
}

export const AdvancedCampaignAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignMetric | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [sortField, setSortField] = useState<SortField>('roi');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    channel: 'all',
    minROI: 0,
    maxSpend: Infinity
  });
  const [overallStats, setOverallStats] = useState({
    totalSpend: 0,
    totalRevenue: 0,
    totalConversions: 0,
    avgROI: 0,
    avgCTR: 0,
    avgCVR: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch real campaigns from service
      const campaignsData = await marketingService.getCampaigns();
      
      // Transform campaigns to metrics format
      const metrics: CampaignMetric[] = campaignsData.map((c: Campaign) => {
        const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
        const cvr = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
        const cpa = c.conversions > 0 ? c.spent / c.conversions : 0;
        const revenue = c.conversions * 100; // Mock: assume $100 per conversion
        const roi = c.spent > 0 ? ((revenue - c.spent) / c.spent) * 100 : 0;
        
        return {
          id: c.id,
          name: c.name,
          channel: c.type,
          status: c.status,
          impressions: c.impressions,
          clicks: c.clicks,
          conversions: c.conversions,
          spend: c.spent,
          revenue,
          roi,
          ctr,
          cvr,
          cpa,
          trend: roi > 150 ? 'up' : roi < 50 ? 'down' : 'stable',
          budget: c.budget,
          start_date: c.start_date,
          end_date: c.end_date
        };
      });

      setCampaigns(metrics);

      // Calculate overall stats
      const totalSpend = metrics.reduce((sum, c) => sum + c.spend, 0);
      const totalRevenue = metrics.reduce((sum, c) => sum + c.revenue, 0);
      const totalConversions = metrics.reduce((sum, c) => sum + c.conversions, 0);
      const avgROI = metrics.length > 0 
        ? metrics.reduce((sum, c) => sum + c.roi, 0) / metrics.length 
        : 0;
      const avgCTR = metrics.length > 0
        ? metrics.reduce((sum, c) => sum + c.ctr, 0) / metrics.length
        : 0;
      const avgCVR = metrics.length > 0
        ? metrics.reduce((sum, c) => sum + c.cvr, 0) / metrics.length
        : 0;

      setOverallStats({
        totalSpend,
        totalRevenue,
        totalConversions,
        avgROI: Math.round(avgROI),
        avgCTR: Math.round(avgCTR * 10) / 10,
        avgCVR: Math.round(avgCVR * 10) / 10,
      });

      // Calculate channel performance
      const channelMap = new Map<string, {
        spend: number;
        revenue: number;
        conversions: number;
      }>();

      metrics.forEach(m => {
        const existing = channelMap.get(m.channel) || { spend: 0, revenue: 0, conversions: 0 };
        channelMap.set(m.channel, {
          spend: existing.spend + m.spend,
          revenue: existing.revenue + m.revenue,
          conversions: existing.conversions + m.conversions
        });
      });

      const channelPerf: ChannelPerformance[] = Array.from(channelMap.entries()).map(([channel, data]) => {
        const roi = data.spend > 0 ? ((data.revenue - data.spend) / data.spend) * 100 : 0;
        const trend = Math.round((roi - avgROI) / Math.max(avgROI, 1) * 100 * 10) / 10;
        return {
          channel,
          spend: data.spend,
          revenue: data.revenue,
          roi: Math.round(roi),
          conversions: data.conversions,
          trend
        };
      });

      setChannelPerformance(channelPerf);
      
      // Build funnel from aggregated data
      const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
      const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
      const totalLeads = Math.round(totalClicks * 0.4); // Mock: 40% of clicks become leads
      const totalConv = metrics.reduce((sum, m) => sum + m.conversions, 0);

      setFunnel([
        { 
          name: 'Impressions', 
          value: totalImpressions, 
          percentage: 100, 
          color: 'bg-blue-500' 
        },
        { 
          name: 'Clicks', 
          value: totalClicks, 
          percentage: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0, 
          color: 'bg-indigo-500' 
        },
        { 
          name: 'Leads', 
          value: totalLeads, 
          percentage: totalImpressions > 0 ? (totalLeads / totalImpressions) * 100 : 0, 
          color: 'bg-purple-500' 
        },
        { 
          name: 'Conversions', 
          value: totalConv, 
          percentage: totalImpressions > 0 ? (totalConv / totalImpressions) * 100 : 0, 
          color: 'bg-green-500' 
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(errorMessage);
      console.error('Error fetching campaign analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, dateRange]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCampaignClick = (campaign: CampaignMetric) => {
    setSelectedCampaign(campaign);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setTimeout(() => setSelectedCampaign(null), 300);
  };

  const getFilteredAndSortedCampaigns = () => {
    let filtered = campaigns.filter(campaign => {
      if (filters.status !== 'all' && campaign.status !== filters.status) return false;
      if (filters.channel !== 'all' && campaign.channel !== filters.channel) return false;
      if (campaign.roi < filters.minROI) return false;
      if (campaign.spend > filters.maxSpend) return false;
      return true;
    });

    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * direction;
      }
      return ((aVal as number) - (bVal as number)) * direction;
    });

    return filtered;
  };

  const handleExport = () => {
    try {
      const exportData = getFilteredAndSortedCampaigns().map(c => ({
        Name: c.name,
        Channel: c.channel,
        Status: c.status,
        Impressions: c.impressions,
        Clicks: c.clicks,
        Conversions: c.conversions,
        Spend: c.spend,
        Revenue: c.revenue,
        ROI: `${c.roi.toFixed(1)}%`,
        CTR: `${c.ctr.toFixed(2)}%`,
        CVR: `${c.cvr.toFixed(2)}%`,
        CPA: c.cpa.toFixed(2),
      }));
      marketingExportService.exportROIToExcel(exportData);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export data');
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('en-US').format(value);

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      'Email': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'Social': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'Display': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Search': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      'Google Ads': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'Facebook': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'LinkedIn': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
      'Instagram': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    };
    return colors[channel] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-gray-700 dark:text-gray-300 mb-2">Failed to load analytics</div>
          <div className="text-sm text-gray-500 mb-4">{error}</div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredCampaigns = getFilteredAndSortedCampaigns();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-500" />
            Advanced Campaign Analytics
          </h1>
          <p className="text-gray-500 mt-1">Deep performance insights across all marketing channels</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  dateRange === range
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                )}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <button className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50">
            <Filter className="w-5 h-5 text-gray-500" />
          </button>
          <button onClick={handleExport} className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50">
            <Download className="w-5 h-5 text-gray-500" />
          </button>
          <button onClick={fetchData} className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600">
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Spend', value: formatCurrency(overallStats.totalSpend), icon: DollarSign, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Total Revenue', value: formatCurrency(overallStats.totalRevenue), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Conversions', value: formatNumber(overallStats.totalConversions), icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Avg ROI', value: `${overallStats.avgROI}%`, icon: Award, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Avg CTR', value: `${overallStats.avgCTR}%`, icon: MousePointer, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Avg CVR', value: `${overallStats.avgCVR}%`, icon: Target, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", kpi.bg)}>
              <kpi.icon className={cn("w-5 h-5", kpi.color)} />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <Layers className="w-5 h-5 text-indigo-500" />
            Conversion Funnel
          </h2>
          <div className="space-y-4">
            {funnel.map((stage, idx) => (
              <div key={stage.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{stage.name}</span>
                  <span className="text-gray-500">{formatNumber(stage.value)}</span>
                </div>
                <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(stage.percentage, 5)}%` }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className={cn("h-full rounded-lg", stage.color)}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {stage.percentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Channel Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-purple-500" />
            Channel Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {channelPerformance.map((channel, idx) => (
              <motion.div
                key={channel.channel}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
              >
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{channel.channel}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{channel.roi}%</div>
                <div className="text-xs text-gray-500 mb-2">ROI</div>
                <div className="flex items-center gap-1">
                  {channel.trend > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={cn("text-xs font-medium", channel.trend > 0 ? "text-green-500" : "text-red-500")}>
                    {channel.trend > 0 ? '+' : ''}{channel.trend}%
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Spend</span>
                    <span className="font-medium">{formatCurrency(channel.spend)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Revenue</span>
                    <span className="font-medium text-green-600">{formatCurrency(channel.revenue)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Campaign Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Campaign Performance Details
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Campaign</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Channel</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Impressions</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Clicks</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">CTR</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Conversions</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">CVR</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Spend</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Revenue</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">ROI</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-500">
                    No campaigns match the current filters
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <tr 
                    key={campaign.id} 
                    onClick={() => handleCampaignClick(campaign)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900 dark:text-white">{campaign.name}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getChannelColor(campaign.channel))}>
                      {campaign.channel}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">{formatNumber(campaign.impressions)}</td>
                  <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">{formatNumber(campaign.clicks)}</td>
                  <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">{campaign.ctr.toFixed(1)}%</td>
                  <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">{formatNumber(campaign.conversions)}</td>
                  <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">{campaign.cvr.toFixed(2)}%</td>
                  <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">{formatCurrency(campaign.spend)}</td>
                  <td className="py-4 px-4 text-right font-medium text-green-600">{formatCurrency(campaign.revenue)}</td>
                  <td className="py-4 px-4 text-right">
                    <span className={cn("font-bold", campaign.roi >= 200 ? "text-green-600" : campaign.roi >= 100 ? "text-blue-600" : "text-orange-600")}>
                      {campaign.roi.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {campaign.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : campaign.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <span className="w-4 h-4 text-gray-400">—</span>
                      )}
                      <span className={cn("text-sm font-medium", campaign.trend === 'up' ? "text-green-500" : campaign.trend === 'down' ? "text-red-500" : "text-gray-400")}>
                        {campaign.trend}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Campaign Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseDetail}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCampaign.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getChannelColor(selectedCampaign.channel))}>
                      {selectedCampaign.channel}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      {selectedCampaign.status === 'Active' ? (
                        <><Play className="w-4 h-4 text-green-500" /> Active</>
                      ) : selectedCampaign.status === 'Paused' ? (
                        <><Pause className="w-4 h-4 text-yellow-500" /> Paused</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 text-gray-500" /> {selectedCampaign.status}</>
                      )}
                    </span>
                    {selectedCampaign.start_date && (
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(selectedCampaign.start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
                    <Eye className="w-8 h-8 text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(selectedCampaign.impressions)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Impressions</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
                    <MousePointer className="w-8 h-8 text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(selectedCampaign.clicks)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Clicks ({selectedCampaign.ctr.toFixed(2)}%)</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
                    <ShoppingCart className="w-8 h-8 text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(selectedCampaign.conversions)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Conversions ({selectedCampaign.cvr.toFixed(2)}%)</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4">
                    <Award className="w-8 h-8 text-orange-600 mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCampaign.roi.toFixed(0)}%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">ROI</div>
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Financial Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedCampaign.budget && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Budget</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(selectedCampaign.budget)}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Spend</div>
                      <div className="text-xl font-bold text-red-600">{formatCurrency(selectedCampaign.spend)}</div>
                      {selectedCampaign.budget && (
                        <div className="text-xs text-gray-500 mt-1">
                          {((selectedCampaign.spend / selectedCampaign.budget) * 100).toFixed(1)}% of budget
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Revenue</div>
                      <div className="text-xl font-bold text-green-600">{formatCurrency(selectedCampaign.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">CPA</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(selectedCampaign.cpa)}</div>
                    </div>
                  </div>
                </div>

                {/* Performance Indicator */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Performance Trend</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This campaign is performing {selectedCampaign.trend === 'up' ? 'above' : selectedCampaign.trend === 'down' ? 'below' : 'at'} expectations
                      </p>
                    </div>
                    <div className="text-center">
                      {selectedCampaign.trend === 'up' ? (
                        <TrendingUp className="w-16 h-16 text-green-500 mx-auto mb-2" />
                      ) : selectedCampaign.trend === 'down' ? (
                        <TrendingDown className="w-16 h-16 text-red-500 mx-auto mb-2" />
                      ) : (
                        <Target className="w-16 h-16 text-blue-500 mx-auto mb-2" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        selectedCampaign.trend === 'up' ? 'text-green-600' : selectedCampaign.trend === 'down' ? 'text-red-600' : 'text-blue-600'
                      )}>
                        {selectedCampaign.trend === 'up' ? 'Trending Up' : selectedCampaign.trend === 'down' ? 'Trending Down' : 'Stable'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleCloseDetail}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const exportData = [selectedCampaign].map(c => ({
                        Name: c.name,
                        Channel: c.channel,
                        Status: c.status,
                        Impressions: c.impressions,
                        Clicks: c.clicks,
                        Conversions: c.conversions,
                        Spend: c.spend,
                        Revenue: c.revenue,
                        ROI: `${c.roi.toFixed(1)}%`,
                        CTR: `${c.ctr.toFixed(2)}%`,
                        CVR: `${c.cvr.toFixed(2)}%`,
                        CPA: c.cpa.toFixed(2),
                      }));
                      marketingExportService.exportROIToExcel(exportData);
                    }}
                    className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Details
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedCampaignAnalytics;
