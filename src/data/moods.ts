export interface Mood {
  id: string;
  name: string;
  emoji: string;
  color: string;
  valence: number; // -1 (Negative) to 1 (Positive)
}

export const moods: Mood[] = [
  { id: 'happy', name: 'Happy', emoji: '😊', color: 'bg-yellow-400', valence: 0.8 },
  { id: 'excited', name: 'Excited', emoji: '🤩', color: 'bg-orange-400', valence: 1.0 },
  { id: 'calm', name: 'Calm', emoji: '😌', color: 'bg-blue-300', valence: 0.5 },
  { id: 'neutral', name: 'Neutral', emoji: '😐', color: 'bg-gray-300', valence: 0.0 },
  { id: 'tired', name: 'Tired', emoji: '😴', color: 'bg-purple-300', valence: -0.2 },
  { id: 'sad', name: 'Sad', emoji: '😢', color: 'bg-blue-600', valence: -0.6 },
  { id: 'anxious', name: 'Anxious', emoji: '😰', color: 'bg-teal-400', valence: -0.5 },
  { id: 'angry', name: 'Angry', emoji: '😠', color: 'bg-red-500', valence: -0.8 },
  { id: 'stressed', name: 'Stressed', emoji: '😫', color: 'bg-red-400', valence: -0.7 },
];
