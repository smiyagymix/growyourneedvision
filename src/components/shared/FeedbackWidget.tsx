import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, Button } from './ui/CommonUI';
import { useSubmitFeedback } from '../../hooks/useFeedback';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

export const FeedbackWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<'bug' | 'feature' | 'other'>('bug');
    const [description, setDescription] = useState('');
    const [rating, setRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const { user } = useAuth();
    const location = useLocation();
    const submitMutation = useSubmitFeedback();

    if (!user) return null; // Only show for logged in users

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await submitMutation.mutateAsync({
                type,
                description,
                rating,
                url: window.location.href,
                user_id: user.id,
                status: 'new'
            });
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setIsOpen(false);
                setDescription('');
                setRating(0);
            }, 2000);
        } catch (error) {
            alert('Failed to submit feedback. Collection might not exist.');
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 overflow-hidden pointer-events-auto"
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gyn-blue-medium/5 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white">Share Feedback</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon name="XMarkIcon" className="w-5 h-5" />
                            </button>
                        </div>

                        {submitted ? (
                            <div className="p-8 text-center">
                                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                    <Icon name="CheckIcon" className="w-6 h-6 text-green-600" />
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Thank You!</h4>
                                <p className="text-sm text-gray-500">Your feedback helps us improve.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Feedback Type</label>
                                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                        {(['bug', 'feature', 'other'] as const).map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setType(t)}
                                                className={`flex-1 text-xs py-1.5 rounded-md capitalize transition-colors ${type === t ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Rating</label>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className={`transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                            >
                                                <Icon name="StarIcon" className="w-6 h-6" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description</label>
                                    <textarea
                                        required
                                        className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                                        placeholder="Tell us what you think..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full justify-center"
                                    disabled={submitMutation.isPending}
                                >
                                    {submitMutation.isPending ? 'Sending...' : 'Send Feedback'}
                                </Button>
                            </form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto bg-gyn-blue-medium hover:bg-gyn-blue-dark text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center group"
            >
                <Icon name="ChatBubbleLeftRightIcon" className="w-6 h-6 group-hover:animate-pulse" />
            </button>
        </div>
    );
};
