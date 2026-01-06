import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Icon, Card, Button, Badge, Modal } from '../components/shared/ui/CommonUI';
import { eventService, Event } from '../services/eventService';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import pb from '../lib/pocketbase';
import { sanitizeText, sanitizeHtml } from '../utils/sanitization';
import { useToast } from '../hooks/useToast';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long'),
  start_time: z.string().min(1, 'Start time is required'),
  location: z.string().min(1, 'Location is required').max(200, 'Location too long'),
  type: z.enum(['Academic', 'Sports', 'Social', 'Other']),
  organizer: z.string().min(1, 'Organizer is required')
});

interface EventsAppProps {
  activeTab: string;
  activeSubNav: string;
}

const EventsApp: React.FC<EventsAppProps> = ({ activeTab, activeSubNav }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<Event['type']>('Other');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const result = await eventService.getEvents();
      // eventService.getEvents returns Event[] directly, not a paginated result
      setEvents(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const { showToast } = useToast();
  
  const handleCreate = async () => {
    try {
      const user = pb.authStore.model;
      if (!user) {
        showToast('User not authenticated', 'error');
        return;
      }
      
      // Sanitize inputs
      const sanitized = {
        title: sanitizeText(title),
        description: sanitizeHtml(description, 'BASIC'),
        start_time: startTime,
        location: sanitizeText(location),
        type: type,
        organizer: user.id
      };
      
      // Validate
      const result = eventSchema.safeParse(sanitized);
      if (!result.success) {
        showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
        return;
      }

      await eventService.createEvent({
        ...result.data,
        start_time: new Date(result.data.start_time).toISOString(),
        end_time: new Date(result.data.start_time).toISOString(), // Default to same for now
      });

      showToast('Event created successfully', 'success');
      setIsCreateOpen(false);
      fetchEvents();
      // Reset form
      setTitle('');
      setDescription('');
      setStartTime('');
      setLocation('');
    } catch (error) {
      console.error('Error creating event:', error);
      showToast('Failed to create event', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn text-gray-800 dark:text-white">
       <Card className="flex justify-between items-center p-6">
           <div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Events</h1>
               <p className="text-sm text-gray-500 dark:text-gray-400">Create, edit, and track your upcoming events.</p>
           </div>
           <Button 
             onClick={() => setIsCreateOpen(true)}
             className="flex items-center gap-2"
           >
               <Icon name="PlusCircleIcon" className="w-5 h-5" /> Create New Event
           </Button>
       </Card>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Stats */}
           <Card className="p-6 flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400"><Icon name="CalendarIcon" className="w-6 h-6" /></div>
               <div>
                   <div className="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</div>
                   <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Upcoming</div>
               </div>
           </Card>
           <Card className="p-6 flex items-center gap-4">
               <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400"><Icon name="CheckCircleIcon" className="w-6 h-6" /></div>
               <div>
                   <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                   <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Registrations</div>
               </div>
           </Card>
           <Card className="p-6 flex items-center gap-4">
               <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400"><Icon name="TicketIcon" className="w-6 h-6" /></div>
               <div>
                   <div className="text-2xl font-bold text-gray-900 dark:text-white">$0</div>
                   <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Ticket Sales</div>
               </div>
           </Card>
       </div>

       {/* Event List */}
       <Card className="overflow-hidden p-0">
           <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
               <h3 className="font-bold text-gray-700 dark:text-gray-200">{activeTab} List</h3>
               <button className="text-xs text-blue-600 dark:text-blue-400 font-bold">View All</button>
           </div>
           <div className="divide-y divide-gray-100 dark:divide-slate-700">
               {loading ? (
                   <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading events...</div>
               ) : events.length === 0 ? (
                   <div className="p-8 text-center text-gray-500 dark:text-gray-400">No events found. Create one to get started!</div>
               ) : (
                   events.map(event => (
                   <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 flex items-center justify-between transition-colors">
                       <div className="flex items-center gap-4">
                           <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">
                               {new Date(event.start_time).getDate()}
                           </div>
                           <div>
                               <h4 className="font-bold text-gray-900 dark:text-white">{event.title}</h4>
                               <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                   <Icon name="CalendarIcon" className="w-3 h-3" /> {new Date(event.start_time).toLocaleDateString()}
                                   <span className="text-gray-300 dark:text-slate-600">|</span>
                                   <Icon name="MapPinIcon" className="w-3 h-3" /> {event.location || 'TBD'}
                               </p>
                           </div>
                       </div>
                       <div className="flex items-center gap-4">
                           <div className="text-right">
                               <div className="text-sm font-bold text-gray-900 dark:text-white">{event.type}</div>
                               <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Type</div>
                           </div>
                           <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"><Icon name="CogIcon" className="w-5 h-5" /></button>
                       </div>
                   </div>
               )))}
           </div>
       </Card>

       {/* Create Modal */}
       <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Event">
            <div className="space-y-4">
              <input 
                className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg text-gray-800 dark:text-white" 
                placeholder="Event Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <div className="relative">
                  <textarea 
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg text-gray-800 dark:text-white" 
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                  />
                  <button 
                    onClick={() => setIsAIModalOpen(true)}
                    className="absolute bottom-2 right-2 p-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-md hover:bg-purple-200 transition-colors text-xs font-bold flex items-center gap-1"
                  >
                      <Icon name="Sparkles" className="w-3 h-3" /> AI Draft
                  </button>
              </div>
              <input 
                type="datetime-local" 
                className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg text-gray-800 dark:text-white"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
              <input 
                className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg text-gray-800 dark:text-white" 
                placeholder="Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
              <select 
                className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg text-gray-800 dark:text-white"
                value={type}
                onChange={e => setType(e.target.value as Event['type'])}
              >
                <option value="Other">Other</option>
                <option value="Academic">Academic</option>
                <option value="Social">Social</option>
                <option value="Sports">Sports</option>
              </select>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create</Button>
              </div>
            </div>
       </Modal>

       <AIContentGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={(content) => {
            setDescription(content);
            setIsAIModalOpen(false);
        }}
        title="Draft Event Description"
        promptTemplate={`Write an engaging event description for an event titled "${title || '[Event Title]'}".
        
        Include:
        - Catchy opening
        - Key highlights/activities
        - Call to action for registration
        
        Tone: Exciting and Professional.`}
        contextData={{ title, type }}
       />
    </div>
  );
};

export default EventsApp;
