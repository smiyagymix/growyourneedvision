import React, { useState, useEffect, useMemo } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Heading1, Heading2, Text } from '../../components/shared/ui/Typography';
import { Card } from '../../components/shared/ui/Card';
import { Button } from '../../components/shared/ui/Button';
import { Tabs } from '../../components/shared/ui/Tabs';
import { Modal, Icon } from '../../components/shared/ui/CommonUI';
import { Badge } from '../../components/shared/ui/Badge';
import { Input } from '../../components/shared/ui/Input';
import pb from '../../lib/pocketbase';
import { Service, Booking } from './types';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { z } from 'zod';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import env from '../../config/environment';

interface ServicesProps {
    activeTab?: string;
    activeSubNav?: string;
}

const Services: React.FC<ServicesProps> = ({ activeTab, activeSubNav }) => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const [localTab, setLocalTab] = useState('Offerings');
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingView, setBookingView] = useState<'Table' | 'Calendar'>('Table');

    // Service Modal State
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [newService, setNewService] = useState<Partial<Service>>({
        name: '',
        description: '',
        price: 0,
        duration_minutes: 60,
        category: 'Extra Class'
    });

    const apiBase = env.get('apiUrl') || '/api';
    const serviceApiKey = env.get('serviceApiKey');
    const tenantId = user?.tenantId;
    const isAdmin = useMemo(() => ['Owner', 'SchoolAdmin', 'Admin'].includes((user as any)?.role), [user]);

    useEffect(() => {
        if (localTab === 'Offerings') {
            fetchServices();
        } else if (localTab === 'Bookings') {
            fetchBookings();
        }
    }, [localTab]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await pb.collection('school_services').getList<Service>(1, 50, { sort: 'name', filter: user?.tenantId ? `tenantId = "${user.tenantId}"` : undefined });
            setServices(res.items);
        } catch (e) {
            console.error("Error fetching services:", e);
            addToast('Failed to load services', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await pb.collection('school_bookings').getList<Booking>(1, 50, {
                expand: 'service,parent,student',
                sort: '-created',
                filter: user?.tenantId ? `tenantId = "${user.tenantId}"` : undefined
            });
            setBookings(res.items);
        } catch (e) {
            console.error("Error fetching bookings:", e);
            addToast('Failed to load bookings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (bookingId: string) => {
        try {
            await pb.collection('school_bookings').update(bookingId, { payment_status: 'Paid' });
            addToast('Marked as paid', 'success');
            fetchBookings();
        } catch (e) {
            console.error('Failed to mark paid', e);
            addToast('Failed to mark as paid', 'error');
        }
    };

    const handleRefund = async (bookingId: string) => {
        try {
            await pb.collection('school_bookings').update(bookingId, { payment_status: 'Refunded' });
            addToast('Marked as refunded', 'success');
            fetchBookings();
        } catch (e) {
            console.error('Failed to refund', e);
            addToast('Failed to refund', 'error');
        }
    };

    const downloadServicesCsv = async () => {
        if (!isAdmin) {
            addToast('Only admins can export services', 'warning');
            return;
        }
        try {
            const res = await fetch(`${apiBase}/school/services/export`, {
                headers: {
                    'x-api-key': serviceApiKey,
                    'x-tenant-id': tenantId || '',
                    'x-user-role': user?.role || 'Admin'
                }
            });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'services.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed', e);
            addToast('Failed to export services', 'error');
        }
    };

    const groupedBookings = useMemo(() => {
        const map: Record<string, Booking[]> = {};
        bookings.forEach(b => {
            const key = new Date(b.date).toISOString().split('T')[0];
            map[key] = map[key] || [];
            map[key].push(b);
        });
        return map;
    }, [bookings]);

    const handleCreateService = async () => {
        try {
            const price = Number(newService.price ?? 0);
            const duration = Number(newService.duration_minutes ?? 0);

            // Sanitize
            const sanitized = {
                name: sanitizeText(newService.name || ''),
                description: sanitizeHtml(newService.description || '', 'BASIC'),
                price,
                duration_minutes: duration,
                category: newService.category || 'Extra Class',
                tenantId: user?.tenantId || ''
            } as const;

            // Validation
            const serviceSchema = z.object({
                name: z.string().min(3, 'Name must be at least 3 characters').max(200),
                description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
                price: z.number().min(0, 'Price cannot be negative'),
                duration_minutes: z.number().min(1, 'Duration must be positive').max(24 * 60, 'Duration too long'),
                category: z.enum(['Extra Class', 'Consultation', 'Workshop', 'Tutoring', 'Other']),
                tenantId: z.string().optional()
            });

            const result = serviceSchema.safeParse(sanitized);
            if (!result.success) {
                addToast(`Validation error: ${result.error.issues[0].message}`, 'error');
                return;
            }

            await pb.collection('school_services').create(result.data as any);
            setIsServiceModalOpen(false);
            fetchServices();
            setNewService({
                name: '',
                description: '',
                price: 0,
                duration_minutes: 60,
                category: 'Extra Class'
            });
            addToast('Service created', 'success');
        } catch (e) {
            console.error('Failed to create service', e);
            addToast('Failed to create service', 'error');
        }
    };

    const handleDeleteService = async (id: string) => {
        if (confirm('Are you sure you want to delete this service?')) {
            try {
                await pb.collection('school_services').delete(id);
                fetchServices();
                addToast('Service deleted', 'success');
            } catch (e) {
                addToast('Failed to delete service', 'error');
            }
        }
    };

    const updateBookingStatus = async (id: string, status: Booking['status']) => {
        try {
            if (status === 'Confirmed') {
                // Prevent double booking for same service/student/date
                const booking = bookings.find(b => b.id === id);
                if (booking) {
                    const conflicts = await pb.collection('school_bookings').getList(1, 1, {
                        filter: `service = "${booking.service}" && date = "${booking.date}" && student = "${booking.student}" && status = "Confirmed" && id != "${id}"`,
                        requestKey: null
                    });
                    if (conflicts.items.length > 0) {
                        addToast('Booking conflict detected for this student/time.', 'error');
                        return;
                    }
                }
            }
            await pb.collection('school_bookings').update(id, { status, tenantId: user?.tenantId });
            fetchBookings();
            addToast('Booking updated', 'success');
        } catch (e) {
            addToast('Failed to update booking status', 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex justify-between items-end">
                <div>
                    <Heading1>Services Management</Heading1>
                    <Text variant="muted">Manage school services and bookings.</Text>
                </div>
                <div className="flex gap-3">
                    {localTab === 'Offerings' && (
                        <Button variant="primary" leftIcon={<Icon name="PlusCircleIcon" className="w-4 h-4" />} onClick={() => setIsServiceModalOpen(true)}>Add Service</Button>
                    )}
                    {localTab === 'Bookings' && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setBookingView(bookingView === 'Table' ? 'Calendar' : 'Table')}>
                                {bookingView === 'Table' ? 'Calendar View' : 'Table View'}
                            </Button>
                            <Button variant="ghost" onClick={downloadServicesCsv} disabled={!isAdmin}>Export Services</Button>
                        </div>
                    )}
                </div>
            </div>

            <Card padding="none" className="min-h-[600px]">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <Tabs tabs={['Offerings', 'Bookings']} activeTab={localTab} onTabChange={setLocalTab} />
                </div>

                <div className="p-6">
                    {localTab === 'Offerings' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? <div>Loading services...</div> : services.map(service => (
                                <div key={service.id} className="p-6 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:shadow-md transition-all relative group">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDeleteService(service.id)} className="text-gray-400 hover:text-red-600"><Icon name="TrashIcon" className="w-5 h-5" /></button>
                                    </div>
                                    <div className="flex justify-between items-start mb-3">
                                        <Badge variant="neutral">{service.category}</Badge>
                                        <span className="font-bold text-lg text-green-600">${service.price}</span>
                                    </div>
                                    <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">{service.name}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3">{service.description}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Icon name="ClockIcon" className="w-4 h-4" />
                                        <span>{service.duration_minutes} mins</span>
                                    </div>
                                </div>
                            ))}
                            {services.length === 0 && !loading && (
                                <div className="col-span-full text-center py-10 text-gray-400">No services found. Create one to get started.</div>
                            )}
                        </div>
                    )}

                    {localTab === 'Bookings' && bookingView === 'Table' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-slate-700">
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Service</th>
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Parent</th>
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Student</th>
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Date</th>
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Status</th>
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Payment</th>
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? <tr><td colSpan={7} className="p-8 text-center">Loading bookings...</td></tr> : bookings.map(booking => (
                                        <tr key={booking.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="p-4 font-bold text-gray-900 dark:text-white">{booking.expand?.service?.name}</td>
                                            <td className="p-4 text-gray-700 dark:text-gray-300">
                                                <div className="font-bold">{booking.expand?.parent?.name}</div>
                                                <div className="text-xs text-gray-500">{booking.expand?.parent?.email}</div>
                                            </td>
                                            <td className="p-4 text-gray-700 dark:text-gray-300">{booking.expand?.student?.name || '-'}</td>
                                            <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(booking.date).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <Badge variant={booking.status === 'Confirmed' ? 'success' : booking.status === 'Cancelled' ? 'danger' : booking.status === 'Completed' ? 'neutral' : 'warning'}>
                                                    {booking.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={booking.payment_status === 'Paid' ? 'success' : booking.payment_status === 'Refunded' ? 'neutral' : 'warning'}>
                                                    {booking.payment_status || 'Unpaid'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                {booking.status === 'Pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => updateBookingStatus(booking.id, 'Cancelled')}>Reject</Button>
                                                        <Button size="sm" variant="primary" onClick={() => updateBookingStatus(booking.id, 'Confirmed')}>Approve</Button>
                                                    </div>
                                                )}
                                                {booking.status === 'Confirmed' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, 'Completed')}>Mark Complete</Button>
                                                        {booking.payment_status !== 'Paid' && <Button size="sm" variant="primary" onClick={() => handleMarkPaid(booking.id)}>Mark Paid</Button>}
                                                    </div>
                                                )}
                                                {booking.payment_status === 'Paid' && (
                                                    <Button size="sm" variant="ghost" onClick={() => handleRefund(booking.id)}>Refund</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {bookings.length === 0 && !loading && (
                                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">No bookings found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {localTab === 'Bookings' && bookingView === 'Calendar' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.keys(groupedBookings).length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-500">No bookings to display.</div>
                            )}
                            {Object.entries(groupedBookings).map(([date, items]) => (
                                <Card key={date} className="p-4 border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <Heading2 className="text-lg">{new Date(date).toLocaleDateString()}</Heading2>
                                            <Text variant="muted">{items.length} booking{items.length > 1 ? 's' : ''}</Text>
                                        </div>
                                        <Badge variant="neutral">{items.length}</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {items.map(item => (
                                            <div key={item.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                                                <div className="flex justify-between text-sm font-semibold text-gray-800">
                                                    <span>{item.expand?.service?.name}</span>
                                                    <Badge variant={item.status === 'Confirmed' ? 'success' : item.status === 'Cancelled' ? 'danger' : 'warning'}>{item.status}</Badge>
                                                </div>
                                                <div className="text-xs text-gray-500">Parent: {item.expand?.parent?.name}</div>
                                                <div className="text-xs text-gray-500">Student: {item.expand?.student?.name || '-'}</div>
                                                <div className="text-xs text-gray-500">Payment: {item.payment_status || 'Unpaid'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Create Service Modal */}
            <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} title="Add New Service">
                <div className="space-y-4">
                    <Input 
                        label="Service Name" 
                        placeholder="e.g. School Bus Zone A" 
                        value={newService.name} 
                        onChange={e => setNewService({ ...newService, name: e.target.value })} 
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                            value={newService.category}
                            onChange={e => setNewService({ ...newService, category: e.target.value as any })}
                        >
                            <option value="Transport">Transport</option>
                            <option value="Canteen">Canteen</option>
                            <option value="Extra Class">Extra Class</option>
                            <option value="Health">Health</option>
                        </select>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input 
                                label="Price ($)" 
                                type="number" 
                                value={newService.price} 
                                onChange={e => setNewService({ ...newService, price: Number(e.target.value) })} 
                            />
                        </div>
                        <div className="flex-1">
                            <Input 
                                label="Duration (mins)" 
                                type="number" 
                                value={newService.duration_minutes} 
                                onChange={e => setNewService({ ...newService, duration_minutes: Number(e.target.value) })} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                            rows={3}
                            value={newService.description}
                            onChange={e => setNewService({ ...newService, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsServiceModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateService}>Create Service</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Services;
