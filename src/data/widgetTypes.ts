export interface WidgetType {
  id: string;
  name: string;
  description: string;
  defaultSize: 'small' | 'medium' | 'large';
  category: 'Academic' | 'Wellness' | 'Utility' | 'Social';
}

export const widgetTypes: WidgetType[] = [
  { id: 'calendar', name: 'Calendar', description: 'Upcoming events and schedule.', defaultSize: 'medium', category: 'Utility' },
  { id: 'tasks', name: 'To-Do List', description: 'Personal task manager.', defaultSize: 'medium', category: 'Utility' },
  { id: 'grades', name: 'Recent Grades', description: 'Latest academic performance.', defaultSize: 'small', category: 'Academic' },
  { id: 'attendance', name: 'Attendance Stats', description: 'Attendance overview.', defaultSize: 'small', category: 'Academic' },
  { id: 'mood', name: 'Mood Tracker', description: 'Daily mood log.', defaultSize: 'small', category: 'Wellness' },
  { id: 'steps', name: 'Step Counter', description: 'Daily activity tracking.', defaultSize: 'small', category: 'Wellness' },
  { id: 'news', name: 'School News', description: 'Latest announcements.', defaultSize: 'large', category: 'Social' },
  { id: 'weather', name: 'Weather', description: 'Local weather forecast.', defaultSize: 'small', category: 'Utility' },
];
