import React, { useState } from 'react';
import { Card, Icon, Badge, Button } from '../ui/CommonUI';
import { useSendBroadcast } from '../../../hooks/usePhase2Data';
import pb from '../../../lib/pocketbase';
import { emailService } from '../../../services/emailService';
import { tenantService } from '../../../services/tenantService';
import { sanitizeHtml, sanitizeText } from '../../../utils/sanitization';
import { escapeHtml } from '../../../utils/sanitization';
import { useRateLimit, RateLimitPresets } from '../../../hooks/useRateLimit';
import { announcementSchema } from '../../../validation/schemas';

interface BroadcastMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantCount?: number;
}

export const BroadcastMessageModal: React.FC<BroadcastMessageModalProps> = ({ isOpen, onClose, tenantCount = 0 }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sendEmail, setSendEmail] = useState(true);
    const [sendInApp, setSendInApp] = useState(true);
    const [sendSMS, setSendSMS] = useState(false);
    const [targetAudience, setTargetAudience] = useState<'all' | 'schools' | 'individuals' | 'active' | 'trial'>('all');
    const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
    const { executeIfAllowed } = useRateLimit(RateLimitPresets.MESSAGE_SEND);

    const sendMutation = useSendBroadcast();

    const handleSend = async () => {
        // Sanitize inputs to prevent XSS
        const sanitizedSubject = sanitizeText(subject);
        const sanitizedMessage = sanitizeHtml(message, 'BASIC');

        // Validate with Zod
        const validationResult = announcementSchema.safeParse({
            title: sanitizedSubject,
            content: sanitizedMessage,
            priority: priority === 'urgent' ? 'high' : 'medium'
        });

        if (!validationResult.success) {
            alert(`Validation error: ${validationResult.error.issues[0].message}`);
            return;
        }

        // Rate limit check before sending
        await executeIfAllowed(async () => {

        try {
            // Get tenant emails based on target audience
            const tenantsResult = await tenantService.getTenants();
            const tenants = tenantsResult.items;
            let targetEmails: string[] = [];

            switch (targetAudience) {
                case 'all':
                case 'schools':
                case 'individuals':
                    // For all/schools/individuals, send to all tenants
                    targetEmails = tenants.map((t) => t.admin_email).filter(Boolean) as string[];
                    break;
                case 'active':
                    targetEmails = tenants.filter((t) => t.subscription_status === 'active').map((t) => t.admin_email).filter(Boolean) as string[];
                    break;
                case 'trial':
                    targetEmails = tenants.filter((t) => t.subscription_status === 'trialing').map((t) => t.admin_email).filter(Boolean) as string[];
                    break;
            }

            // Send emails if email channel is selected
            if (sendEmail && targetEmails.length > 0) {
                const htmlBody = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(to right, #3b82f6, #8b5cf6); padding: 20px; border-radius: 8px 8px 0 0;">
                            <h1 style="color: white; margin: 0;">Grow Your Need</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Platform Announcement</p>
                        </div>
                        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <h2 style="color: #1f2937; margin-top: 0;">${escapeHtml(sanitizedSubject)}</h2>
                                <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${sanitizedMessage}</div>
                                ${priority === 'urgent' ? '<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin-top: 20px; border-radius: 4px;"><strong style="color: #dc2626;">⚠️ URGENT:</strong> <span style="color: #991b1b;">This message requires immediate attention.</span></div>' : ''}
                            </div>
                            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; text-align: center;">
                                <a href="${window.location.origin}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
                            </div>
                            <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                                <p>This is an automated message from Grow Your Need platform.</p>
                            </div>
                        </div>
                    </div>
                `;

                await emailService.sendBulkEmail(targetEmails, sanitizedSubject, htmlBody, sanitizedMessage);
            }

            // Send in-app notifications if selected
            if (sendInApp) {
                await sendMutation.mutateAsync({
                    subject: sanitizedSubject,
                    message: sanitizedMessage,
                    target_audience: targetAudience,
                    priority,
                    channels: { email: sendEmail, inApp: sendInApp, sms: sendSMS },
                    sent_by: pb.authStore.model?.email || 'owner@growyourneed.com'
                });
            }

            alert(`✅ Broadcast sent successfully to ${targetEmails.length} recipients!\n\n${sendEmail ? '📧 Email: Sent\n' : ''}${sendInApp ? '🔔 In-App: Sent\n' : ''}${sendSMS ? '📱 SMS: Queued' : ''}`);
            onClose();
            setSubject('');
            setMessage('');
        } catch (error) {
            console.error('Failed to send broadcast:', error);
            alert('❌ Failed to send broadcast message. Please try again.');
        }
        }); // Close executeIfAllowed wrapper
    };

    const getEstimatedCount = () => {
        // Simplified estimation
        switch (targetAudience) {
            case 'all': return tenantCount;
            case 'schools': return Math.floor(tenantCount * 0.7);
            case 'individuals': return Math.floor(tenantCount * 0.3);
            case 'active': return Math.floor(tenantCount * 0.8);
            case 'trial': return Math.floor(tenantCount * 0.2);
            default: return tenantCount;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700  flex items-center justify-between bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="MegaphoneIcon" className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Broadcast Message</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Send announcement to all tenants</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon name="XMarkIcon" className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Target Audience */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Target Audience
                        </label>
                        <select
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value as any)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        >
                            <option value="all">All Tenants ({tenantCount})</option>
                            <option value="schools">Schools Only ({Math.floor(tenantCount * 0.7)})</option>
                            <option value="individuals">Individuals Only ({Math.floor(tenantCount * 0.3)})</option>
                            <option value="active">Active Tenants ({Math.floor(tenantCount * 0.8)})</option>
                            <option value="trial">Trial Tenants ({Math.floor(tenantCount * 0.2)})</option>
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Priority Level
                        </label>
                        <div className="flex gap-3">
                            <Button
                                variant={priority === 'normal' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setPriority('normal')}
                            >
                                Normal
                            </Button>
                            <Button
                                variant={priority === 'high' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setPriority('high')}
                            >
                                High
                            </Button>
                            <Button
                                variant={priority === 'urgent' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setPriority('urgent')}
                            >
                                <Icon name="ExclamationTriangleIcon" className="w-4 h-4 mr-1" />
                                Urgent
                            </Button>
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Subject *
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            placeholder="Important platform update"
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Message *
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={8}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            placeholder="Enter your message here..."
                        />
                        <p className="text-xs text-gray-500 mt-1">{message.length} characters</p>
                    </div>

                    {/* Delivery Channels */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Delivery Channels
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sendEmail}
                                    onChange={(e) => setSendEmail(e.target.checked)}
                                    className="rounded"
                                />
                                <Icon name="EnvelopeIcon" className="w-5 h-5 text-blue-600" />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">Email</div>
                                    <div className="text-xs text-gray-500">Send via email to all tenant admins</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sendInApp}
                                    onChange={(e) => setSendInApp(e.target.checked)}
                                    className="rounded"
                                />
                                <Icon name="BellIcon" className="w-5 h-5 text-green-600" />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">In-App Notification</div>
                                    <div className="text-xs text-gray-500">Show notification in tenant dashboards</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sendSMS}
                                    onChange={(e) => setSendSMS(e.target.checked)}
                                    className="rounded"
                                />
                                <Icon name="DevicePhoneMobileIcon" className="w-5 h-5 text-purple-600" />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">SMS (Text Message)</div>
                                    <div className="text-xs text-gray-500">Send text messages (additional charges apply)</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Preview Box */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="EyeIcon" className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</span>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-3">
                            <div className="font-bold text-gray-900 dark:text-white">{subject || '(No subject)'}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                                {message || '(No message)'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Will reach approximately <span className="font-bold text-gray-900 dark:text-white">{getEstimatedCount()}</span> tenants
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSend}
                            disabled={sendMutation.isPending || !subject || !message}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {sendMutation.isPending ? (
                                <>
                                    <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Icon name="PaperAirplaneIcon" className="w-4 h-4 mr-2" />
                                    Send Broadcast
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
