import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { multiverseService } from '../services/multiverseService';
import { QuizQuestion } from '../types/gamification';
import { useAuth } from '../../../context/AuthContext';
import { Icon } from '../../../components/shared/ui/CommonUI';

export const QuantumQuiz: React.FC = () => {
    const { user } = useAuth();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const data = await multiverseService.getQuizQuestions();
            // Take first 5 random questions for a session
            setQuestions(data.slice(0, 5));
            setGameState('playing');
            setCurrentQuestionIndex(0);
            setScore(0);
            setSelectedOption(null);
            setShowExplanation(false);
        } catch (e) {
            console.error("Failed to load questions", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (optionKey: string) => {
        if (selectedOption) return; // Prevent multiple clicks
        setSelectedOption(optionKey);
        
        const currentQ = questions[currentQuestionIndex];
        const isCorrect = parseInt(optionKey) === currentQ.correct_answer;
        
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
        
        setShowExplanation(true);
    };

    const nextQuestion = () => {
        setSelectedOption(null);
        setShowExplanation(false);
        
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setGameState('finished');
        if (user) {
            await multiverseService.submitQuizResult(user.id, score);
        }
    };

    return (
        <div className="h-full w-full bg-slate-900 text-white p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-purple-400 flex items-center gap-3">
                            <Icon name="brain" className="w-8 h-8" />
                            Quantum Quiz
                        </h1>
                        <p className="text-slate-400 mt-2">Test your knowledge across the multiverse dimensions.</p>
                    </div>
                    {gameState === 'playing' && (
                        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                            <span className="text-purple-400 font-bold">Score: {score}</span>
                            <span className="text-slate-500 mx-2">/</span>
                            <span className="text-slate-400">{questions.length}</span>
                        </div>
                    )}
                </header>

                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div 
                            key="start"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center justify-center h-[60vh] text-center"
                        >
                            <div className="w-32 h-32 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <Icon name="help-circle" className="w-16 h-16 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Ready to Challenge the Quantum Realm?</h2>
                            <p className="text-slate-400 max-w-md mb-8">
                                Answer questions correctly to stabilize the timeline and earn XP. 
                                Be careful, the laws of physics might change!
                            </p>
                            <button
                                onClick={loadQuestions}
                                disabled={loading}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-colors flex items-center gap-2"
                            >
                                {loading ? 'Initializing...' : 'Start Quiz'}
                                {!loading && <Icon name="arrow-right" className="w-5 h-5" />}
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && questions.length > 0 && (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-mono text-purple-400">
                                    QUESTION {currentQuestionIndex + 1} OF {questions.length}
                                </span>
                                <span className="px-3 py-1 bg-slate-700 rounded text-xs text-slate-300">
                                    {questions[currentQuestionIndex].subject}
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold mb-8">
                                {questions[currentQuestionIndex].question}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {Object.entries(questions[currentQuestionIndex].options).map(([key, value]) => {
                                    const isSelected = selectedOption === key;
                                    const isCorrect = parseInt(key) === questions[currentQuestionIndex].correct_answer;
                                    
                                    let btnClass = "p-4 rounded-lg border-2 text-left transition-all relative overflow-hidden ";
                                    
                                    if (showExplanation) {
                                        if (isCorrect) btnClass += "bg-green-500/20 border-green-500 text-green-100";
                                        else if (isSelected && !isCorrect) btnClass += "bg-red-500/20 border-red-500 text-red-100";
                                        else btnClass += "bg-slate-800 border-slate-700 opacity-50";
                                    } else {
                                        if (isSelected) btnClass += "bg-purple-500/20 border-purple-500";
                                        else btnClass += "bg-slate-800 border-slate-700 hover:border-purple-400 hover:bg-slate-700";
                                    }

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => handleAnswer(key)}
                                            disabled={showExplanation}
                                            className={btnClass}
                                        >
                                            <span className="font-bold mr-2">{key.toUpperCase()}.</span>
                                            {value}
                                            {showExplanation && isCorrect && (
                                                <Icon name="check" className="absolute right-4 top-4 text-green-400" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {showExplanation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6"
                                >
                                    <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-2">
                                        <Icon name="info" className="w-4 h-4" />
                                        Explanation
                                    </h4>
                                    <p className="text-slate-400">
                                        {questions[currentQuestionIndex].explanation}
                                    </p>
                                </motion.div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    onClick={nextQuestion}
                                    disabled={!selectedOption}
                                    className={`px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${
                                        selectedOption 
                                            ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                                >
                                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                                    <Icon name="arrow-right" className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'finished' && (
                        <motion.div
                            key="finished"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-[60vh] text-center"
                        >
                            <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                <Icon name="award" className="w-16 h-16 text-green-400" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                            <p className="text-slate-400 mb-8">You've stabilized the quantum field.</p>
                            
                            <div className="grid grid-cols-2 gap-8 mb-8 w-full max-w-md">
                                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                    <div className="text-slate-400 text-sm mb-1">Score</div>
                                    <div className="text-3xl font-bold text-white">{score} / {questions.length}</div>
                                </div>
                                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                    <div className="text-slate-400 text-sm mb-1">XP Earned</div>
                                    <div className="text-3xl font-bold text-purple-400">+{score * 10} XP</div>
                                </div>
                            </div>

                            <button
                                onClick={() => setGameState('start')}
                                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition-colors"
                            >
                                Play Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
