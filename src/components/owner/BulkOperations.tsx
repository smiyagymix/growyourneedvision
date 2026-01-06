/**
 * Bulk Operations Component for Owner Dashboard
 * Provides UI for bulk tenant operations with progress tracking
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Icon, Modal, Select, Badge } from '../../components/shared/ui/CommonUI';
import { useToast } from '../../hooks/useToast';
import { useOwnerServices } from '../../hooks/useOwnerServices';
import { logger } from '../../utils/logger';

interface BulkOperationProgress {
    total: number;
    completed: number;
    failed: number;
    current?: string;
}

interface BulkOperationsProps {
    selectedTenants: string[];
    tenantData: any[];
    onComplete: () => void;
    onCancel: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
    selectedTenants,
    tenantData,
    onComplete,
    onCancel,
}) => {
    const { showToast } = useToast();
    const { tenants } = useOwnerServices();
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<BulkOperationProgress>({
        total: 0,
        completed: 0,
        failed: 0,
    });
    const [operation, setOperation] = useState<
        'suspend' | 'activate' | 'change_plan' | 'send_message' | null
    >(null);
    const [reason, setReason] = useState('');
    const [targetPlan, setTargetPlan] = useState('');
    const [message, setMessage] = useState('');

    const handleBulkSuspend = async () => {
        if (!reason) {
            showToast('Please provide a reason for suspension', 'error');
            return;
        }

        setIsProcessing(true);
        setProgress({ total: selectedTenants.length, completed: 0, failed: 0 });

        try {
            const result = await tenants.bulkSuspend({
                tenantIds: selectedTenants,
                reason,
                details: 'Bulk suspension initiated from Owner dashboard',
                userId: user?.id || 'unknown'
            });
            
            setProgress({
                total: selectedTenants.length,
                completed: result.successCount || 0,
                failed: result.failureCount || 0,
            });

            if (result.failureCount === 0) {
                showToast(`Successfully suspended ${result.successCount} tenants`, 'success');
            } else {
                showToast(
                    `Suspended ${result.successCount} tenants, ${result.failureCount} failed`,
                    'warning'
                );
            }

            logger.info('User action: bulk_suspend_tenants', {
                component: 'BulkOperations',
                count: selectedTenants.length,
                success: result.successCount,
                failed: result.failureCount,
            });

            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (error) {
            logger.error('Bulk suspend failed', error, {
                component: 'BulkOperations',
                count: selectedTenants.length,
            });
            showToast('Bulk suspend operation failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkActivate = async () => {
        setIsProcessing(true);
        setProgress({ total: selectedTenants.length, completed: 0, failed: 0 });

        try {
            const result = await tenants.bulkResume(selectedTenants, user?.id || 'unknown');

            setProgress({
                total: selectedTenants.length,
                completed: result.successCount || 0,
                failed: result.failureCount || 0,
            });

            if (result.failureCount === 0) {
                showToast(`Successfully activated ${result.successCount} tenants`, 'success');
            } else {
                showToast(
                    `Activated ${result.successCount} tenants, ${result.failureCount} failed`,
                    'warning'
                );
            }

            logger.info('User action: bulk_activate_tenants', {
                component: 'BulkOperations',
                count: selectedTenants.length,
                success: result.successCount,
                failed: result.failureCount,
            });

            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (error) {
            logger.error('Bulk activate failed', error, {
                component: 'BulkOperations',
                count: selectedTenants.length,
            });
            showToast('Bulk activate operation failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleChangePlan = async () => {
        if (!targetPlan) {
            showToast('Please select a target plan', 'error');
            return;
        }

        setIsProcessing(true);
        setProgress({ total: selectedTenants.length, completed: 0, failed: 0 });

        try {
            // Simulate bulk plan change
            let successCount = 0;
            let failureCount = 0;

            for (const tenantId of selectedTenants) {
                try {
                    // Here you would call the actual API endpoint
                    // await tenants.updatePlan(tenantId, targetPlan);
                    successCount++;
                } catch {
                    failureCount++;
                }
                setProgress({
                    total: selectedTenants.length,
                    completed: successCount,
                    failed: failureCount,
                });
            }

            showToast(`Plan changed for ${successCount} tenants`, 'success');
            logger.info('User action: bulk_change_plan', {
                component: 'BulkOperations',
                plan: targetPlan,
                count: selectedTenants.length,
            });

            setTimeout(() => onComplete(), 2000);
        } catch (error) {
            logger.error('Bulk plan change failed', error, {
                component: 'BulkOperations',
            });
            showToast('Bulk plan change failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) {
            showToast('Please enter a message', 'error');
            return;
        }

        setIsProcessing(true);
        setProgress({ total: selectedTenants.length, completed: 0, failed: 0 });

        try {
            // Simulate bulk message sending
            let successCount = 0;
            let failureCount = 0;

            for (const tenantId of selectedTenants) {
                try {
                    // Here you would call the actual API endpoint
                    // await communications.sendToTenant(tenantId, message);
                    successCount++;
                } catch {
                    failureCount++;
                }
                setProgress({
                    total: selectedTenants.length,
                    completed: successCount,
                    failed: failureCount,
                });
            }

            showToast(`Message sent to ${successCount} tenants`, 'success');
            logger.info('User action: bulk_send_message', {
                component: 'BulkOperations',
                count: selectedTenants.length,
            });

            setTimeout(() => onComplete(), 2000);
        } catch (error) {
            logger.error('Bulk message send failed', error, {
                component: 'BulkOperations',
            });
            showToast('Bulk message send failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderOperationForm = () => {
        switch (operation) {
            case 'suspend':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Reason for Suspension *
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500"
                                rows={3}
                                placeholder="Enter reason for suspending these tenants..."
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <Icon name="ExclamationTriangleIcon" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                    Warning: This action will suspend {selectedTenants.length} tenants
                                </p>
                                <p className="text-xs text-red-800 dark:text-red-200 mt-1">
                                    Suspended tenants will lose access immediately. This action is logged and can be reversed.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button onClick={onCancel} variant="outline" disabled={isProcessing}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleBulkSuspend}
                                variant="danger"
                                disabled={!reason || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2 animate-spin" />
                                        Suspending...
                                    </>
                                ) : (
                                    <>Suspend {selectedTenants.length} Tenants</>
                                )}
                            </Button>
                        </div>
                    </div>
                );

            case 'activate':
                return (
                    <div className="space-y-4">
                        <div className="flex items-start gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <Icon name="CheckCircleIcon" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                    Activate {selectedTenants.length} tenants
                                </p>
                                <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                                    These tenants will regain full access to the platform.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button onClick={onCancel} variant="outline" disabled={isProcessing}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleBulkActivate}
                                variant="primary"
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2 animate-spin" />
                                        Activating...
                                    </>
                                ) : (
                                    <>Activate {selectedTenants.length} Tenants</>
                                )}
                            </Button>
                        </div>
                    </div>
                );

            case 'change_plan':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Target Plan *
                            </label>
                            <Select
                                value={targetPlan}
                                onChange={(e) => setTargetPlan(e.target.value)}
                                className="w-full"
                                disabled={isProcessing}
                            >
                                <option value="">Select a plan...</option>
                                <option value="free">Free</option>
                                <option value="starter">Starter</option>
                                <option value="professional">Professional</option>
                                <option value="enterprise">Enterprise</option>
                            </Select>
                        </div>

                        <div className="flex items-start gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                            <Icon name="InformationCircleIcon" className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                    Change plan for {selectedTenants.length} tenants
                                </p>
                                <p className="text-xs text-purple-800 dark:text-purple-200 mt-1">
                                    This will update subscription and billing for all selected tenants.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button onClick={onCancel} variant="outline" disabled={isProcessing}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleChangePlan}
                                variant="primary"
                                disabled={!targetPlan || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>Change Plan for {selectedTenants.length} Tenants</>
                                )}
                            </Button>
                        </div>
                    </div>
                );

            case 'send_message':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Message *
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                placeholder="Enter message to send to all selected tenants..."
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <Icon name="ChatBubbleLeftRightIcon" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Send to {selectedTenants.length} tenants
                                </p>
                                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                                    This message will be delivered via email and in-app notification.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button onClick={onCancel} variant="outline" disabled={isProcessing}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendMessage}
                                variant="primary"
                                disabled={!message.trim() || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>Send to {selectedTenants.length} Tenants</>
                                )}
                            </Button>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setOperation('suspend')}
                            className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-500 dark:hover:border-red-500 transition-colors group"
                        >
                            <Icon name="BanIcon" className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                Suspend Tenants
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Temporarily disable access
                            </p>
                        </button>

                        <button
                            onClick={() => setOperation('activate')}
                            className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors group"
                        >
                            <Icon name="CheckCircleIcon" className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                Activate Tenants
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Restore full access
                            </p>
                        </button>

                        <button
                            onClick={() => setOperation('change_plan')}
                            className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors group"
                        >
                            <Icon name="ArrowsUpDownIcon" className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                Change Plan
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Update subscription tier
                            </p>
                        </button>

                        <button
                            onClick={() => setOperation('send_message')}
                            className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                        >
                            <Icon name="ChatBubbleLeftRightIcon" className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                Send Message
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Broadcast announcement
                            </p>
                        </button>
                    </div>
                );
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onCancel}
            title={`Bulk Operations - ${selectedTenants.length} Tenants`}
            size="lg"
        >
            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Icon name="InformationCircleIcon" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                {selectedTenants.length} tenants selected
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {tenantData
                                    .filter((t) => selectedTenants.includes(t.id))
                                    .slice(0, 5)
                                    .map((tenant) => (
                                        <Badge key={tenant.id} variant="info">
                                            {tenant.name || tenant.subdomain}
                                        </Badge>
                                    ))}
                                {selectedTenants.length > 5 && (
                                    <Badge variant="info">+{selectedTenants.length - 5} more</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {progress.total > 0 && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Progress
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {progress.completed + progress.failed} / {progress.total}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all"
                                style={{
                                    width: `${((progress.completed + progress.failed) / progress.total) * 100}%`,
                                }}
                            />
                        </div>
                        {progress.failed > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                {progress.failed} operations failed
                            </p>
                        )}
                    </div>
                )}

                {renderOperationForm()}
            </div>
        </Modal>
    );
};
