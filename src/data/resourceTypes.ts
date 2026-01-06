export interface ResourceType {
  id: string;
  name: string;
  icon: string;
  mimeTypes: string[];
}

export const resourceTypes: ResourceType[] = [
  { id: 'pdf', name: 'PDF Document', icon: 'DocumentText', mimeTypes: ['application/pdf'] },
  { id: 'video', name: 'Video Lesson', icon: 'VideoCamera', mimeTypes: ['video/mp4', 'video/webm'] },
  { id: 'audio', name: 'Audio / Podcast', icon: 'Microphone', mimeTypes: ['audio/mpeg', 'audio/wav'] },
  { id: 'presentation', name: 'Presentation', icon: 'PresentationChartBar', mimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'] },
  { id: 'spreadsheet', name: 'Spreadsheet', icon: 'Table', mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] },
  { id: 'link', name: 'External Link', icon: 'Link', mimeTypes: ['text/html'] },
  { id: 'quiz', name: 'Interactive Quiz', icon: 'QuestionMarkCircle', mimeTypes: ['application/json'] },
];
