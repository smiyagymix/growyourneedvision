import React, { useState } from 'react';
import { Modal, Button, Input, Select } from '../shared/ui/CommonUI';
import { Campaign } from '../../services/marketingService';

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (campaign: Partial<Campaign>) => Promise<void>;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Campaign>>({
        name: '',
        status: 'Draft',
        type: 'Social',
        budget: 1000,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        spent: 0,
        performance_score: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Campaign">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name</label>
                    <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        placeholder="e.g. Summer Sale 2025"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                        <Select 
                            value={formData.type} 
                            onChange={(e) => setFormData({...formData, type: e.target.value as Campaign['type']})}
                        >
                            <option value="Social">Social Media</option>
                            <option value="Email">Email Blast</option>
                            <option value="Search">Search Ads</option>
                            <option value="Display">Display Ads</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <Select 
                            value={formData.status} 
                            onChange={(e) => setFormData({...formData, status: e.target.value as Campaign['status']})}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Active">Active</option>
                            <option value="Paused">Paused</option>
                        </Select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget ($)</label>
                    <Input 
                        type="number"
                        value={formData.budget} 
                        onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})} 
                        min={0}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                        <Input 
                            type="date"
                            value={formData.start_date} 
                            onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                        <Input 
                            type="date"
                            value={formData.end_date} 
                            onChange={(e) => setFormData({...formData, end_date: e.target.value})} 
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Campaign'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
