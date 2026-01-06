import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Badge, Avatar, Modal, Icon, EmptyState } from '../components/shared/ui/CommonUI';
import { Skeleton } from '../components/shared/ui/Skeleton';
import pb from '../lib/pocketbase';
import { communicationService, Message, SocialPost } from '../services/communicationService';
import { communityService, Post } from '../services/communityService';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';

interface CommunicationProps {
    activeTab: string;
    activeSubNav: string;
}

interface UserSearchResult {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

const EmailView: React.FC<{ activeSubNav: string }> = ({ activeSubNav }) => {
    const { addToast } = useToast();
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    // Compose state
    const [toEmail, setToEmail] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');

    // User Search State
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debouncedSearch = useDebounce(toEmail, 300);
    const searchRef = useRef<HTMLDivElement>(null);

    // Handle outside click for suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search Users Effect
    useEffect(() => {
        const searchUsers = async () => {
            if (!debouncedSearch || recipientId) return; // Don't search if we already selected a user or empty

            setIsSearching(true);
            try {
                const result = await communicationService.searchUsers(debouncedSearch);
                setSearchResults(result.items.map(u => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    avatar: u.avatar
                })));
                setShowSuggestions(true);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        };

        if (debouncedSearch.length > 1) {
            searchUsers();
        } else {
            setSearchResults([]);
            setShowSuggestions(false);
        }
    }, [debouncedSearch, recipientId]);

    const selectRecipient = (user: UserSearchResult) => {
        setToEmail(user.email);
        setRecipientId(user.id);
        setShowSuggestions(false);
    };

