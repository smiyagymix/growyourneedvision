
import React, { useState, useEffect } from 'react';
import { Icon, Card, Button, Badge, Avatar, EmptyState } from '../components/shared/ui/CommonUI';
import { communicationService, Message } from '../services/communicationService';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import pb from '../lib/pocketbase';

interface MessagingAppProps {
  activeTab: string;
  activeSubNav: string;
}

const MessagingApp: React.FC<MessagingAppProps> = ({ activeTab, activeSubNav }) => {
  const isArchived = activeSubNav === 'Archived';
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [activeSubNav]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const user = pb.authStore.model;
      if (user) {
        const result = await communicationService.getMessages(user.id, isArchived ? 'archived' : 'inbox');
        setMessages(result.items);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;
    
    try {
        const user = pb.authStore.model;
        if (!user) return;

        await communicationService.sendMessage({
            sender: user.id,
            recipient: selectedMessage.sender, // Reply to sender
            content: replyContent
        });
        
        setReplyContent('');
        alert('Reply sent!');
    } catch (error) {
        console.error('Error sending reply:', error);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeIn shadow-xl">
        {/* Contact List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="relative">
                    <Icon name="SearchIcon" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search messages..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 border focus:border-blue-500 rounded-xl text-sm transition-all duration-200 dark:text-white shadow-inner" 
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Loading chats...</div>
                    </div>
                ) : isArchived && messages.length === 0 ? (
                    <EmptyState 
                        title="No Archived Chats"
                        description="You don't have any archived conversations."
                        icon="ArchiveBoxIcon"
                        className="py-10"
                    />
                ) : messages.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon name="ChatBubbleLeftRight" className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No messages found.</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div 
                          key={msg.id} 
                          onClick={() => setSelectedMessage(msg)}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer transition-all duration-200 flex gap-3 group relative overflow-hidden ${
                              selectedMessage?.id === msg.id 
                              ? 'bg-white dark:bg-gray-700 shadow-md border-l-4 border-l-blue-500 z-10' 
                              : 'hover:bg-white/60 dark:hover:bg-gray-700/60 hover:pl-5'
                          }`}
                        >
                            <div className="relative">
                                <Avatar 
                                    src={msg.expand?.sender?.avatar} 
                                    initials={(msg.expand?.sender?.name || 'U').substring(0, 2)}
                                    className={`w-12 h-12 shadow-sm transition-transform group-hover:scale-105 ${selectedMessage?.id === msg.id ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''}`}
                                />
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className={`font-bold text-sm truncate ${selectedMessage?.id === msg.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {msg.expand?.sender?.name || 'Unknown User'}
                                    </span>
                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                                        {new Date(msg.created).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <p className={`text-xs truncate transition-colors ${selectedMessage?.id === msg.id ? 'text-gray-600 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {msg.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

            {!selectedMessage ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-gray-800/30 backdrop-blur-sm p-8 text-center">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                        <Icon name="ChatBubbleLeftRight" className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2">Select a Conversation</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Choose a contact from the left sidebar to start messaging or create a new chat.</p>
                    <Button variant="primary" className="mt-6 shadow-lg shadow-blue-500/30">
                        Start New Chat
                    </Button>
                </div>
            ) : (
                <>
                    <div className="h-20 border-b border-gray-200 dark:border-gray-700 flex items-center px-6 justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar 
                                    src={selectedMessage.expand?.sender?.avatar} 
                                    initials={(selectedMessage.expand?.sender?.name || 'U').substring(0, 2)}
                                    className="w-10 h-10 ring-2 ring-gray-100 dark:ring-gray-700"
                                />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></span>
                            </div>
                            <div>
                                <div className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                                    {selectedMessage.expand?.sender?.name || 'Unknown User'}
                                    <Badge variant="neutral" className="text-[10px] py-0 px-1.5 h-5">Student</Badge>
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                    Active Now
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                                <Icon name="PhoneIcon" className="w-5 h-5" />
                            </button>
                            <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                                <Icon name="VideoCameraIcon" className="w-5 h-5" />
                            </button>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                            <button className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                                <Icon name="DotsVertical" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar relative z-10">
                        <div className="flex justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-1 rounded-full shadow-sm">
                                {new Date(selectedMessage.created).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        
                        {/* Received Message */}
                        <div className="flex justify-start group">
                            <div className="flex items-end gap-2 max-w-[70%]">
                                <Avatar 
                                    src={selectedMessage.expand?.sender?.avatar} 
                                    initials={(selectedMessage.expand?.sender?.name || 'U').substring(0, 2)}
                                    className="w-8 h-8 mb-1 shadow-sm"
                                />
                                <div>
                                    <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-5 py-3.5 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700 group-hover:shadow-md transition-shadow text-sm leading-relaxed">
                                        {selectedMessage.content}
                                    </div>
                                    <span className="text-[10px] text-gray-400 ml-2 mt-1 block opacity-0 group-hover:opacity-100 transition-opacity">
                                        {new Date(selectedMessage.created).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Dummy Sent Message for Visual */}
                        <div className="flex justify-end group">
                            <div className="flex items-end gap-2 max-w-[70%] flex-row-reverse">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mb-1 shadow-md">
                                    ME
                                </div>
                                <div>
                                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 py-3.5 rounded-2xl rounded-br-none shadow-md shadow-blue-500/20 text-sm leading-relaxed">
                                        I'll check the schedule and get back to you!
                                    </div>
                                    <div className="flex justify-end items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] text-gray-400">Just now</span>
                                        <Icon name="CheckCircle" className="w-3 h-3 text-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 relative z-20">
                        <div className="flex items-end gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-3xl border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                            <button className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <Icon name="PlusCircleIcon" className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={() => setIsAIModalOpen(true)}
                                className="p-2 text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-colors"
                                title="Draft with AI"
                            >
                                <Icon name="Sparkles" className="w-6 h-6" />
                            </button>
                            <textarea 
                                placeholder="Type a message..." 
                                className="flex-1 bg-transparent border-none text-gray-900 dark:text-white px-2 py-2.5 focus:ring-0 max-h-32 min-h-[44px] resize-none text-sm custom-scrollbar"
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendReply();
                                    }
                                }}
                                rows={1}
                            />
                            <div className="flex gap-1 pb-1">
                                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <Icon name="FaceSmileIcon" className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={handleSendReply} 
                                    disabled={!replyContent.trim()}
                                    className={`p-2 rounded-full transition-all shadow-md ${
                                        replyContent.trim() 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <Icon name="PaperAirplane" className="w-5 h-5 transform rotate-90 translate-x-0.5" />
                                </button>
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[10px] text-gray-400">Press Enter to send, Shift + Enter for new line</span>
                        </div>
                    </div>

                    <AIContentGeneratorModal
                        isOpen={isAIModalOpen}
                        onClose={() => setIsAIModalOpen(false)}
                        onSuccess={(content) => {
                            setReplyContent(content);
                            setIsAIModalOpen(false);
                        }}
                        title="Draft Reply"
                        promptTemplate={`Draft a professional yet friendly reply to the following message:
                        "${selectedMessage.content}"
                        
                        Context: I am a student/teacher replying to a colleague.`}
                        contextData={{ message: selectedMessage }}
                    />
                </>
            )}
        </div>
    </div>
  );
};

export default MessagingApp;
