export interface TransactionType {
  id: string;
  name: string;
  category: 'Income' | 'Expense';
}

export const transactionTypes: TransactionType[] = [
  { id: 'tuition', name: 'Tuition Fee', category: 'Income' },
  { id: 'cafeteria', name: 'Cafeteria Purchase', category: 'Income' },
  { id: 'bookstore', name: 'Bookstore Purchase', category: 'Income' },
  { id: 'donation', name: 'Donation', category: 'Income' },
  { id: 'salary', name: 'Staff Salary', category: 'Expense' },
  { id: 'maintenance', name: 'Facility Maintenance', category: 'Expense' },
  { id: 'supplies', name: 'Office Supplies', category: 'Expense' },
  { id: 'software', name: 'Software License', category: 'Expense' },
  { id: 'refund', name: 'Refund', category: 'Expense' },
];