    const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setToEmail(e.target.value);
        setRecipientId(''); // Reset ID if user types manually
    };

    // Handle Compose subnav action
    useEffect(() => {
        if (activeSubNav === 'Compose') {
            setIsComposeOpen(true);
        }
    }, [activeSubNav]);

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const userId = pb.authStore.model?.id;
                if (!userId) {
                    setMessages([]);
                    return;
                }

                // Map folder to service type
                let type: 'inbox' | 'sent' | 'archived' | 'starred' | 'trash' = 'inbox';
                if (activeSubNav === 'Sent') type = 'sent';
                else if (activeSubNav === 'Starred') type = 'starred';
                else if (activeSubNav === 'Archive') type = 'archived';
                else if (activeSubNav === 'Trash') type = 'trash';
                else if (activeSubNav === 'Spam') type = 'trash'; // Map spam to trash for now

                const result = await communicationService.getMessages(userId, type);
                setMessages(result.items);
            } catch (err) {
                console.error("Error fetching messages:", err);
                addToast("Failed to load messages", 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Real-time subscription
        pb.collection('messages').subscribe('*', function (e) {
            fetchMessages();
        });

        return () => {
            pb.collection('messages').unsubscribe('*');
        };
    }, [activeSubNav]);

    const handleSend = async () => {
        try {
            const currentUser = pb.authStore.model;
            if (!currentUser) return;

            let finalRecipientId = recipientId;

            // If no ID selected but email provided, try to find exact match
            if (!finalRecipientId && toEmail) {
                try {
                    const user = await communicationService.findUserByEmail(toEmail);
                    finalRecipientId = user?.id || '';
                } catch (e) {
                    addToast(`Recipient with email ${toEmail} not found`, 'error');
                    return;
                }
            }

            if (!finalRecipientId) {
                addToast('Please specify a valid recipient', 'warning');
                return;
            }

            await communicationService.sendMessage({
                sender: currentUser.id,
                recipient: finalRecipientId,
                content: `Subject: ${subject}\n\n${content}`,
                read_at: undefined,
                archived: false,
                trashed: false,
                starred: false
            });

            addToast('Message sent successfully', 'success');
            setIsComposeOpen(false);
            setToEmail('');
            setRecipientId('');
            setSubject('');
            setContent('');

            // Refresh if we are in Sent
            if (activeSubNav === 'Sent') {
                // trigger fetch - handled by subscription or re-fetch logic if needed
                // For now, the subscription should handle it if it listens to 'messages'
            }
        } catch (e) {
            console.error(e);
            addToast('Failed to send message', 'error');
        }
    };

    const handleArchive = async (msg: Message, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await pb.collection('messages').update(msg.id, { archived: !msg.archived });
            addToast(msg.archived ? 'Message unarchived' : 'Message archived', 'success');
            if (activeSubNav !== 'All') {
                 setMessages(prev => prev.filter(m => m.id !== msg.id));
                 if (selectedMessage?.id === msg.id) setSelectedMessage(null);
            }
        } catch (error) {
            addToast('Failed to update message', 'error');
        }
    };

    const handleTrash = async (msg: Message, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await pb.collection('messages').update(msg.id, { trashed: !msg.trashed });
            addToast(msg.trashed ? 'Message restored' : 'Message moved to trash', 'success');
            if (activeSubNav !== 'All') {
                setMessages(prev => prev.filter(m => m.id !== msg.id));
                if (selectedMessage?.id === msg.id) setSelectedMessage(null);
            }
        } catch (error) {
            addToast('Failed to update message', 'error');
        }
    };

    const handleStar = async (msg: Message, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const newStatus = !msg.starred;
            await pb.collection('messages').update(msg.id, { starred: newStatus });
            // Update local state immediately for better UX
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, starred: newStatus } : m));
            if (selectedMessage?.id === msg.id) {
                setSelectedMessage(prev => prev ? { ...prev, starred: newStatus } : null);
            }
        } catch (error) {
            addToast('Failed to update message', 'error');
        }
    };

    // Helper to get sender name safely
    const getSenderName = (msg: Message) => {
        return msg.expand?.sender?.name || msg.expand?.sender?.email || 'Unknown Sender';
    };

    // Extract subject from content
    const getSubject = (content: string) => {
        const match = content.match(/^Subject: (.*?)(\n|$)/);
        return match ? match[1] : '(No Subject)';
    };

    const getBody = (content: string) => {
        return content.replace(/^Subject: .*?(\n|$)/, '').trim();
    };

    const isEmpty = !loading && messages.length === 0;

    return (
        <div className="h-full flex gap-3 overflow-hidden animate-fadeIn relative">

            {/* Main Content - Split Pane Glass */}
            <div className={`flex-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl border border-white/50 dark:border-slate-700 shadow-glass-edge flex flex-col overflow-hidden relative transition-all duration-300 ${selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
                {/* Header */}
                <div className="h-12 border-b border-gray-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 flex justify-between items-center px-3 shrink-0 backdrop-blur-md z-10">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <h2 className="text-sm font-black text-gyn-blue-dark dark:text-blue-400">Email</h2>
                            <span className="text-gray-300 dark:text-slate-600 text-sm font-light">/</span>
                            <h3 className="text-xs font-bold text-gray-600 dark:text-slate-300">{activeSubNav || 'Inbox'}</h3>
                        </div>

                        <Button
                            variant="primary"
                            onClick={() => setIsComposeOpen(true)}
                            icon="PencilIcon"
                            className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-md text-[10px] px-2 py-1"
                        >
                            Compose
                        </Button>
                    </div>
                    <div className="relative group">
                        <input type="text" placeholder="Search messages..." className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-[10px] w-48 focus:outline-none focus:ring-2 focus:ring-gyn-blue-medium/20 focus:border-gyn-blue-medium transition-all dark:text-white" />
                        <Icon name="SearchIcon" className="w-3 h-3 text-gray-400 absolute right-2 top-2" />
                    </div>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {loading ? (
                        <div className="p-5 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex gap-4 p-4 border border-gray-100 dark:border-slate-700 rounded-xl">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="w-1/3 h-4" />
                                        <Skeleton className="w-1/2 h-3" />
                                        <Skeleton className="w-full h-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : isEmpty ? (
                        <EmptyState
                            title={`No ${activeSubNav} Messages`}
                            description="This folder is empty. New messages will appear here."
                            icon="Envelope"
                            className="mt-12"
                        />
                    ) : (
                        messages.map(msg => {
                            const senderName = getSenderName(msg);
                            const isRead = !!msg.read_at;
                            return (
                                <div
                                    key={msg.id}
                                    onClick={() => {
                                        setSelectedMessage(msg);
                                        if (!msg.read_at && activeSubNav === 'Inbox') {
                                            communicationService.markMessageRead(msg.id);
                                        }
                                    }}
                                    className={`group border-b border-gray-50 dark:border-slate-700 p-5 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer relative overflow-hidden ${!isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gyn-blue-medium scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>

                                    <div className="flex gap-4 items-start relative z-10">
                                        {/* Avatar */}
                                        <Avatar initials={senderName.charAt(0)} size="md" />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className={`text-sm font-bold group-hover:text-gyn-blue-dark dark:group-hover:text-blue-400 transition-colors ${!isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'}`}>{senderName}</h4>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={(e) => handleStar(msg, e)}
                                                        className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors ${msg.starred ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600 hover:text-yellow-400'}`}
                                                    >
                                                        <Icon name={msg.starred ? "StarIcon" : "StarIcon"} className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-full group-hover:bg-white dark:group-hover:bg-slate-600 group-hover:shadow-sm transition-all">
                                                        {new Date(msg.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className={`text-sm font-bold mb-1 ${!isRead ? 'text-gray-800 dark:text-slate-200' : 'text-gray-500 dark:text-slate-400'}`}>{getSubject(msg.content)}</p>
                                            <p className="text-xs text-gray-400 line-clamp-1 group-hover:text-gray-500 dark:group-hover:text-slate-400 transition-colors">
                                                {getBody(msg.content)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Hover Actions */}
                                    <div className="absolute right-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                                        <button onClick={(e) => handleArchive(msg, e)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded text-gray-500 dark:text-slate-400" title={msg.archived ? "Unarchive" : "Archive"}>
                                            <Icon name="ArchiveBoxIcon" className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => handleTrash(msg, e)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-500 hover:text-red-500 dark:text-slate-400" title="Delete">
                                            <Icon name="TrashIcon" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Reading Pane (Overlay on Mobile, Side on Desktop) */}
            {selectedMessage && (
                <div className="absolute inset-0 lg:static lg:w-[500px] lg:shrink-0 bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700 shadow-2xl lg:shadow-glass-edge flex flex-col z-20 animate-slideInRight">
                    <div className="h-16 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 bg-white/50 dark:bg-slate-800/50">
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedMessage(null)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400"><Icon name="ArrowLeftIcon" className="w-5 h-5" /></button>
                            <button onClick={() => handleArchive(selectedMessage)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400" title={selectedMessage.archived ? "Unarchive" : "Archive"}><Icon name="ArchiveBoxIcon" className="w-5 h-5" /></button>
                            <button onClick={() => handleTrash(selectedMessage)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400" title="Delete"><Icon name="TrashIcon" className="w-5 h-5" /></button>
                            <button onClick={() => handleStar(selectedMessage)} className={`p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg ${selectedMessage.starred ? 'text-yellow-400' : 'text-gray-500 dark:text-slate-400'}`} title="Star"><Icon name="StarIcon" className="w-5 h-5" /></button>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400" title="Reply"><Icon name="ArrowUturnLeftIcon" className="w-5 h-5" /></button>
                            <button onClick={() => setSelectedMessage(null)} className="hidden lg:block p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400"><Icon name="XMarkIcon" className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">{getSubject(selectedMessage.content)}</h2>

                        <div className="flex items-center gap-4 mb-8">
                            <Avatar initials={getSenderName(selectedMessage).charAt(0)} size="lg" />
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">{getSenderName(selectedMessage)}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">to me • {new Date(selectedMessage.created).toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="prose prose-sm max-w-none text-gray-600 dark:text-slate-300 whitespace-pre-line">
                            {getBody(selectedMessage.content)}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-700">
                            <Button variant="outline" icon="ArrowUturnLeftIcon">
                                Reply to {getSenderName(selectedMessage)}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Compose Modal */}
            <Modal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                title="New Message"
                size="lg"
            >
                <div className="flex flex-col gap-4">
                    <div className="relative" ref={searchRef}>
                        <input
                            type="text"
                            placeholder="To (Name or Email):"
                            value={toEmail}
                            onChange={handleToChange}
                            className="w-full border-b border-gray-200 dark:border-slate-700 py-2 focus:outline-none focus:border-gyn-blue-medium font-medium bg-transparent dark:text-white"
                        />
                        {isSearching && (
                            <div className="absolute right-2 top-2">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        {showSuggestions && searchResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                {searchResults.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => selectRecipient(user)}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                    >
                                        <Avatar initials={user.name.charAt(0)} size="sm" src={user.avatar ? pb.files.getUrl(user, user.avatar) : undefined} />
                                        <div>
                                            <div className="font-bold text-sm text-gray-900 dark:text-white">{user.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">{user.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <input
                        type="text"
                        placeholder="Subject:"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="w-full border-b border-gray-200 dark:border-slate-700 py-2 focus:outline-none focus:border-gyn-blue-medium font-bold bg-transparent dark:text-white"
                    />
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full flex-1 min-h-[150px] resize-none focus:outline-none text-gray-600 dark:text-slate-300 bg-transparent"
                        placeholder="Write your message..."
                    ></textarea>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-slate-700">
                        <div className="flex gap-2 text-gray-400">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><Icon name="PaperClipIcon" className="w-5 h-5" /></button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><Icon name="PhotoIcon" className="w-5 h-5" /></button>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setIsComposeOpen(false)}>Discard</Button>
                            <Button variant="primary" onClick={handleSend}>Send</Button>
                        </div>
                    </div>
                </div>
            </Modal>

        </div>
    );
}; const SocialMediaView: React.FC<{ activeSubNav: string }> = ({ activeSubNav }) => {
    const { addToast } = useToast();
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    // Form State
    const [platform, setPlatform] = useState<'Facebook' | 'Twitter' | 'Instagram' | 'LinkedIn'>('Twitter');
    const [content, setContent] = useState('');
    const [scheduledFor, setScheduledFor] = useState('');

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const result = await communicationService.getSocialPosts();
            setPosts(result.items);
        } catch (error) {
            console.error("Failed to fetch social posts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreatePost = async () => {
        try {
            await communicationService.createSocialPost({
                platform,
                content,
                scheduled_for: scheduledFor || undefined,
                status: scheduledFor ? 'Scheduled' : 'Draft',
                likes: 0,
                comments: 0,
                shares: 0
            });
            addToast('Post created successfully', 'success');
            setIsCreateOpen(false);
            setContent('');
            setScheduledFor('');
            fetchPosts();
        } catch (error) {
            addToast('Failed to create post', 'error');
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-blue-400">Social Media Manager</h2>
                    <p className="text-gray-500 dark:text-slate-400">Manage posts across all platforms.</p>
                </div>
                <Button variant="primary" icon="PlusCircle" onClick={() => setIsCreateOpen(true)} className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-md">
                    Create Post
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
                {/* Feed Preview */}
                <Card className="lg:col-span-2 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-gray-700 dark:text-slate-200">Scheduled Posts</h3>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-500"><Icon name="Calendar" className="w-4 h-4" /></button>
                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-500"><Icon name="List" className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {loading ? (
                            <div className="space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-4">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="flex-1 space-y-3">
                                            <Skeleton className="w-1/3 h-4" />
                                            <Skeleton className="w-full h-20 rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : posts.length === 0 ? (
                            <EmptyState
                                title="No Scheduled Posts"
                                description="Create a post to get started with your social media campaign."
                                icon="Calendar"
                            />
                        ) : (
                            posts.map(post => (
                                <div key={post.id} className="flex gap-4 group">
                                    <div className="flex flex-col items-center gap-2 pt-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                                            post.platform === 'Facebook' ? 'bg-blue-600' :
                                            post.platform === 'Twitter' ? 'bg-sky-500' :
                                            post.platform === 'LinkedIn' ? 'bg-blue-700' :
                                            'bg-pink-600'
                                        }`}>
                                            <Icon name={
                                                post.platform === 'Facebook' ? 'HandThumbUpIcon' : // Fallback icons if brand icons missing
                                                post.platform === 'Twitter' ? 'ChatBubbleLeftRight' :
                                                'ShareIcon'
                                            } className="w-5 h-5" />
                                        </div>
                                        <div className="w-0.5 h-full bg-gray-100 dark:bg-slate-700 group-last:hidden"></div>
                                    </div>
                                    <div className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-800 dark:text-white">{post.platform} Post</span>
                                                <Badge variant={
                                                    post.status === 'Scheduled' ? 'warning' :
                                                        post.status === 'Published' ? 'success' : 'default'
                                                }>{post.status}</Badge>
                                            </div>
                                            <span className="text-xs text-gray-400">{post.scheduled_for ? new Date(post.scheduled_for).toLocaleString() : 'Draft'}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-3 whitespace-pre-wrap">
                                            {post.content}
                                        </p>
                                        {post.image && (
                                            <div className="h-32 bg-gray-100 dark:bg-slate-900 rounded-lg mb-3 flex items-center justify-center text-gray-400 overflow-hidden">
                                                <img src={pb.files.getUrl(post, post.image)} alt="Post attachment" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex gap-4 text-xs font-bold text-gray-400">
                                            <span className="flex items-center gap-1"><Icon name="HandThumbUpIcon" className="w-3 h-3" /> {post.likes || 0}</span>
                                            <span className="flex items-center gap-1"><Icon name="ChatBubbleLeftRight" className="w-3 h-3" /> {post.comments || 0}</span>
                                            <span className="flex items-center gap-1"><Icon name="ShareIcon" className="w-3 h-3" /> {post.shares || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Analytics Sidebar */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="font-bold mb-4 opacity-90">Engagement Rate</h3>
                        <div className="text-4xl font-black mb-2">--%</div>
                        <div className="flex items-center gap-2 text-sm opacity-75">
                            <Icon name="ArrowTrendingUpIcon" className="w-4 h-4" />
                            <span>Analytics coming soon</span>
                        </div>
                    </div>

                    <Card className="p-6">
                        <h3 className="font-bold text-gray-700 dark:text-slate-200 mb-4">Connected Accounts</h3>
                        <div className="space-y-4">
                            <div className="text-sm text-gray-500 text-center py-4">
                                No accounts connected yet.
                            </div>
                        </div>
                        <Button variant="outline" className="w-full mt-6">Manage Connections</Button>
                    </Card>
                </div>
            </div>

            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create Social Post"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Platform</label>
                        <select 
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value as any)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="Twitter">Twitter</option>
                            <option value="Facebook">Facebook</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Instagram">Instagram</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Content</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white min-h-[100px]"
                            placeholder="What's on your mind?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Schedule (Optional)</label>
                        <input 
                            type="datetime-local"
                            value={scheduledFor}
                            onChange={(e) => setScheduledFor(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreatePost}>
                            {scheduledFor ? 'Schedule Post' : 'Save Draft'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const CommunityView: React.FC<{ activeSubNav: string }> = ({ activeSubNav }) => {
    const { addToast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const result = await communityService.getPosts();
            setPosts(result.items);
        } catch (error) {
            console.error("Failed to fetch community posts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreateTopic = async () => {
        try {
            const currentUser = pb.authStore.model;
            if (!currentUser) return;

            await communityService.createPost({
                title,
                content,
                author: currentUser.id,
                tags: tags.split(',').map(t => t.trim()).filter(t => t)
            });
            addToast('Topic created successfully', 'success');
            setIsCreateOpen(false);
            setTitle('');
            setContent('');
            setTags('');
            fetchPosts();
        } catch (error) {
            addToast('Failed to create topic', 'error');
        }
    };

    return (
        <div className="h-full flex flex-col animate-fadeIn">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-blue-400">Community Forums</h2>
                    <p className="text-gray-500 dark:text-slate-400">Engage with your user base.</p>
                </div>
                <div className="flex gap-2">
                    <input type="text" placeholder="Search topics..." className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm w-64 dark:text-white" />
                    <Button variant="primary" icon="PlusCircle" onClick={() => setIsCreateOpen(true)} className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-md">
                        New Topic
                    </Button>
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    <div className="col-span-6">Topic</div>
                    <div className="col-span-2 text-center">Likes</div>
                    <div className="col-span-2 text-center">Tags</div>
                    <div className="col-span-2 text-right">Created</div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-700 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="grid grid-cols-12 gap-4">
                                    <div className="col-span-6 flex gap-3">
                                        <Skeleton className="w-2 h-2 mt-2 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="w-3/4 h-4" />
                                            <Skeleton className="w-1/2 h-3" />
                                        </div>
                                    </div>
                                    <Skeleton className="col-span-2 h-4" />
                                    <Skeleton className="col-span-2 h-4" />
                                    <Skeleton className="col-span-2 h-4" />
                                </div>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="p-10 flex justify-center">
                            <EmptyState
                                title="No Discussions"
                                description="Start a new topic to engage with the community."
                                icon="ChatBubbleLeftRight"
                            />
                        </div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group items-center">
                                <div className="col-span-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"></div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{post.title}</h4>
                                            <div className="flex gap-2 mt-1">
                                                {post.tags?.map(tag => (
                                                    <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                                                ))}
                                                <span className="text-xs text-gray-400">by {post.expand?.author?.name || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 text-center font-mono text-sm text-gray-600 dark:text-slate-400">{post.likes || 0}</div>
                                <div className="col-span-2 text-center font-mono text-sm text-gray-600 dark:text-slate-400">{post.tags?.length || 0}</div>
                                <div className="col-span-2 text-right text-xs text-gray-400">
                                    {new Date(post.created).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Start New Discussion"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Topic Title</label>
                        <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                            placeholder="What would you like to discuss?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Content</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white min-h-[150px]"
                            placeholder="Elaborate on your topic..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                        <input 
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                            placeholder="e.g. feature-request, bug, general"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateTopic}>Post Topic</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const Communication: React.FC<CommunicationProps> = ({ activeTab, activeSubNav }) => {
    if (activeTab === 'Email') {
        return <EmailView activeSubNav={activeSubNav} />;
    }
    if (activeTab === 'Social-Media') {
        return <SocialMediaView activeSubNav={activeSubNav} />;
    }
    if (activeTab === 'Community') {
        return <CommunityView activeSubNav={activeSubNav} />;
    }

    return (
        <div className="h-full flex gap-6 overflow-hidden animate-fadeIn relative">
            <div className="flex-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700 shadow-glass-edge flex flex-col overflow-hidden relative">
                <div className="h-16 border-b border-gray-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 flex justify-between items-center px-6 shrink-0 backdrop-blur-md z-10">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-gyn-blue-dark dark:text-blue-400">{activeTab}</h2>
                        <span className="text-gray-300 dark:text-slate-600 text-xl font-light">/</span>
                        <h3 className="text-lg font-bold text-gray-600 dark:text-slate-300">{activeSubNav || 'Overview'}</h3>
                    </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center">
                    <EmptyState
                        title={`${activeTab} - ${activeSubNav || 'Overview'}`}
                        description={`Manage your ${activeTab.toLowerCase()} settings and content here.`}
                        icon="ChatBubbleLeftRight"
                    />
                </div>
            </div>
        </div>
    );
};
// ...existing code...

export default Communication;
