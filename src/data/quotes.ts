export interface Quote {
  id: string;
  text: string;
  author: string;
  category: 'Motivation' | 'Education' | 'Life' | 'Success';
}

export const quotes: Quote[] = [
  { id: '1', text: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela', category: 'Education' },
  { id: '2', text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'Success' },
  { id: '3', text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'Motivation' },
  { id: '4', text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'Motivation' },
  { id: '5', text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'Success' },
  { id: '6', text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi', category: 'Life' },
];
