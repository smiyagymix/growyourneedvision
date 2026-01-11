import { pocketBaseClient } from '../lib/pocketbase';
import { createTypedCollection } from '../lib/pocketbase-types';
import { isMockEnv } from '../utils/mockData';
import { RecordModel } from 'pocketbase';
import { auditLog } from './auditLogger';
import { Result, Ok, Err, Option, Some, None } from '../lib/types';
import { AppError, NotFoundError } from './errorHandler';

export interface Event extends RecordModel {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  organizer: string;
  type: 'Academic' | 'Social' | 'Sports' | 'Other';
  status?: 'draft' | 'published' | 'cancelled';
  attendees?: string[];
  max_attendees?: number;
  is_public?: boolean;
  tags?: string[];
  expand?: {
    organizer?: { name: string };
  };
}

export interface CalendarEvent extends RecordModel {
  user: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  all_day?: boolean;
  color?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder?: number; // minutes before
}

export interface Schedule {
  day: string;
  time: string;
  duration?: string;
  frequency?: 'Weekly' | 'Bi-weekly' | 'Monthly';
}

export interface EventActivity extends RecordModel {
  name: string;
  description: string;
  type: string;
  location: string;
  schedule: Schedule;
  capacity: number;
  organizer: string;
  participants?: string[];
}

const MOCK_EVENTS: Event[] = [
  {
    id: 'evt-1',
    collectionId: 'mock',
    collectionName: 'events',
    title: 'Annual Science Fair',
    description: 'Students showcase their science projects. Open to all grades.',
    start_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    location: 'Main Auditorium',
    organizer: 'teacher-1',
    type: 'Academic',
    status: 'published',
    is_public: true,
    tags: ['science', 'students', 'competition'],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    expand: {
      organizer: { name: 'Dr. Smith' }
    }
  },
  {
    id: 'evt-2',
    collectionId: 'mock',
    collectionName: 'events',
    title: 'Basketball Tournament',
    description: 'Inter-school basketball championship. Finals week!',
    start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    location: 'Sports Complex',
    organizer: 'coach-1',
    type: 'Sports',
    status: 'published',
    is_public: true,
    tags: ['sports', 'basketball', 'tournament'],
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  },
  {
    id: 'evt-3',
    collectionId: 'mock',
    collectionName: 'events',
    title: 'Parent-Teacher Conference',
    description: 'Quarterly parent-teacher meetings. Book your slot!',
    start_time: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
    location: 'School Building A',
    organizer: 'admin-1',
    type: 'Academic',
    status: 'published',
    is_public: false,
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }
];

const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-1',
    collectionId: 'mock',
    collectionName: 'calendar_events',
    user: 'user-1',
    title: 'Math Study Session',
    description: 'Review chapter 5 for upcoming test',
    start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    all_day: false,
    color: '#3B82F6',
    reminder: 30,
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }
];

const MOCK_ACTIVITIES: EventActivity[] = [
  {
    id: 'activity-1',
    collectionId: 'mock',
    collectionName: 'activities',
    name: 'Community Garden Planting',
    description: 'Join neighbors to plant and maintain the community garden beds.',
    type: 'Community',
    location: 'Central Park',
    schedule: { day: 'Saturday', time: '10:00 AM' },
    capacity: 25,
    organizer: 'Community Board',
    participants: ['user-1'],
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  },
  {
    id: 'activity-2',
    collectionId: 'mock',
    collectionName: 'activities',
    name: 'Jazz Night',
    description: 'Local jazz quartet performing live. Open mic to follow.',
    type: 'Social',
    location: 'Campus Cafe',
    schedule: { day: 'Friday', time: '7:30 PM' },
    capacity: 80,
    organizer: 'Arts Club',
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  },
  {
    id: 'activity-3',
    collectionId: 'mock',
    collectionName: 'activities',
    name: 'Coding Dojo',
    description: 'Pair-programming session focused on React and TypeScript katas.',
    type: 'Workshop',
    location: 'Innovation Lab',
    schedule: { day: 'Wednesday', time: '5:00 PM' },
    capacity: 30,
    organizer: 'CS Department',
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }
];

