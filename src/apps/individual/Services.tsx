import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { individualService, ServiceBooking } from '../../services/individualService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { sanitizeText } from '../../utils/sanitization';

const bookingSchema = z.object({
  service_name: z.string().min(3, 'Service name must be at least 3 characters').max(100, 'Service name too long'),
  service_provider: z.string().min(2, 'Provider name required').max(100, 'Provider name too long'),
  booking_date: z.string().min(1, 'Booking date is required'),
  booking_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  duration_minutes: z.number().min(15, 'Minimum duration is 15 minutes').max(480, 'Maximum duration is 8 hours'),
  price: z.number().min(0, 'Price must be positive'),
  location: z.string().min(1, 'Location is required').max(200, 'Location too long')
});

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const IndividualServices: React.FC<Props> = ({ activeTab }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  
  // Form state
  const [bookingForm, setBookingForm] = useState({
    service_name: '',
    service_provider: '',
    booking_date: '',
    booking_time: '10:00',
    duration_minutes: 60,
    price: 0,
    location: ''
  });

  // Sample services to book
  const availableServices = [
    { name: 'Career Coaching', provider: 'Career Pro', price: 150, duration: 60, icon: 'BriefcaseIcon' },
    { name: 'Personal Training', provider: 'FitLife Gym', price: 75, duration: 45, icon: 'HeartIcon' },
    { name: 'Language Tutoring', provider: 'LinguaLearn', price: 50, duration: 60, icon: 'LanguageIcon' },
    { name: 'Financial Planning', provider: 'MoneyWise', price: 200, duration: 90, icon: 'CurrencyDollarIcon' },
    { name: 'Mental Health Counseling', provider: 'MindCare', price: 120, duration: 50, icon: 'SparklesIcon' },
    { name: 'Music Lessons', provider: 'Harmony Studio', price: 65, duration: 45, icon: 'MusicalNoteIcon' }
  ];

  useEffect(() => {
    loadBookings();
  }, [user?.id]);

  const loadBookings = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await individualService.getBookings(user.id);
    setBookings(data);
    setLoading(false);
  };

  const filteredBookings = useMemo(() => {
    if (filter === 'all') return bookings;
    return bookings.filter(b => b.status === filter);
  }, [bookings, filter]);

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const groups: { [key: string]: ServiceBooking[] } = {};
    filteredBookings.forEach(booking => {
      const date = booking.booking_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(booking);
    });
    return groups;
  }, [filteredBookings]);

  const handleServiceSelect = (service: typeof availableServices[0]) => {
    setBookingForm({
      service_name: service.name,
      service_provider: service.provider,
      booking_date: '',
      booking_time: '10:00',
      duration_minutes: service.duration,
      price: service.price,
      location: 'Virtual'
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async () => {
    if (!user?.id) {
      addToast('User not authenticated', 'error');
      return;
    }
    
    // Sanitize inputs
    const sanitized = {
      service_name: sanitizeText(bookingForm.service_name),
      service_provider: sanitizeText(bookingForm.service_provider),
      booking_date: bookingForm.booking_date,
      booking_time: bookingForm.booking_time,
      duration_minutes: bookingForm.duration_minutes,
      price: bookingForm.price,
      location: sanitizeText(bookingForm.location)
    };
    
    // Validate
    const result = bookingSchema.safeParse(sanitized);
    if (!result.success) {
      addToast(`Validation error: ${result.error.issues[0].message}`, 'error');
      return;
    }

    const bookingResult = await individualService.createBooking(user.id, result.data);
    if (bookingResult) {
      addToast('Booking created successfully!', 'success');
      setShowBookingModal(false);
      setBookingForm({
        service_name: '',
        service_provider: '',
        booking_date: '',
        booking_time: '10:00',
        duration_minutes: 60,
        price: 0,
        location: ''
      });
      loadBookings();
    } else {
      addToast('Failed to create booking', 'error');
    }
  };

  const getStatusColor = (status: ServiceBooking['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getServiceIcon = (serviceName: string) => {
    const service = availableServices.find(s => s.name === serviceName);
    return service?.icon || 'CalendarIcon';
  };

  const upcomingCount = bookings.filter(b => b.status === 'upcoming').length;

  if (loading) {
    return (
      <div className="animate-fadeIn space-y-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-white">{activeTab}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Book services and manage your appointments</p>
        </div>
        <div className="flex items-center gap-3">
          {upcomingCount > 0 && (
            <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {upcomingCount} upcoming booking{upcomingCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <Button variant="primary" onClick={() => setShowBookingModal(true)}>
            <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Available Services */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Available Services</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {availableServices.map(service => (
            <motion.button
              key={service.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleServiceSelect(service)}
              className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-xl text-left hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                <Icon name={service.icon} className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{service.name}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">{service.provider}</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-2">${service.price}</p>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            {f === 'all' ? 'All Bookings' : f}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="CalendarIcon" className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bookings found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filter === 'all' 
              ? 'Book a service to get started' 
              : `No ${filter} bookings`}
          </p>
          {filter === 'all' && (
            <Button variant="primary" onClick={() => setShowBookingModal(true)}>
              Book a Service
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBookings)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, dateBookings]) => (
              <div key={date}>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <div className="space-y-3">
                  <AnimatePresence>
                    {dateBookings.map((booking, idx) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                booking.status === 'upcoming' 
                                  ? 'bg-blue-100 dark:bg-blue-900/30' 
                                  : booking.status === 'completed'
                                    ? 'bg-green-100 dark:bg-green-900/30'
                                    : 'bg-gray-100 dark:bg-gray-800'
                              }`}>
                                <Icon 
                                  name={getServiceIcon(booking.service_name)} 
                                  className={`w-6 h-6 ${
                                    booking.status === 'upcoming' 
                                      ? 'text-blue-600 dark:text-blue-400' 
                                      : booking.status === 'completed'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                  }`} 
                                />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{booking.service_name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {booking.service_provider} • {booking.booking_time} • {booking.duration_minutes} min
                                </p>
                                {booking.location && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                                    <Icon name="MapPinIcon" className="w-3 h-3" />
                                    {booking.location}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                ${booking.price}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">New Booking</h3>
              <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                <Icon name="XMarkIcon" className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Service Selection */}
              {!bookingForm.service_name ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select a Service
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableServices.map(service => (
                      <button
                        key={service.name}
                        onClick={() => setBookingForm(f => ({
                          ...f,
                          service_name: service.name,
                          service_provider: service.provider,
                          duration_minutes: service.duration,
                          price: service.price
                        }))}
                        className="p-3 border border-gray-200 dark:border-slate-700 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                      >
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{service.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">${service.price}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Selected Service */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-blue-900 dark:text-blue-100">{bookingForm.service_name}</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{bookingForm.service_provider}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">${bookingForm.price}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{bookingForm.duration_minutes} min</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setBookingForm(f => ({ ...f, service_name: '', service_provider: '' }))}
                      className="text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline"
                    >
                      Change service
                    </button>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={bookingForm.booking_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingForm(f => ({ ...f, booking_date: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time
                    </label>
                    <select
                      value={bookingForm.booking_time}
                      onChange={(e) => setBookingForm(f => ({ ...f, booking_time: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <select
                      value={bookingForm.location}
                      onChange={(e) => setBookingForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      <option value="Virtual">Virtual (Online)</option>
                      <option value="In-Person">In-Person</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowBookingModal(false)}>Cancel</Button>
              {bookingForm.service_name && (
                <Button variant="primary" onClick={handleBookingSubmit}>
                  <Icon name="CheckIcon" className="w-4 h-4 mr-2" />
                  Confirm Booking
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default IndividualServices;
