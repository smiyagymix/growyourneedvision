import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, Button, Icon, Modal } from '../../../components/shared/ui/CommonUI';
import { helpService } from '../../../services/helpService';
import { useToast } from '../../../hooks/useToast';

const faqSchema = z.object({
    question: z.string().min(5, "Question must be at least 5 characters"),
    answer: z.string().min(10, "Answer must be at least 10 characters"),
    category: z.string().min(1, "Category is required"),
    order: z.number().optional(),
});

export const HelpContentManager: React.FC = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'faqs' | 'tickets'>('faqs');
    const [faqs, setFaqs] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [faqFormData, setFaqFormData] = useState({
        question: '',
        answer: '',
        category: 'General',
        order: 0
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'faqs') {
                const data = await helpService.getAllFAQs();
                setFaqs(data);
            } else {
                // For admin, we might want ALL tickets, but service only has getUserTickets.
                // We'll need to update service or just use what we have for now (maybe current user is admin so it works if we change the query?)
                // I'll assume I need to add getAllTickets to service.
                // For now, let's try to use getUserTickets but pass a special flag or just use a new method I'll add.
                // I'll add getAllTickets to helpService.
                const data = await (helpService as any).getAllTickets();
                setTickets(data);
            }
        } catch (error) {
            // showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddFAQ = async () => {
        try {
            const validation = faqSchema.safeParse(faqFormData);
            if (!validation.success) {
                showToast(validation.error.issues[0].message, 'error');
                return;
            }

            await helpService.createFAQ(faqFormData);
            showToast('FAQ added successfully!', 'success');
            setIsAddModalOpen(false);
            setFaqFormData({
                question: '',
                answer: '',
                category: 'General',
                order: 0
            });
            loadData();
        } catch (error) {
            showToast('Failed to add FAQ', 'error');
        }
    };

    const handleDeleteFAQ = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this FAQ?')) {
            try {
                await helpService.deleteFAQ(id);
                showToast('FAQ deleted successfully', 'success');
                loadData();
            } catch (error) {
                showToast('Failed to delete FAQ', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Help Center Management</h2>
                {activeTab === 'faqs' && (
                    <Button name="open-add-faq-modal" variant="primary" onClick={() => setIsAddModalOpen(true)}>
                        <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                        Add FAQ
                    </Button>
                )}
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        name="help-tab-faqs"
                        onClick={() => setActiveTab('faqs')}
                        className={`${
                            activeTab === 'faqs'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        FAQs
                    </button>
                    <button
                        name="help-tab-tickets"
                        onClick={() => setActiveTab('tickets')}
                        className={`${
                            activeTab === 'tickets'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Support Tickets
                    </button>
                </nav>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {activeTab === 'faqs' ? (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center">Loading...</td>
                                </tr>
                            ) : (activeTab === 'faqs' ? faqs : tickets).length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No items found</td>
                                </tr>
                            ) : (
                                (activeTab === 'faqs' ? faqs : tickets).map((item) => (
                                    <tr key={item.id}>
                                        {activeTab === 'faqs' ? (
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{item.question}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.views || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        name={`delete-faq-${item.id}`}
                                                        onClick={() => handleDeleteFAQ(item.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{item.subject}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.expand?.user?.name || item.user}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        item.status === 'Open' ? 'bg-green-100 text-green-800' : 
                                                        item.status === 'Closed' ? 'bg-gray-100 text-gray-800' : 
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.priority}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button name={`view-ticket-${item.id}`} className="text-indigo-600 hover:text-indigo-900">
                                                        View
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New FAQ"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question</label>
                        <input
                            type="text"
                            name="question"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={faqFormData.question}
                            onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            name="category"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={faqFormData.category}
                            onChange={(e) => setFaqFormData({ ...faqFormData, category: e.target.value })}
                        >
                            <option value="General">General</option>
                            <option value="Account">Account</option>
                            <option value="Billing">Billing</option>
                            <option value="Technical">Technical</option>
                            <option value="Features">Features</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Answer</label>
                        <textarea
                            name="answer"
                            rows={5}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={faqFormData.answer}
                            onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button name="cancel-add-faq" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button name="submit-add-faq" variant="primary" onClick={handleAddFAQ}>
                            Add FAQ
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
