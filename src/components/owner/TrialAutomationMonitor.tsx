import React, { useState, useEffect } from 'react';
import { Bell, Clock, Send, CheckCircle, XCircle, Play, RefreshCw } from 'lucide-react';
import env from '../../config/environment';

interface TrialMetrics {
  activeTrials: number;
  emailsSentLast7Days: number;
  schedulerStatus: {
    isRunning: boolean;
    jobCount: number;
    jobs: Array<{
      name: string;
      status: 'scheduled' | 'running' | 'completed' | 'failed';
      schedule: string;
      lastRun: string | null;
      nextRun: string | null;
      lastError?: string;
    }>;
  };
  timestamp: string;
}

interface WorkflowResult {
  success: boolean;
  workflow: string;
  result: any;
  timestamp: string;
}

/**
 * Trial Automation Monitor
 * Displays trial automation status and allows manual triggering
 * For Owner dashboard
 */
export const TrialAutomationMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<TrialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<WorkflowResult | null>(null);

  const fetchMetrics = async () => {
    try {
      const serverUrl = env.get('serverUrl') || 'http://localhost:3001';
      const response = await fetch(`${serverUrl}/api/trials/automation/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const runWorkflow = async (workflow: 'reminders' | 'expirations' | 'full') => {
    setRunning(workflow);
    setLastResult(null);

    try {
      const serverUrl = env.get('serverUrl') || 'http://localhost:3001';
      const response = await fetch(`${serverUrl}/api/trials/automation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });

      if (!response.ok) throw new Error('Failed to run workflow');
      const result = await response.json();
      setLastResult(result);

      // Refresh metrics after workflow completes
      await fetchMetrics();
    } catch (error) {
      console.error('Error running workflow:', error);
      setLastResult({
        success: false,
        workflow,
        result: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setRunning(null);
    }
  };

  const triggerSchedulerJob = async (jobName: string) => {
    try {
      const serverUrl = env.get('serverUrl') || 'http://localhost:3001';
      const response = await fetch(`${serverUrl}/api/scheduler/trigger/${jobName}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to trigger job');
      await fetchMetrics();
    } catch (error) {
      console.error('Error triggering job:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-300">Failed to load trial automation metrics</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'running':
        return 'text-blue-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-400" />
            Trial Automation
          </h2>
          <p className="text-gray-400 mt-1">Automated trial conversion and reminder system</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm font-medium">Active Trials</p>
              <p className="text-3xl font-bold text-white mt-2">{metrics.activeTrials}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm font-medium">Emails (7 Days)</p>
              <p className="text-3xl font-bold text-white mt-2">{metrics.emailsSentLast7Days}</p>
            </div>
            <Send className="w-12 h-12 text-purple-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm font-medium">Scheduler Status</p>
              <p className="text-xl font-bold text-white mt-2">
                {metrics.schedulerStatus.isRunning ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Running
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Stopped
                  </span>
                )}
              </p>
            </div>
            <RefreshCw className={`w-12 h-12 text-green-400 opacity-50 ${metrics.schedulerStatus.isRunning ? 'animate-spin' : ''}`} />
          </div>
        </div>
      </div>

      {/* Manual Triggers */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Manual Triggers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => runWorkflow('reminders')}
            disabled={running !== null}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {running === 'reminders' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Reminders
              </>
            )}
          </button>

          <button
            onClick={() => runWorkflow('expirations')}
            disabled={running !== null}
            className="px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {running === 'expirations' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Process Expirations
              </>
            )}
          </button>

          <button
            onClick={() => runWorkflow('full')}
            disabled={running !== null}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {running === 'full' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Full Workflow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Last Result */}
      {lastResult && (
        <div
          className={`border rounded-lg p-6 ${
            lastResult.success
              ? 'bg-green-900/20 border-green-500'
              : 'bg-red-900/20 border-red-500'
          }`}
        >
          <div className="flex items-start gap-3">
            {lastResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold ${lastResult.success ? 'text-green-300' : 'text-red-300'}`}>
                {lastResult.success ? 'Workflow Completed Successfully' : 'Workflow Failed'}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                Workflow: <span className="font-mono">{lastResult.workflow}</span>
              </p>
              <pre className="mt-3 p-3 bg-gray-900/50 rounded text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(lastResult.result, null, 2)}
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(lastResult.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Jobs */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Scheduled Jobs ({metrics.schedulerStatus.jobCount})</h3>
        <div className="space-y-3">
          {metrics.schedulerStatus.jobs.map((job) => (
            <div
              key={job.name}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-900/70 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`${getStatusColor(job.status)}`}>{getStatusIcon(job.status)}</span>
                    <h4 className="font-semibold text-white">{job.name}</h4>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{job.schedule}</p>
                  {job.lastRun && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last run: {new Date(job.lastRun).toLocaleString()}
                    </p>
                  )}
                  {job.nextRun && (
                    <p className="text-xs text-gray-500">
                      Next run: {new Date(job.nextRun).toLocaleString()}
                    </p>
                  )}
                  {job.lastError && (
                    <p className="text-xs text-red-400 mt-1">Error: {job.lastError}</p>
                  )}
                </div>
                <button
                  onClick={() => triggerSchedulerJob(job.name)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                  title="Trigger now"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
