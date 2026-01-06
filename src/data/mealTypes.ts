export interface MealType {
  id: string;
  name: string;
  timeRange: string; // e.g., "06:00-10:00"
}

export const mealTypes: MealType[] = [
  { id: 'breakfast', name: 'Breakfast', timeRange: '06:00-10:00' },
  { id: 'brunch', name: 'Brunch', timeRange: '10:00-12:00' },
  { id: 'lunch', name: 'Lunch', timeRange: '12:00-14:00' },
  { id: 'snack', name: 'Snack', timeRange: 'Anytime' },
  { id: 'dinner', name: 'Dinner', timeRange: '18:00-21:00' },
  { id: 'late-night', name: 'Late Night', timeRange: '22:00-02:00' },
];
