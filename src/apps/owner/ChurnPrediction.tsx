import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import {
  AlertTriangle,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Activity,
  RefreshCw,
  Download,
  Filter,
  ChevronRight
} from 'lucide-react';
import env from '../../config/environment';

interface ChurnAnalysis {
  customerId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: Array<{
    factor: string;
    score: number;
    weight: number;
  }>;
  recommendations: Array<{
    action: string;
    priority: string;
    description: string;
  }>;
  ltv: number;
  accountAge: number;
  activeSubscriptions: number;
  lastActivity: string;
}

interface ChurnReport {
  totalCustomers: number;
  atRiskCount: number;
  avgRiskScore: number;
  estimatedRevenueLoss: number;
  breakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topRisks: ChurnAnalysis[];
}

const ChurnPrediction: React.FC = () => {
  const [report, setReport] = useState<ChurnReport | null>(null);
  const [atRiskCustomers, setAtRiskCustomers] = useState<ChurnAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<ChurnAnalysis | null>(null);
  const [minRiskScore, setMinRiskScore] = useState(50);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const paymentServerUrl = env.get('paymentServerUrl');
  const serviceApiKey = env.get('serviceApiKey');

  const fetchChurnReport = async () => {
    if (!serviceApiKey) {
      console.warn('Service API key not configured');
      return;
    }
    try {
      const response = await fetch(`${paymentServerUrl}/api/churn/report`, {
        headers: { 'x-api-key': serviceApiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Error fetching churn report:', error);
    }
  };

  const fetchAtRiskCustomers = async () => {
    if (!serviceApiKey) {
      console.warn('Service API key not configured');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const serviceApiKey = env.get('serviceApiKey');
      const response = await fetch(
        `${paymentServerUrl}/api/churn/at-risk?minRiskScore=${minRiskScore}&limit=50`,
        { headers: { 'x-api-key': serviceApiKey } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAtRiskCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching at-risk customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeRetention = async (customerId: string) => {
    try {
      const serviceApiKey = env.get('serviceApiKey');
      const response = await fetch(
        `${paymentServerUrl}/api/churn/retention/${customerId}`,
        {
          method: 'POST',
          headers: { 'x-api-key': serviceApiKey }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        alert(`Retention actions executed: ${data.actions.length} actions`);
        fetchAtRiskCustomers();
      }
    } catch (error) {
      console.error('Error executing retention:', error);
    }
  };

  useEffect(() => {
    fetchChurnReport();
    fetchAtRiskCustomers();
  }, [minRiskScore]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchChurnReport();
        fetchAtRiskCustomers();
      }, 60000); // Refresh every minute
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-300';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      default: return 'text-green-600 bg-green-100 border-green-300';
    }
  };

  const getRiskIcon = (level: string) => {
    if (level === 'critical' || level === 'high') return <AlertTriangle className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TrendingDown className="w-10 h-10 text-red-500" />
            AI Churn Prediction
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Identify and prevent customer churn with AI-powered insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            name="auto-refresh-toggle"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>
          
          <button
            name="refresh-churn-data"
            onClick={() => {
              fetchChurnReport();
              fetchAtRiskCustomers();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Customers</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {report.totalCustomers}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">At Risk</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {report.atRiskCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((report.atRiskCount / report.totalCustomers) * 100).toFixed(1)}% of total
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Risk Score</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {report.avgRiskScore.toFixed(1)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Revenue at Risk</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ${report.estimatedRevenueLoss.toFixed(0)}
            </div>
          </motion.div>
        </div>
      )}

      {/* Risk Level Breakdown */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Risk Level Distribution
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(report.breakdown).map(([level, count]) => (
              <div key={level} className="text-center">
                <div className={`text-2xl font-bold capitalize ${
                  level === 'critical' ? 'text-red-600' :
                  level === 'high' ? 'text-orange-600' :
                  level === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {level} Risk
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Minimum Risk Score:
          </label>
          <input
            name="min-risk-score-filter"
            type="range"
            min="0"
            max="100"
            value={minRiskScore}
            onChange={(e) => setMinRiskScore(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-semibold text-gray-900 dark:text-white w-12">
            {minRiskScore}
          </span>
        </div>
      </div>

      {/* At-Risk Customers List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            At-Risk Customers ({atRiskCustomers.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading customer data...</p>
          </div>
        ) : atRiskCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No customers found with risk score ≥ {minRiskScore}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    LTV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Account Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {atRiskCustomers.map((customer, idx) => (
                  <motion.tr
                    key={customer.customerId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {customer.customerId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.activeSubscriptions} active subscription(s)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(customer.riskLevel)}`}>
                        {getRiskIcon(customer.riskLevel)}
                        {customer.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {customer.riskScore}
                        </div>
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              customer.riskScore >= 70 ? 'bg-red-500' :
                              customer.riskScore >= 50 ? 'bg-orange-500' :
                              customer.riskScore >= 30 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${customer.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      ${customer.ltv.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {customer.accountAge} days
                    </td>
                    <td className="px-6 py-4">
                      <button
                        name="execute-retention"
                        onClick={(e) => {
                          e.stopPropagation();
                          executeRetention(customer.customerId);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        <Target className="w-3 h-3" />
                        Execute Retention
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCustomer(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Customer Risk Analysis
              </h3>
              <button
                name="close-detail-modal"
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Risk Overview */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Risk Overview
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Customer ID:</span>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedCustomer.customerId}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Risk Level:</span>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(selectedCustomer.riskLevel)}`}>
                        {getRiskIcon(selectedCustomer.riskLevel)}
                        {selectedCustomer.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score:</span>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedCustomer.riskScore} / 100
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Lifetime Value:</span>
                    <div className="text-lg font-medium text-green-600">
                      ${selectedCustomer.ltv.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contributing Factors */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Contributing Factors
                </h4>
                <div className="space-y-2">
                  {selectedCustomer.contributingFactors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {factor.factor}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {factor.score} points
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${(factor.score / factor.weight) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Recommended Actions
                </h4>
                <div className="space-y-3">
                  {selectedCustomer.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <ChevronRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {rec.action}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {rec.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {rec.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                name="execute-all-retention-actions"
                onClick={() => {
                  executeRetention(selectedCustomer.customerId);
                  setSelectedCustomer(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Target className="w-5 h-5" />
                Execute All Retention Actions
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ChurnPrediction;