export const eventService = {
  // =============== EVENTS ===============

  /**
   * Get all events
   */
  async getEvents(options?: { filter?: string; page?: number; perPage?: number }) {
    const page = options?.page || 1;
    const perPage = options?.perPage || 50;

    if (isMockEnv()) {
      let filtered = [...MOCK_EVENTS];
      if (options?.filter) {
        // Simple mock filter support
        filtered = filtered.filter(e => e.status === 'published');
      }
      const start = (page - 1) * perPage;
      const items = filtered.slice(start, start + perPage);
      return {
        items,
        page,
        perPage,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / perPage)
      };
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const eventsCollection = createTypedCollection<Event>(pb, 'events');
      const result = await eventsCollection.getList(page, perPage, {
        sort: 'start_time',
        filter: options?.filter || '',
        requestKey: null
      });
      return {
        items: result.items as Event[],
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      return { items: [], page, perPage, totalItems: 0, totalPages: 0 };
    }
  },

  /**
   * Get event by ID
   */
  async getEvent(id: string): Promise<Option<Event>> {
    if (isMockEnv()) {
      const event = MOCK_EVENTS.find(e => e.id === id);
      return event ? Some(event) : None();
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const eventsCollection = createTypedCollection<Event>(pb, 'events');
      const result = await eventsCollection.getOne(id, {
        requestKey: null
      });
      if (result.success) {
        return Some(result.data as Event);
      }
      return None();
    } catch (error) {
      console.error('Error fetching event:', error);
      return None();
    }
  },

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit = 10): Promise<Event[]> {
    const now = new Date().toISOString();

    if (isMockEnv()) {
      return MOCK_EVENTS
        .filter(e => e.start_time > now && e.status === 'published')
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, limit);
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const eventsCollection = createTypedCollection<Event>(pb, 'events');
      const result = await eventsCollection.getList(1, limit, {
        filter: `start_time > "${now}" && status = "published"`,
        sort: 'start_time',
        requestKey: null
      });
      return result.items as Event[];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  },

  /**
   * Create event
   */
  async createEvent(data: Partial<Event>): Promise<Result<Event, AppError>> {
    if (isMockEnv()) {
      const newEvent: Event = {
        id: `evt-${Date.now()}`,
        collectionId: 'mock',
        collectionName: 'events',
        title: data.title || 'Untitled Event',
        description: data.description || '',
        start_time: data.start_time || new Date().toISOString(),
        end_time: data.end_time || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: data.location || '',
        organizer: data.organizer || '',
        type: data.type || 'Other',
        status: data.status || 'draft',
        attendees: data.attendees || [],
        max_attendees: data.max_attendees,
        is_public: data.is_public ?? true,
        tags: data.tags || [],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      MOCK_EVENTS.push(newEvent);
      auditLog.log('event_created', { eventId: newEvent.id, title: newEvent.title }, 'info');
      return Ok(newEvent);
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const eventsCollection = createTypedCollection<Event>(pb, 'events');
      const result = await eventsCollection.create(data as Partial<Event>);
      if (result.success) {
        auditLog.log('event_created', { eventId: result.data.id, title: result.data.title }, 'info');
        return Ok(result.data as Event);
      }
      return Err(new AppError(
        'Failed to create event',
        'EVENT_CREATE_FAILED',
        500
      ));
    } catch (error) {
      if (error instanceof AppError) {
        return Err(error);
      }
      return Err(new AppError(
        error instanceof Error ? error.message : 'Error creating event',
        'EVENT_CREATE_FAILED',
        500
      ));
    }
  },

  /**
   * Update event
   */
  async updateEvent(id: string, data: Partial<Event>): Promise<Result<Event, AppError>> {
    if (isMockEnv()) {
      const index = MOCK_EVENTS.findIndex(e => e.id === id);
      if (index === -1) return Err(new NotFoundError('Event'));
      MOCK_EVENTS[index] = {
        ...MOCK_EVENTS[index],
        ...data,
        updated: new Date().toISOString()
      };
      return Ok(MOCK_EVENTS[index]);
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const eventsCollection = createTypedCollection<Event>(pb, 'events');
      const result = await eventsCollection.update(id, data as Partial<Event>);
      if (result.success) {
        auditLog.log('event_updated', { eventId: result.data.id }, 'info');
        return Ok(result.data as Event);
      }
      return Err(new AppError(
        'Failed to update event',
        'EVENT_UPDATE_FAILED',
        500
      ));
    } catch (error) {
      if (error instanceof AppError) {
        return Err(error);
      }
      return Err(new AppError(
        error instanceof Error ? error.message : 'Error updating event',
        'EVENT_UPDATE_FAILED',
        500
      ));
    }
  },

  /**
   * Delete event
   */
  async deleteEvent(id: string): Promise<Result<boolean, AppError>> {
    if (isMockEnv()) {
      const index = MOCK_EVENTS.findIndex(e => e.id === id);
      if (index !== -1) {
        MOCK_EVENTS.splice(index, 1);
        auditLog.log('event_deleted', { eventId: id }, 'info');
      }
      return Ok(true);
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const eventsCollection = createTypedCollection<Event>(pb, 'events');
      const result = await eventsCollection.delete(id);
      auditLog.log('event_deleted', { eventId: id }, 'info');
      return Ok(true);
    } catch (error) {
      console.error('Error deleting event:', error);
      return Err(new AppError(
        error instanceof Error ? error.message : 'Error deleting event',
        'EVENT_DELETE_FAILED',
        500
      ));
    }
  },

  /**
   * Register for event
   */
  async registerForEvent(eventId: string, userId: string): Promise<Result<Event, AppError>> {
    const eventOption = await this.getEvent(eventId);
    if (!eventOption.hasValue) {
      return Err(new NotFoundError('Event'));
    }
    const event = eventOption.value;

    if (event.attendees?.includes(userId)) {
      throw new Error('Already registered');
    }

    if (event.max_attendees && (event.attendees?.length || 0) >= event.max_attendees) {
      throw new Error('Event is full');
    }

    const newAttendees = [...(event.attendees || []), userId];
    return await this.updateEvent(eventId, { attendees: newAttendees });
  },

  async unregisterFromEvent(eventId: string, userId: string): Promise<Result<Event, AppError>> {
    const eventOption = await this.getEvent(eventId);
    if (!eventOption.hasValue) {
      return Err(new NotFoundError('Event'));
    }
    const event = eventOption.value;
    if (!event.attendees?.includes(userId)) {
      return Err(new AppError('Not registered', 'NOT_REGISTERED', 400));
    }

    const newAttendees = event.attendees.filter(a => a !== userId);
    return await this.updateEvent(eventId, { attendees: newAttendees });
  },

  /**
   * Get events by type
   */
  async getEventsByType(type: Event['type']): Promise<Event[]> {
    if (isMockEnv()) {
      return MOCK_EVENTS.filter(e => e.type === type && e.status === 'published');
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const eventsCollection = createTypedCollection<Event>(pb, 'events');
      const result = await eventsCollection.getFullList({
        filter: `type = "${type}" && status = "published"`,
        sort: 'start_time',
        requestKey: null
      });
      return result as Event[];
    } catch (error) {
      console.error('Error fetching events by type:', error);
      return [];
    }
  },

  // =============== CALENDAR EVENTS ===============

  /**
   * Get calendar events for a user
   */
  async getCalendarEvents(userId: string, dateRange?: { start: string; end: string }) {
    if (isMockEnv()) {
      let filtered = MOCK_CALENDAR_EVENTS.filter(e => e.user === userId);
      if (dateRange) {
        filtered = filtered.filter(e =>
          e.start >= dateRange.start && e.start <= dateRange.end
        );
      }
      return filtered;
    }

    try {
      let filter = `user = "${userId}"`;
      if (dateRange) {
        filter += ` && start >= "${dateRange.start}" && start <= "${dateRange.end}"`;
      }
      const pb = pocketBaseClient.getRawClient();
      const calendarCollection = createTypedCollection<CalendarEvent>(pb, 'calendar_events');
      const result = await calendarCollection.getFullList({
        filter,
        sort: 'start',
        requestKey: null
      });
      return result as CalendarEvent[];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  },

  /**
   * Create calendar event
   */
  async createCalendarEvent(data: Partial<CalendarEvent>): Promise<Result<CalendarEvent, AppError>> {
    if (isMockEnv()) {
      const newEvent: CalendarEvent = {
        id: `cal-${Date.now()}`,
        collectionId: 'mock',
        collectionName: 'calendar_events',
        user: data.user || '',
        title: data.title || 'Untitled',
        description: data.description,
        start: data.start || new Date().toISOString(),
        end: data.end || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        all_day: data.all_day,
        color: data.color,
        recurring: data.recurring || 'none',
        reminder: data.reminder,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      MOCK_CALENDAR_EVENTS.push(newEvent);
      return Ok(newEvent);
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const calendarCollection = createTypedCollection<CalendarEvent>(pb, 'calendar_events');
      const result = await calendarCollection.create(data as Partial<CalendarEvent>);
      if (result.success) {
        auditLog.log('calendar_event_created', { eventId: result.data.id, title: result.data.title }, 'info');
        return Ok(result.data as CalendarEvent);
      }
      return Err(new AppError(
        'Failed to create calendar event',
        'CALENDAR_EVENT_CREATE_FAILED',
        500
      ));
    } catch (error) {
      if (error instanceof AppError) {
        return Err(error);
      }
      return Err(new AppError(
        error instanceof Error ? error.message : 'Error creating calendar event',
        'CALENDAR_EVENT_CREATE_FAILED',
        500
      ));
    }
  },

  /**
   * Update calendar event
   */
  async updateCalendarEvent(id: string, data: Partial<CalendarEvent>): Promise<Result<CalendarEvent, AppError>> {
    if (isMockEnv()) {
      const index = MOCK_CALENDAR_EVENTS.findIndex(e => e.id === id);
      if (index === -1) return Err(new NotFoundError('Calendar event'));
      MOCK_CALENDAR_EVENTS[index] = {
        ...MOCK_CALENDAR_EVENTS[index],
        ...data,
        updated: new Date().toISOString()
      };
      return Ok(MOCK_CALENDAR_EVENTS[index]);
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const calendarEventsCollection = createTypedCollection<CalendarEvent>(pb, 'calendar_events');
      const result = await calendarEventsCollection.update(id, data) as CalendarEvent;
      auditLog.log('calendar_event_updated', { eventId: result.id }, 'info');
      return Ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return Err(error);
      }
      return Err(new AppError(
        error instanceof Error ? error.message : 'Error updating calendar event',
        'CALENDAR_EVENT_UPDATE_FAILED',
        500
      ));
    }
  },

  /**
   * Delete calendar event
   */
  async deleteCalendarEvent(id: string): Promise<Result<boolean, AppError>> {
    if (isMockEnv()) {
      const index = MOCK_CALENDAR_EVENTS.findIndex(e => e.id === id);
      if (index !== -1) {
        MOCK_CALENDAR_EVENTS.splice(index, 1);
      }
      return Ok(true);
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const calendarCollection = createTypedCollection<CalendarEvent>(pb, 'calendar_events');
      await calendarCollection.delete(id);
      auditLog.log('calendar_event_deleted', { eventId: id }, 'info');
      return Ok(true);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return Err(new AppError(
        error instanceof Error ? error.message : 'Error deleting calendar event',
        'CALENDAR_EVENT_DELETE_FAILED',
        500
      ));
    }
  },

  /**
   * Get events due for reminder
   */
  async getEventsWithReminders(userId: string): Promise<CalendarEvent[]> {
    const now = new Date();

    if (isMockEnv()) {
      return MOCK_CALENDAR_EVENTS.filter(e => {
        if (e.user !== userId || !e.reminder) return false;
        const eventStart = new Date(e.start);
        const reminderTime = new Date(eventStart.getTime() - e.reminder * 60 * 1000);
        return now >= reminderTime && now < eventStart;
      });
    }

    // For production, this would typically be handled by a background job
    const events = await this.getCalendarEvents(userId);
    return events.filter((e: CalendarEvent) => {
      if (!e.reminder) return false;
      const eventStart = new Date(e.start);
      const reminderTime = new Date(eventStart.getTime() - e.reminder * 60 * 1000);
      return now >= reminderTime && now < eventStart;
    });
  },

  // =============== ACTIVITIES ===============

  /**
   * Get activities with filtering
   */
  async getActivities(options: {
    page?: number;
    perPage?: number;
    search?: string;
    categories?: string[];
    location?: string;
    from?: string;
    to?: string;
    sort?: string;
  } = {}) {
    const {
      page = 1,
      perPage = 20,
      search,
      categories,
      location,
      from,
      to,
      sort = '-created'
    } = options;

    if (isMockEnv()) {
      let filtered = [...MOCK_ACTIVITIES];

      if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(a =>
          a.name.toLowerCase().includes(lowerSearch) ||
          a.description.toLowerCase().includes(lowerSearch)
        );
      }
      if (categories?.length) {
        filtered = filtered.filter(a => categories.includes(a.type));
      }
      if (location) {
        filtered = filtered.filter(a =>
          a.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      const start = (page - 1) * perPage;
      const items = filtered.slice(start, start + perPage);
      return {
        page,
        perPage,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / perPage),
        items
      };
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      const filters: string[] = [];
      if (search) {
        filters.push(`name ~ "${search}" || description ~ "${search}"`);
      }
      if (categories?.length) {
        const catFilters = categories.map(c => `type = "${c}"`);
        filters.push(`(${catFilters.join(' || ')})`);
      }
      if (location) {
        filters.push(`location ~ "${location}"`);
      }
      if (from) {
        filters.push(`created >= "${from}"`);
      }
      if (to) {
        filters.push(`created <= "${to}"`);
      }

      const filter = filters.length ? filters.join(' && ') : '';

      return await pb.collection('activities').getList<EventActivity>(page, perPage, {
        sort,
        filter,
        requestKey: null
      });
    } catch (error) {
      console.error('Error fetching activities:', error);
      return {
        page,
        perPage,
        totalItems: 0,
        totalPages: 0,
        items: []
      };
    }
  },

  /**
   * Get activity by ID
   */
  async getActivity(id: string): Promise<EventActivity | null> {
    if (isMockEnv()) {
      return MOCK_ACTIVITIES.find(a => a.id === id) || null;
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      return await pb.collection('activities').getOne<EventActivity>(id, {
        requestKey: null
      });
    } catch (error) {
      console.error('Error fetching activity:', error);
      return null;
    }
  },

  /**
   * Create activity
   */
  async createActivity(data: Partial<EventActivity>): Promise<EventActivity | null> {
    if (isMockEnv()) {
      const newActivity: EventActivity = {
        id: `activity-${Date.now()}`,
        collectionId: 'mock',
        collectionName: 'activities',
        name: data.name || 'Untitled Activity',
        description: data.description || '',
        type: data.type || 'Other',
        location: data.location || '',
        schedule: data.schedule || { day: '', time: '' },
        capacity: data.capacity || 0,
        organizer: data.organizer || '',
        participants: data.participants || [],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      MOCK_ACTIVITIES.push(newActivity);
      return newActivity;
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      return await pb.collection('activities').create<EventActivity>(data);
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  },

  /**
   * Update activity
   */
  async updateActivity(id: string, data: Partial<EventActivity>): Promise<EventActivity | null> {
    if (isMockEnv()) {
      const index = MOCK_ACTIVITIES.findIndex(a => a.id === id);
      if (index === -1) return null;
      MOCK_ACTIVITIES[index] = {
        ...MOCK_ACTIVITIES[index],
        ...data,
        updated: new Date().toISOString()
      };
      return MOCK_ACTIVITIES[index];
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      return await pb.collection('activities').update<EventActivity>(id, data);
    } catch (error) {
      console.error('Error updating activity:', error);
      return null;
    }
  },

  /**
   * Delete activity
   */
  async deleteActivity(id: string): Promise<boolean> {
    if (isMockEnv()) {
      const index = MOCK_ACTIVITIES.findIndex(a => a.id === id);
      if (index !== -1) {
        MOCK_ACTIVITIES.splice(index, 1);
      }
      return true;
    }

    try {
      const pb = pocketBaseClient.getRawClient();
      await pb.collection('activities').delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      return false;
    }
  },

  /**
   * Join activity
   */
  async joinActivity(activityId: string, userId: string): Promise<EventActivity | null> {
    const activity = await this.getActivity(activityId);
    if (!activity) return null;

    if (activity.participants?.includes(userId)) {
      throw new Error('Already joined');
    }

    if (activity.capacity && (activity.participants?.length || 0) >= activity.capacity) {
      throw new Error('Activity is full');
    }

    const newParticipants = [...(activity.participants || []), userId];
    return await this.updateActivity(activityId, { participants: newParticipants });
  },

  /**
   * Leave activity
   */
  async leaveActivity(activityId: string, userId: string): Promise<EventActivity | null> {
    const activity = await this.getActivity(activityId);
    if (!activity) return null;

    if (!activity.participants?.includes(userId)) {
      throw new Error('Not a participant');
    }

    const newParticipants = activity.participants.filter(p => p !== userId);
    return await this.updateActivity(activityId, { participants: newParticipants });
  },

  // =============== STATISTICS ===============

  /**
   * Get event statistics
   */
  async getStatistics() {
    if (isMockEnv()) {
      const byType: Record<string, number> = {};
      let totalAttendees = 0;

      for (const event of MOCK_EVENTS) {
        byType[event.type] = (byType[event.type] || 0) + 1;
        totalAttendees += event.attendees?.length || 0;
      }

      return {
        totalEvents: MOCK_EVENTS.length,
        publishedEvents: MOCK_EVENTS.filter(e => e.status === 'published').length,
        upcomingEvents: MOCK_EVENTS.filter(e => new Date(e.start_time) > new Date()).length,
        totalAttendees,
        totalActivities: MOCK_ACTIVITIES.length,
        byType
      };
    }

    const pb = pocketBaseClient.getRawClient();
    const events = await pb.collection('events').getFullList<Event>({ requestKey: null });
    const activities = await pb.collection('activities').getFullList<EventActivity>({ requestKey: null });

    const byType: Record<string, number> = {};
    let totalAttendees = 0;

    for (const event of events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
      totalAttendees += event.attendees?.length || 0;
    }

    return {
      totalEvents: events.length,
      publishedEvents: events.filter((e: Event) => e.status === 'published').length,
      upcomingEvents: events.filter((e: Event) => new Date(e.start_time) > new Date()).length,
      totalAttendees,
      totalActivities: activities.length,
      byType
    };
  }
};
