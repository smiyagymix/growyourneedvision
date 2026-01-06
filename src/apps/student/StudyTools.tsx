import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Clock, Brain, Plus, Play, Pause, RotateCcw, 
  ChevronRight, ChevronLeft, Check, X, Star, Layers,
  Timer, Coffee, Zap, Target, Award, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService, FlashcardDeck, Flashcard, StudySession } from '../../services/studentService';
import { cn } from '../../lib/utils';

const studySessionSchema = z.object({
    userId: z.string().min(1, 'User ID required'),
    duration: z.number().min(1, 'Duration must be at least 1 minute').max(240, 'Duration too long'),
    type: z.enum(['pomodoro', 'study', 'review', 'flashcards'])
});

const flashcardReviewSchema = z.object({
    cardId: z.string().min(1, 'Card ID required'),
    correct: z.boolean()
});

interface Props {
  activeTab?: string;
  activeSubNav?: string;
}

type ToolMode = 'dashboard' | 'pomodoro' | 'flashcards' | 'review';

const StudyTools: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<ToolMode>('dashboard');
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pomodoro state
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroType, setPomodoroType] = useState<'work' | 'short' | 'long'>('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  
  // Flashcard state
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0 && isRunning) {
      handlePomodoroComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, pomodoroTime]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    const [decksData, sessionsData] = await Promise.all([
      studentService.getFlashcardDecks(user.id),
      studentService.getStudySessions(user.id, 7),
    ]);
    setDecks(decksData);
    setSessions(sessionsData);
    setLoading(false);
  };

  const loadDeckCards = async (deck: FlashcardDeck) => {
    setSelectedDeck(deck);
    const cardsData = await studentService.getFlashcards(deck.id);
    setCards(cardsData);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setSessionStats({ correct: 0, incorrect: 0 });
    setMode('review');
  };

  const handlePomodoroComplete = async () => {
    setIsRunning(false);
    if (pomodoroType === 'work') {
      setCompletedPomodoros(prev => prev + 1);
      // Log study session with validation
      if (user?.id) {
        const sessionData = {
          userId: user.id,
          duration: 25,
          type: 'pomodoro' as const
        };
        
        const result = studySessionSchema.safeParse(sessionData);
        if (result.success) {
          await studentService.logStudySession(user.id, result.data);
        }
      }
      // Auto switch to break
      if ((completedPomodoros + 1) % 4 === 0) {
        setPomodoroType('long');
        setPomodoroTime(15 * 60);
      } else {
        setPomodoroType('short');
        setPomodoroTime(5 * 60);
      }
    } else {
      setPomodoroType('work');
      setPomodoroTime(25 * 60);
    }
  };

  const resetPomodoro = () => {
    setIsRunning(false);
    setPomodoroTime(pomodoroType === 'work' ? 25 * 60 : pomodoroType === 'short' ? 5 * 60 : 15 * 60);
  };

  const handleCardAnswer = async (correct: boolean) => {
    const card = cards[currentCardIndex];
    if (card) {
      // Validate review data
      const reviewData = {
        cardId: card.id,
        correct
      };
      
      const result = flashcardReviewSchema.safeParse(reviewData);
      if (result.success) {
        await studentService.reviewFlashcard(card.id, correct);
      }
      
      setSessionStats(prev => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1)
      }));
    }
    
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // End of deck
      setMode('flashcards');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalStudyTime = () => {
    return sessions.reduce((sum, s) => sum + s.duration, 0);
  };

  const renderDashboard = () => (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 opacity-80" />
            <div>
              <div className="text-2xl font-bold">{Math.round(getTotalStudyTime() / 60)}h</div>
              <div className="text-sm opacity-80">This Week</div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 opacity-80" />
            <div>
              <div className="text-2xl font-bold">{sessions.filter(s => s.completed).length}</div>
              <div className="text-sm opacity-80">Sessions</div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Layers className="w-8 h-8 opacity-80" />
            <div>
              <div className="text-2xl font-bold">{decks.length}</div>
              <div className="text-sm opacity-80">Flashcard Decks</div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 opacity-80" />
            <div>
              <div className="text-2xl font-bold">{completedPomodoros}</div>
              <div className="text-sm opacity-80">Pomodoros Today</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tool Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pomodoro Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setMode('pomodoro')}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Timer className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pomodoro Timer</h3>
              <p className="text-gray-600 dark:text-gray-400">Focus with timed study sessions</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>25 min work / 5 min break</span>
            <ChevronRight className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Flashcards Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setMode('flashcards')}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Brain className="w-7 h-7 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Flashcards</h3>
              <p className="text-gray-600 dark:text-gray-400">Review and memorize with spaced repetition</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{decks.reduce((s, d) => s + d.card_count, 0)} cards in {decks.length} decks</span>
            <ChevronRight className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Recent Sessions */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Study Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No sessions yet. Start studying!</p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map(session => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    session.type === 'pomodoro' ? 'bg-red-100 text-red-500' : 
                    session.type === 'flashcards' ? 'bg-purple-100 text-purple-500' : 'bg-blue-100 text-blue-500'
                  )}>
                    {session.type === 'pomodoro' ? <Timer className="w-5 h-5" /> :
                     session.type === 'flashcards' ? <Brain className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">{session.type} Session</div>
                    <div className="text-sm text-gray-500">{session.subject || 'General'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">{session.duration} min</div>
                  <div className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderPomodoro = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto"
    >
      <button onClick={() => setMode('dashboard')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6 hover:text-gray-900 dark:hover:text-white">
        <ChevronLeft className="w-5 h-5" /> Back to Tools
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Timer Type Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { type: 'work', label: 'Focus', time: 25, color: 'bg-red-500' },
            { type: 'short', label: 'Short Break', time: 5, color: 'bg-green-500' },
            { type: 'long', label: 'Long Break', time: 15, color: 'bg-blue-500' },
          ].map(({ type, label, time, color }) => (
            <button
              key={type}
              onClick={() => { setPomodoroType(type as any); setPomodoroTime(time * 60); setIsRunning(false); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                pomodoroType === type ? `${color} text-white` : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="128" cy="128" r="120" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
            <circle
              cx="128" cy="128" r="120" fill="none" strokeWidth="8" strokeLinecap="round"
              className={pomodoroType === 'work' ? 'text-red-500' : pomodoroType === 'short' ? 'text-green-500' : 'text-blue-500'}
              strokeDasharray={`${(pomodoroTime / (pomodoroType === 'work' ? 25 * 60 : pomodoroType === 'short' ? 5 * 60 : 15 * 60)) * 754} 754`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-gray-900 dark:text-white">{formatTime(pomodoroTime)}</div>
            <div className="text-gray-500 capitalize mt-2">{pomodoroType === 'work' ? 'Focus Time' : `${pomodoroType} Break`}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center text-white transition-all",
              pomodoroType === 'work' ? 'bg-red-500 hover:bg-red-600' : pomodoroType === 'short' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
            )}
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          <button
            onClick={resetPomodoro}
            className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>

        {/* Completed Pomodoros */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full transition-all",
                  i < (completedPomodoros % 4) ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">{completedPomodoros} pomodoros completed today</p>
        </div>
      </div>
    </motion.div>
  );

  const renderFlashcards = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button onClick={() => setMode('dashboard')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6 hover:text-gray-900 dark:hover:text-white">
        <ChevronLeft className="w-5 h-5" /> Back to Tools
      </button>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcard Decks</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus className="w-5 h-5" /> New Deck
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck, idx) => (
          <motion.div
            key={deck.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => loadDeckCards(deck)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
            style={{ borderTop: `4px solid ${deck.color}` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{deck.name}</h3>
                <p className="text-sm text-gray-500">{deck.subject}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${deck.color}20` }}>
                <Brain className="w-5 h-5" style={{ color: deck.color }} />
              </div>
            </div>
            
            {deck.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{deck.description}</p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {deck.card_count} cards
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${deck.mastery}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{deck.mastery}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderReview = () => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto text-center py-12">
          <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Session Complete!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You reviewed {sessionStats.correct + sessionStats.incorrect} cards
          </p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{sessionStats.correct}</div>
              <div className="text-sm text-gray-500">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{sessionStats.incorrect}</div>
              <div className="text-sm text-gray-500">Incorrect</div>
            </div>
          </div>
          <button onClick={() => setMode('flashcards')} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Back to Decks
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto">
        <button onClick={() => setMode('flashcards')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6 hover:text-gray-900 dark:hover:text-white">
          <ChevronLeft className="w-5 h-5" /> Back to Decks
        </button>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDeck?.name}</h2>
          <span className="text-sm text-gray-500">{currentCardIndex + 1} / {cards.length}</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }} />
        </div>

        {/* Flashcard */}
        <motion.div
          key={currentCard.id}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: showAnswer ? 180 : 0 }}
          className="relative h-72 cursor-pointer perspective-1000"
          onClick={() => setShowAnswer(!showAnswer)}
        >
          <div className={cn(
            "absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 flex items-center justify-center backface-hidden transition-transform",
            showAnswer ? "rotate-y-180 invisible" : ""
          )}>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-4">Question</div>
              <div className="text-xl font-medium text-gray-900 dark:text-white">{currentCard.front}</div>
              <div className="mt-6 text-sm text-gray-400">Tap to reveal answer</div>
            </div>
          </div>
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 flex items-center justify-center backface-hidden rotate-y-180",
            showAnswer ? "visible" : "invisible"
          )}>
            <div className="text-center text-white">
              <div className="text-sm opacity-80 mb-4">Answer</div>
              <div className="text-xl font-medium">{currentCard.back}</div>
            </div>
          </div>
        </motion.div>

        {/* Answer Buttons */}
        <AnimatePresence>
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-center gap-4 mt-6"
            >
              <button
                onClick={() => handleCardAnswer(false)}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
                Incorrect
              </button>
              <button
                onClick={() => handleCardAnswer(true)}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                <Check className="w-5 h-5" />
                Correct
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {mode === 'dashboard' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-indigo-500" />
                Study Tools
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Boost your learning with focused study sessions
              </p>
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : (
              renderDashboard()
            )}
          </>
        )}
        {mode === 'pomodoro' && renderPomodoro()}
        {mode === 'flashcards' && renderFlashcards()}
        {mode === 'review' && renderReview()}
      </div>
    </div>
  );
};

export default StudyTools;
