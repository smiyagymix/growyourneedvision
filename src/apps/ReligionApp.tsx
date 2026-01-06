import React, { useState, useEffect } from 'react';
import { Icon, Card, Button, Modal } from '../components/shared/ui/CommonUI';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import { religionService, ReligiousEvent, QuranVerse, NameOfAllah, Dua, Hadith, PrayerTime } from '../services/religionService';
import { LoadingScreen } from '../components/shared/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../hooks/useToast';

interface ReligionAppProps {
    activeTab: string;
    activeSubNav: string;
    onNavigate?: (tab: string, subNav?: string) => void;
}

interface NextPrayer {
    name: string;
    time: string;
    minutesUntil: number;
}

interface SoulPrescription {
    verse: { arabic: string; translation: string; reference: string };
    dua: { arabic: string; translation: string };
}

interface InheritanceResult {
    relation: string;
    share: number;
    amount: number;
    note: string;
}

interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

interface QuranVerseDetail {
    id: number;
    verse_number: number;
    arabic_text: string;
    translation: string;
}

const ReligionApp: React.FC<ReligionAppProps> = ({ activeTab, activeSubNav, onNavigate }) => {
    const { showToast } = useToast();
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [events, setEvents] = useState<ReligiousEvent[]>([]);
    const [verseOfDay, setVerseOfDay] = useState<QuranVerse | null>(null);
    const [hadithOfDay, setHadithOfDay] = useState<Hadith | null>(null);
    const [namesOfAllah, setNamesOfAllah] = useState<NameOfAllah[]>([]);
    const [duas, setDuas] = useState<Dua[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
    const [todaysPrayers, setTodaysPrayers] = useState<PrayerTime | null>(null);

    // Feature State
    const [tasbihCount, setTasbihCount] = useState(0);
    const [tasbihTarget, setTasbihTarget] = useState(33);
    const [tasbihHistory, setTasbihHistory] = useState<{ date: string; count: number; target: number }[]>([]);
    
    const [zakatAssets, setZakatAssets] = useState(0);

    // New Features State
    const [mood, setMood] = useState<string | null>(null);
    const [prescription, setPrescription] = useState<SoulPrescription | null>(null);
    const [prescriptionHistory, setPrescriptionHistory] = useState<SoulPrescription[]>([]);
    
    const [inheritanceParams, setInheritanceParams] = useState({ assets: 0, spouse: 'None', sons: 0, daughters: 0, father: false, mother: false });
    const [inheritanceResult, setInheritanceResult] = useState<InheritanceResult[]>([]);

    // Quran Reader State
    const [surahList, setSurahList] = useState<Surah[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<number>(1);
    const [quranVerses, setQuranVerses] = useState<QuranVerseDetail[]>([]);
    const [loadingQuran, setLoadingQuran] = useState(false);
    const [searchSurah, setSearchSurah] = useState('');
    const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());

    // Prayer Tracker State
    const [prayerTracker, setPrayerTracker] = useState<{ [key: string]: boolean }>({
        Fajr: false,
        Dhuhr: false,
        Asr: false,
        Maghrib: false,
        Isha: false
    });
    const [prayerHistory, setPrayerHistory] = useState<{ date: string; prayers: { [key: string]: boolean } }[]>([]);

    // Hifz Progress State
    const [hifzProgress, setHifzProgress] = useState({
        currentJuz: 1,
        completedAyahs: 0,
        totalAyahs: 6236,
        streak: 0,
        lastStudyDate: null as string | null
    });

    // Qibla State
    const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Prayer Times State
    const [prayerCity, setPrayerCity] = useState('Mecca');
    const [prayerCountry, setPrayerCountry] = useState('Saudi Arabia');

    const [isQiblaOpen, setIsQiblaOpen] = useState(false);
    const [isQuranOpen, setIsQuranOpen] = useState(false);

    // Duas State
    const [selectedDuaCategory, setSelectedDuaCategory] = useState<string>('All');

    // Fallback times if API fails
    const defaultPrayerTimes = {
        Fajr: '04:30',
        Dhuhr: '12:15',
        Asr: '15:45',
        Maghrib: '18:20',
        Isha: '20:00'
    };

    useEffect(() => {
        loadData();
        updateNextPrayer();
        loadPrayerTracker();
        loadTasbihData();
        loadPrescriptionHistory();
        loadHifzProgress();
        loadBookmarks();

        // Update next prayer every minute
        const interval = setInterval(updateNextPrayer, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [upcomingEvents, verse, hadith, prayers, names, duaList] = await Promise.all([
                religionService.getUpcomingEvents(),
                religionService.getVerseOfTheDay(),
                religionService.getHadithOfTheDay(),
                religionService.getTodayPrayers(prayerCity, prayerCountry),
                religionService.getNamesOfAllah(),
                religionService.getDuas()
            ]);
            setEvents(upcomingEvents);
            setVerseOfDay(verse);
            setHadithOfDay(hadith);
            setTodaysPrayers(prayers);
            setNamesOfAllah(names);
            setDuas(duaList);

            // Initial update of next prayer once data is loaded
            if (prayers) {
                const next = religionService.getNextPrayer(prayers);
                setNextPrayer(next);
            } else {
                // Handle null case for getNextPrayer if needed, or just set null
                setNextPrayer(null);
            }
        } catch (error) {
            console.error('Failed to load religious data:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshPrayerTimes = async () => {
        const prayers = await religionService.getTodayPrayers(prayerCity, prayerCountry);
        setTodaysPrayers(prayers);
        if (prayers) {
            const next = religionService.getNextPrayer(prayers);
            setNextPrayer(next);
        }
    };

    const updateNextPrayer = () => {
        if (todaysPrayers) {
            const next = religionService.getNextPrayer(todaysPrayers);
            setNextPrayer(next);
        }
    };

    const loadPrayerTracker = () => {
        const today = new Date().toISOString().split('T')[0];
        const saved = localStorage.getItem(`prayerTracker_${today}`);
        if (saved) {
            setPrayerTracker(JSON.parse(saved));
        }
    };

    const loadTasbihData = () => {
        const savedCount = localStorage.getItem('tasbihCount');
        const savedTarget = localStorage.getItem('tasbihTarget');
        const savedHistory = localStorage.getItem('tasbihHistory');
        
        if (savedCount) setTasbihCount(parseInt(savedCount));
        if (savedTarget) setTasbihTarget(parseInt(savedTarget));
        if (savedHistory) setTasbihHistory(JSON.parse(savedHistory));
    };

    const loadPrescriptionHistory = () => {
        const saved = localStorage.getItem('prescriptionHistory');
        if (saved) setPrescriptionHistory(JSON.parse(saved));
    };

    const loadHifzProgress = () => {
        const saved = localStorage.getItem('hifzProgress');
        if (saved) setHifzProgress(JSON.parse(saved));
    };

    const loadBookmarks = () => {
        const saved = localStorage.getItem('quranBookmarks');
        if (saved) setBookmarkedVerses(new Set(JSON.parse(saved)));
    };

    const handleTasbihCount = () => {
        const newCount = tasbihCount + 1;
        setTasbihCount(newCount);
        localStorage.setItem('tasbihCount', newCount.toString());
        
        // Add to history if target reached
        if (newCount % tasbihTarget === 0) {
            const today = new Date().toISOString().split('T')[0];
            const newHistory = [...tasbihHistory, { date: today, count: newCount, target: tasbihTarget }];
            setTasbihHistory(newHistory);
            localStorage.setItem('tasbihHistory', JSON.stringify(newHistory));
            showToast(`MashaAllah! Completed ${newCount / tasbihTarget} cycles!`, "success");
        }
    };

    const resetTasbih = () => {
        setTasbihCount(0);
        localStorage.setItem('tasbihCount', '0');
        showToast("Tasbih counter reset", "info");
    };

    const changeTasbihTarget = (newTarget: number) => {
        setTasbihTarget(newTarget);
        localStorage.setItem('tasbihTarget', newTarget.toString());
        showToast(`Target changed to ${newTarget}`, "info");
    };

    const fetchQibla = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                const data = await religionService.getQiblaDirection(latitude, longitude);
                if (data) {
                    setQiblaDirection(data.direction);
                }
            }, (error) => {
                console.error("Error getting location", error);
                showToast("Please enable location services to find Qibla direction.", "error");
            });
        } else {
            showToast("Geolocation is not supported by this browser.", "error");
        }
    };

    useEffect(() => {
        if (isQiblaOpen && !qiblaDirection) {
            fetchQibla();
        }
    }, [isQiblaOpen]);

    const getCurrentPrayer = () => {
        if (!todaysPrayers) return 'Isha';
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const timeToMinutes = (timeStr: string) => {
            const [time] = timeStr.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const times = [
            { name: 'Fajr', minutes: timeToMinutes(todaysPrayers.fajr) },
            { name: 'Dhuhr', minutes: timeToMinutes(todaysPrayers.dhuhr) },
            { name: 'Asr', minutes: timeToMinutes(todaysPrayers.asr) },
            { name: 'Maghrib', minutes: timeToMinutes(todaysPrayers.maghrib) },
            { name: 'Isha', minutes: timeToMinutes(todaysPrayers.isha) }
        ];

        for (let i = times.length - 1; i >= 0; i--) {
            if (currentTime >= times[i].minutes) {
                return times[i].name;
            }
        }
        return 'Isha';
    };

    const handleMoodSelect = (selectedMood: 'Anxious' | 'Sad' | 'Angry' | 'Happy' | 'Confused' | 'Grateful') => {
        setMood(selectedMood);
        const newPrescription = religionService.getSoulPrescription(selectedMood);
        setPrescription(newPrescription);
        
        // Save to history
        const historyEntry = { ...newPrescription, mood: selectedMood, date: new Date().toISOString() };
        const newHistory = [historyEntry, ...prescriptionHistory.slice(0, 9)]; // Keep last 10
        setPrescriptionHistory(newHistory);
        localStorage.setItem('prescriptionHistory', JSON.stringify(newHistory));
        
        showToast(`Soul prescription for ${selectedMood.toLowerCase()} generated`, "success");
    };

    const toggleBookmark = (verseId: number, surahNumber: number) => {
        const bookmarkKey = `${surahNumber}:${verseId}`;
        const newBookmarks = new Set(bookmarkedVerses);
        
        if (newBookmarks.has(bookmarkKey)) {
            newBookmarks.delete(bookmarkKey);
            showToast("Bookmark removed", "info");
        } else {
            newBookmarks.add(bookmarkKey);
            showToast("Verse bookmarked", "success");
        }
        
        setBookmarkedVerses(newBookmarks);
        localStorage.setItem('quranBookmarks', JSON.stringify([...newBookmarks]));
    };

    const updateHifzProgress = (completedAyahs: number) => {
        const today = new Date().toISOString().split('T')[0];
        const newProgress = {
            ...hifzProgress,
            completedAyahs: Math.min(hifzProgress.totalAyahs, hifzProgress.completedAyahs + completedAyahs),
            currentJuz: Math.floor((hifzProgress.completedAyahs + completedAyahs) / 200) + 1,
            lastStudyDate: today,
            streak: hifzProgress.lastStudyDate === today ? hifzProgress.streak : hifzProgress.streak + 1
        };
        setHifzProgress(newProgress);
        localStorage.setItem('hifzProgress', JSON.stringify(newProgress));
    };

    const calculateInheritance = () => {
        const result = religionService.calculateInheritance(
            inheritanceParams.assets, 
            {
                spouse: inheritanceParams.spouse as 'Husband' | 'Wife' | 'None',
                sons: inheritanceParams.sons,
                daughters: inheritanceParams.daughters,
                father: inheritanceParams.father,
                mother: inheritanceParams.mother
            }
        );
        setInheritanceResult(result);
    };

    const loadSurah = async (surahNumber: number) => {
        setLoadingQuran(true);
        setSelectedSurah(surahNumber);
        try {
            const details = await religionService.getSurahDetails(surahNumber);
            if (details) {
                // Merge Arabic and Translation
                const verses: QuranVerseDetail[] = details.arabic.ayahs.map((ayah: { number: number; numberInSurah: number; text: string }, index: number) => ({
                    id: ayah.number,
                    verse_number: ayah.numberInSurah,
                    arabic_text: ayah.text,
                    translation: details.translation.ayahs[index].text
                }));
                setQuranVerses(verses);
            }
        } catch (error) {
            console.error("Failed to load surah", error);
        } finally {
            setLoadingQuran(false);
        }
    };

    useEffect(() => {
        if (isQuranOpen) {
            // Load Surah List
            religionService.getAllSurahs().then(setSurahList);
            
            if (quranVerses.length === 0) {
                loadSurah(1); // Load Al-Fatihah by default
            }
        }
    }, [isQuranOpen]);

    const filteredSurahs = surahList.filter(s => 
        s.name.toLowerCase().includes(searchSurah.toLowerCase()) || 
        s.englishName.toLowerCase().includes(searchSurah.toLowerCase()) ||
        s.number.toString().includes(searchSurah)
    );

    if (loading) {
        return <LoadingScreen />;
    }

    // --- RENDER HELPERS ---

    const renderDashboard = () => (
        <div className="h-full w-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans animate-fadeIn">
            
            {/* Top Section: Prayer & Mood (Fixed Height) */}
            <div className="flex-none p-4 pb-2 grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Prayer Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-8 bg-gradient-to-r from-emerald-700 via-teal-800 to-cyan-900 text-white rounded-2xl p-4 relative overflow-hidden shadow-lg flex flex-col justify-between"
                >
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold font-serif">{nextPrayer?.name || 'Prayer Times'}</h2>
                                <p className="opacity-90 text-sm">
                                    {nextPrayer ? `Next in ${Math.floor(nextPrayer.minutesUntil / 60)}h ${nextPrayer.minutesUntil % 60}m` : 'Prayer schedule'}
                                </p>
                            </div>
                            <div className="hidden md:block h-8 w-px bg-white/20"></div>
                            <div className="hidden md:block">
                                <div className="text-2xl font-bold font-mono">{nextPrayer?.time || '--:--'}</div>
                                <div className="text-[10px] uppercase tracking-widest opacity-80">Local Time</div>
                            </div>
                        </div>
                        
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsAIModalOpen(true)}
                            className="bg-white/20 hover:bg-white/30 text-white border-none flex items-center gap-2 backdrop-blur-sm text-xs"
                        >
                            <Icon name="StarIcon" className="w-3 h-3" />
                            Daily Reflection
                        </Button>
                    </div>

                    {/* Compact Prayer Times Row */}
                    <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-white/10">
                        {Object.entries(todaysPrayers ? {
                            Fajr: todaysPrayers.fajr.split(' ')[0],
                            Dhuhr: todaysPrayers.dhuhr.split(' ')[0],
                            Asr: todaysPrayers.asr.split(' ')[0],
                            Maghrib: todaysPrayers.maghrib.split(' ')[0],
                            Isha: todaysPrayers.isha.split(' ')[0]
                        } : defaultPrayerTimes).map(([name, time]) => {
                            const isCurrent = getCurrentPrayer() === name;
                            const isCompleted = prayerTracker[name];
                            return (
                                <div
                                    key={name}
                                    className={`text-center cursor-pointer group`}
                                    onClick={() => togglePrayer(name)}
                                >
                                    <div className={`text-[10px] uppercase font-semibold ${isCurrent ? 'text-yellow-300' : 'text-white/70'}`}>{name}</div>
                                    <div className={`font-bold text-sm ${isCurrent ? 'text-white' : 'text-white/90'}`}>{time}</div>
                                    <div className={`mt-1 w-4 h-4 mx-auto rounded-full border flex items-center justify-center transition-all ${
                                        isCompleted ? 'bg-emerald-400 border-emerald-400 text-emerald-900' : 'border-white/30'
                                    }`}>
                                        {isCompleted && <Icon name="CheckIcon" className="w-3 h-3" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Background Decoration */}
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 pointer-events-none">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2" fill="none" />
                            <path d="M 50 5 L 50 25 M 50 75 L 50 95" stroke="white" strokeWidth="2" />
                        </svg>
                    </div>
                </motion.div>

                {/* Mood Tracker */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col"
                >
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Icon name="HeartIcon" className="w-4 h-4 text-rose-500" />
                        Soul Prescription
                    </h2>
                    
                    {!mood ? (
                        <div className="flex flex-wrap gap-2 overflow-y-auto flex-1 content-start">
                            {(['Anxious', 'Sad', 'Angry', 'Happy', 'Confused', 'Grateful'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => handleMoodSelect(m)}
                                    className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all text-xs font-medium flex-grow text-center"
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col animate-fadeIn overflow-y-auto">
                            <div className="flex justify-between items-center mb-2">
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
                                    {mood}
                                </span>
                                <button onClick={() => setMood(null)} className="text-xs text-gray-500 hover:text-gray-700">Reset</button>
                            </div>
                            <div className="space-y-2">
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                    <p className="text-sm font-serif text-gray-800 dark:text-gray-200 text-right">{prescription?.verse.arabic}</p>
                                    <p className="text-[10px] text-gray-600 dark:text-gray-400 italic mt-1 line-clamp-2">"{prescription?.verse.translation}"</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                    <p className="text-sm font-serif text-gray-800 dark:text-gray-200 text-right">{prescription?.dua.arabic}</p>
                                    <p className="text-[10px] text-gray-600 dark:text-gray-400 italic mt-1 line-clamp-2">"{prescription?.dua.translation}"</p>
                                </div>
                            </div>
                            
                            {/* Prescription History */}
                            {prescriptionHistory.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Recent Prescriptions</h4>
                                    <div className="space-y-1 max-h-20 overflow-y-auto">
                                        {prescriptionHistory.slice(0, 3).map((item, idx) => (
                                            <div key={idx} className="text-[10px] text-gray-500 flex justify-between">
                                                <span>{new Date(item.date).toLocaleDateString()}</span>
                                                <span className="capitalize">{item.mood}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Main Content Grid (Flexible Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 pt-0 overflow-hidden">
                
                {/* Left Sidebar: Quick Actions & Calendar */}
                <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin">
                    <Card className="p-4">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                        <div className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => onNavigate?.('Quran', 'Read')}>
                                <Icon name="BookOpenIcon" className="w-3 h-3 mr-2" /> Quran Reader
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => onNavigate?.('Prayer', 'Tracker')}>
                                <Icon name="StarIcon" className="w-3 h-3 mr-2" /> Dhikr Counter
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => onNavigate?.('Prayer', 'Qibla')}>
                                <Icon name="MapPinIcon" className="w-3 h-3 mr-2" /> Qibla Finder
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => onNavigate?.('Ramadan', 'Zakat')}>
                                <Icon name="CalculatorIcon" className="w-3 h-3 mr-2" /> Zakat Calculator
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => onNavigate?.('Knowledge', 'Inheritance')}>
                                <Icon name="ScaleIcon" className="w-3 h-3 mr-2" /> Inheritance
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-100 dark:border-indigo-800">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Icon name="ChartBarIcon" className="w-4 h-4 text-indigo-600" />
                            Hifz Progress
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600 dark:text-gray-400">Current Juz</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Juz {hifzProgress.currentJuz}/30</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                        style={{ width: `${(hifzProgress.completedAyahs / hifzProgress.totalAyahs) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span className="text-gray-500">{hifzProgress.completedAyahs} Ayahs</span>
                                    <span className="text-gray-500">{hifzProgress.streak} day streak</span>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full text-xs"
                                onClick={() => updateHifzProgress(10)}
                            >
                                +10 Ayahs Studied
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {new Date().toLocaleString('ar-SA-u-ca-islamic', { month: 'long' })}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date().toLocaleString('ar-SA-u-ca-islamic', { year: 'numeric' })}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Center Feed: Verse, Hadith, Duas */}
                <div className="lg:col-span-6 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin">
                    {/* Verse of the Day */}
                    {verseOfDay && (
                        <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-500 font-bold">Verse of the Day</h3>
                                <span className="text-xs font-bold text-gray-500">Surah {verseOfDay.surah_name} • {verseOfDay.verse_number}</span>
                            </div>
                            <p className="text-2xl font-serif text-right text-gray-900 dark:text-white mb-2 leading-loose">
                                {verseOfDay.arabic_text}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                "{verseOfDay.translation}"
                            </p>
                        </Card>
                    )}

                    {/* Hadith */}
                    {hadithOfDay && (
                        <Card className="p-4 border-l-4 border-teal-500">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Icon name="ChatBubbleBottomCenterTextIcon" className="w-4 h-4 text-teal-600" />
                                Hadith of the Day
                            </h2>
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
                                "{hadithOfDay.text_en}"
                            </p>
                            <div className="text-xs text-gray-500 text-right">
                                — {hadithOfDay.collection}
                            </div>
                        </Card>
                    )}

                    {/* Duas Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {duas.map((dua) => (
                            <Card key={dua.id} className="p-3 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] rounded-full font-semibold">
                                        {dua.category}
                                    </span>
                                </div>
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{dua.title}</h3>
                                <p className="text-right font-serif text-base text-gray-800 dark:text-gray-200 mb-1">{dua.arabic}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2">"{dua.translation}"</p>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar: Events & Names */}
                <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin">
                    {/* Names of Allah (Vertical List for Compactness) */}
                    {namesOfAllah.length > 0 && (
                        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Icon name="SparklesIcon" className="w-4 h-4 text-amber-500" />
                                Names of Allah
                            </h2>
                            <div className="space-y-2">
                                {namesOfAllah.slice(0, 3).map((name) => (
                                    <div key={name.id} className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 last:border-0">
                                        <div>
                                            <div className="font-bold text-xs text-gray-900 dark:text-white">{name.transliteration}</div>
                                            <div className="text-[10px] text-gray-600 dark:text-gray-400">{name.meaning}</div>
                                        </div>
                                        <div className="text-xl font-serif text-emerald-800 dark:text-emerald-400">{name.arabic}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Events */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Icon name="CalendarIcon" className="w-4 h-4 text-emerald-600" />
                            Upcoming Events
                        </h2>
                        <div className="space-y-2">
                            {events.map((event) => (
                                <Card key={event.id} className="p-3 hover:shadow-md transition-all cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded bg-emerald-100 dark:bg-emerald-900/30 flex flex-col items-center justify-center flex-shrink-0">
                                            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                                {new Date(event.date).getDate()}
                                            </div>
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase">
                                                {new Date(event.date).toLocaleString('default', { month: 'short' })}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-xs text-gray-900 dark:text-white truncate">{event.title}</h3>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                                                {event.time && <span>{event.time}</span>}
                                                <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                                                    {event.event_type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderQuranReader = () => (
        <div className="h-full flex flex-col p-6 bg-white dark:bg-gray-900 animate-fadeIn">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Noble Quran Reader</h2>
                <div className="w-64">
                    <input 
                        type="text" 
                        placeholder="Search Surah..." 
                        className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        value={searchSurah}
                        onChange={(e) => setSearchSurah(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-thin">
                {filteredSurahs.map((surah) => (
                    <button
                        key={surah.number}
                        onClick={() => loadSurah(surah.number)}
                        className={`px-4 py-3 rounded-xl whitespace-nowrap transition-all flex flex-col items-center min-w-[140px] border ${
                            selectedSurah === surah.number 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' 
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        }`}
                    >
                        <span className="font-bold text-lg">{surah.number}. {surah.englishName}</span>
                        <span className="text-xs opacity-80">{surah.name}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin">
                {loadingQuran ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    </div>
                ) : quranVerses.length > 0 ? (
                    quranVerses.map((verse) => {
                        const isBookmarked = bookmarkedVerses.has(`${selectedSurah}:${verse.verse_number}`);
                        return (
                        <div key={verse.id} className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start mb-6">
                                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">
                                    {verse.verse_number}
                                </span>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => showToast("Audio playback coming soon!", "info")}
                                    >
                                        <Icon name="PlayIcon" className="w-5 h-5" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => toggleBookmark(verse.verse_number, selectedSurah)}
                                        className={isBookmarked ? "text-amber-500" : ""}
                                    >
                                        <Icon name="BookmarkIcon" className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-3xl font-serif text-right leading-loose text-gray-900 dark:text-white mb-6" dir="rtl">
                                {verse.arabic_text}
                            </p>
                            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-light">
                                {verse.translation}
                            </p>
                        </div>
                        );
                    })
                ) : (
                    <div className="text-center py-24 text-gray-500">
                        <Icon name="BookOpenIcon" className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>Select a Surah to begin reading</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderQibla = () => (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 animate-fadeIn">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Qibla Finder</h2>
            {!qiblaDirection ? (
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mb-6"></div>
                    <p className="text-lg text-gray-600">Calibrating compass...</p>
                    <p className="text-sm text-gray-500 mt-2">Please ensure location services are enabled</p>
                </div>
            ) : (
                <div className="relative w-96 h-96">
                    {/* Compass Ring */}
                    <div className="absolute inset-0 rounded-full border-8 border-gray-100 dark:border-gray-800 flex items-center justify-center shadow-inner">
                        <div className="w-1 h-6 bg-gray-300 absolute top-0"></div>
                        <div className="w-1 h-6 bg-gray-300 absolute bottom-0"></div>
                        <div className="w-6 h-1 bg-gray-300 absolute left-0"></div>
                        <div className="w-6 h-1 bg-gray-300 absolute right-0"></div>
                        <div className="text-xl font-bold text-gray-400 absolute top-4">N</div>
                    </div>
                    
                    {/* Needle */}
                    <motion.div 
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ rotate: qiblaDirection }}
                        transition={{ type: "spring", stiffness: 40, damping: 10 }}
                    >
                        <div className="relative h-full w-full">
                            <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                                <div className="bg-emerald-600 text-white p-2 rounded-full shadow-xl">
                                    <Icon name="MapPinIcon" className="w-8 h-8" />
                                </div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 w-2 h-32 bg-gradient-to-t from-transparent to-emerald-500 origin-bottom transform -translate-x-1/2 -translate-y-full rounded-full opacity-50"></div>
                        </div>
                    </motion.div>
                    
                    {/* Degree Display */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-10 text-center">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Qibla Direction</div>
                            <span className="text-4xl font-bold text-emerald-600">{Math.round(qiblaDirection)}°</span>
                        </div>
                    </div>
                </div>
            )}
            <p className="mt-12 text-gray-500 max-w-md text-center">
                Align the compass needle with the Kaaba icon to face the Qibla direction accurately.
            </p>
        </div>
    );

    const renderTasbih = () => (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 animate-fadeIn">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">Digital Tasbih</h2>
            
            <div className="relative w-80 h-80 mb-12">
                {/* Circular Progress */}
                <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
                    <circle
                        cx="160"
                        cy="160"
                        r="140"
                        stroke="currentColor"
                        strokeWidth="20"
                        fill="transparent"
                        className="text-gray-100 dark:text-gray-800"
                    />
                    <circle
                        cx="160"
                        cy="160"
                        r="140"
                        stroke="currentColor"
                        strokeWidth="20"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 140}
                        strokeDashoffset={2 * Math.PI * 140 * (1 - (tasbihCount % tasbihTarget) / tasbihTarget)}
                        className="text-emerald-500 transition-all duration-300 ease-out"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-8xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tighter">
                        {tasbihCount}
                    </div>
                    <div className="text-lg text-gray-500 mt-4 font-medium">Target: {tasbihTarget}</div>
                </div>
            </div>

            <div className="flex justify-center gap-4 mb-12">
                {[33, 99, 100].map(target => (
                    <button
                        key={target}
                        onClick={() => changeTasbihTarget(target)}
                        className={`px-6 py-2 rounded-full text-lg transition-all ${
                            tasbihTarget === target 
                            ? 'bg-emerald-100 text-emerald-700 font-bold shadow-md scale-105' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {target}
                    </button>
                ))}
            </div>

            <div className="flex justify-center gap-6 w-full max-w-md">
                <Button 
                    variant="outline" 
                    onClick={resetTasbih}
                    className="flex-1 h-16 text-lg border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                    Reset
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleTasbihCount}
                    className="flex-[2] h-16 text-xl shadow-xl active:scale-95 transition-transform bg-emerald-600 hover:bg-emerald-700"
                >
                    Count
                </Button>
            </div>

            {/* History & Stats */}
            {tasbihHistory.length > 0 && (
                <div className="mt-8 w-full max-w-md">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Recent Sessions</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {tasbihHistory.slice(-3).reverse().map((session, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                                <div className="flex justify-between">
                                    <span>{new Date(session.date).toLocaleDateString()}</span>
                                    <span className="font-bold text-emerald-600">{session.count} / {session.target}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderInheritance = () => (
        <div className="h-full p-8 bg-white dark:bg-gray-900 animate-fadeIn overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Islamic Inheritance Calculator</h2>
                    <p className="text-gray-600 dark:text-gray-400">Calculate inheritance shares (Mirath) according to Sharia law.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6 border-t-4 border-blue-500">
                            <h3 className="font-bold text-lg mb-4">Family Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Assets ($)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                        value={inheritanceParams.assets || ''}
                                        onChange={(e) => setInheritanceParams({...inheritanceParams, assets: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Spouse</label>
                                    <select 
                                        className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                        value={inheritanceParams.spouse}
                                        onChange={(e) => setInheritanceParams({...inheritanceParams, spouse: e.target.value})}
                                    >
                                        <option value="None">None</option>
                                        <option value="Husband">Husband</option>
                                        <option value="Wife">Wife</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sons</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            value={inheritanceParams.sons}
                                            onChange={(e) => setInheritanceParams({...inheritanceParams, sons: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Daughters</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            value={inheritanceParams.daughters}
                                            onChange={(e) => setInheritanceParams({...inheritanceParams, daughters: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                        <input 
                                            type="checkbox" 
                                            id="father"
                                            className="w-5 h-5 text-blue-600 rounded"
                                            checked={inheritanceParams.father}
                                            onChange={(e) => setInheritanceParams({...inheritanceParams, father: e.target.checked})}
                                        />
                                        <label htmlFor="father" className="text-sm font-medium text-gray-700 dark:text-gray-300">Father Alive?</label>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                        <input 
                                            type="checkbox" 
                                            id="mother"
                                            className="w-5 h-5 text-blue-600 rounded"
                                            checked={inheritanceParams.mother}
                                            onChange={(e) => setInheritanceParams({...inheritanceParams, mother: e.target.checked})}
                                        />
                                        <label htmlFor="mother" className="text-sm font-medium text-gray-700 dark:text-gray-300">Mother Alive?</label>
                                    </div>
                                </div>
                                <Button className="w-full py-3 text-lg" onClick={calculateInheritance}>Calculate Distribution</Button>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        {inheritanceResult.length > 0 ? (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {inheritanceResult.map((share, idx) => (
                                        <Card key={idx} className="p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
                                                    {share.relation}
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {(share.share * 100).toFixed(2)}%
                                                </div>
                                            </div>
                                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                                                ${share.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 italic border-t pt-3 mt-2">
                                                {share.note}
                                            </p>
                                        </Card>
                                    ))}
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800/30 text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Note:</strong> This calculation is based on standard Sunni jurisprudence. Complex cases involving other relatives (grandparents, siblings, etc.) should be referred to a qualified scholar.
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12">
                                <Icon name="ScaleIcon" className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg">Enter family details to see distribution</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderZakat = () => (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 animate-fadeIn">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="CalculatorIcon" className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Zakat Calculator</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Calculate your obligatory charity (2.5%) on wealth held for a lunar year.
                    </p>
                </div>

                <Card className="p-8 shadow-lg border-t-4 border-emerald-500">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Total Savings & Assets ($)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-500">$</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-8 p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="0.00"
                                    value={zakatAssets || ''}
                                    onChange={(e) => setZakatAssets(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center border border-gray-100 dark:border-gray-700">
                            <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">Zakat Payable</div>
                            <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                ${(zakatAssets * 0.025).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                (2.5% of ${zakatAssets.toLocaleString()})
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 items-start">
                            <Icon name="InformationCircleIcon" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                Nisab is the minimum amount of wealth a Muslim must possess for a whole year before they are liable to pay Zakat. Current Gold Nisab is approx $6,000 (varies).
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderPrayerTimes = () => (
        <div className="h-full p-6 bg-white dark:bg-gray-900 animate-fadeIn overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Prayer Times</h2>
                        <p className="text-gray-600 dark:text-gray-400">Accurate timings for your location</p>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={prayerCity}
                            onChange={(e) => setPrayerCity(e.target.value)}
                            className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            placeholder="City"
                        />
                        <input 
                            type="text" 
                            value={prayerCountry}
                            onChange={(e) => setPrayerCountry(e.target.value)}
                            className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            placeholder="Country"
                        />
                        <Button onClick={refreshPrayerTimes}>Update</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {Object.entries(todaysPrayers ? {
                        Fajr: todaysPrayers.fajr.split(' ')[0],
                        Dhuhr: todaysPrayers.dhuhr.split(' ')[0],
                        Asr: todaysPrayers.asr.split(' ')[0],
                        Maghrib: todaysPrayers.maghrib.split(' ')[0],
                        Isha: todaysPrayers.isha.split(' ')[0]
                    } : defaultPrayerTimes).map(([name, time]) => {
                        const isNext = nextPrayer?.name === name;
                        return (
                            <Card key={name} className={`p-6 text-center border-2 transition-all ${isNext ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 transform scale-105' : 'border-transparent hover:border-gray-200'}`}>
                                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{name}</div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{time}</div>
                                {isNext && (
                                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 py-1 px-2 rounded-full inline-block">
                                        Next Prayer
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {/* Monthly Calendar Placeholder or Additional Info */}
                <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
                    <div className="flex items-start gap-4">
                        <Icon name="InformationCircleIcon" className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-1">Calculation Method</h3>
                            <p className="text-sm text-blue-800 dark:text-blue-400">
                                Times are calculated based on Umm al-Qura University, Makkah. You can adjust the calculation method in settings.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderDuas = () => {
        const categories = ['All', ...Array.from(new Set(duas.map(d => d.category)))];
        const filteredDuas = selectedDuaCategory === 'All' 
            ? duas 
            : duas.filter(d => d.category === selectedDuaCategory);

        return (
            <div className="h-full p-6 bg-white dark:bg-gray-900 animate-fadeIn overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Fortress of the Muslim</h2>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedDuaCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        selectedDuaCategory === cat
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {filteredDuas.map((dua) => (
                            <Card key={dua.id} className="p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{dua.title}</h3>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs rounded-md font-medium">
                                        {dua.category}
                                    </span>
                                </div>
                                <p className="text-2xl font-serif text-right leading-loose text-gray-800 dark:text-gray-200 mb-4" dir="rtl">
                                    {dua.arabic}
                                </p>
                                {dua.transliteration && (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 italic mb-2">
                                        {dua.transliteration}
                                    </p>
                                )}
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {dua.translation}
                                </p>
                                {dua.reference && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
                                        Reference: {dua.reference}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Main Router
    const renderContent = () => {
        if (activeTab === 'Dashboard' || !activeTab) return renderDashboard();
        if (activeTab === 'Quran' && activeSubNav === 'Read') return renderQuranReader();
        if (activeTab === 'Prayer' && activeSubNav === 'Qibla') return renderQibla();
        if (activeTab === 'Prayer' && activeSubNav === 'Tracker') return renderTasbih();
        if (activeTab === 'Prayer' && activeSubNav === 'Times') return renderPrayerTimes();
        if (activeTab === 'Prayer' && activeSubNav === 'Duas') return renderDuas();
        if (activeTab === 'Knowledge' && activeSubNav === 'Inheritance') return renderInheritance();
        if (activeTab === 'Ramadan' && activeSubNav === 'Zakat') return renderZakat();
        
        // Fallback for unimplemented views
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Icon name="WrenchScrewdriverIcon" className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-bold text-gray-500">Under Construction</h2>
                <p>The {activeTab} &gt; {activeSubNav} module is coming soon.</p>
                <Button variant="outline" className="mt-6" onClick={() => {}}>Return to Dashboard</Button>
            </div>
        );
    };

    return (
        <>
            {renderContent()}

            {/* AI Modal (Global) */}
            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={(content) => {
                    console.log("Daily Reflection:", content);
                    setIsAIModalOpen(false);
                    showToast("Daily reflection generated successfully!", "success");
                }}
                title="Daily Spiritual Reflection"
                promptTemplate={`Provide a short, uplifting Islamic spiritual reflection for today.
        
        Include:
        - A relevant Quran verse or Hadith
        - Brief reflection on its meaning
        - Practical application for daily life
        - Encouraging message
        
        Theme: {Gratitude, Patience, Kindness, or Faith}
        Tone: Peaceful, Wise, and Inspiring`}
                contextData={{ prayer: nextPrayer?.name, time: new Date().toLocaleTimeString() }}
            />
        </>
    );
};

export default ReligionApp;
