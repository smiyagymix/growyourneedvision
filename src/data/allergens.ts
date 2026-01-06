export interface Allergen {
  id: string;
  name: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
}

export const commonAllergens: Allergen[] = [
  { id: 'peanuts', name: 'Peanuts', severity: 'Severe' },
  { id: 'tree-nuts', name: 'Tree Nuts', severity: 'Severe' },
  { id: 'milk', name: 'Milk', severity: 'Moderate' },
  { id: 'eggs', name: 'Eggs', severity: 'Moderate' },
  { id: 'wheat', name: 'Wheat', severity: 'Mild' },
  { id: 'soy', name: 'Soy', severity: 'Mild' },
  { id: 'fish', name: 'Fish', severity: 'Severe' },
  { id: 'shellfish', name: 'Shellfish', severity: 'Severe' },
  { id: 'sesame', name: 'Sesame', severity: 'Moderate' },
];
