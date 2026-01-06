export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Account' | 'Billing' | 'Technical' | 'Education';
}

export const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What is Grow Your Need Vision?',
    answer: 'Grow Your Need Vision is a comprehensive educational and lifestyle management platform designed to integrate school management, personal wellness, and community engagement into a single operating system.',
    category: 'General',
  },
  {
    id: '2',
    question: 'How do I reset my password?',
    answer: 'You can reset your password by clicking on the "Forgot Password" link on the login page. Follow the instructions sent to your registered email address to create a new password.',
    category: 'Account',
  },
  {
    id: '3',
    question: 'Is my data secure?',
    answer: 'Yes, we use industry-standard encryption and security protocols to ensure your personal and educational data is protected at all times. We are compliant with GDPR and COPPA regulations.',
    category: 'Technical',
  },
  {
    id: '4',
    question: 'Can I upgrade my subscription plan?',
    answer: 'Absolutely. You can upgrade your plan at any time from the "Billing" section in your account settings. Changes will be applied immediately.',
    category: 'Billing',
  },
  {
    id: '5',
    question: 'How can teachers track student progress?',
    answer: 'Teachers can use the "Academics" dashboard to view real-time analytics on student attendance, grades, and assignment submissions.',
    category: 'Education',
  },
];
