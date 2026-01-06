import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import pb from '../../lib/pocketbase';
import { communicationService, Message } from '../../services/communicationService';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useRateLimit, RateLimitPresets } from '../../hooks/useRateLimit';
import { messageSchema } from '../../validation/schemas';
import { parentService } from '../../services/parentService';
import { academicsService } from '../../services/academicsService';
import { AIContentGeneratorModal } from '../../components/shared/modals/AIContentGeneratorModal';
import { Icon } from '../../components/shared/ui/CommonUI';
import { useToast } from '../../hooks/useToast';
interface Props {
    activeTab: string;
    activeSubNav: string;
}

const ParentCommunication: React.FC<Props> = ({ activeTab, activeSubNav }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    // Compose state
    const [toEmail, setToEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const { executeIfAllowed } = useRateLimit(RateLimitPresets.MESSAGE_SEND);
    const { showToast } = useToast();

    useEffect(() => {
        if (activeSubNav === 'Message' || activeSubNav === 'Inquiries') {
            loadMessages();
        }
        loadTeachers();
    }, [activeSubNav]);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const user = pb.authStore.model;
            if (user) {
                // For now, we just show inbox for 'Message'/'Inquiries'
                // We could add a 'Sent' tab in the UI or handle it differently
                const type = 'inbox';
                const res = await communicationService.getMessages(user.id, type);
                setMessages(res.items);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTeachers = async () => {
        // In a real app, we'd fetch teachers linked to the children's classes
        // For now, we'll just leave it empty or fetch all users with role 'teacher' if possible
        // But we don't have a direct way to get "my children's teachers" easily without more complex queries
        // So we'll just rely on email input for now, or maybe fetch a list of staff
    };


    const handleSend = async () => {
        await executeIfAllowed(async () => {
            try {
                const user = pb.authStore.model;
                if (!user) return;

                let recipientId = '';
                try {
                    const recipient = await communicationService.findUserByEmail(toEmail);
                    recipientId = recipient?.id || '';
                } catch (e) {
                    showToast('Recipient not found', 'error');
                    return;
                }

                // Sanitize message content to prevent XSS
                const sanitizedSubject = sanitizeText(subject);
                const sanitizedContent = sanitizeHtml(content, 'BASIC');

                // Validate with Zod
                const messageData = {
                    tenantId: user.tenantId || '',
                    senderId: user.id,
                    recipientId: recipientId,
                    subject: sanitizedSubject,
                    body: sanitizedContent,
                    sentAt: new Date().toISOString()
                };

                const validationResult = messageSchema.safeParse(messageData);
                if (!validationResult.success) {
                    showToast(`Message validation failed: ${validationResult.error.issues[0].message}`, 'error');
                    return;
                }

                await communicationService.sendMessage({
                    sender: user.id,
                    recipient: recipientId,
                    content: `Subject: ${sanitizedSubject}\n\n${sanitizedContent}`,
                    read_at: undefined
                });

                setIsComposeOpen(false);
                setToEmail('');
                setSubject('');
                setContent('');
                loadMessages();
                showToast('Message sent!', 'success');
            } catch (error) {
                console.error('Error sending message:', error);
                showToast('Failed to send message.', 'error');
            }
        });
    };

    const getSubject = (content: string) => {
        const match = content.match(/^Subject: (.*?)(\n|$)/);
        return match ? match[1] : '(No Subject)';
    };

    const getBody = (content: string) => {
        return content.replace(/^Subject: .*?(\n|$)/, '').trim();
    };

    const handleAIResult = (generatedText: string) => {
        // Try to parse subject if AI provided it
        const subjectMatch = generatedText.match(/Subject: (.*?)(\n|$)/);
        if (subjectMatch) {
            setSubject(subjectMatch[1]);
            setContent(generatedText.replace(/Subject: .*?(\n|$)/, '').trim());
        } else {
            setContent(generatedText);
        }
        setIsAIModalOpen(false);
    };

    if (activeSubNav === 'Meetings' || activeSubNav === 'Support') {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-glass-edge p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{activeSubNav} Feature</h3>
                <p className="text-gray-500 text-center max-w-md">This feature is currently under development. Please check back later.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex gap-6 animate-fadeIn">
            {/* Message List */}
            <div className={`flex-1 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-glass-edge flex flex-col overflow-hidden ${selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/50">
                    <h2 className="font-bold text-gray-800 text-lg">{activeSubNav || 'Inbox'}</h2>
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                        Compose
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : messages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No messages found.</div>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => setSelectedMessage(msg)}
                                className={`p-4 border-b border-gray-100 hover:bg-white/80 cursor-pointer transition-colors ${!msg.read_at && activeSubNav !== 'Sent' ? 'bg-blue-50/50' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-800">
                                        {activeSubNav === 'Sent' ? `To: ${msg.expand?.recipient?.name || msg.expand?.recipient?.email}` : (msg.expand?.sender?.name || msg.expand?.sender?.email)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(msg.created).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="font-medium text-gray-700 text-sm mb-1">{getSubject(msg.content)}</div>
                                <div className="text-xs text-gray-500 line-clamp-1">{getBody(msg.content)}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Message Detail */}
            {selectedMessage && (
                <div className="absolute inset-0 lg:static lg:flex-1 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-glass-edge flex flex-col z-20">
                    <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/50">
                        <button onClick={() => setSelectedMessage(null)} className="lg:hidden text-gray-500">Back</button>
                        <div className="flex gap-2">
                            <button className="text-gray-500 hover:text-red-500">Delete</button>
                        </div>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{getSubject(selectedMessage.content)}</h2>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                {(selectedMessage.expand?.sender?.name || '?')[0]}
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">{selectedMessage.expand?.sender?.name || selectedMessage.expand?.sender?.email}</div>
                                <div className="text-xs text-gray-500">{new Date(selectedMessage.created).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                            {getBody(selectedMessage.content)}
                        </div>
                    </div>
                </div>
            )}

            {/* Compose Modal */}
            {isComposeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">New Message</h3>
                            <button onClick={() => setIsComposeOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">To (Email)</label>
                                <input
                                    type="email"
                                    value={toEmail}
                                    onChange={e => setToEmail(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    placeholder="teacher@school.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    placeholder="Regarding..."
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-gray-500">Message</label>
                                    <button
                                        onClick={() => setIsAIModalOpen(true)}
                                        className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold"
                                    >
                                        <Icon name="Sparkles" className="w-3 h-3" /> Draft with AI
                                    </button>
                                </div>
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all h-32 resize-none"
                                    placeholder="Write your message here..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setIsComposeOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSend}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    Send Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={handleAIResult}
                title="Draft Message"
                promptTemplate="Draft a professional email to a teacher from a parent. Include a subject line starting with 'Subject: '."
                placeholder="E.g., Ask about my child's recent math grade, or request a meeting."
            />
        </div>
    );
};

export default ParentCommunication;
