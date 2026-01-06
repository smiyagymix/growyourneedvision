import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Share2, Mail, MessageSquare, Globe, Smartphone, Bell, Radio,
  Plus, Settings, BarChart3, Calendar, Users, Target, Zap,
  CheckCircle, Clock, AlertTriangle, TrendingUp, Filter, Search, RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { marketingService } from '../../services/marketingService';

interface ChannelData {
  channel: string;
  enabled: boolean;
  reach: number;
  engagement: number;
  conversions: number;
  cost: number;
  roi: number;
  lastSync?: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'web' | 'social' | 'inapp';
  icon: React.ElementType;
  color: string;
  enabled: boolean;
  reach: number;
  engagement: number;
  conversions: number;
  cost: number;
  roi: number;
  lastSync?: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

interface OrchestratedCampaign {
  id: string;
  name: string;
  description?: string;
  channels: string[];
  status: 'Active' | 'Scheduled' | 'Paused' | 'Completed' | 'active' | 'scheduled' | 'draft' | 'completed';
  audience?: number;
  reach: number;
  engagement: number;
  conversions: number;
  startDate: string;
  endDate?: string;
  performance?: {
    reach: number;
    engagement: number;
    conversions: number;
    revenue: number;
  };
}

interface ChannelRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  confidence: number;
  channels: string[];
  channel?: string;
  reason?: string;
  expectedLift?: number;
}

const getChannelIcon = (type: string): React.ElementType => {
  switch (type) {
    case 'email': return Mail;
    case 'sms': return MessageSquare;
    case 'push': return Bell;
    case 'web': return Globe;
    case 'social': return Share2;
    case 'inapp': return Smartphone;
    default: return Radio;
  }
};

const getChannelColor = (type: string): string => {
  switch (type) {
    case 'email': return 'bg-blue-500';
    case 'sms': return 'bg-green-500';
    case 'push': return 'bg-purple-500';
    case 'web': return 'bg-orange-500';
    case 'social': return 'bg-pink-500';
    case 'inapp': return 'bg-indigo-500';
    default: return 'bg-gray-500';
  }
};

