export interface MedicationType {
  id: string;
  name: string;
  commonForms: string[]; // Tablet, Liquid, etc.
}

export const medicationTypes: MedicationType[] = [
  { id: 'pain-reliever', name: 'Pain Reliever', commonForms: ['Tablet', 'Capsule', 'Liquid'] },
  { id: 'antibiotic', name: 'Antibiotic', commonForms: ['Tablet', 'Capsule', 'Liquid'] },
  { id: 'antihistamine', name: 'Antihistamine', commonForms: ['Tablet', 'Liquid', 'Spray'] },
  { id: 'vitamin', name: 'Vitamin / Supplement', commonForms: ['Tablet', 'Gummy', 'Powder'] },
  { id: 'inhaler', name: 'Inhaler', commonForms: ['Aerosol', 'Powder'] },
  { id: 'topical', name: 'Topical Cream/Ointment', commonForms: ['Cream', 'Gel', 'Ointment'] },
  { id: 'drops', name: 'Drops', commonForms: ['Liquid'] },
];
