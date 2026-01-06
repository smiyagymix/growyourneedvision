export interface Symptom {
  id: string;
  name: string;
  category: 'Physical' | 'Mental' | 'Digestive' | 'Respiratory';
}

export const symptoms: Symptom[] = [
  { id: 'headache', name: 'Headache', category: 'Physical' },
  { id: 'nausea', name: 'Nausea', category: 'Digestive' },
  { id: 'fatigue', name: 'Fatigue', category: 'Physical' },
  { id: 'anxiety', name: 'Anxiety', category: 'Mental' },
  { id: 'insomnia', name: 'Insomnia', category: 'Mental' },
  { id: 'cough', name: 'Cough', category: 'Respiratory' },
  { id: 'sore-throat', name: 'Sore Throat', category: 'Respiratory' },
  { id: 'muscle-pain', name: 'Muscle Pain', category: 'Physical' },
  { id: 'bloating', name: 'Bloating', category: 'Digestive' },
  { id: 'dizziness', name: 'Dizziness', category: 'Physical' },
];
