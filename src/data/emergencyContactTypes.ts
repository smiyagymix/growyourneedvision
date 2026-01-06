export interface EmergencyContactType {
  id: string;
  label: string;
}

export const emergencyContactTypes: EmergencyContactType[] = [
  { id: 'parent', label: 'Parent / Guardian' },
  { id: 'spouse', label: 'Spouse / Partner' },
  { id: 'sibling', label: 'Sibling' },
  { id: 'grandparent', label: 'Grandparent' },
  { id: 'doctor', label: 'Primary Physician' },
  { id: 'neighbor', label: 'Neighbor' },
  { id: 'friend', label: 'Close Friend' },
  { id: 'other', label: 'Other' },
];
