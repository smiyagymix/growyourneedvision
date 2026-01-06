import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Heading1, Heading2, Text } from '../../components/shared/ui/Typography';
import { Card } from '../../components/shared/ui/Card';
import { Button } from '../../components/shared/ui/Button';
import { Tabs } from '../../components/shared/ui/Tabs';
import { Modal, Icon } from '../../components/shared/ui/CommonUI';
import { Badge } from '../../components/shared/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import pb from '../../lib/pocketbase';
import { ParentStudentLink, Student, Invoice, Service, Booking, AttendanceRecord, ExamResult } from './types';
import { sanitizeText } from '../../utils/sanitization';

const bookingSchema = z.object({
    service: z.string().min(1, 'Service is required'),
    student: z.string().min(1, 'Student is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    notes: z.string().max(500, 'Notes too long').optional()
});

const paymentSchema = z.object({
    invoiceId: z.string().min(1),
    amount: z.number().positive('Amount must be positive'),
    status: z.enum(['Paid', 'Pending', 'Overdue'])
});

interface ParentPortalProps {
    activeTab?: string;
}

const ParentPortal: React.FC<ParentPortalProps> = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [localTab, setLocalTab] = useState('My Children');
    const [children, setChildren] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    // Data for children
    const [selectedChild, setSelectedChild] = useState<Student | null>(null);
    const [childAttendance, setChildAttendance] = useState<AttendanceRecord[]>([]);
    const [childResults, setChildResults] = useState<ExamResult[]>([]);

    // Fees
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Services & Bookings
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [newBooking, setNewBooking] = useState<{ service: string; student: string; date: string; notes: string }>({
        service: '',
        student: '',
        date: '',
        notes: ''
    });

    useEffect(() => {
        if (user) {
            fetchChildren();
            fetchServices();
        }
    }, [user]);

    useEffect(() => {
        if (children.length > 0) {
            fetchInvoices();
            fetchBookings();
        }
    }, [children]);

    const fetchChildren = async () => {
        if (!user) return;
        try {
            const links = await pb.collection('parent_student_links').getFullList<ParentStudentLink>({
                filter: `parent="${user.id}"`,
                expand: 'student'
            });
            const kids = links.map(l => l.expand?.student).filter((s): s is Student => !!s);
            setChildren(kids);
        } catch (e) {
            console.error("Error fetching children:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchChildDetails = async (child: Student) => {
        setSelectedChild(child);
        try {
            const [att, res] = await Promise.all([
                pb.collection('attendance_records').getFullList<AttendanceRecord>({
                    filter: `student="${child.id}"`,
                    sort: '-date'
                }),
                pb.collection('exam_results').getFullList<ExamResult>({
                    filter: `student="${child.id}"`,
                    expand: 'exam,exam.subject',
                    sort: '-created'
                })
            ]);
            setChildAttendance(att);
            setChildResults(res);
        } catch (e) {
            console.error("Error fetching child details:", e);
        }
    };

    const fetchInvoices = async () => {
        if (children.length === 0) return;
        try {
            // Construct filter for all children
            const filter = children.map(c => `student="${c.id}"`).join(' || ');
            const res = await pb.collection('school_invoices').getFullList<Invoice>({
                filter: `(${filter})`,
                expand: 'student,fee',
                sort: '-due_date'
            });
            setInvoices(res);
        } catch (e) {
            console.error("Error fetching invoices:", e);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await pb.collection('school_services').getFullList<Service>({ sort: 'name' });
            setServices(res);
        } catch (e) {
            console.error("Error fetching services:", e);
        }
    };

    const fetchBookings = async () => {
        if (!user) return;
        try {
            const res = await pb.collection('school_bookings').getFullList<Booking>({
                filter: `parent="${user.id}"`,
                expand: 'service,student',
                sort: '-date'
            });
            setBookings(res);
        } catch (e) {
            console.error("Error fetching bookings:", e);
        }
    };

    const { showToast } = useToast();

    const handlePayInvoice = async (invoice: Invoice) => {
        // Validate payment data
        const paymentData = {
            invoiceId: invoice.id,
            amount: invoice.amount,
            status: 'Paid' as const
        };
        
        const result = paymentSchema.safeParse(paymentData);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        if (confirm(`Pay $${invoice.amount} for ${invoice.expand?.fee?.name}?`)) {
            try {
                await pb.collection('school_invoices').update(invoice.id, { 
                    status: 'Paid', 
                    paid_date: new Date().toISOString() 
                });
                fetchInvoices();
            } catch (e) {
                showToast("Payment failed", "error");
            }
        }
    };

    const handleBookService = async () => {
        if (!user) return;
        
        // Sanitize notes
        const sanitized = {
            ...newBooking,
            notes: sanitizeText(newBooking.notes)
        };
        
        // Validate booking data
        const result = bookingSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            await pb.collection('school_bookings').create({
                ...result.data,
                parent: user.id,
                status: 'Pending'
            });
            setIsBookingModalOpen(false);
            fetchBookings();
            setNewBooking({ service: '', student: '', date: '', notes: '' });
        } catch (e) {
            showToast("Booking failed", "error");
        }
    };

    if (!user) return <div className="p-10 text-center">Please log in to view the Parent Portal.</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex justify-between items-end">
                <div>
                    <Heading1>Parent Portal</Heading1>
                    <Text variant="muted">Monitor your children's progress and manage school services.</Text>
                </div>
                <div className="flex gap-3">
                    <Button variant="primary" leftIcon={<Icon name="CalendarIcon" className="w-4 h-4" />} onClick={() => setIsBookingModalOpen(true)}>Book Service</Button>
                </div>
            </div>

            <Card padding="none" className="min-h-[600px]">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <Tabs tabs={['My Children', 'Fees & Payments', 'Services & Bookings']} activeTab={localTab} onTabChange={setLocalTab} />
                </div>

                <div className="p-6">
                    {localTab === 'My Children' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Children List */}
                            <div className="space-y-4">
                                {loading ? <div>Loading children...</div> : children.map(child => (
                                    <div 
                                        key={child.id} 
                                        onClick={() => fetchChildDetails(child)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedChild?.id === child.id ? 'border-gyn-blue-medium bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-blue-300'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                                                {child.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">{child.name}</h3>
                                                <p className="text-sm text-gray-500">{child.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {children.length === 0 && !loading && (
                                    <div className="text-center py-10 text-gray-400">No children linked to your account. Please contact school administration.</div>
                                )}
                            </div>

                            {/* Child Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {selectedChild ? (
                                    <>
                                        <Card className="bg-gray-50 dark:bg-slate-800/50">
                                            <Heading2>{selectedChild.name}'s Overview</Heading2>
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                    <div className="text-sm text-gray-500">Attendance Rate</div>
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {childAttendance.length > 0 
                                                            ? Math.round((childAttendance.filter(a => a.status === 'Present').length / childAttendance.length) * 100) 
                                                            : 0}%
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                    <div className="text-sm text-gray-500">Recent Grade</div>
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        {childResults.length > 0 ? childResults[0].grade || childResults[0].marks_obtained : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                        <div>
                                            <h3 className="font-bold text-lg mb-3">Recent Attendance</h3>
                                            <div className="space-y-2">
                                                {childAttendance.slice(0, 5).map(att => (
                                                    <div key={att.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg">
                                                        <span>{new Date(att.date).toLocaleDateString()}</span>
                                                        <Badge variant={att.status === 'Present' ? 'success' : att.status === 'Absent' ? 'danger' : 'warning'}>{att.status}</Badge>
                                                    </div>
                                                ))}
                                                {childAttendance.length === 0 && <div className="text-gray-500 italic">No attendance records found.</div>}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-lg mb-3">Exam Results</h3>
                                            <div className="space-y-2">
                                                {childResults.map(res => (
                                                    <div key={res.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg">
                                                        <div>
                                                            <div className="font-bold">{res.expand?.exam?.name}</div>
                                                            <div className="text-xs text-gray-500">{res.expand?.exam?.expand?.subject?.name}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-lg">{res.marks_obtained}/{res.expand?.exam?.total_marks}</div>
                                                            <div className="text-xs text-gray-500">{new Date(res.created).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {childResults.length === 0 && <div className="text-gray-500 italic">No exam results found.</div>}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                        Select a child to view details
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {localTab === 'Fees & Payments' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-slate-700">
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Student</th>
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Fee Description</th>
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Amount</th>
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Status</th>
                                        <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="p-4 font-bold text-gray-900 dark:text-white">{inv.expand?.student?.name}</td>
                                            <td className="p-4 text-gray-700 dark:text-gray-300">{inv.expand?.fee?.name}</td>
                                            <td className="p-4 font-bold text-gray-900 dark:text-white">${inv.amount}</td>
                                            <td className="p-4">
                                                <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'danger' : 'warning'}>{inv.status}</Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                {inv.status !== 'Paid' && (
                                                    <Button size="sm" variant="primary" onClick={() => handlePayInvoice(inv)}>Pay Now</Button>
                                                )}
                                                {inv.status === 'Paid' && (
                                                    <span className="text-xs text-gray-500">Paid on {new Date(inv.paid_date).toLocaleDateString()}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {invoices.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No invoices found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {localTab === 'Services & Bookings' && (
                        <div className="space-y-8">
                            {/* Available Services */}
                            <div>
                                <h3 className="font-bold text-lg mb-4">Available Services</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {services.map(service => (
                                        <div key={service.id} className="p-4 border border-gray-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all bg-white dark:bg-slate-800">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="neutral">{service.category}</Badge>
                                                <span className="font-bold text-green-600">${service.price}</span>
                                            </div>
                                            <h4 className="font-bold text-lg mb-1">{service.name}</h4>
                                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{service.description}</p>
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => {
                                                setNewBooking(prev => ({ ...prev, service: service.id }));
                                                setIsBookingModalOpen(true);
                                            }}>Book Now</Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* My Bookings */}
                            <div>
                                <h3 className="font-bold text-lg mb-4">My Bookings</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-slate-700">
                                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Service</th>
                                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">For Student</th>
                                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Date</th>
                                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-sm">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.map(booking => (
                                                <tr key={booking.id} className="border-b border-gray-100 dark:border-slate-800">
                                                    <td className="p-4 font-bold">{booking.expand?.service?.name}</td>
                                                    <td className="p-4">{booking.expand?.student?.name || 'N/A'}</td>
                                                    <td className="p-4">{new Date(booking.date).toLocaleDateString()}</td>
                                                    <td className="p-4"><Badge variant={booking.status === 'Confirmed' ? 'success' : booking.status === 'Cancelled' ? 'danger' : 'warning'}>{booking.status}</Badge></td>
                                                </tr>
                                            ))}
                                            {bookings.length === 0 && (
                                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No bookings found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Booking Modal */}
            <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Book Service">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Service</label>
                        <select 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                            value={newBooking.service}
                            onChange={e => setNewBooking({ ...newBooking, service: e.target.value })}
                        >
                            <option value="">Select Service</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">For Child (Optional)</label>
                        <select 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                            value={newBooking.student}
                            onChange={e => setNewBooking({ ...newBooking, student: e.target.value })}
                        >
                            <option value="">Select Child</option>
                            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input 
                            type="date" 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                            value={newBooking.date}
                            onChange={e => setNewBooking({ ...newBooking, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                            value={newBooking.notes}
                            onChange={e => setNewBooking({ ...newBooking, notes: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleBookService}>Confirm Booking</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ParentPortal;
