import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Icon, Card, Button } from '../components/shared/ui/CommonUI';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import { helpService, FAQItem, SupportTicket, KnowledgeArticle, TicketReply } from '../services/helpService';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/shared/LoadingScreen';
import { motion } from 'framer-motion';
import { sanitizeText, sanitizeHtml } from '../utils/sanitization';
import { useToast } from '../hooks/useToast';

const ticketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description too long'),
  category: z.enum(['Technical', 'Billing', 'Feature Request', 'Bug Report', 'Other']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  user: z.string().min(1, 'User ID required')
});

interface HelpCenterAppProps {
    activeTab: string;
    activeSubNav: string;
}

const HelpCenterApp: React.FC<HelpCenterAppProps> = ({ activeTab, activeSubNav }) => {
    const { user } = useAuth();
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [articles, setArticles] = useState<KnowledgeArticle[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
    const [replyMessage, setReplyMessage] = useState('');

    // Ticket Form
    const [ticketForm, setTicketForm] = useState({
        subject: '',
        description: '',
        category: 'Technical' as SupportTicket['category'],
        priority: 'Medium' as SupportTicket['priority']
    });

    useEffect(() => {
        loadData();
    }, [activeTab, user]);

    const loadData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            if (activeTab === 'FAQ') {
                const faqData = await helpService.getAllFAQs();
                setFaqs(faqData);
            } else if (activeTab === 'My Tickets') {
                const ticketData = await helpService.getUserTickets(user.id);
                setTickets(ticketData);
            } else if (activeTab === 'Knowledge Base') {
                const articleData = await helpService.getPublishedArticles();
                setArticles(articleData);
            } else {
                // Home - load FAQs
                const faqData = await helpService.getAllFAQs();
                setFaqs(faqData.slice(0, 5)); // Top 5
            }
        } catch (error) {
            console.error('Failed to load help data: ', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            const [faqResults, articleResults] = await Promise.all([
                helpService.searchFAQs(searchQuery),
                helpService.searchArticles(searchQuery)
            ]);
            setFaqs(faqResults);
            setArticles(articleResults);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const { showToast } = useToast();
    
    const handleSubmitTicket = async () => {
        if (!user) {
            showToast('User not authenticated', 'error');
            return;
        }
        
        // Sanitize inputs
        const sanitized = {
            subject: sanitizeText(ticketForm.subject),
            description: sanitizeHtml(ticketForm.description, 'BASIC'),
            category: ticketForm.category,
            priority: ticketForm.priority,
            user: user.id
        };
        
        // Validate
        const result = ticketSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        try {
            await helpService.createTicket({
                ...result.data,
                status: 'Open'
            });

            showToast('Ticket submitted successfully!', 'success');
            setTicketForm({
                subject: '',
                description: '',
                category: 'Technical',
                priority: 'Medium'
            });

            // Refresh tickets
            const ticketData = await helpService.getUserTickets(user.id);
            setTickets(ticketData);
        } catch (error) {
            console.error('Failed to create ticket:', error);
            showToast('Failed to submit ticket. Please try again.', 'error');
        }
    };

    const handleViewTicket = async (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        try {
            const replies = await helpService.getTicketReplies(ticket.id);
            setTicketReplies(replies);
        } catch (error) {
            console.error('Failed to load replies:', error);
        }
    };

    const handleReply = async () => {
        if (!user || !selectedTicket || !replyMessage.trim()) return;

        try {
            await helpService.addTicketReply(selectedTicket.id, user.id, replyMessage);
            setReplyMessage('');

            // Refresh replies
            const replies = await helpService.getTicketReplies(selectedTicket.id);
            setTicketReplies(replies);
        } catch (error) {
            console.error('Failed to send reply:', error);
            alert('Failed to send reply');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'In Progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'High': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading && activeTab !== 'Home') {
        return <LoadingScreen />;
    }

    const renderHome = () => (
        <div className="max-w-4xl mx-auto spacy-8">
            {/* Search Hero */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                    How can we help you?
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Search our knowledge base or submit a support ticket
                </p>

                <div className="relative max-w-2xl mx-auto">
                    <input
                        type="text"
                        placeholder="Search for answers..."
                        className="w-full px-6 py-4 pr-14 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg text-gray-900 dark:text-white"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors"
                    >
                        <Icon name="MagnifyingGlassIcon" className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Card className="text-center hover:shadow-xl transition-all cursor-pointer p-6">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                            <Icon name="BookOpenIcon" className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Knowledge Base</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Browse guides and tutorials</p>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Card className="text-center hover:shadow-xl transition-all cursor-pointer p-6">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
                            <Icon name="ChatBubbleLeftRightIcon" className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">My Tickets</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Track your support requests</p>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Card className="text-center hover:shadow-xl transition-all cursor-pointer p-6">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
                            <Icon name="Sparkles" className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">AI Assistant</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Get instant AI-powered help</p>
                    </Card>
                </motion.div>
            </div>

            {/* Popular FAQs */}
            <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={faq.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{faq.answer}</p>
                                </div>
                                <Icon name="ChevronRightIcon" className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Card>
        </div>
    );

    const renderSubmitTicket = () => (
        <div className="max-w-2xl mx-auto">
            <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Submit Support Ticket</h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Subject *
                        </label>
                        <input
                            type="text"
                            className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={ticketForm.subject}
                            onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                            placeholder="Brief summary of your issue"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={ticketForm.category}
                                onChange={e => setTicketForm({ ...ticketForm, category: e.target.value as any })}
                            >
                                <option value="Technical">Technical</option>
                                <option value="Billing">Billing</option>
                                <option value="Feature Request">Feature Request</option>
                                <option value="Bug Report">Bug Report</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Priority
                            </label>
                            <select
                                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={ticketForm.priority}
                                onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg h-40 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            value={ticketForm.description}
                            onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
                            placeholder="Please provide as much detail as possible..."
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button variant="primary" onClick={handleSubmitTicket} className="flex-1">
                            <Icon name="PaperAirplaneIcon" className="w-5 h-5 mr-2" />
                            Submit Ticket
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsAIModalOpen(true)}
                            className="border-purple-300 text-purple-600"
                        >
                            <Icon name="Sparkles" className="w-5 h-5 mr-2" />
                            Ask AI
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderMyTickets = () => (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Support Tickets</h2>
                <Button variant="primary">
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    New Ticket
                </Button>
            </div>

            {tickets.length > 0 ? (
                <div className="space-y-4">
                    {tickets.map((ticket, index) => (
                        <motion.div
                            key={ticket.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleViewTicket(ticket)}
                            className="cursor-pointer"
                        >
                            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-transparent hover:border-l-blue-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                            {ticket.subject}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                                            {ticket.description}
                                        </p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-sm text-gray-500">
                                            {new Date(ticket.created).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                        {ticket.category}
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16">
                    <Icon name="InboxIcon" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't submitted any support tickets</p>
                    <Button variant="primary">Submit Your First Ticket</Button>
                </Card>
            )}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'Submit Ticket':
                return renderSubmitTicket();
            case 'My Tickets':
                return renderMyTickets();
            case 'Home':
            default:
                return renderHome();
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 animate-fadeIn">
            {renderContent()}

            {/* AI Modal */}
            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={(content) => {
                    console.log("AI Help Response:", content);
                    setIsAIModalOpen(false);
                    alert("AI generated a helpful response! (Check console)");
                }}
                title="AI Support Assistant"
                promptTemplate={`Help answer this support question: "${ticketForm.subject || '[User Question]'}"

            Context: ${ticketForm.description || 'No additional details provided'}

            Provide:
            - Clear explanation of the issue
            - Step-by-step solution
            - Related documentation links
        - Prevention tips`}
                contextData={ticketForm}
            />

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                    {selectedTicket.subject}
                                </h2>
                                <div className="flex gap-2 text-sm">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedTicket.status)}`}>
                                        {selectedTicket.status}
                                    </span>
                                    <span className="text-gray-500">#{selectedTicket.id.slice(0, 8)}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedTicket(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <Icon name="XMarkIcon" className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50">
                            {/* Original Ticket */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <span className="font-bold text-blue-600">ME</span>
                                </div>
                                <div className="flex-1">
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700">
                                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                            {selectedTicket.description}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1 ml-2 block">
                                        {new Date(selectedTicket.created).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Replies */}
                            {ticketReplies.map(reply => (
                                <div key={reply.id} className={`flex gap-4 ${reply.is_staff ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        reply.is_staff ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        <span className="font-bold">{reply.is_staff ? 'SP' : 'ME'}</span>
                                    </div>
                                    <div className={`flex-1 ${reply.is_staff ? 'text-right' : ''}`}>
                                        <div className={`inline-block text-left p-4 rounded-2xl shadow-sm border ${
                                            reply.is_staff 
                                                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 rounded-tr-none' 
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-tl-none'
                                        }`}>
                                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                                {reply.message}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1 mx-2 block">
                                            {new Date(reply.created).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Input */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex gap-2">
                                <textarea
                                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="Type your reply..."
                                    rows={2}
                                    value={replyMessage}
                                    onChange={e => setReplyMessage(e.target.value)}
                                />
                                <Button 
                                    variant="primary" 
                                    className="h-auto"
                                    onClick={handleReply}
                                    disabled={!replyMessage.trim()}
                                >
                                    <Icon name="PaperAirplaneIcon" className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default HelpCenterApp;
