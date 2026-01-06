import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Target, TrendingUp, Users, Zap, Brain, BarChart3, Filter,
  ChevronDown, Star, AlertCircle, CheckCircle, Clock, ArrowUp, ArrowDown,
  Settings, RefreshCw, Download, Eye, Mail, Phone, Globe, Building
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { marketingService } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  score: number;
  previousScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'hot' | 'warm' | 'cold' | 'new';
  lastActivity: string;
  activityCount: number;
  source: string;
  signals: Signal[];
  demographics: DemographicScore;
  behavior: BehaviorScore;
  starred?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface Signal {
  type: 'positive' | 'negative' | 'neutral';
  action: string;
  points: number;
  timestamp: string;
}

interface DemographicScore {
  jobTitle: number;
  companySize: number;
  industry: number;
  location: number;
  total: number;
}

interface BehaviorScore {
  emailEngagement: number;
  websiteVisits: number;
  contentDownloads: number;
  formSubmissions: number;
  socialEngagement: number;
  total: number;
}

interface ScoringRule {
  id: string;
  name: string;
  category: 'demographic' | 'behavioral' | 'engagement' | 'negative';
  condition: string;
  points: number;
  active: boolean;
}

export const LeadScoringEngine: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'rules' | 'analytics'>('leads');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'activity' | 'name'>('score');
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [starredLeads, setStarredLeads] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsData, rulesData] = await Promise.all([
        marketingService.getLeads(),
        marketingService.getScoringRules(),
      ]);
      setLeads(leadsData as Lead[]);
      setScoringRules(rulesData as ScoringRule[]);
    } catch (error) {
      console.error('Error fetching lead data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecalculateAll = async () => {
    setLoading(true);
    try {
      // Recalculate all lead scores
      await marketingService.recalculateAllScores();
      await fetchData();
    } catch (error) {
      console.error('Error recalculating scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setLoading(true);
    try {
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = leads.map(l => ({
      Name: l.name,
      Email: l.email,
      Company: l.company,
      Title: l.title,
      Score: l.score,
      Grade: l.grade,
      Status: l.status,
      'Last Activity': l.lastActivity,
      Source: l.source,
      'Demographic Score': l.demographics.total,
      'Behavior Score': l.behavior.total,
    }));
    marketingExportService.exportROIToExcel(exportData);
  };

  const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
    try {
      await marketingService.updateScoringRule(ruleId, { active: !currentActive });
      setScoringRules(prev => prev.map(r => r.id === ruleId ? { ...r, active: !currentActive } : r));
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  const toggleExpanded = (leadId: string) => {
    setExpandedLeads(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  };

  const toggleStarred = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredLeads(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
    // Persist to service
    try {
      await marketingService.updateLead(leadId, { starred: !starredLeads.has(leadId) });
    } catch (error) {
      console.error('Error updating lead starred status:', error);
    }
  };

  const stats = {
    totalLeads: leads.length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((a, b) => a + b.score, 0) / leads.length) : 0,
    hotLeads: leads.filter(l => l.status === 'hot').length,
    coldLeads: leads.filter(l => l.status === 'cold').length,
    starredCount: starredLeads.size,
    topPerformers: leads.filter(l => l.grade === 'A' || l.grade === 'B').length,
  };

  const gradeColors: Record<string, string> = {
    A: 'bg-green-500',
    B: 'bg-blue-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-500',
    F: 'bg-red-500',
  };

  const statusColors: Record<string, string> = {
    hot: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    warm: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    new: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const filteredLeads = leads
    .filter(l => filterGrade === 'all' || l.grade === filterGrade)
    .filter(l => filterStatus === 'all' || l.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'activity') return b.activityCount - a.activityCount;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-500" />
            Lead Scoring Engine
          </h1>
          <p className="text-gray-500 mt-1">AI-powered lead qualification and prioritization</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={handleRecalculate}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Recalculate Scores
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Average Score', value: stats.avgScore, icon: Target, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
          { label: 'Hot Leads', value: stats.hotLeads, icon: Zap, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
          { label: 'Starred', value: stats.starredCount, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
          { label: 'Top Performers', value: stats.topPerformers, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'leads', label: 'Lead Scores', icon: Users },
          { id: 'rules', label: 'Scoring Rules', icon: Settings },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "px-4 py-3 flex items-center gap-2 border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'leads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All Grades</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All Status</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="score">Sort by Score</option>
                <option value="activity">Sort by Activity</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            {/* Lead Cards */}
            <div className="space-y-3">
              {filteredLeads.map((lead, idx) => {
                const isExpanded = expandedLeads.has(lead.id);
                const isStarred = starredLeads.has(lead.id);
                return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedLead(lead)}
                  className={cn(
                    "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 cursor-pointer hover:border-purple-300 transition-all",
                    selectedLead?.id === lead.id && "ring-2 ring-purple-500",
                    isStarred && "border-yellow-300 dark:border-yellow-600"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Star Button */}
                      <button
                        onClick={(e) => toggleStarred(lead.id, e)}
                        className={cn(
                          "p-1 rounded-lg transition-colors",
                          isStarred 
                            ? "text-yellow-500 hover:text-yellow-600" 
                            : "text-gray-300 hover:text-yellow-400"
                        )}
                        title={isStarred ? 'Remove from starred' : 'Add to starred'}
                      >
                        <Star className={cn("w-5 h-5", isStarred && "fill-current")} />
                      </button>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {lead.name}
                          {isStarred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                        </div>
                        <div className="text-sm text-gray-500">{lead.title} at {lead.company}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[lead.status])}>
                            {lead.status}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {lead.lastActivity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm", gradeColors[lead.grade])}>
                          {lead.grade}
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{lead.score}</div>
                          <div className="flex items-center text-xs">
                            {lead.score > lead.previousScore ? (
                              <span className="text-green-500 flex items-center">
                                <ArrowUp className="w-3 h-3" /> +{lead.score - lead.previousScore}
                              </span>
                            ) : lead.score < lead.previousScore ? (
                              <span className="text-red-500 flex items-center">
                                <ArrowDown className="w-3 h-3" /> {lead.score - lead.previousScore}
                              </span>
                            ) : (
                              <span className="text-gray-400">No change</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Expand Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(lead.id); }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <ChevronDown className={cn(
                          "w-5 h-5 text-gray-400 transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </button>
                    </div>
                  </div>

                  {/* Score Breakdown Bar */}
                  <div className="mt-4">
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <div
                        className="bg-blue-500 transition-all"
                        style={{ width: `${(lead.demographics.total / 100) * 100}%` }}
                        title={`Demographics: ${lead.demographics.total}`}
                      />
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${(lead.behavior.total / 100) * 100}%` }}
                        title={`Behavior: ${lead.behavior.total}`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Demographics: {lead.demographics.total}pts</span>
                      <span>Behavior: {lead.behavior.total}pts</span>
                    </div>
                  </div>

                  {/* Expanded Details Section */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {/* Recent Signals */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Recent Signals
                          </h4>
                          <div className="space-y-2">
                            {lead.signals.slice(0, 3).map((signal, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                {signal.type === 'positive' ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : signal.type === 'negative' ? (
                                  <AlertCircle className="w-3 h-3 text-red-500" />
                                ) : (
                                  <Clock className="w-3 h-3 text-gray-400" />
                                )}
                                <span className="text-gray-600 dark:text-gray-400 truncate">{signal.action}</span>
                                <span className={cn(
                                  "font-medium ml-auto",
                                  signal.points > 0 ? "text-green-600" : signal.points < 0 ? "text-red-600" : "text-gray-400"
                                )}>
                                  {signal.points > 0 ? '+' : ''}{signal.points}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Score Trends */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Score Trends
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Current</span>
                              <span className="font-bold text-gray-900 dark:text-white">{lead.score}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Previous</span>
                              <span className="text-gray-600 dark:text-gray-400">{lead.previousScore}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Change</span>
                              <span className={cn(
                                "flex items-center gap-1 font-medium",
                                lead.score > lead.previousScore ? "text-green-600" : 
                                lead.score < lead.previousScore ? "text-red-600" : "text-gray-400"
                              )}>
                                {lead.score > lead.previousScore ? (
                                  <><ArrowUp className="w-3 h-3" /> +{lead.score - lead.previousScore}</>  
                                ) : lead.score < lead.previousScore ? (
                                  <><ArrowDown className="w-3 h-3" /> {lead.score - lead.previousScore}</>
                                ) : 'No change'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
              })}
            </div>
          </div>

          {/* Lead Details */}
          <div className="lg:col-span-1">
            {selectedLead ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-6"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl mb-3">
                    {selectedLead.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedLead.name}</h3>
                  <p className="text-gray-500 text-sm">{selectedLead.title}</p>
                  <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
                    <Building className="w-4 h-4" /> {selectedLead.company}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" /> {selectedLead.email}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Score Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedLead.demographics).filter(([k]) => k !== 'total').map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-medium text-gray-900 dark:text-white">+{value}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent Signals</h4>
                    <div className="space-y-2">
                      {selectedLead.signals.map((signal, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          {signal.type === 'positive' ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : signal.type === 'negative' ? (
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <div className="text-gray-700 dark:text-gray-300">{signal.action}</div>
                            <div className="text-xs text-gray-500">{signal.timestamp} • {signal.points > 0 ? '+' : ''}{signal.points}pts</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                <Eye className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Select a lead to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Scoring Rules Configuration</h3>
            <p className="text-sm text-gray-500">Define how leads are scored based on attributes and behaviors</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {scoringRules.map((rule) => (
              <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    rule.active ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{rule.name}</div>
                    <div className="text-sm text-gray-500">{rule.condition}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium capitalize",
                    rule.category === 'demographic' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    rule.category === 'behavioral' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    rule.category === 'engagement' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {rule.category}
                  </span>
                  <span className={cn(
                    "font-bold",
                    rule.points > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {rule.points > 0 ? '+' : ''}{rule.points}
                  </span>
                  <button 
                    onClick={() => handleToggleRule(rule.id, rule.active)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title={rule.active ? 'Disable rule' : 'Enable rule'}
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Score Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Score Distribution</h3>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D', 'F'].map((grade) => {
                const count = leads.filter(l => l.grade === grade).length;
                const pct = (count / leads.length) * 100;
                return (
                  <div key={grade} className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm", gradeColors[grade])}>
                      {grade}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{count} leads</span>
                        <span className="font-medium text-gray-900 dark:text-white">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", gradeColors[grade])} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conversion by Source */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Lead Quality by Source</h3>
            <div className="space-y-3">
              {['LinkedIn', 'Organic Search', 'Webinar', 'Paid Ad', 'Referral'].map((source) => {
                const sourceLeads = leads.filter(l => l.source === source);
                const avgScore = sourceLeads.length ? Math.round(sourceLeads.reduce((a, b) => a + b.score, 0) / sourceLeads.length) : 0;
                return (
                  <div key={source} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{source}</div>
                      <div className="text-xs text-gray-500">{sourceLeads.length} leads</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{avgScore}</div>
                      <div className="text-xs text-gray-500">avg score</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LeadScoringEngine;
