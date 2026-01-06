import { useState, useEffect } from 'react';
import { marketingService, LeadScore, ScoreFactor } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';
import { useLeadScoresRealtime } from '../../hooks/useMarketingRealtime';
import { Card, Button, Icon, Badge, Modal } from '../shared/ui/CommonUI';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
type Trend = 'up' | 'down' | 'stable';

export const PredictiveScoring: React.FC = () => {
    const [leadScores, setLeadScores] = useState<LeadScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedLead, setSelectedLead] = useState<LeadScore | null>(null);
    const [recalculatingIds, setRecalculatingIds] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const perPage = 10;

    // Real-time subscription
    const { subscribe, unsubscribe, isSubscribed } = useLeadScoresRealtime({
        autoFetch: false,
        onCreate: (record) => setLeadScores(prev => [record, ...prev]),
        onUpdate: (record) => {
            setLeadScores(prev => prev.map(l => l.profile_id === record.profile_id ? record : l));
            if (selectedLead?.profile_id === record.profile_id) setSelectedLead(record);
        },
        onDelete: (record) => setLeadScores(prev => prev.filter(l => l.profile_id !== record.profile_id)),
    });

    useEffect(() => {
        loadLeadScores();
        subscribe();
        return () => unsubscribe();
    }, [page]);

    const handleExport = (format: 'csv' | 'excel') => {
        if (format === 'csv') {
            marketingExportService.exportLeadScoresToCSV(leadScores);
        } else {
            marketingExportService.exportLeadScoresToExcel(leadScores);
        }
        setShowExportMenu(false);
    };

    const loadLeadScores = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await marketingService.getLeadScores(page, perPage);
            setLeadScores(data.items);
            setTotalItems(data.totalItems);
        } catch (err) {
            setError('Failed to load lead scores');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculateScore = async (profileId: string) => {
        setRecalculatingIds(prev => new Set(prev).add(profileId));
        try {
            const result = await marketingService.recalculateScore(profileId);
            // Update the local state with the new score
            setLeadScores(prev => prev.map(lead => 
                lead.profile_id === profileId 
                    ? { ...lead, score: result.score, last_updated: new Date().toISOString() }
                    : lead
            ));
        } catch (err) {
            setError('Failed to recalculate score');
            console.error(err);
        } finally {
            setRecalculatingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(profileId);
                return newSet;
            });
        }
    };

    const getGradeBadge = (grade: Grade) => {
        const config: Record<Grade, { bg: string; text: string }> = {
            'A': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
            'B': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
            'C': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
            'D': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
            'F': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
        };
        const { bg, text } = config[grade];
        return (
            <span className={`px-3 py-1 rounded-full text-lg font-black ${bg} ${text}`}>
                {grade}
            </span>
        );
    };

    const getTrendIndicator = (trend: Trend) => {
        const config: Record<Trend, { icon: string; color: string; label: string }> = {
            'up': { icon: 'ArrowTrendingUpIcon', color: 'text-green-500', label: 'Trending up' },
            'down': { icon: 'ArrowTrendingDownIcon', color: 'text-red-500', label: 'Trending down' },
            'stable': { icon: 'MinusIcon', color: 'text-gray-400', label: 'Stable' },
        };
        const { icon, color, label } = config[trend];
        return (
            <div className={`flex items-center gap-1 ${color}`} title={label}>
                <Icon name={icon} className="w-4 h-4" />
            </div>
        );
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-blue-600 dark:text-blue-400';
        if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Calculate grade distribution
    const gradeDistribution = leadScores.reduce((acc, lead) => {
        acc[lead.grade] = (acc[lead.grade] || 0) + 1;
        return acc;
    }, {} as Record<Grade, number>);

    const grades: Grade[] = ['A', 'B', 'C', 'D', 'F'];
    const maxGradeCount = Math.max(...grades.map(g => gradeDistribution[g] || 0), 1);

    // Calculate average score
    const avgScore = leadScores.length > 0 
        ? Math.round(leadScores.reduce((sum, lead) => sum + lead.score, 0) / leadScores.length)
        : 0;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (loading && page === 1) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8">
                    <div className="h-8 w-64 bg-gray-700 rounded animate-pulse mb-2" />
                    <div className="h-4 w-96 bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 p-6">
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            ))}
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-3 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <h2 className="text-base font-black mb-1 flex items-center gap-2">
                        <Icon name="ChartBarIcon" className="w-4 h-4 text-yellow-400" />
                        Predictive Lead Scoring
                    </h2>
                    <p className="text-gray-300 text-[9px] max-w-xl">
                        AI-powered lead scoring analyzes engagement, demographics, and behavior to predict conversion probability.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-black text-yellow-400">{avgScore}</div>
                    <div className="text-[8px] text-gray-400 uppercase font-bold">Avg. Score</div>
                    <div className="text-[7px] text-gray-500 mt-0.5">{totalItems.toLocaleString()} leads scored</div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
                    <Icon name="ExclamationCircleIcon" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-400">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                        <Icon name="XMarkIcon" className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* Lead Scores List */}
                <Card className="lg:col-span-2 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white">Lead Scores</h3>
                        <Button variant="secondary" size="sm" icon="ArrowPathIcon" onClick={loadLeadScores}>
                            Refresh
                        </Button>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {leadScores.map((lead) => (
                            <div 
                                key={lead.id} 
                                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                onClick={() => setSelectedLead(lead)}
                            >
                                <div className="flex items-center gap-2">
                                    {/* Score Circle */}
                                    <div className="relative w-10 h-10 flex-shrink-0">
                                        <svg className="w-10 h-10 transform -rotate-90">
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="16"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                fill="none"
                                                className="text-gray-200 dark:text-gray-700"
                                            />
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="16"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                fill="none"
                                                strokeDasharray={`${(lead.score / 100) * 100} 100`}
                                                className={getScoreColor(lead.score)}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className={`text-lg font-black ${getScoreColor(lead.score)}`}>
                                                {lead.score}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Lead Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 dark:text-white truncate">
                                                {lead.profile_name}
                                            </span>
                                            {getTrendIndicator(lead.trend)}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{lead.profile_email}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Updated {formatDate(lead.last_updated)}
                                        </p>
                                    </div>

                                    {/* Grade */}
                                    <div className="flex-shrink-0">
                                        {getGradeBadge(lead.grade)}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex-shrink-0">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            icon="ArrowPathIcon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRecalculateScore(lead.profile_id);
                                            }}
                                            disabled={recalculatingIds.has(lead.profile_id)}
                                            className={recalculatingIds.has(lead.profile_id) ? 'animate-spin' : ''}
                                        >
                                            {recalculatingIds.has(lead.profile_id) ? '' : 'Recalc'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalItems > perPage && (
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                                Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, totalItems)} of {totalItems.toLocaleString()}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={page * perPage >= totalItems}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    {leadScores.length === 0 && !loading && (
                        <div className="p-12 text-center">
                            <Icon name="ChartBarIcon" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No scored leads</h3>
                            <p className="text-gray-500">Lead scores will appear here once calculated.</p>
                        </div>
                    )}
                </Card>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Grade Distribution */}
                    <Card className="p-6">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Grade Distribution</h3>
                        <div className="space-y-3">
                            {grades.map((grade) => {
                                const count = gradeDistribution[grade] || 0;
                                const percentage = leadScores.length > 0 
                                    ? Math.round((count / leadScores.length) * 100) 
                                    : 0;
                                return (
                                    <div key={grade} className="flex items-center gap-3">
                                        {getGradeBadge(grade)}
                                        <div className="flex-1">
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${
                                                        grade === 'A' ? 'bg-green-500' :
                                                        grade === 'B' ? 'bg-blue-500' :
                                                        grade === 'C' ? 'bg-yellow-500' :
                                                        grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${(count / maxGradeCount) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                                            {count} ({percentage}%)
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Top Scoring Factors */}
                    <Card className="p-6">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Top Scoring Factors</h3>
                        <div className="space-y-4">
                            {[
                                { name: 'Company Size', impact: '+30 pts', color: 'text-green-600', icon: 'BuildingOfficeIcon' },
                                { name: 'Engagement Level', impact: '+25 pts', color: 'text-green-600', icon: 'ChartBarIcon' },
                                { name: 'Budget Authority', impact: '+20 pts', color: 'text-green-600', icon: 'CurrencyDollarIcon' },
                                { name: 'Decision Timeline', impact: '+15 pts', color: 'text-green-600', icon: 'ClockIcon' },
                                { name: 'Inactivity (30d+)', impact: '-20 pts', color: 'text-red-500', icon: 'ExclamationTriangleIcon' },
                            ].map((factor, i) => (
                                <div key={i} className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <Icon name={factor.icon} className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <span className="flex-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        {factor.name}
                                    </span>
                                    <span className={`text-sm font-bold ${factor.color}`}>{factor.impact}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="p-6">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="text-2xl font-black text-green-600 dark:text-green-400">
                                    {leadScores.filter(l => l.grade === 'A' || l.grade === 'B').length}
                                </div>
                                <div className="text-xs text-green-700 dark:text-green-500 font-medium">Hot Leads</div>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                                    {leadScores.filter(l => l.trend === 'up').length}
                                </div>
                                <div className="text-xs text-yellow-700 dark:text-yellow-500 font-medium">Trending Up</div>
                            </div>
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="text-2xl font-black text-red-600 dark:text-red-400">
                                    {leadScores.filter(l => l.grade === 'D' || l.grade === 'F').length}
                                </div>
                                <div className="text-xs text-red-700 dark:text-red-500 font-medium">Needs Attention</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                    {leadScores.filter(l => l.trend === 'stable').length}
                                </div>
                                <div className="text-xs text-blue-700 dark:text-blue-500 font-medium">Stable</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Lead Detail Modal */}
            <Modal
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                title={`Lead Score Details: ${selectedLead?.profile_name || ''}`}
            >
                {selectedLead && (
                    <div className="space-y-6">
                        {/* Score Overview */}
                        <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="relative w-24 h-24">
                                <svg className="w-24 h-24 transform -rotate-90">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="42"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="none"
                                        className="text-gray-200 dark:text-gray-700"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="42"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="none"
                                        strokeDasharray={`${(selectedLead.score / 100) * 264} 264`}
                                        className={getScoreColor(selectedLead.score)}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-2xl font-black ${getScoreColor(selectedLead.score)}`}>
                                        {selectedLead.score}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {getGradeBadge(selectedLead.grade)}
                                    {getTrendIndicator(selectedLead.trend)}
                                </div>
                                <p className="text-sm text-gray-500">{selectedLead.profile_email}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Last updated: {formatDate(selectedLead.last_updated)}
                                </p>
                            </div>
                        </div>

                        {/* Score Factors Breakdown */}
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white mb-3">Score Factors</h4>
                            <div className="space-y-3">
                                {selectedLead.factors.map((factor: ScoreFactor, i: number) => (
                                    <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {factor.name}
                                            </span>
                                            <span className="text-sm font-bold text-green-600">
                                                +{factor.contribution.toFixed(1)} pts
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${getScoreBarColor(factor.value)}`}
                                                    style={{ width: `${factor.value}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 w-8">{factor.value}%</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Weight: {factor.weight}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button 
                                variant="secondary" 
                                onClick={() => setSelectedLead(null)}
                            >
                                Close
                            </Button>
                            <Button 
                                variant="primary" 
                                icon="ArrowPathIcon"
                                onClick={() => {
                                    handleRecalculateScore(selectedLead.profile_id);
                                    setSelectedLead(null);
                                }}
                            >
                                Recalculate Score
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
