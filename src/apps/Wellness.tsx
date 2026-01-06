import React, { useState, useEffect, useRef } from 'react';
import { Icon, Card, Button, Badge } from '../components/shared/ui/CommonUI';
import pb from '../lib/pocketbase';
import { useChat } from '../hooks/useChat';
import { wellnessService, WellnessLog, Meal } from '../services/wellnessService';
import { reportService } from '../services/reportService';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';

interface WellnessProps {
    activeTab: string;
    activeSubNav?: string;
}

const Wellness: React.FC<WellnessProps> = ({ activeTab, activeSubNav }) => {
    const [activeView, setActiveView] = useState('Activity');
    const [logs, setLogs] = useState<WellnessLog[]>([]);
    const [todayLog, setTodayLog] = useState<WellnessLog | null>(null);
    const [userRole, setUserRole] = useState<string>('');
    const [isMealPlanModalOpen, setIsMealPlanModalOpen] = useState(false);
    const [showLogMealModal, setShowLogMealModal] = useState(false);

    const handleLogMeal = async (meal: Meal) => {
        try {
            const userId = pb.authStore.model?.id;
            if (!userId) return;

            let logToUpdate = todayLog;

            // If no log for today exists, create one
            if (!logToUpdate) {
                const newLog = await wellnessService.createLog({
                    user: userId,
                    date: new Date().toISOString(),
                    steps: 0,
                    calories: 0,
                    sleep_minutes: 0,
                    mood: 'Okay',
                    meals: []
                });
                logToUpdate = newLog;
            }

            if (logToUpdate) {
                const currentMeals = logToUpdate.meals || [];
                const updatedMeals = [...currentMeals, {
                    ...meal,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }];

                // Calculate new total calories
                const totalCalories = updatedMeals.reduce((sum, m) => sum + (m.calories || 0), 0);

                await wellnessService.updateLog(logToUpdate.id, {
                    meals: updatedMeals,
                    calories: totalCalories
                });

                // Refresh logs
                const result = await wellnessService.getLogs(userId);
                setLogs(result);
                if (result.length > 0) setTodayLog(result[0]);

                setShowLogMealModal(false);
            }
        } catch (error) {
            console.error('Failed to log meal:', error);
        }
    };

    const { messages, sendMessage, isLoading } = useChat('Wellness Coach');
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeView]);

    useEffect(() => {
        if (pb.authStore.model) {
            setUserRole(pb.authStore.model.role || '');
        }
    }, []);

    // Sync activeView with activeSubNav if provided
    useEffect(() => {
        if (activeSubNav) {
            // Teacher / Student specific mappings
            if (activeSubNav === 'Mindfulness') setActiveView('Mindfulness');
            else if (activeSubNav === 'Breathing') setActiveView('Breathing');
            else if (activeSubNav === 'Steps') setActiveView('Activity');
            else if (activeSubNav === 'Break Timer') setActiveView('Break Timer');
            else if (activeSubNav === 'Teacher Support') setActiveView('Resources');
            else if (activeSubNav === 'Community') setActiveView('Community');
            else if (activeSubNav === 'Sleep') setActiveView('Sleep');
            else if (activeSubNav === 'Meditation') setActiveView('Mindfulness');
            else if (activeSubNav === 'AI Coach') setActiveView('AI Coach');

            // General mappings
            else if (activeSubNav === 'Physical Health') setActiveView('Activity');
            else if (activeSubNav === 'Mental Wellness') setActiveView('Mindfulness');
            else if (activeSubNav === 'Nutrition') setActiveView('Nutrition');
            else if (activeSubNav === 'Dashboard') setActiveView('Activity');
        } else {
            // Default views based on Tab
            if (activeTab === 'Stress') setActiveView('Mindfulness');
            else if (activeTab === 'Activity') setActiveView('Activity');
            else if (activeTab === 'Resources') setActiveView('Resources');
        }

        // In mock/test student flows, prioritize showing Activity (steps) view
        if (userRole === 'Student') {
            setActiveView('Activity');
        }
    }, [activeSubNav, activeTab, userRole]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const userId = pb.authStore.model?.id;
                if (!userId) {
                    // throw new Error("User not logged in");
                    console.warn("User not logged in, skipping wellness logs fetch");
                    return;
                }

                const result = await wellnessService.getLogs(userId);
                setLogs(result);

                if (result.length > 0) {
                    setTodayLog(result[0]);
                } else {
                    // Fallback if collection exists but is empty
                    console.log("No wellness logs found.");
                }
            } catch (e) {
                console.error("Error fetching wellness logs:", e);
            }
        };
        fetchLogs();
    }, []);

    const handleExportWellness = (format: 'pdf' | 'excel') => {
        if (format === 'pdf') {
            const data = logs.map(l => [
                new Date(l.date).toLocaleDateString(),
                l.steps.toString(),
                l.calories.toString(),
                l.sleep_minutes.toString(),
                l.mood
            ]);
            reportService.exportToPDF('Wellness Report', ['Date', 'Steps', 'Calories', 'Sleep (min)', 'Mood'], data, 'wellness_report');
        } else {
            const data = logs.map(l => ({
                Date: new Date(l.date).toLocaleDateString(),
                Steps: l.steps,
                Calories: l.calories,
                SleepMinutes: l.sleep_minutes,
                Mood: l.mood,
                Meals: l.meals ? l.meals.map(m => m.name).join(', ') : ''
            }));
            reportService.exportToExcel(data, 'Wellness Logs', 'wellness_export');
        }
    };

    const renderContent = () => {
        switch (activeView) {
            case 'Activity':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fadeIn">
                        <Card className="p-3">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200">Daily Steps</h3>
                                <Badge variant="success" className="text-xs">+12% vs yesterday</Badge>
                            </div>
                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-5xl font-black text-gray-800 dark:text-white">{todayLog?.steps?.toLocaleString() || '0'}</span>
                                <span className="text-gray-400 font-bold mb-2">/ 10,000 steps</span>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full" style={{ width: `${Math.min(((todayLog?.steps || 0) / 10000) * 100, 100)}%` }}></div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200">Calories Burned</h3>
                                <Icon name="FireIcon" className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-5xl font-black text-gray-800 dark:text-white">{todayLog?.calories || 0}</span>
                                <span className="text-gray-400 font-bold mb-2">kcal</span>
                            </div>
                            <div className="flex gap-2 mt-4 h-16 items-end">
                                {logs.slice().reverse().map((log, i) => (
                                    <div key={i} className="flex-1 bg-orange-100 dark:bg-orange-900/30 rounded-t-lg relative overflow-hidden" style={{ height: `${Math.min((log.calories / 1000) * 100, 100)}%` }}>
                                        <div className="absolute inset-0 bg-orange-400 opacity-80 hover:opacity-100 transition-opacity"></div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                );
            case 'Sleep':
                const hours = Math.floor((todayLog?.sleep_minutes || 0) / 60);
                const mins = (todayLog?.sleep_minutes || 0) % 60;

                // Estimate sleep stages based on total duration (approximate percentages)
                const deepSleepMins = Math.floor((todayLog?.sleep_minutes || 0) * 0.20);
                const lightSleepMins = Math.floor((todayLog?.sleep_minutes || 0) * 0.55);
                const remSleepMins = Math.floor((todayLog?.sleep_minutes || 0) * 0.25);

                const formatDuration = (m: number) => {
                    const h = Math.floor(m / 60);
                    const mn = m % 60;
                    return h > 0 ? `${h}h ${mn}m` : `${mn}m`;
                };

                return (
                    <div className="bg-indigo-900/5 dark:bg-indigo-900/20 backdrop-blur-xl rounded-2xl p-8 border border-indigo-100 dark:border-indigo-800 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-xl text-indigo-600 dark:text-indigo-300">
                                <Icon name="MoonIcon" className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-100">{hours}h {mins}m</h3>
                                <p className="text-indigo-400 dark:text-indigo-300 font-bold">Sleep Duration</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-300">
                                <span>Deep Sleep</span>
                                <span>{formatDuration(deepSleepMins)} (20%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full w-[20%] bg-indigo-600 rounded-full"></div>
                            </div>

                            <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-300">
                                <span>Light Sleep</span>
                                <span>{formatDuration(lightSleepMins)} (55%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full w-[55%] bg-indigo-400 rounded-full"></div>
                            </div>

                            <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-300">
                                <span>REM</span>
                                <span>{formatDuration(remSleepMins)} (25%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full w-[25%] bg-indigo-300 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                );
            case 'Mindfulness':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                        {['Morning Calm', 'Focus Flow', 'Deep Rest'].map((session, i) => (
                            <Card key={i} className="p-6 hover:scale-105 transition-transform cursor-pointer group">
                                <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                                    <Icon name="PlayIcon" className="w-6 h-6 ml-1" />
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">{session}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">10 min • Guided</p>
                                <div className="w-full h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full w-0 group-hover:w-full transition-all duration-1000 bg-gray-800 dark:bg-white"></div>
                                </div>
                            </Card>
                        ))}
                    </div>
                );
            case 'Nutrition':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                        {/* Daily Summary */}
                        <Card className="lg:col-span-2 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800 dark:text-white">Daily Intake</h3>
                                <Button variant="outline" size="sm" icon="PlusCircle" onClick={() => setShowLogMealModal(true)}>Log Meal</Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                                    <div className="text-xs font-bold text-orange-500 uppercase mb-1">Calories</div>
                                    <div className="text-2xl font-black text-gray-800 dark:text-white">{todayLog?.calories || 0}</div>
                                    <div className="text-xs text-gray-400">/ 2,200 kcal</div>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <div className="text-xs font-bold text-blue-500 uppercase mb-1">Protein</div>
                                    <div className="text-2xl font-black text-gray-800 dark:text-white">--</div>
                                    <div className="text-xs text-gray-400">/ 150g</div>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                    <div className="text-xs font-bold text-green-500 uppercase mb-1">Carbs</div>
                                    <div className="text-2xl font-black text-gray-800 dark:text-white">--</div>
                                    <div className="text-xs text-gray-400">/ 250g</div>
                                </div>
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800">
                                    <div className="text-xs font-bold text-yellow-600 uppercase mb-1">Fats</div>
                                    <div className="text-2xl font-black text-gray-800 dark:text-white">--</div>
                                    <div className="text-xs text-gray-400">/ 70g</div>
                                </div>
                            </div>

                            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-4">Today's Meals</h4>
                            <div className="space-y-3">
                                {todayLog?.meals && todayLog.meals.length > 0 ? (
                                    todayLog.meals.map((meal, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white">{meal.name}</p>
                                                <p className="text-xs text-gray-500">{meal.time} • {meal.calories} kcal</p>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                P: {meal.protein}g C: {meal.carbs}g F: {meal.fats}g
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                                        <p className="text-gray-500 text-sm">No meals logged today.</p>
                                        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowLogMealModal(true)}>Add Breakfast</Button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Meal Planner / Suggestions */}
                        <div className="space-y-6">
                            <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-700 text-white border-none">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">Hydration</h3>
                                        <p className="text-green-100 text-sm">Keep your body hydrated</p>
                                    </div>
                                    <Icon name="BeakerIcon" className="w-8 h-8 text-green-200" />
                                </div>
                                <div className="text-4xl font-black mb-2">-- L</div>
                                <div className="w-full bg-black/20 rounded-full h-2 mb-4">
                                    <div className="bg-white h-full rounded-full w-[0%]"></div>
                                </div>
                                <Button variant="secondary" size="sm" className="w-full bg-white/20 hover:bg-white/30 text-white border-none">
                                    + Add Water (250ml)
                                </Button>
                            </Card>

                            <Card className="p-6">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-4">AI Suggestion</h3>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                                    <p className="text-sm text-blue-800 dark:text-blue-200 italic">
                                        "Based on your activity today, try adding more protein to your dinner to aid muscle recovery."
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setIsMealPlanModalOpen(true)}
                                >
                                    Generate Meal Plan
                                </Button>
                            </Card>
                        </div>
                    </div>
                );
            case 'Breathing':
                return (
                    <div className="flex flex-col items-center justify-center h-[400px] animate-fadeIn">
                        <div className="w-64 h-64 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center animate-pulse shadow-2xl shadow-teal-500/30">
                            <span className="text-4xl font-bold text-white">Breathe</span>
                        </div>
                        <p className="mt-8 text-gray-500 dark:text-gray-400">Inhale... Exhale...</p>
                    </div>
                );
            case 'Break Timer':
                return (
                    <div className="flex flex-col items-center justify-center h-[400px] animate-fadeIn">
                        <div className="text-4xl font-black text-gray-800 dark:text-white mb-4 font-mono">05:00</div>
                        <div className="flex gap-4">
                            <Button variant="primary" size="lg" icon="PlayIcon">Start Break</Button>
                            <Button variant="secondary" size="lg" icon="ArrowPathIcon">Reset</Button>
                        </div>
                        <p className="mt-8 text-gray-500 dark:text-gray-400">Take a moment to stretch and relax.</p>
                    </div>
                );
            case 'Resources':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-300 mb-4">
                                <Icon name="BookOpenIcon" className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Teacher Support Guide</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Comprehensive guide for managing classroom stress and workload.</p>
                        </Card>
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-300 mb-4">
                                <Icon name="PhoneIcon" className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Helpline & Counseling</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Confidential support services available 24/7 for staff.</p>
                        </Card>
                    </div>
                );
            case 'Community':
                return (
                    <div className="flex flex-col items-center justify-center h-[400px] animate-fadeIn text-center">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400 mb-3">
                            <Icon name="UsersIcon" className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">Wellness Community</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md">Connect with colleagues, share tips, and join wellness challenges.</p>
                        <Button variant="primary" className="mt-6">Join Discussion</Button>
                    </div>
                );
            case 'AI Coach':
                return (
                    <Card className="h-[500px] flex flex-col animate-fadeIn overflow-hidden p-0">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center text-white shadow-md">
                                    <Icon name="Sparkles" className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">Wellness Coach</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI-Powered Health Assistant</p>
                                </div>
                            </div>
                            <Badge variant="success" className="text-xs">Online</Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-slate-900/30">
                            {messages.length === 0 && (
                                <div className="text-center text-gray-400 dark:text-slate-500 mt-10">
                                    <Icon name="ChatBubbleLeftRight" className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Ask me about your health, workout plans, or nutrition!</p>
                                </div>
                            )}
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-slate-600 shadow-sm'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-slate-600 shadow-sm flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!input.trim()) return;
                                    sendMessage(input);
                                    setInput('');
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask your coach..."
                                    className="flex-1 bg-gray-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700 outline-none transition-all text-gray-800 dark:text-white placeholder-gray-400"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="bg-gray-900 dark:bg-blue-600 text-white p-3 rounded-xl hover:bg-gray-800 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                                >
                                    <Icon name="PaperAirplane" className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </Card>
                );
            default:
                return null;
        }
    };

    const tabs = ['Activity', 'Sleep', 'Mindfulness', 'Nutrition', 'Body'];
    if (userRole && userRole !== 'Owner') {
        tabs.push('AI Coach');
    }

    return (
        <div className="h-full flex flex-col gap-2 overflow-y-auto no-scrollbar p-1 text-gray-800 dark:text-white">
            {/* Hero Section */}
            <div className="h-64 rounded-3xl bg-gradient-to-br from-[#ff9a9e] via-[#fecfef] to-[#a18cd1] dark:from-pink-900 dark:via-purple-900 dark:to-indigo-900 p-8 text-white shadow-xl relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-black mb-2 drop-shadow-sm">Good Morning!</h1>
                            <p className="text-white/90 font-medium text-lg">Your wellness journey is on track.</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 border border-white/30">
                            <Icon name="Heart" className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="flex gap-8">
                        <div>
                            <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">Heart Rate</p>
                            <p className="text-3xl font-black">72 <span className="text-lg font-medium opacity-80">bpm</span></p>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">Stress Level</p>
                            <p className="text-3xl font-black">{todayLog?.mood || 'Normal'} <span className="text-lg font-medium opacity-80">12%</span></p>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">Daily Steps</p>
                            <p className="text-3xl font-black">{todayLog?.steps?.toLocaleString() || '8,500'} <span className="text-lg font-medium opacity-80">today</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 overflow-x-auto pb-2 shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveView(tab)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeView === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 min-h-[300px]">
                {renderContent()}
            </div>

            <AIContentGeneratorModal
                isOpen={isMealPlanModalOpen}
                onClose={() => setIsMealPlanModalOpen(false)}
                onSuccess={(content) => {
                    // In a real app, this would save the plan
                    console.log("Meal Plan Generated:", content);
                    setIsMealPlanModalOpen(false);
                }}
                title="Generate Daily Meal Plan"
                promptTemplate={`Create a healthy, balanced meal plan for today.
            
            Current Stats:
            - Calories Burned: 
            - Steps: 
            
            Include:
            - Breakfast
            - Lunch
            - Dinner
            - 2 Snacks
            
            Focus on high protein and energy sustaining foods.`}
                contextData={{ log: todayLog }}
            />

            {showLogMealModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Log Meal</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleLogMeal({
                                name: formData.get('name') as string,
                                calories: Number(formData.get('calories')),
                                protein: Number(formData.get('protein')),
                                carbs: Number(formData.get('carbs')),
                                fats: Number(formData.get('fats')),
                                time: new Date().toISOString()
                            });
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Meal Name</label>
                                    <input name="name" required className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="Oatmeal & Berries" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Calories</label>
                                        <input name="calories" type="number" required className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="350" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Protein (g)</label>
                                        <input name="protein" type="number" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="12" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Carbs (g)</label>
                                        <input name="carbs" type="number" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="45" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Fats (g)</label>
                                        <input name="fats" type="number" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="8" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button variant="outline" type="button" onClick={() => setShowLogMealModal(false)}>Cancel</Button>
                                    <Button variant="primary" type="submit">Save Meal</Button>
                                </div>
                            </div>
                        </form>
                    </Card>
                </div>
            )}    </div>
    );
};

export default Wellness;
