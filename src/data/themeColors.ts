export interface ThemeColor {
  name: string;
  hex: string;
  variable: string;
}

export const themeColors: ThemeColor[] = [
  { name: 'Primary Blue', hex: '#007AFF', variable: '--color-primary' },
  { name: 'Secondary Teal', hex: '#20C997', variable: '--color-secondary' },
  { name: 'Accent Purple', hex: '#7950F2', variable: '--color-accent' },
  { name: 'Success Green', hex: '#28A745', variable: '--color-success' },
  { name: 'Warning Yellow', hex: '#FFC107', variable: '--color-warning' },
  { name: 'Danger Red', hex: '#DC3545', variable: '--color-danger' },
  { name: 'Info Cyan', hex: '#17A2B8', variable: '--color-info' },
  { name: 'Dark Gray', hex: '#343A40', variable: '--color-dark' },
  { name: 'Light Gray', hex: '#F8F9FA', variable: '--color-light' },
];
