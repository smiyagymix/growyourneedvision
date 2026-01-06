export interface DietaryPreference {
  id: string;
  name: string;
  description: string;
}

export const dietaryPreferences: DietaryPreference[] = [
  { id: 'vegan', name: 'Vegan', description: 'No animal products.' },
  { id: 'vegetarian', name: 'Vegetarian', description: 'No meat, poultry, or seafood.' },
  { id: 'pescatarian', name: 'Pescatarian', description: 'Vegetarian diet including seafood.' },
  { id: 'gluten-free', name: 'Gluten-Free', description: 'No gluten-containing grains (wheat, barley, rye).' },
  { id: 'dairy-free', name: 'Dairy-Free', description: 'No dairy products.' },
  { id: 'keto', name: 'Ketogenic', description: 'High-fat, low-carbohydrate diet.' },
  { id: 'paleo', name: 'Paleo', description: 'Whole foods based on early human diet.' },
  { id: 'halal', name: 'Halal', description: 'Prepared according to Islamic dietary laws.' },
  { id: 'kosher', name: 'Kosher', description: 'Prepared according to Jewish dietary laws.' },
];
