import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import {
  Clock, TrendingUp, Users, DollarSign, Calendar,
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Send, Plus, ArrowRight, Download
} from 'lucide-react';
import { cn } from '../../lib/utils';
import env from '../../config/environment';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const trialCancellationSchema = z.object({
    subscriptionId: z.string().min(1, 'Subscription ID required'),
    reason: z.string().min(3, 'Reason must be at least 3 characters').max(200, 'Reason too long')
});

interface Trial {
  subscriptionId: string;
  customerId: string;
  status: string;
  trialStart: Date;
  trialEnd: Date;
  daysRemaining: number;
  plan: string;
  amount: number;
  currency: string;
  hasPaymentMethod: boolean;
}

interface TrialMetrics {
  totalTrials: number;
  activeTrials: number;
  convertedTrials: number;
  canceledTrials: number;
  conversionRate: number;
  avgTrialDuration: number;
  revenue: number;
  period: {
    start: string;
    end: string;
  };
}

const TrialManagement: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'expiring' | 'metrics'>('active');
  const [activeTrials, setActiveTrials] = useState<Trial[]>([]);
  const [expiringTrials, setExpiringTrials] = useState<Trial[]>([]);
  const [metrics, setMetrics] = useState<TrialMetrics | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const apiKey = localStorage.getItem('api_key') || 'test-key';
      const headers = { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };

      // Fetch active trials
      const activeRes = await fetch(`${env.get('paymentServerUrl')}/api/trial/active`, { headers });
      const activeData = await activeRes.json();
      setActiveTrials(activeData.trials || []);

      // Fetch expiring trials
      const expiringRes = await fetch(`${env.get('paymentServerUrl')}/api/trial/expiring?daysThreshold=7`, { headers });
      const expiringData = await expiringRes.json();
      setExpiringTrials(expiringData.trials || []);

      // Fetch metrics
      const metricsRes = await fetch(`${env.get('paymentServerUrl')}/api/trial/metrics`, { headers });
      const metricsData = await metricsRes.json();
      setMetrics(metricsData.metrics);

    } catch (error) {
      console.error('Error fetching trial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExtendTrial = async (subscriptionId: string, days: number = 7) => {
    try {
      const apiKey = localStorage.getItem('api_key') || 'test-key';
      const res = await fetch(`${env.get('paymentServerUrl')}/api/trial/extend/${subscriptionId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ additionalDays: days })
      });

      if (res.ok) {
        alert(`Trial extended by ${days} days!`);
        fetchData();
      }
    } catch (error) {
      console.error('Error extending trial:', error);
      alert('Failed to extend trial');
    }
  };

  const handleConvertTrial = async (subscriptionId: string) => {
    try {
      const apiKey = localStorage.getItem('api_key') || 'test-key';
      const res = await fetch(`${env.get('paymentServerUrl')}/api/trial/convert/${subscriptionId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        alert('Trial converted to paid subscription!');
        fetchData();
      }
    } catch (error) {
      console.error('Error converting trial:', error);
      alert('Failed to convert trial');
    }
  };

  const handleCancelTrial = async (subscriptionId: string, reason: string = 'customer_request') => {
    if (!confirm('Are you sure you want to cancel this trial?')) return;

    // Sanitize and validate
    const sanitized = {
        subscriptionId,
        reason: sanitizeText(reason)
    };
    
    const result = trialCancellationSchema.safeParse(sanitized);
    if (!result.success) {
        showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
        return;
    }

    try {
      const apiKey = localStorage.getItem('api_key') || 'test-key';
      const res = await fetch(`${env.get('paymentServerUrl')}/api/trial/cancel/${subscriptionId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: result.data.reason })
      });

      if (res.ok) {
        alert('Trial cancelled');
        fetchData();
      }
    } catch (error) {
      console.error('Error cancelling trial:', error);
      alert('Failed to cancel trial');
    }
  };

  const handleSendReminders = async () => {
    try {
      const apiKey = localStorage.getItem('api_key') || 'test-key';
      const res = await fetch(`${env.get('paymentServerUrl')}/api/trial/send-reminders`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Sent ${data.remindersSent} trial reminder emails`);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading trial data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-500" />
              Trial Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor and optimize trial-to-paid conversions
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              name="send-trial-reminders"
              onClick={handleSendReminders}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Reminders
            </button>
            <button
              name="refresh-trial-data"
              onClick={fetchData}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Trials</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrics.activeTrials}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.totalTrials} total started
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrics.conversionRate}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.convertedTrials} converted
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrics.avgTrialDuration}d
              </div>
              <div className="text-xs text-gray-500 mt-1">
                until conversion
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Est. Revenue</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ${metrics.revenue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                from conversions
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            name="tab-active-trials"
            onClick={() => setActiveTab('active')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === 'active'
                ? "bg-purple-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            Active ({activeTrials.length})
          </button>
          <button
            name="tab-expiring-trials"
            onClick={() => setActiveTab('expiring')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === 'expiring'
                ? "bg-purple-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            Expiring ({expiringTrials.length})
          </button>
        </div>

        {/* Trials Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Days Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(activeTab === 'active' ? activeTrials : expiringTrials).map((trial, idx) => (
                  <tr key={trial.subscriptionId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {trial.customerId.substring(0, 20)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{trial.plan}</div>
                      <div className="text-xs text-gray-500">
                        ${trial.amount}/{trial.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        trial.daysRemaining <= 1
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : trial.daysRemaining <= 3
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      )}>
                        {trial.daysRemaining <= 1 && <AlertTriangle className="w-3 h-3" />}
                        {trial.daysRemaining} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(trial.trialEnd).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trial.hasPaymentMethod ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          name="extend-trial"
                          onClick={() => handleExtendTrial(trial.subscriptionId)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                          title="Extend 7 days"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          name="convert-trial"
                          onClick={() => handleConvertTrial(trial.subscriptionId)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400"
                          title="Convert to paid"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          name="cancel-trial"
                          onClick={() => handleCancelTrial(trial.subscriptionId)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400"
                          title="Cancel trial"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(activeTab === 'active' ? activeTrials : expiringTrials).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No {activeTab} trials found
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TrialManagement;
