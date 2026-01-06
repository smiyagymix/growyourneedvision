import React, { useState } from 'react';
import { AlertTriangle, Check, X, Loader2, Users, Lock, Unlock, Archive, Bell, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
    bulkSuspendTenants, 
    bulkActivateTenants, 
    bulkUpdateTenantPlan,
    bulkArchiveTenants,
    bulkNotifyTenants,
    getBulkTenantHealth,
    type BulkOperationResult 
} from '../../services/ownerTenantService';

interface BulkTenantOperationsProps {
    selectedTenants: Array<{ id: string; name: string; status: string }>;
    onOperationComplete: () => void;
    onClose: () => void;
}

export const BulkTenantOperations: React.FC<BulkTenantOperationsProps> = ({
    selectedTenants,
    onOperationComplete,
    onClose
}) => {
    const { user } = useAuth();
    const [activeOperation, setActiveOperation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<BulkOperationResult | null>(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [archiveReason, setArchiveReason] = useState('');
    const [newPlan, setNewPlan] = useState('');
    const [notificationData, setNotificationData] = useState({
        title: '',
        message: '',
        type: 'info' as 'info' | 'warning' | 'success' | 'error'
    });
    const [healthScores, setHealthScores] = useState<Record<string, number>>({});
    const [loadingHealth, setLoadingHealth] = useState(false);

    const tenantIds = selectedTenants.map(t => t.id);

    // Load tenant health scores on mount
    React.useEffect(() => {
        const loadHealthScores = async () => {
            setLoadingHealth(true);
            try {
                const scores = await getBulkTenantHealth(tenantIds);
                setHealthScores(scores);
            } catch (error) {
                console.error('Failed to load tenant health scores:', error);
            } finally {
                setLoadingHealth(false);
            }
        };
        loadHealthScores();
    }, [tenantIds.join(',')]);  // eslint-disable-line react-hooks/exhaustive-deps

    const handleOperation = async (operation: string) => {
        if (!user) return;
        
        setLoading(true);
        setResult(null);
        
        try {
            let opResult: BulkOperationResult;
            
            switch (operation) {
                case 'suspend':
                    if (!suspendReason.trim()) {
                        alert('Please provide a suspension reason');
                        setLoading(false);
                        return;
                    }
                    opResult = await bulkSuspendTenants(tenantIds, suspendReason, user.id);
                    break;
                    
                case 'activate':
                    opResult = await bulkActivateTenants(tenantIds, user.id);
                    break;
                    
                case 'updatePlan':
                    if (!newPlan) {
                        alert('Please select a plan');
                        setLoading(false);
                        return;
                    }
                    opResult = await bulkUpdateTenantPlan(tenantIds, newPlan, user.id);
                    break;
                    
                case 'archive':
                    if (!archiveReason.trim()) {
                        alert('Please provide an archive reason');
                        setLoading(false);
                        return;
                    }
                    if (!confirm(`Archive ${tenantIds.length} tenants? This action marks them as cancelled.`)) {
                        setLoading(false);
                        return;
                    }
                    opResult = await bulkArchiveTenants(tenantIds, archiveReason, user.id);
                    break;
                    
                case 'notify':
                    if (!notificationData.title.trim() || !notificationData.message.trim()) {
                        alert('Please provide notification title and message');
                        setLoading(false);
                        return;
                    }
                    opResult = await bulkNotifyTenants(tenantIds, notificationData, user.id);
                    break;
                    
                default:
                    throw new Error('Invalid operation');
            }
            
            setResult(opResult);
            
            if (opResult.success) {
                setTimeout(() => {
                    onOperationComplete();
                }, 2000);
            }
        } catch (error) {
            console.error('Bulk operation failed:', error);
            alert('Operation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const renderOperationForm = () => {
        switch (activeOperation) {
            case 'suspend':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Suspension Reason</label>
                            <textarea
                                value={suspendReason}
                                onChange={(e) => setSuspendReason(e.target.value)}
                                placeholder="e.g., Payment overdue, Terms violation..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                rows={3}
                            />
                        </div>
                        <button
                            onClick={() => handleOperation('suspend')}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            Suspend {tenantIds.length} Tenant{tenantIds.length !== 1 ? 's' : ''}
                        </button>
                    </div>
                );

            case 'activate':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Activate {tenantIds.length} tenant{tenantIds.length !== 1 ? 's' : ''} and restore access.
                        </p>
                        <button
                            onClick={() => handleOperation('activate')}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                            Activate {tenantIds.length} Tenant{tenantIds.length !== 1 ? 's' : ''}
                        </button>
                    </div>
                );

            case 'updatePlan':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">New Plan</label>
                            <select
                                value={newPlan}
                                onChange={(e) => setNewPlan(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="">Select plan...</option>
                                <option value="free">Free</option>
                                <option value="basic">Basic</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <button
                            onClick={() => handleOperation('updatePlan')}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                            Update Plan for {tenantIds.length} Tenant{tenantIds.length !== 1 ? 's' : ''}
                        </button>
                    </div>
                );

            case 'archive':
                return (
                    <div className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-red-800 dark:text-red-300">
                                    <p className="font-semibold mb-1">Warning: This action cannot be easily undone</p>
                                    <p>Tenants will be marked as cancelled and archived. Data will be preserved but access will be revoked.</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Archive Reason</label>
                            <textarea
                                value={archiveReason}
                                onChange={(e) => setArchiveReason(e.target.value)}
                                placeholder="e.g., Business closure, Contract termination..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600"
                                rows={3}
                            />
                        </div>
                        <button
                            onClick={() => handleOperation('archive')}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                            Archive {tenantIds.length} Tenant{tenantIds.length !== 1 ? 's' : ''}
                        </button>
                    </div>
                );

            case 'notify':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Notification Type</label>
                            <select
                                value={notificationData.type}
                                onChange={(e) => setNotificationData({ ...notificationData, type: e.target.value as any })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="success">Success</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Title</label>
                            <input
                                type="text"
                                value={notificationData.title}
                                onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                                placeholder="e.g., Platform Maintenance Notice"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Message</label>
                            <textarea
                                value={notificationData.message}
                                onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                                placeholder="Enter notification message..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                rows={4}
                            />
                        </div>
                        <button
                            onClick={() => handleOperation('notify')}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                            Send to {tenantIds.length} Tenant{tenantIds.length !== 1 ? 's' : ''}
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            Bulk Tenant Operations
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {tenantIds.length} tenant{tenantIds.length !== 1 ? 's' : ''} selected
                        </p>
                        {!loadingHealth && Object.keys(healthScores).length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Avg Health Score:</span>
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    {Math.round(Object.values(healthScores).reduce((a, b) => a + b, 0) / Object.values(healthScores).length)}%
                                </span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {!activeOperation && !result && (
                        <div className="space-y-3">
                            <div className="mb-4">
                                <h3 className="font-semibold">Select Operation:</h3>
                                {!loadingHealth && Object.keys(healthScores).length > 0 && (
                                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Tenant Health Status:</p>
                                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                            {selectedTenants.map(tenant => (
                                                <div key={tenant.id} className="text-xs flex items-center justify-between">
                                                    <span className="truncate text-gray-700 dark:text-gray-300">{tenant.name}</span>
                                                    <span className={`font-semibold ml-2 ${
                                                        (healthScores[tenant.id] || 0) >= 80 ? 'text-green-600' :
                                                        (healthScores[tenant.id] || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                        {healthScores[tenant.id] || 0}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <button
                                onClick={() => setActiveOperation('suspend')}
                                className="w-full p-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-left transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-orange-600" />
                                    <div>
                                        <div className="font-semibold">Suspend Tenants</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Temporarily disable access</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveOperation('activate')}
                                className="w-full p-4 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-left transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Unlock className="w-5 h-5 text-green-600" />
                                    <div>
                                        <div className="font-semibold">Activate Tenants</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Restore access</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveOperation('updatePlan')}
                                className="w-full p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <div className="font-semibold">Update Plan</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Change subscription tier</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveOperation('notify')}
                                className="w-full p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-left transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-purple-600" />
                                    <div>
                                        <div className="font-semibold">Send Notification</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Broadcast message to admins</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveOperation('archive')}
                                className="w-full p-4 border-2 border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Archive className="w-5 h-5 text-red-600" />
                                    <div>
                                        <div className="font-semibold">Archive Tenants</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Mark as cancelled (caution)</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {activeOperation && !result && (
                        <div>
                            <button
                                onClick={() => setActiveOperation(null)}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
                            >
                                ← Back to operations
                            </button>
                            {renderOperationForm()}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {result.success ? (
                                        <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                    )}
                                    <div className="font-semibold">
                                        {result.success ? 'Operation Completed' : 'Partial Success'}
                                    </div>
                                </div>
                                <div className="text-sm">
                                    Success: {result.successCount} | Failed: {result.failureCount}
                                </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {result.results.map((r, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border ${r.success ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{r.tenantName}</span>
                                            {r.success ? (
                                                <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <X className="w-4 h-4 text-red-600" />
                                            )}
                                        </div>
                                        {r.error && (
                                            <div className="text-sm text-red-600 dark:text-red-400 mt-1">{r.error}</div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
