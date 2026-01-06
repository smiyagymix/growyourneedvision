import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Badge, Modal } from '../../components/shared/ui/CommonUI';
import { Spinner } from '../../components/shared/ui/Spinner';
import { communicationService, Message } from '../../services/communicationService';
import pb from '../../lib/pocketbase';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useRateLimit, RateLimitPresets } from '../../hooks/useRateLimit';
import { messageSchema, announcementSchema } from '../../validation/schemas';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const TeacherCommunication: React.FC<Props> = ({ activeTab, activeSubNav }) => {
    const [conversations, setConversations] = useState<any[]>([]); // Grouped messages
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [parents, setParents] = useState<any[]>([]); // List of parents to start chat with
    
    const { executeIfAllowed } = useRateLimit(RateLimitPresets.MESSAGE_SEND);
    
    // Announcement State
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', recipients: 'All Classes' });

    useEffect(() => {
        if (activeSubNav === 'Announcements') {
            loadAnnouncements();
        } else {
            loadConversations();
            loadParents();
        }
    }, [activeSubNav]);

    useEffect(() => {
        if (selectedConversation && activeSubNav !== 'Announcements') {
            loadMessages(selectedConversation);
        }
    }, [selectedConversation]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const userId = pb.authStore.model?.id;
            if (userId) {
                const data = await communicationService.getMessages(userId, 'inbox');
                // Group by sender/recipient to form conversations
                // This is a simplified client-side grouping. In production, a 'conversations' collection is better.
                const grouped = new Map();
                data.items.forEach(msg => {
                    const otherId = msg.sender === userId ? msg.recipient : msg.sender;
                    const otherUser = msg.sender === userId ? msg.expand?.recipient : msg.expand?.sender;
                    
                    if (!grouped.has(otherId)) {
                        grouped.set(otherId, {
                            id: otherId,
                            user: otherUser,
                            lastMessage: msg,
                            unreadCount: (!msg.read_at && msg.recipient === userId) ? 1 : 0
                        });
                    } else {
                        // Update if newer
                        const existing = grouped.get(otherId);
                        if (new Date(msg.created) > new Date(existing.lastMessage.created)) {
                            existing.lastMessage = msg;
                        }
                        if (!msg.read_at && msg.recipient === userId) {
                            existing.unreadCount++;
                        }
                    }
                });
                setConversations(Array.from(grouped.values()));
            }
        } catch (error) {
            console.error("Failed to load conversations", error);
        } finally {
            setLoading(false);
        }
    };

    const loadParents = async () => {
        // Logic: Get Teacher Classes -> Get Enrollments -> Get Students -> Get Parents
        // Simplified: Just fetch users with role 'Parent' for now as we don't have the full graph query easily
        // In a real app, we would filter strictly by enrolled students' parents.
        try {
            const parentsList = await pb.collection('users').getList(1, 50, {
                filter: 'role = "Parent"'
            });
            setParents(parentsList.items);
        } catch (error) {
            console.error("Failed to load parents", error);
        }
    };

    const loadMessages = async (otherUserId: string) => {
        try {
            const userId = pb.authStore.model?.id;
            if (!userId) return;

            // Fetch messages between current user and other user
            // We need to fetch both sent and received and merge/sort
            const received = await pb.collection('messages').getFullList<Message>({
                filter: `recipient = "${userId}" && sender = "${otherUserId}"`,
                sort: 'created'
            });
            const sent = await pb.collection('messages').getFullList<Message>({
                filter: `sender = "${userId}" && recipient = "${otherUserId}"`,
                sort: 'created'
            });

            const all = [...received, ...sent].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
            setMessages(all);

            // Mark received as read
            received.forEach(msg => {
                if (!msg.read_at) communicationService.markMessageRead(msg.id);
            });
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        await executeIfAllowed(async () => {
            try {
                const userId = pb.authStore.model?.id;
                if (userId) {
                    // Sanitize message content to prevent XSS
                    const sanitizedContent = sanitizeHtml(newMessage, 'BASIC');

                    // Validate with Zod
                    const messageData = {
                        tenantId: pb.authStore.model?.tenantId || '',
                        senderId: userId,
                        recipientId: selectedConversation,
                        body: sanitizedContent,
                        sentAt: new Date().toISOString()
                    };

                    const validationResult = messageSchema.safeParse(messageData);
                    if (!validationResult.success) {
                        console.error('Message validation failed:', validationResult.error);
                        return;
                    }

                    await communicationService.sendMessage({
                        sender: userId,
                        recipient: selectedConversation,
                        content: sanitizedContent,
                        created: new Date().toISOString()
                    });
                    setNewMessage('');
                    loadMessages(selectedConversation); // Refresh
                }
            } catch (error) {
                console.error("Failed to send message", error);
            }
        });
    };

    const loadAnnouncements = async () => {
        // Placeholder for announcements
        setAnnouncements([
            { id: '1', title: 'Science Fair Next Week', content: 'Please remind students to bring their projects.', date: new Date().toISOString(), recipients: 'All Classes' },
            { id: '2', title: 'Exam Schedule', content: 'Midterm exams start on Monday.', date: new Date(Date.now() - 86400000).toISOString(), recipients: 'Grade 10' }
        ]);
        setLoading(false);
    };

    const { showToast } = useToast();

    const handleCreateAnnouncement = () => {
        // Sanitize
        const sanitized = {
            title: sanitizeText(newAnnouncement.title || ''),
            content: sanitizeHtml(newAnnouncement.content || '', 'BASIC'),
            recipients: newAnnouncement.recipients || 'All Classes'
        };

        // Validate
        const announcementSchema = z.object({
            title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
            content: z.string().min(10, 'Content must be at least 10 characters').max(5000, 'Content too long'),
            recipients: z.string().min(1, 'Recipients required')
        });

        const result = announcementSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        // Placeholder
        setAnnouncements([
            { id: Date.now().toString(), ...result.data, date: new Date().toISOString() },
            ...announcements
        ]);
        setIsAnnouncementModalOpen(false);
        setNewAnnouncement({ title: '', content: '', recipients: 'All Classes' });
        showToast('Announcement created successfully', 'success');
    };

    const renderAnnouncements = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white">Posted Announcements</h3>
                <Button variant="primary" icon="PlusIcon" onClick={() => setIsAnnouncementModalOpen(true)}>New Announcement</Button>
            </div>
            <div className="grid gap-4">
                {announcements.map(ann => (
                    <Card key={ann.id} variant="default" className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg text-gray-800 dark:text-white">{ann.title}</h4>
                            <Badge variant="neutral">{ann.recipients}</Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{ann.content}</p>
                        <div className="text-xs text-gray-400">
                            Posted on {new Date(ann.date).toLocaleDateString()}
                        </div>
                    </Card>
                ))}
            </div>

            <Modal
                isOpen={isAnnouncementModalOpen}
                onClose={() => setIsAnnouncementModalOpen(false)}
                title="Create Announcement"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsAnnouncementModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateAnnouncement}>Post</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                            value={newAnnouncement.title}
                            onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Recipients</label>
                        <select 
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                            value={newAnnouncement.recipients}
                            onChange={e => setNewAnnouncement({...newAnnouncement, recipients: e.target.value})}
                        >
                            <option>All Classes</option>
                            <option>Grade 10</option>
                            <option>Grade 11</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Content</label>
                        <textarea 
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                            rows={4}
                            value={newAnnouncement.content}
                            onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );

    return (
        <div className="h-[calc(100vh-200px)] animate-fadeIn flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200/50 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-white">{activeTab}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Communicate with parents and students.</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                    {activeSubNav || 'Inbox'}
                </div>
            </div>

            {activeSubNav === 'Announcements' ? (
                <div className="flex-1 overflow-y-auto">
                    {renderAnnouncements()}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                    {/* Sidebar: Conversations */}
                    <Card variant="default" className="col-span-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Messages</h3>
                            <div className="relative">
                                <Icon name="MagnifyingGlassIcon" className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search parents..." 
                                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border-none text-sm focus:ring-2 ring-blue-500 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {conversations.map(conv => (
                                <div 
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv.id)}
                                    className={`p-3 rounded-xl cursor-pointer transition-colors flex gap-3 items-start ${
                                        selectedConversation === conv.id 
                                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                                        : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                                        {conv.user?.avatar ? (
                                            <img src={pb.files.getUrl(conv.user, conv.user.avatar)} alt={conv.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">{conv.user?.name?.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">{conv.user?.name || 'Unknown'}</h4>
                                            <span className="text-[10px] text-gray-400">{new Date(conv.lastMessage.created).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {conv.lastMessage.content}
                                        </p>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                            ))}
                            {conversations.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">No conversations yet.</div>
                            )}
                            
                            {/* Quick Start List (Parents) */}
                            <div className="mt-4 px-2">
                                <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Start New Chat</h5>
                                {parents.map(parent => (
                                    <div 
                                        key={parent.id} 
                                        onClick={() => setSelectedConversation(parent.id)}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-gray-600 dark:text-gray-300">{parent.name?.charAt(0)}</div>
                                        <span className="text-sm text-gray-600 dark:text-gray-300">{parent.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Chat Area */}
                    <Card variant="default" className="col-span-1 lg:col-span-2 flex flex-col overflow-hidden">
                        {selectedConversation ? (
                            <>
                                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                                            {conversations.find(c => c.id === selectedConversation)?.user?.name?.charAt(0) || parents.find(p => p.id === selectedConversation)?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-white">
                                                {conversations.find(c => c.id === selectedConversation)?.user?.name || parents.find(p => p.id === selectedConversation)?.name || 'Chat'}
                                            </h3>
                                            <span className="text-xs text-green-500 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm"><Icon name="EllipsisHorizontalIcon" className="w-5 h-5" /></Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900/50">
                                    {messages.map(msg => {
                                        const isMe = msg.sender === pb.authStore.model?.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] rounded-2xl p-3 ${
                                                    isMe 
                                                    ? 'bg-blue-500 text-white rounded-tr-none' 
                                                    : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                                                }`}>
                                                    <p className="text-sm">{msg.content}</p>
                                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        {new Date(msg.created).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" className="text-gray-400"><Icon name="PaperClipIcon" className="w-5 h-5" /></Button>
                                        <input 
                                            type="text" 
                                            className="flex-1 bg-gray-100 dark:bg-slate-900 border-none rounded-full px-4 focus:ring-2 ring-blue-500 dark:text-white"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <Button variant="primary" className="rounded-full w-10 h-10 p-0 flex items-center justify-center" onClick={handleSendMessage}>
                                            <Icon name="PaperAirplaneIcon" className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <Icon name="ChatBubbleLeftRightIcon" className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select a conversation to start messaging</p>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default TeacherCommunication;
