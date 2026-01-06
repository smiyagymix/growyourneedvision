export interface Level {
  level: number;
  xpRequired: number;
  title: string;
}

export const levels: Level[] = [
  { level: 1, xpRequired: 0, title: 'Novice' },
  { level: 2, xpRequired: 100, title: 'Apprentice' },
  { level: 3, xpRequired: 300, title: 'Explorer' },
  { level: 4, xpRequired: 600, title: 'Scholar' },
  { level: 5, xpRequired: 1000, title: 'Expert' },
  { level: 6, xpRequired: 1500, title: 'Master' },
  { level: 7, xpRequired: 2100, title: 'Grandmaster' },
  { level: 8, xpRequired: 2800, title: 'Legend' },
  { level: 9, xpRequired: 3600, title: 'Visionary' },
  { level: 10, xpRequired: 4500, title: 'Transcendent' },
];