export const MultiChannelOrchestrator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'channels' | 'campaigns' | 'optimize'>('overview');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [campaigns, setCampaigns] = useState<OrchestratedCampaign[]>([]);
  const [recommendations, setRecommendations] = useState<ChannelRecommendation[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [channelData, campaignData, recData] = await Promise.all([
        marketingService.getChannelStats(),
        marketingService.getMultiChannelCampaigns(),
        marketingService.getChannelRecommendations(),
      ]);
      
      // Transform channel data to match interface
      const transformedChannels: Channel[] = channelData.map((ch: ChannelData, idx: number) => ({
        id: `channel-${idx}`,
        name: ch.channel.charAt(0).toUpperCase() + ch.channel.slice(1),
        type: ch.channel as Channel['type'],
        icon: getChannelIcon(ch.channel),
        color: getChannelColor(ch.channel),
        enabled: ch.enabled,
        reach: ch.reach,
        engagement: ch.engagement,
        conversions: ch.conversions,
        cost: ch.cost,
        roi: ch.roi,
        lastSync: ch.lastSync,
        stats: {
          sent: ch.reach,
          delivered: Math.round(ch.reach * 0.95),
          opened: ch.engagement,
          clicked: Math.round(ch.engagement * 0.35),
          converted: ch.conversions,
        },
      }));
      
      setChannels(transformedChannels);
      setCampaigns(campaignData);
      setRecommendations(recData);
    } catch (error) {
      console.error('Error fetching orchestrator data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const overallStats = {
    totalReach: channels.reduce((sum, ch) => sum + ch.stats.delivered, 0),
    avgEngagement: channels.length > 0 
      ? Math.round(channels.reduce((sum, ch) => sum + (ch.stats.opened / Math.max(ch.stats.delivered, 1)) * 100, 0) / channels.length * 10) / 10
      : 0,
    totalConversions: channels.reduce((sum, ch) => sum + ch.stats.converted, 0),
    totalRevenue: campaigns.reduce((sum, c) => sum + (c.performance?.revenue || c.conversions * 50 || 0), 0),
    activeChannels: channels.filter(c => c.enabled).length,
    activeCampaigns: campaigns.filter(c => c.status === 'active' || c.status === 'Active').length,
  };

  const toggleChannel = (channelId: string) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId ? { ...ch, enabled: !ch.enabled } : ch
    ));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: OrchestratedCampaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
      case 'completed': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-gray-500">Loading orchestrator...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-7 h-7 text-teal-500" />
            Multi-Channel Orchestrator
          </h1>
          <p className="text-gray-500 mt-1">Coordinate campaigns across all marketing channels</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="px-4 py-2 bg-teal-500 text-white rounded-lg flex items-center gap-2 hover:bg-teal-600">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Reach', value: formatNumber(overallStats.totalReach), icon: Users, color: 'text-blue-500' },
          { label: 'Avg Engagement', value: `${overallStats.avgEngagement}%`, icon: Target, color: 'text-green-500' },
          { label: 'Conversions', value: formatNumber(overallStats.totalConversions), icon: CheckCircle, color: 'text-purple-500' },
          { label: 'Revenue', value: `$${formatNumber(overallStats.totalRevenue)}`, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Active Channels', value: overallStats.activeChannels.toString(), icon: Radio, color: 'text-orange-500' },
          { label: 'Campaigns', value: overallStats.activeCampaigns.toString(), icon: Zap, color: 'text-pink-500' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
          >
            <stat.icon className={cn("w-5 h-5 mb-2", stat.color)} />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['overview', 'channels', 'campaigns', 'optimize'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveView(tab)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize",
              activeView === tab
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Performance */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-500" />
              Channel Performance
            </h2>
            <div className="space-y-4">
              {channels.filter(c => c.enabled).map((channel) => {
                const deliveryRate = channel.stats.sent > 0 ? (channel.stats.delivered / channel.stats.sent * 100) : 0;
                const openRate = channel.stats.delivered > 0 ? (channel.stats.opened / channel.stats.delivered * 100) : 0;
                const ctr = channel.stats.opened > 0 ? (channel.stats.clicked / channel.stats.opened * 100) : 0;
                
                return (
                  <div key={channel.id} className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", channel.color)}>
                      <channel.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">{channel.name}</span>
                        <span className="text-sm text-gray-500">{formatNumber(channel.stats.sent)} sent</span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Del: {deliveryRate.toFixed(1)}%</span>
                        <span>Open: {openRate.toFixed(1)}%</span>
                        <span>CTR: {ctr.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              AI Recommendations
            </h2>
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{rec.channel}</span>
                    <span className="text-green-600 font-semibold">+{rec.expectedLift}% lift</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rec.reason}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${rec.confidence}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{rec.confidence}% confidence</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Channels Management */}
      {activeView === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel, idx) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 transition-all",
                channel.enabled 
                  ? "border-gray-100 dark:border-gray-700" 
                  : "border-dashed border-gray-300 dark:border-gray-600 opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", channel.color)}>
                  <channel.icon className="w-6 h-6 text-white" />
                </div>
                <button
                  onClick={() => toggleChannel(channel.id)}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors",
                    channel.enabled ? "bg-teal-500" : "bg-gray-300 dark:bg-gray-600"
                  )}
                >
                  <div className={cn(
                    "absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform",
                    channel.enabled ? "translate-x-6" : "translate-x-0.5"
                  )} />
                </button>
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{channel.name}</h3>
              <p className="text-sm text-gray-500 mb-4 capitalize">{channel.type} channel</p>

              {channel.enabled && channel.stats.sent > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(channel.stats.sent)}</div>
                    <div className="text-xs text-gray-500">Sent</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{formatNumber(channel.stats.converted)}</div>
                    <div className="text-xs text-gray-500">Converted</div>
                  </div>
                </div>
              )}

              {!channel.enabled && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-400">Channel disabled</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Campaigns List */}
      {activeView === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.map((campaign, idx) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{campaign.name}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", getStatusColor(campaign.status))}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{campaign.description}</p>
                  
                  {/* Channel Pills */}
                  <div className="flex items-center gap-2">
                    {campaign.channels.map(chId => {
                      const ch = channels.find(c => c.id === chId);
                      if (!ch) return null;
                      return (
                        <div key={chId} className={cn("w-8 h-8 rounded-lg flex items-center justify-center", ch.color)} title={ch.name}>
                          <ch.icon className="w-4 h-4 text-white" />
                        </div>
                      );
                    })}
                    <span className="text-sm text-gray-500 ml-2">{campaign.channels.length} channels</span>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="text-right">
                  <div className="grid grid-cols-4 gap-6 text-sm">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{formatNumber(campaign.audience || campaign.reach || 0)}</div>
                      <div className="text-xs text-gray-500">Audience</div>
                    </div>
                    <div>
                      <div className="font-semibold text-blue-600">{formatNumber(campaign.performance?.reach || campaign.reach || 0)}</div>
                      <div className="text-xs text-gray-500">Reach</div>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-600">{campaign.performance?.engagement || campaign.engagement || 0}%</div>
                      <div className="text-xs text-gray-500">Engagement</div>
                    </div>
                    <div>
                      <div className="font-semibold text-green-600">${formatNumber(campaign.performance?.revenue || campaign.conversions * 50 || 0)}</div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(campaign.startDate).toLocaleDateString()}
                    {campaign.endDate && ` - ${new Date(campaign.endDate).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Optimization View */}
      {activeView === 'optimize' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Channel Optimization</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            AI-powered analysis to find the optimal channel mix for your campaigns. Get personalized recommendations based on your audience behavior.
          </p>
          <button className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
            Run Optimization Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiChannelOrchestrator;
