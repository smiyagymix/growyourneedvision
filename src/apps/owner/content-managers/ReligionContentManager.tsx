import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, Button, Icon, Modal } from '../../../components/shared/ui/CommonUI';
import { religionService, PrayerTime, ReligiousEvent, ReligiousResource } from '../../../services/religionService';
import { useToast } from '../../../hooks/useToast';
import { sanitizeText, sanitizeHtml } from '../../../utils/sanitization';
import { urlSchema } from '../../../validation/schemas';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  event_type: z.enum(['Community', 'Prayer', 'Lecture', 'Charity', 'Other']),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  location: z.string().max(200, 'Location too long').optional(),
  organizer: z.string().max(100, 'Organizer name too long').optional()
});

const resourceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(['Article', 'Video', 'Audio', 'Book', 'Other']),
  content: z.string().optional(),
  url: urlSchema.optional(),
  author: z.string().max(100, 'Author name too long').optional(),
  tags: z.array(z.string()).optional()
});

export const ReligionContentManager: React.FC = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'prayers' | 'events' | 'quran' | 'resources'>('prayers');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Data States
    const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
    const [events, setEvents] = useState<ReligiousEvent[]>([]);
    const [resources, setResources] = useState<ReligiousResource[]>([]);

    // Form States
    const [eventForm, setEventForm] = useState<Partial<ReligiousEvent>>({
        title: '',
        description: '',
        event_type: 'Community',
        date: '',
        time: '',
        location: '',
        organizer: ''
    });

    const [resourceForm, setResourceForm] = useState<Partial<ReligiousResource>>({
        title: '',
        description: '',
        category: 'Article',
        content: '',
        url: '',
        author: '',
        tags: []
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'prayers') {
                // For admin, maybe list recent prayer times or allow searching by date
                // For now, let's just fetch today's
                const today = new Date().toISOString().split('T')[0];
                const data = await religionService.getPrayerTimes(today);
                setPrayerTimes(data ? [data] : []);
            } else if (activeTab === 'events') {
                const data = await religionService.getUpcomingEvents();
                setEvents(data);
            } else if (activeTab === 'resources') {
                const data = await religionService.getResources();
                setResources(data);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEvent = async () => {
        // Sanitize inputs
        const sanitized = {
            ...eventForm,
            title: sanitizeText(eventForm.title || ''),
            description: sanitizeHtml(eventForm.description || '', 'BASIC'),
            location: sanitizeText(eventForm.location || ''),
            organizer: sanitizeText(eventForm.organizer || '')
        };
        
        // Validate
        const result = eventSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            if (editingItem) {
                await religionService.updateEvent(editingItem.id, result.data);
                showToast('Event updated successfully', 'success');
            } else {
                await religionService.createEvent(result.data);
                showToast('Event created successfully', 'success');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            showToast('Failed to save event', 'error');
        }
    };

    const handleSaveResource = async () => {
        // Sanitize inputs
        const sanitized = {
            ...resourceForm,
            title: sanitizeText(resourceForm.title || ''),
            description: sanitizeHtml(resourceForm.description || '', 'BASIC'),
            content: sanitizeHtml(resourceForm.content || '', 'RICH'),
            author: sanitizeText(resourceForm.author || '')
        };
        
        // Validate
        const result = resourceSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            if (editingItem) {
                await religionService.updateResource(editingItem.id, result.data);
                showToast('Resource updated successfully', 'success');
            } else {
                await religionService.createResource(result.data);
                showToast('Resource created successfully', 'success');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            showToast('Failed to save resource', 'error');
        }
    };

    const handleDelete = async (id: string, type: 'event' | 'resource') => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            if (type === 'event') {
                await religionService.deleteEvent(id);
            } else {
                await religionService.deleteResource(id);
            }
            showToast('Item deleted successfully', 'success');
            loadData();
        } catch (error) {
            showToast('Failed to delete item', 'error');
        }
    };

    const openModal = (item?: any) => {
        setEditingItem(item);
        if (activeTab === 'events') {
            setEventForm(item || {
                title: '',
                description: '',
                event_type: 'Community',
                date: '',
                time: '',
                location: '',
                organizer: ''
            });
        } else if (activeTab === 'resources') {
            setResourceForm(item || {
                title: '',
                description: '',
                category: 'Article',
                content: '',
                url: '',
                author: '',
                tags: []
            });
        }
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Religion Manager</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage prayer times, events, and Islamic content</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData}>
                        <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {activeTab !== 'prayers' && activeTab !== 'quran' && (
                        <Button variant="primary" onClick={() => openModal()}>
                            <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                            Add New
                        </Button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-1">
                {[
                    { id: 'prayers', label: 'Prayer Times', icon: 'ClockIcon' },
                    { id: 'events', label: 'Events', icon: 'CalendarIcon' },
                    { id: 'quran', label: 'Quran & Hadith', icon: 'BookOpenIcon' },
                    { id: 'resources', label: 'Resources', icon: 'DocumentTextIcon' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative ${
                            activeTab === tab.id
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <Icon name={tab.icon} className="w-4 h-4" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <Card className="p-6 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'prayers' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">Today's Prayer Times</h3>
                                    <Button variant="outline" size="sm">Sync from API</Button>
                                </div>
                                {prayerTimes.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(prayer => (
                                            <div key={prayer} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                                                <div className="text-sm text-gray-500 mb-1">{prayer}</div>
                                                <div className="text-xl font-bold text-emerald-600">
                                                    {prayerTimes[0][prayer.toLowerCase() as keyof PrayerTime]}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No prayer times found for today.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'events' && (
                            <div className="space-y-4">
                                {events.map(event => (
                                    <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white">{event.title}</h4>
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                    {event.event_type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {new Date(event.date).toLocaleDateString()} at {event.time} • {event.location}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openModal(event)}>
                                                <Icon name="PencilIcon" className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(event.id, 'event')}>
                                                <Icon name="TrashIcon" className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {events.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        No upcoming events found.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'resources' && (
                            <div className="space-y-4">
                                {resources.map(resource => (
                                    <div key={resource.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white">{resource.title}</h4>
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {resource.category}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                                {resource.description}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openModal(resource)}>
                                                <Icon name="PencilIcon" className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(resource.id, 'resource')}>
                                                <Icon name="TrashIcon" className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {resources.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        No resources found.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'quran' && (
                            <div className="text-center py-12">
                                <Icon name="BookOpenIcon" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quran Management</h3>
                                <p className="text-gray-500 mt-2">
                                    Quran content is managed via external API integration.
                                    <br />
                                    Custom interpretations can be added here in future updates.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${editingItem ? 'Edit' : 'Add'} ${activeTab === 'events' ? 'Event' : 'Resource'}`}
            >
                <div className="space-y-4">
                    {activeTab === 'events' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    value={eventForm.title}
                                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                        value={eventForm.date}
                                        onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                    <input
                                        type="time"
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                        value={eventForm.time}
                                        onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    value={eventForm.event_type}
                                    onChange={e => setEventForm({ ...eventForm, event_type: e.target.value as any })}
                                >
                                    <option value="Community">Community</option>
                                    <option value="Prayer">Prayer</option>
                                    <option value="Holiday">Holiday</option>
                                    <option value="Sermon">Sermon</option>
                                    <option value="Study Circle">Study Circle</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    value={eventForm.location}
                                    onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    rows={3}
                                    value={eventForm.description}
                                    onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'resources' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    value={resourceForm.title}
                                    onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    value={resourceForm.category}
                                    onChange={e => setResourceForm({ ...resourceForm, category: e.target.value as any })}
                                >
                                    <option value="Article">Article</option>
                                    <option value="Video">Video</option>
                                    <option value="Book">Book</option>
                                    <option value="Lecture">Lecture</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL (Optional)</label>
                                <input
                                    type="url"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    value={resourceForm.url}
                                    onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    rows={3}
                                    value={resourceForm.description}
                                    onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={activeTab === 'events' ? handleSaveEvent : handleSaveResource}>
                            {editingItem ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
