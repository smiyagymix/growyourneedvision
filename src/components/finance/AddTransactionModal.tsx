import React, { useState } from 'react';
import { Modal, Button, Input, Select } from '../shared/ui/CommonUI';
import { Transaction } from '../../services/financeService';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Partial<Transaction>) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Transaction>>({
        description: '',
        amount: 0,
        type: 'expense',
        category: 'General',
        status: 'Completed',
        date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
            // Reset form
            setFormData({
                description: '',
                amount: 0,
                type: 'expense',
                category: 'General',
                status: 'Completed',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Transaction">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <Input 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                        placeholder="e.g. Server Costs"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</label>
                        <Input 
                            type="number"
                            value={formData.amount} 
                            onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} 
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <Input 
                            type="date"
                            value={formData.date} 
                            onChange={(e) => setFormData({...formData, date: e.target.value})} 
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                        <Select 
                            value={formData.type} 
                            onChange={(e) => setFormData({...formData, type: e.target.value as 'income' | 'expense'})}
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <Select 
                            value={formData.status} 
                            onChange={(e) => setFormData({...formData, status: e.target.value as 'Completed' | 'Pending' | 'Failed'})}
                        >
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Failed">Failed</option>
                        </Select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <Select 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                        <option value="General">General</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Services">Services</option>
                        <option value="Subscription">Subscription</option>
                        <option value="Salary">Salary</option>
                    </Select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Transaction'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
