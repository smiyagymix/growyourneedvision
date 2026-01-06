import React from 'react';
import { TrendingDown, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { useChurnPrediction } from '../../hooks/useChurnPrediction';
import { useNavigate } from 'react-router-dom';

export const ChurnPredictionWidget: React.FC = () => {
    const { data, isLoading, error } = useChurnPrediction();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <p className="text-red-600 dark:text-red-400">Failed to load churn predictions</p>
            </div>
        );
    }

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'critical': return 'text-red-600 dark:text-red-400';
            case 'high': return 'text-orange-600 dark:text-orange-400';
            case 'medium': return 'text-yellow-600 dark:text-yellow-400';
            default: return 'text-green-600 dark:text-green-400';
        }
    };

    const getRiskBgColor = (risk: string) => {
        switch (risk) {
            case 'critical': return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'high': return 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
            case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
            default: return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Churn Risk Analysis</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">AI-Powered Predictions</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/owner/churn-analysis')}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                        View Details <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">{data.criticalCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Critical</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{data.highCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">High Risk</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{data.mediumCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Medium</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{data.averageRisk}%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Risk</div>
                </div>
            </div>

            {/* At-Risk Tenants */}
            <div className="p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    High Priority Interventions
                </h4>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                    {data.atRiskTenants.slice(0, 5).map(tenant => (
                        <div
                            key={tenant.tenantId}
                            className={`p-4 rounded-lg border ${getRiskBgColor(tenant.churnRisk)} cursor-pointer hover:shadow-md transition-shadow`}
                            onClick={() => navigate(`/owner/tenants/${tenant.tenantId}`)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h5 className="font-semibold">{tenant.tenantName}</h5>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-sm font-bold ${getRiskColor(tenant.churnRisk)}`}>
                                            {tenant.churnRisk.toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {tenant.churnProbability}% probability
                                        </span>
                                    </div>
                                </div>
                                <div className={`text-2xl font-bold ${getRiskColor(tenant.churnRisk)}`}>
                                    {tenant.churnProbability}%
                                </div>
                            </div>

                            {/* Top Factors */}
                            <div className="space-y-1 mb-3">
                                {tenant.factors.slice(0, 2).map((factor, idx) => (
                                    <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <span className={factor.impact === 'negative' ? 'text-red-600' : 'text-green-600'}>
                                            {factor.impact === 'negative' ? '▼' : '▲'}
                                        </span>
                                        <span className="font-medium">{factor.factor}:</span>
                                        <span>{factor.description}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Top Recommendation */}
                            {tenant.recommendations.length > 0 && (
                                <div className="text-xs bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                                    <span className="font-semibold">Action:</span> {tenant.recommendations[0]}
                                </div>
                            )}
                        </div>
                    ))}

                    {data.atRiskTenants.length === 0 && (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-400">No high-risk tenants detected</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">All tenants are healthy! 🎉</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
