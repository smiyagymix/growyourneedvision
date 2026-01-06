import React, { useState, useEffect, useMemo } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, 
  Clock, MapPin, Tag, X, Save, Trash2, Edit3, AlertCircle,
  Video, Users, BookOpen, Briefcase, Coffee, Repeat
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { individualService, CalendarEvent } from '../../services/individualService';
import { cn } from '../../lib/utils';
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures';
import { PremiumBanner, PremiumButton, PremiumBadge } from '../../components/shared/ui/PremiumFeatures';
import { z } from 'zod';
import { dateSchema, colorSchema } from '../../validation/schemas';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const calendarEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  start_date: dateSchema,
  end_date: dateSchema,
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  type: z.enum(['task', 'meeting', 'reminder', 'deadline', 'learning', 'wellness']),
  color: colorSchema,
  recurring: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    interval: z.number().min(1).max(365).optional(),
    end_date: z.string().optional()
  }).optional()
});

interface Props {
  activeTab?: string;
  activeSubNav?: string;
}

const EVENT_TYPES: { value: CalendarEvent['type']; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'task', label: 'Task', icon: AlertCircle, color: 'bg-blue-500' },
  { value: 'meeting', label: 'Meeting', icon: Users, color: 'bg-purple-500' },
  { value: 'reminder', label: 'Reminder', icon: Clock, color: 'bg-yellow-500' },
  { value: 'deadline', label: 'Deadline', icon: AlertCircle, color: 'bg-red-500' },
  { value: 'learning', label: 'Learning', icon: BookOpen, color: 'bg-green-500' },
  { value: 'wellness', label: 'Wellness', icon: Coffee, color: 'bg-pink-500' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Calendar: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const { hasFeatureAccess } = usePremiumFeatures();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [eventForm, setEventForm] = useState({
    title: '', description: '', start_date: '', end_date: '', start_time: '09:00', end_time: '10:00',
    type: 'task' as CalendarEvent['type'], color: '#3b82f6', recurring: undefined as CalendarEvent['recurring']
  });
  
  // Premium features
  const hasSmartScheduling = hasFeatureAccess('SMART_SCHEDULING');
  const hasCalendarSync = hasFeatureAccess('CALENDAR_SYNC');
  const hasMeetingAnalytics = hasFeatureAccess('MEETING_ANALYTICS');

  useEffect(() => {
    loadEvents();
  }, [user?.id, currentDate]);

  const loadEvents = async () => {
    if (!user?.id) return;
    setLoading(true);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const data = await individualService.getCalendarEvents(
      user.id,
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    );
    setEvents(data);
    setLoading(false);
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days: { date: Date; isCurrentMonth: boolean; events: CalendarEvent[] }[] = [];
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({ date, isCurrentMonth: false, events: [] });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(e => e.start_date === dateStr);
      days.push({ date, isCurrentMonth: true, events: dayEvents });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false, events: [] });
    }
    
    return days;
  }, [currentDate, events]);

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEventForm(prev => ({ ...prev, start_date: date.toISOString().split('T')[0], end_date: date.toISOString().split('T')[0] }));
  };

  const handleCreateEvent = async () => {
    if (!user?.id || !eventForm.title.trim() || !eventForm.start_date) return;

    // Sanitize inputs
    const sanitized = {
      title: sanitizeText(eventForm.title),
      description: eventForm.description ? sanitizeHtml(eventForm.description, 'BASIC') : undefined,
      start_date: eventForm.start_date,
      end_date: eventForm.end_date || eventForm.start_date,
      start_time: eventForm.start_time,
      end_time: eventForm.end_time,
      type: eventForm.type,
      color: eventForm.color,
      recurring: eventForm.recurring,
    };

    // Validate
    const result = calendarEventSchema.safeParse(sanitized);
    if (!result.success) {
      showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
      return;
    }

    const event = await individualService.createCalendarEvent(user.id, result.data);
    if (event) {
      setEvents(prev => [...prev, event].sort((a, b) => a.start_date.localeCompare(b.start_date)));
      closeModal();
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    const { showToast } = useToast();

    // Sanitize inputs
    const sanitized = {
      title: sanitizeText(eventForm.title),
      description: eventForm.description ? sanitizeHtml(eventForm.description, 'BASIC') : undefined,
      start_date: eventForm.start_date,
      end_date: eventForm.end_date,
      start_time: eventForm.start_time,
      end_time: eventForm.end_time,
      type: eventForm.type,
      color: eventForm.color,
      recurring: eventForm.recurring,
    };

    // Validate
    const result = calendarEventSchema.safeParse(sanitized);
    if (!result.success) {
      showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
      return;
    }

    const updated = await individualService.updateCalendarEvent(editingEvent.id, result.data);
    if (updated) {
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      closeModal();
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return;
    const success = await individualService.deleteCalendarEvent(eventId);
    if (success) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      closeModal();
    }
  };

  const openEventModal = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title, description: event.description || '', start_date: event.start_date,
        end_date: event.end_date || event.start_date, start_time: event.start_time || '09:00',
        end_time: event.end_time || '10:00', type: event.type, color: event.color || '#3b82f6',
        recurring: event.recurring,
      });
    } else {
      setEditingEvent(null);
      const dateStr = selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      setEventForm({
        title: '', description: '', start_date: dateStr, end_date: dateStr, start_time: '09:00',
        end_time: '10:00', type: 'task', color: '#3b82f6', recurring: undefined
      });
    }
    setShowEventModal(true);
  };

  const closeModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventForm({ title: '', description: '', start_date: '', end_date: '', start_time: '09:00', end_time: '10:00', type: 'task', color: '#3b82f6', recurring: undefined });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const selectedDateEvents = selectedDate ? events.filter(e => e.start_date === selectedDate.toISOString().split('T')[0]) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-indigo-500" />
              Calendar
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your schedule and events
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                    viewMode === mode ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            <PremiumButton
              feature="SMART_SCHEDULING"
              variant="outline"
              size="md"
              disabled={!hasSmartScheduling}
              title={hasSmartScheduling ? "Smart scheduling available" : "Requires AI Premium plan"}
            >
              <Clock className="w-5 h-5 mr-2" />
              Smart Schedule
            </PremiumButton>
            <button
              onClick={() => openEventModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Event
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {/* Day Headers */}
            {DAYS.map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                onClick={() => handleDateClick(day.date)}
                className={cn(
                  "min-h-[100px] p-2 border-b border-r border-gray-100 dark:border-gray-700 cursor-pointer transition-colors",
                  day.isCurrentMonth ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900",
                  selectedDate?.toDateString() === day.date.toDateString() && "bg-indigo-50 dark:bg-indigo-900/20",
                  "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium mb-1",
                  isToday(day.date) && "bg-indigo-600 text-white",
                  !isToday(day.date) && day.isCurrentMonth && "text-gray-900 dark:text-white",
                  !isToday(day.date) && !day.isCurrentMonth && "text-gray-400 dark:text-gray-600"
                )}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {day.events.slice(0, 3).map(event => {
                    const typeConfig = EVENT_TYPES.find(t => t.value === event.type);
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); openEventModal(event); }}
                        className={cn(
                          "text-xs px-2 py-1 rounded truncate text-white",
                          typeConfig?.color || 'bg-blue-500'
                        )}
                        style={event.color ? { backgroundColor: event.color } : {}}
                      >
                        {event.start_time && <span className="opacity-75">{event.start_time} </span>}
                        {event.title}
                      </div>
                    );
                  })}
                  {day.events.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                      +{day.events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Features Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar Sync */}
          {!hasCalendarSync && (
            <PremiumBanner
              feature="CALENDAR_SYNC"
              title="Sync with External Calendars"
              description="Connect Google Calendar, Outlook, and Apple Calendar for seamless synchronization"
              buttonText="Upgrade to Sync"
            />
          )}
          {hasCalendarSync && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PremiumBadge variant="success">Calendar Sync</PremiumBadge>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Google Calendar</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Connected</p>
                    </div>
                  </div>
                  <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Disconnect
                  </button>
                </div>
                <button className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                  + Add Calendar
                </button>
              </div>
            </div>
          )}

          {/* Meeting Analytics */}
          {!hasMeetingAnalytics && (
            <PremiumBanner
              feature="MEETING_ANALYTICS"
              title="Meeting Analytics & Insights"
              description="Track meeting time, productivity patterns, and get optimization recommendations"
              buttonText="Unlock Analytics"
            />
          )}
          {hasMeetingAnalytics && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PremiumBadge variant="premium">Meeting Analytics</PremiumBadge>
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">12.5 hrs</p>
                  <p className="text-sm text-green-600">-2.3 hrs vs last week</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Internal</p>
                    <p className="text-xl font-bold text-purple-600">8 hrs</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">External</p>
                    <p className="text-xl font-bold text-blue-600">4.5 hrs</p>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  View Full Report
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Date Events Panel */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Events on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button
                onClick={() => openEventModal()}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </div>
            
            {selectedDateEvents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No events scheduled for this day</p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map(event => {
                  const typeConfig = EVENT_TYPES.find(t => t.value === event.type);
                  const Icon = typeConfig?.icon || AlertCircle;
                  return (
                    <div
                      key={event.id}
                      onClick={() => openEventModal(event)}
                      className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <div className={cn("p-2 rounded-lg", typeConfig?.color || 'bg-blue-500')}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                          {event.recurring && <Repeat className="w-4 h-4 text-gray-400" />}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                          {event.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.start_time}{event.end_time && ` - ${event.end_time}`}
                            </span>
                          )}
                          <span className="capitalize">{event.type}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Event Modal */}
        <AnimatePresence>
          {showEventModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingEvent ? 'Edit Event' : 'New Event'}
                  </h2>
                  <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Event title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Event description (optional)"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={eventForm.start_date}
                        onChange={(e) => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                      <input
                        type="date"
                        value={eventForm.end_date}
                        onChange={(e) => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={eventForm.start_time}
                        onChange={(e) => setEventForm(prev => ({ ...prev, start_time: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                      <input
                        type="time"
                        value={eventForm.end_time}
                        onChange={(e) => setEventForm(prev => ({ ...prev, end_time: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Type</label>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_TYPES.map(type => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() => setEventForm(prev => ({ ...prev, type: type.value }))}
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                              eventForm.type === type.value 
                                ? "bg-indigo-600 text-white" 
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                    <div className="flex gap-2">
                      {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280'].map(color => (
                        <button
                          key={color}
                          onClick={() => setEventForm(prev => ({ ...prev, color }))}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            eventForm.color === color ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  {editingEvent ? (
                    <button
                      onClick={() => handleDeleteEvent(editingEvent.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  ) : (
                    <div />
                  )}
                  <div className="flex gap-3">
                    <button onClick={closeModal} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      Cancel
                    </button>
                    <button
                      onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                      disabled={!eventForm.title.trim() || !eventForm.start_date}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingEvent ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Calendar;
