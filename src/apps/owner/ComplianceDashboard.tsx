/**
 * Compliance Dashboard
 * 
 * GDPR, SOC2, and HIPAA compliance management
 * Handles data exports, deletions, and compliance reporting
 */

import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { 
    Shield, 
    Download, 
    Trash2, 
    FileText, 
    AlertCircle,
    CheckCircle,
    Clock,
    Search,
    RefreshCw
} from 'lucide-react';
import { useOwnerCompliance } from '../../hooks/useOwnerServices';

export const ComplianceDashboard: React.FC = () => {
    const { exportUserData, deleteUserData, generateComplianceReport, getRetentionStatus, loading, error } = useOwnerCompliance();
    
    const [selectedStandard, setSelectedStandard] = useState('GDPR');
    const [retentionStatus, setRetentionStatus] = useState<any>(null);
    const [searchUserId, setSearchUserId] = useState('');
    const [actionStatus, setActionStatus] = useState<{type: string, message: string} | null>(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadRetentionStatus();
    }, []);

    const loadRetentionStatus = async () => {
        try {
            const status = await getRetentionStatus();
            setRetentionStatus(status);
        } catch (err) {
            console.error('Failed to load retention status:', err);
        }
    };

    const handleExportUser = async () => {
        if (!searchUserId.trim()) {
            setActionStatus({ type: 'error', message: 'Please enter a user ID' });
            return;
        }

        try {
            await exportUserData(searchUserId);
            setActionStatus({ type: 'success', message: 'User data exported successfully!' });
            setSearchUserId('');
        } catch (err) {
            setActionStatus({ type: 'error', message: 'Failed to export user data' });
        }
    };

    const handleDeleteUser = async () => {
        if (!searchUserId.trim()) {
            setActionStatus({ type: 'error', message: 'Please enter a user ID' });
            return;
        }

        if (!confirm(`Are you sure you want to permanently delete all data for user ${searchUserId}? This action cannot be undone.`)) {
            return;
        }

        try {
            const result = await deleteUserData(searchUserId, 'gdpr_request');
            setActionStatus({ 
                type: 'success', 
                message: `Successfully deleted ${result.recordsDeleted} records across ${result.collections} collections`
            });
            setSearchUserId('');
        } catch (err) {
            setActionStatus({ type: 'error', message: 'Failed to delete user data' });
        }
    };

    const handleGenerateReport = async () => {
        setGenerating(true);
        try {
            const report = await generateComplianceReport(selectedStandard);
            
            // Download report as JSON
            const blob = new Blob([JSON.stringify(report.report, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedStandard}-compliance-report-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setActionStatus({ type: 'success', message: `${selectedStandard} report generated and downloaded` });
        } catch (err) {
            setActionStatus({ type: 'error', message: 'Failed to generate compliance report' });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-8 h-8 text-blue-600" />
                    Compliance Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    GDPR, SOC2, and HIPAA compliance management
                </p>
            </div>

            {/* Status Message */}
            {actionStatus && (
                <div className={`rounded-lg p-4 ${
                    actionStatus.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {actionStatus.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                        <p className={actionStatus.type === 'success' ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}>
                            {actionStatus.message}
                        </p>
                        <button 
                            onClick={() => setActionStatus(null)}
                            className="ml-auto text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* GDPR User Data Requests */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    GDPR User Data Requests
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            User ID
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={searchUserId}
                                onChange={(e) => setSearchUserId(e.target.value)}
                                placeholder="Enter user ID"
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                            onClick={handleExportUser}
                            disabled={loading || !searchUserId.trim()}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-5 h-5" />
                            Export User Data (GDPR)
                        </button>

                        <button
                            onClick={handleDeleteUser}
                            disabled={loading || !searchUserId.trim()}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-5 h-5" />
                            Delete User Data (Right to be Forgotten)
                        </button>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-400">
                            <strong>Note:</strong> User data exports include profile, messages, content, and activity logs. 
                            Deletion will anonymize the user record while preserving audit trails for compliance.
                        </p>
                    </div>
                </div>
            </div>

            {/* Compliance Reports */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Generate Compliance Reports
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Compliance Standard
                        </label>
                        <select
                            value={selectedStandard}
                            onChange={(e) => setSelectedStandard(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="GDPR">GDPR (General Data Protection Regulation)</option>
                            <option value="SOC2">SOC 2 (Service Organization Control)</option>
                            <option value="HIPAA">HIPAA (Health Insurance Portability)</option>
                            <option value="CCPA">CCPA (California Consumer Privacy Act)</option>
                            <option value="PCI-DSS">PCI-DSS (Payment Card Industry)</option>
                        </select>
                    </div>

                    <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Generating Report...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                Generate {selectedStandard} Report
                            </>
                        )}
                    </button>

                    {/* Standard Info */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        {selectedStandard === 'GDPR' && (
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">GDPR Report Includes:</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    <li>Data protection status and measures</li>
                                    <li>User rights handling (export/deletion requests)</li>
                                    <li>Data breach log and notifications</li>
                                    <li>Data processors list with DPA status</li>
                                    <li>Data Protection Officer contact</li>
                                </ul>
                            </div>
                        )}
                        {selectedStandard === 'SOC2' && (
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">SOC 2 Report Includes:</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    <li>Security controls (MFA, RBAC, encryption)</li>
                                    <li>Availability metrics (uptime, RTO, RPO)</li>
                                    <li>Confidentiality status (data classification)</li>
                                    <li>Processing integrity (validation, logging)</li>
                                    <li>Privacy controls (consent management)</li>
                                </ul>
                            </div>
                        )}
                        {selectedStandard === 'HIPAA' && (
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">HIPAA Report Includes:</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    <li>Administrative safeguards</li>
                                    <li>Physical safeguards</li>
                                    <li>Technical safeguards</li>
                                    <li>Risk assessment documentation</li>
                                    <li>Staff training records</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Data Retention Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Data Retention Status
                    </h2>
                    <button
                        onClick={loadRetentionStatus}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {retentionStatus ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Overall Status</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {retentionStatus.overallCompliance ? (
                                        <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-8 h-8 mx-auto text-red-600" />
                                    )}
                                </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                                <p className="text-sm text-green-600 dark:text-green-400 mb-1">Compliant</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {retentionStatus.status?.filter((s: any) => s.compliant).length || 0}
                                </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                                <p className="text-sm text-red-600 dark:text-red-400 mb-1">Needs Cleanup</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {retentionStatus.status?.filter((s: any) => !s.compliant).length || 0}
                                </p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Last Check</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {new Date(retentionStatus.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Collection</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Retention Policy</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Expired Records</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Action Required</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {retentionStatus.status?.map((item: any) => (
                                        <tr key={item.collection} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                {item.collection}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {item.retentionDays} days
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {item.expiredRecords || 0}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.compliant ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Compliant
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Non-compliant
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {item.actionRequired === 'cleanup_needed' ? (
                                                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                                                        Run Cleanup
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-500">None</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Loading retention status...</p>
                    </div>
                )}
            </div>

            {/* Timestamp */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleString()}
            </div>
        </div>
    );
};

export default ComplianceDashboard;
