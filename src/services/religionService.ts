import pb from '../lib/pocketbase';

export interface PrayerTime {
    id: string;
    date: string;
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    location: string;
    created: string;
}

export interface ReligiousEvent {
    id: string;
    title: string;
    description: string;
    event_type: 'Prayer' | 'Holiday' | 'Sermon' | 'Study Circle' | 'Community';
    date: string;
    time?: string;
    location?: string;
    organizer?: string;
    created: string;
}

export interface QuranVerse {
    id: string;
    surah_number: number;
    surah_name: string;
    verse_number: number;
    arabic_text: string;
    translation: string;
    transliteration?: string;
    interpretation?: string;
    created: string;
}

export interface ReligiousResource {
    id: string;
    title: string;
    description: string;
    category: 'Quran' | 'Hadith' | 'Article' | 'Lecture' | 'Book';
    content?: string;
    url?: string;
    author?: string;
    tags: string[];
    created: string;
}

export interface NameOfAllah {
    id: string;
    number: number;
    arabic: string;
    transliteration: string;
    meaning: string;
    description?: string;
}

export interface Dua {
    id: string;
    title: string;
    arabic: string;
    transliteration?: string;
    translation: string;
    category: 'Morning' | 'Evening' | 'Travel' | 'Home' | 'Prayer' | 'General';
    reference?: string;
}

export interface Hadith {
    id: string;
    collection: string;
    book_number?: number;
    hadith_number?: number;
    text_en: string;
    text_ar?: string;
    chapter?: string;
}

export const religionService = {
    // Prayer Times
    getPrayerTimes: async (date: string, location: string = 'Mecca'): Promise<PrayerTime | null> => {
        return await pb.collection('prayer_times').getFirstListItem<PrayerTime>(
            `date = "${date}" && location = "${location}"`
        ).catch(() => null);
    },

    createPrayerTime: async (data: Partial<PrayerTime>) => {
        return await pb.collection('prayer_times').create(data);
    },

    updatePrayerTime: async (id: string, data: Partial<PrayerTime>) => {
        return await pb.collection('prayer_times').update(id, data);
    },

    deletePrayerTime: async (id: string) => {
        return await pb.collection('prayer_times').delete(id);
    },

    getTodayPrayers: async (city: string = 'Mecca', country: string = 'Saudi Arabia'): Promise<PrayerTime | null> => {
        const today = new Date().toISOString().split('T')[0];

        // Try local DB first
        const localData = await religionService.getPrayerTimes(today, city);
        if (localData) return localData;

        // Fetch from API
        try {
            const response = await fetch(`http://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=4`);
            const data = await response.json();

            if (data.code === 200) {
                const timings = data.data.timings;
                return {
                    id: 'temp',
                    date: today,
                    fajr: timings.Fajr,
                    dhuhr: timings.Dhuhr,
                    asr: timings.Asr,
                    maghrib: timings.Maghrib,
                    isha: timings.Isha,
                    location: city,
                    created: new Date().toISOString()
                } as PrayerTime;
            }
        } catch (error) {
            console.error('Error fetching prayer times:', error);
        }

        return null;
    },

    getNextPrayer: (prayers: PrayerTime) => {
        if (!prayers) return null;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const timeToMinutes = (timeStr: string) => {
            const [time, modifier] = timeStr.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            // Handle 12h format if API returns it (Aladhan usually returns 24h but check)
            // Aladhan returns 24h usually.
            return hours * 60 + minutes;
        };

        const times = [
            { name: 'Fajr', time: prayers.fajr, minutes: timeToMinutes(prayers.fajr) },
            { name: 'Dhuhr', time: prayers.dhuhr, minutes: timeToMinutes(prayers.dhuhr) },
            { name: 'Asr', time: prayers.asr, minutes: timeToMinutes(prayers.asr) },
            { name: 'Maghrib', time: prayers.maghrib, minutes: timeToMinutes(prayers.maghrib) },
            { name: 'Isha', time: prayers.isha, minutes: timeToMinutes(prayers.isha) }
        ];

        // Find next prayer
        for (const prayer of times) {
            if (prayer.minutes > currentTime) {
                return {
                    name: prayer.name,
                    time: prayer.time,
                    minutesUntil: prayer.minutes - currentTime
                };
            }
        }

        // If no prayer left today, next is Fajr tomorrow
        // Simple approximation: 24h + Fajr time - current time
        const fajrTomorrow = times[0];
        return {
            name: 'Fajr',
            time: fajrTomorrow.time,
            minutesUntil: (24 * 60) - currentTime + fajrTomorrow.minutes
        };
    },

    // Events
    getUpcomingEvents: async (): Promise<ReligiousEvent[]> => {
        const today = new Date().toISOString().split('T')[0];
        return await pb.collection('religious_events').getFullList<ReligiousEvent>({
            filter: `date >= "${today}"`,
            sort: 'date,time'
        }).catch(() => []);
    },

    getEventsByType: async (eventType: string): Promise<ReligiousEvent[]> => {
        return await pb.collection('religious_events').getFullList<ReligiousEvent>({
            filter: `event_type = "${eventType}"`,
            sort: '-date'
        }).catch(() => []);
    },

    createEvent: async (data: Partial<ReligiousEvent>) => {
        return await pb.collection('religious_events').create(data);
    },

    updateEvent: async (id: string, data: Partial<ReligiousEvent>) => {
        return await pb.collection('religious_events').update(id, data);
    },

    deleteEvent: async (id: string) => {
        return await pb.collection('religious_events').delete(id);
    },

    // Quran
    getAllSurahs: async (): Promise<any[]> => {
        try {
            const response = await fetch('http://api.alquran.cloud/v1/surah');
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Failed to fetch surahs', error);
            // Fallback to partial list if offline
            return [
                { number: 1, name: "Al-Fatihah", englishName: "The Opener", englishNameTranslation: "The Opening", numberOfAyahs: 7, revelationType: "Meccan" },
                { number: 2, name: "Al-Baqarah", englishName: "Al-Baqarah", englishNameTranslation: "The Cow", numberOfAyahs: 286, revelationType: "Medinan" },
                { number: 36, name: "Ya-Sin", englishName: "Ya Sin", englishNameTranslation: "Ya Sin", numberOfAyahs: 83, revelationType: "Meccan" },
                { number: 55, name: "Ar-Rahman", englishName: "Ar-Rahman", englishNameTranslation: "The Beneficent", numberOfAyahs: 78, revelationType: "Medinan" },
                { number: 67, name: "Al-Mulk", englishName: "Al-Mulk", englishNameTranslation: "The Sovereignty", numberOfAyahs: 30, revelationType: "Meccan" },
                { number: 112, name: "Al-Ikhlas", englishName: "Al-Ikhlas", englishNameTranslation: "The Sincerity", numberOfAyahs: 4, revelationType: "Meccan" },
                { number: 113, name: "Al-Falaq", englishName: "Al-Falaq", englishNameTranslation: "The Daybreak", numberOfAyahs: 5, revelationType: "Meccan" },
                { number: 114, name: "An-Nas", englishName: "An-Nas", englishNameTranslation: "Mankind", numberOfAyahs: 6, revelationType: "Meccan" }
            ];
        }
    },

    getSurahDetails: async (number: number): Promise<any> => {
        try {
            // Fetch Arabic and English Translation
            const response = await fetch(`http://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.asad`);
            const data = await response.json();
            return {
                arabic: data.data[0],
                translation: data.data[1]
            };
        } catch (error) {
            console.error('Failed to fetch surah details', error);
            return null;
        }
    },

    // Deprecated: Use getAllSurahs instead
    getSurahList: (): { number: number; name: string; english: string }[] => {
        return [
            { number: 1, name: "Al-Fatihah", english: "The Opener" },
            { number: 2, name: "Al-Baqarah", english: "The Cow" },
            { number: 3, name: "Ali 'Imran", english: "Family of Imran" },
            { number: 4, name: "An-Nisa", english: "The Women" },
            { number: 5, name: "Al-Ma'idah", english: "The Table Spread" },
            { number: 6, name: "Al-An'am", english: "The Cattle" },
            { number: 7, name: "Al-A'raf", english: "The Heights" },
            { number: 8, name: "Al-Anfal", english: "The Spoils of War" },
            { number: 9, name: "At-Tawbah", english: "The Repentance" },
            { number: 10, name: "Yunus", english: "Jonah" },
            { number: 11, name: "Hud", english: "Hud" },
            { number: 12, name: "Yusuf", english: "Joseph" },
            { number: 13, name: "Ar-Ra'd", english: "The Thunder" },
            { number: 14, name: "Ibrahim", english: "Abraham" },
            { number: 15, name: "Al-Hijr", english: "The Rocky Tract" },
            { number: 16, name: "An-Nahl", english: "The Bee" },
            { number: 17, name: "Al-Isra", english: "The Night Journey" },
            { number: 18, name: "Al-Kahf", english: "The Cave" },
            { number: 36, name: "Ya-Sin", english: "Ya Sin" },
            { number: 55, name: "Ar-Rahman", english: "The Beneficent" },
            { number: 56, name: "Al-Waqi'ah", english: "The Inevitable" },
            { number: 67, name: "Al-Mulk", english: "The Sovereignty" },
            { number: 112, name: "Al-Ikhlas", english: "The Sincerity" },
            { number: 113, name: "Al-Falaq", english: "The Daybreak" },
            { number: 114, name: "An-Nas", english: "Mankind" }
        ];
    },

    getVerseOfTheDay: async (): Promise<QuranVerse | null> => {
        try {
            const verses = await pb.collection('quran_verses').getList<QuranVerse>(1, 1, {
                sort: '@random'
            });
            return verses.items[0] || null;
        } catch (e) {
            return null;
        }
    },

    searchVerses: async (query: string) => {
        return await pb.collection('quran_verses').getFullList<QuranVerse>({
            filter: `translation ~ "${query}" || arabic_text ~ "${query}"`,
            limit: 50
        });
    },

    getVersesBySurah: async (surahNumber: number) => {
        return await pb.collection('quran_verses').getFullList<QuranVerse>({
            filter: `surah_number = ${surahNumber}`,
            sort: 'verse_number'
        });
    },

    createQuranVerse: async (data: Partial<QuranVerse>) => {
        return await pb.collection('quran_verses').create(data);
    },

    updateQuranVerse: async (id: string, data: Partial<QuranVerse>) => {
        return await pb.collection('quran_verses').update(id, data);
    },

    deleteQuranVerse: async (id: string) => {
        return await pb.collection('quran_verses').delete(id);
    },

    // Resources
    getResources: async (category?: string) => {
        const filter = category ? `category = "${category}"` : '';
        return await pb.collection('religious_resources').getFullList<ReligiousResource>({
            filter,
            sort: '-created'
        });
    },

    searchResources: async (query: string) => {
        return await pb.collection('religious_resources').getFullList<ReligiousResource>({
            filter: `title ~ "${query}" || description ~ "${query}" || content ~ "${query}"`,
        });
    },

    createResource: async (data: Partial<ReligiousResource>) => {
        return await pb.collection('religious_resources').create(data);
    },

    updateResource: async (id: string, data: Partial<ReligiousResource>) => {
        return await pb.collection('religious_resources').update(id, data);
    },

    deleteResource: async (id: string) => {
        return await pb.collection('religious_resources').delete(id);
    },

    // Names of Allah
    getNamesOfAllah: async () => {
        return await pb.collection('names_of_allah').getFullList<NameOfAllah>({
            sort: 'number'
        });
    },

    // Enhanced Hadith Features
    getHadithCollections: async () => {
        return [
            { id: 'bukhari', name: 'Sahih Bukhari', books: 97, hadiths: 7563 },
            { id: 'muslim', name: 'Sahih Muslim', books: 56, hadiths: 7190 },
            { id: 'abudawud', name: 'Sunan Abu Dawud', books: 43, hadiths: 5274 },
            { id: 'tirmidhi', name: 'Jami` at-Tirmidhi', books: 51, hadiths: 3956 },
            { id: 'nasai', name: "Sunan an-Nasa'i", books: 51, hadiths: 5758 },
            { id: 'ibnmajah', name: 'Sunan Ibn Majah', books: 37, hadiths: 4341 }
        ];
    },

    getHadithByCollection: async (collection: string, page: number = 1, limit: number = 20) => {
        try {
            const response = await fetch(`https://hadithapi.com/api/${collection}/hadiths?page=${page}&limit=${limit}`);
            const data = await response.json();
            return data.hadiths || [];
        } catch (error) {
            console.error('Failed to fetch hadiths:', error);
            return [];
        }
    },

    searchHadith: async (query: string, collection: string = 'bukhari') => {
        try {
            const response = await fetch(`https://hadithapi.com/api/${collection}/hadiths?search=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data.hadiths || [];
        } catch (error) {
            console.error('Failed to search hadiths:', error);
            return [];
        }
    },

    // Enhanced Quran Features
    getQuranTranslations: async () => {
        return [
            { id: 'en.asad', name: 'Muhammad Asad', language: 'English' },
            { id: 'en.sahih', name: 'Saheeh International', language: 'English' },
            { id: 'en.pickthall', name: 'Pickthall', language: 'English' },
            { id: 'en.yusufali', name: 'Yusuf Ali', language: 'English' },
            { id: 'fr.hamidullah', name: 'Hamidullah', language: 'French' },
            { id: 'ur.jalandhry', name: 'Jalandhry', language: 'Urdu' },
            { id: 'ar.alafasy', name: 'Alafasy (Audio)', language: 'Arabic' }
        ];
    },

    getQuranWithTranslation: async (surahNumber: number, translationId: string = 'en.sahih') => {
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,${translationId}`);
            const data = await response.json();
            if (data.code === 200) {
                return {
                    arabic: data.data[0],
                    translation: data.data[1]
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch Quran with translation:', error);
            return null;
        }
    },

    getQuranAudio: async (surahNumber: number, reciter: string = 'ar.alafasy') => {
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${reciter}`);
            const data = await response.json();
            if (data.code === 200) {
                return data.data.ayahs.map((ayah: any) => ({
                    number: ayah.numberInSurah,
                    audio: ayah.audio
                }));
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch Quran audio:', error);
            return [];
        }
    },

    searchQuran: async (query: string, language: string = 'en') => {
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/${language}/en.sahih`);
            const data = await response.json();
            if (data.code === 200) {
                return data.data.matches || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to search Quran:', error);
            return [];
        }
    },

    // Islamic Calendar Features
    getHijriDate: async (date?: string) => {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            const [year, month, day] = targetDate.split('-');
            const response = await fetch(`https://api.aladhan.com/v1/gToH/${day}-${month}-${year}`);
            const data = await response.json();
            if (data.code === 200) {
                return {
                    hijri: data.data.hijri,
                    gregorian: data.data.gregorian
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch Hijri date:', error);
            return null;
        }
    },

    getIslamicMonths: () => {
        return [
            { number: 1, name: 'Muharram', arabic: 'مُحَرَّم' },
            { number: 2, name: 'Safar', arabic: 'صَفَر' },
            { number: 3, name: 'Rabi al-Awwal', arabic: 'رَبِيع ٱلْأَوَّل' },
            { number: 4, name: 'Rabi al-Thani', arabic: 'رَبِيع ٱلثَّانِي' },
            { number: 5, name: 'Jumada al-Awwal', arabic: 'جُمَادَىٰ ٱلْأُولَىٰ' },
            { number: 6, name: 'Jumada al-Thani', arabic: 'جُمَادَىٰ ٱلثَّانِيَة' },
            { number: 7, name: 'Rajab', arabic: 'رَجَب' },
            { number: 8, name: 'Shaban', arabic: 'شَعْبَان' },
            { number: 9, name: 'Ramadan', arabic: 'رَمَضَان' },
            { number: 10, name: 'Shawwal', arabic: 'شَوَّال' },
            { number: 11, name: 'Dhu al-Qadah', arabic: 'ذُو ٱلْقَعْدَة' },
            { number: 12, name: 'Dhu al-Hijjah', arabic: 'ذُو ٱلْحِجَّة' }
        ];
    },

    getIslamicHolidays: async (year?: number) => {
        const hijriYear = year || new Date().getFullYear();
        return [
            { name: 'Islamic New Year', hijriDate: '1 Muharram', type: 'holiday' },
            { name: 'Ashura', hijriDate: '10 Muharram', type: 'fasting' },
            { name: 'Mawlid an-Nabi', hijriDate: '12 Rabi al-Awwal', type: 'celebration' },
            { name: 'Isra and Miraj', hijriDate: '27 Rajab', type: 'celebration' },
            { name: 'Laylat al-Bara\'ah', hijriDate: '15 Shaban', type: 'night' },
            { name: 'Ramadan Begins', hijriDate: '1 Ramadan', type: 'fasting' },
            { name: 'Laylat al-Qadr', hijriDate: '27 Ramadan', type: 'night' },
            { name: 'Eid al-Fitr', hijriDate: '1 Shawwal', type: 'eid' },
            { name: 'Day of Arafah', hijriDate: '9 Dhu al-Hijjah', type: 'fasting' },
            { name: 'Eid al-Adha', hijriDate: '10 Dhu al-Hijjah', type: 'eid' }
        ];
    },

    // Ramadan Features
    getRamadanInfo: async (year?: number) => {
        try {
            const currentYear = year || new Date().getFullYear();
            const response = await fetch(`https://api.aladhan.com/v1/hijriCalendarByCity/${currentYear}/9?city=Mecca&country=Saudi Arabia`);
            const data = await response.json();
            if (data.code === 200) {
                const firstDay = data.data[0];
                const lastDay = data.data[data.data.length - 1];
                return {
                    startDate: firstDay.gregorian.date,
                    endDate: lastDay.gregorian.date,
                    daysRemaining: Math.ceil((new Date(firstDay.gregorian.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
                    hijriYear: firstDay.hijri.year
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch Ramadan info:', error);
            return null;
        }
    },

    // Qibla Direction
    getQiblaDirection: async (latitude: number, longitude: number): Promise<any> => {
        try {
            const response = await fetch(`http://api.aladhan.com/v1/qibla/${latitude}/${longitude}`);
            const data = await response.json();
            if (data.code === 200) {
                return data.data;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch Qibla direction', error);
            return null;
        }
    },

    // Enhanced Hadith API
    getRandomHadith: async (): Promise<any> => {
        try {
            // Try primary API
            const response = await fetch('https://random-hadith-generator.vercel.app/bukhari/');
            const data = await response.json();
            return {
                text_en: data.data.hadith_english,
                text_ar: data.data.hadith_arabic || '',
                collection: data.data.book,
                chapter: data.data.chapterName,
                hadith_number: data.data.hadithNumber
            };
        } catch (error) {
            console.error('Failed to fetch random hadith', error);
            // Fallback to local database
            try {
                const hadiths = await pb.collection('hadiths').getList<Hadith>(1, 1, {
                    sort: '@random'
                });
                return hadiths.items[0] || null;
            } catch (e) {
                return null;
            }
        }
    },

    getHadithOfTheDay: async () => {
        try {
            const hadiths = await pb.collection('hadiths').getList<Hadith>(1, 1, {
                sort: '@random'
            });
            return hadiths.items[0] || null;
        } catch (e) {
            return null;
        }
    },

    // Enhanced Duas
    getDuas: async (category?: string) => {
        const filter = category ? `category = "${category}"` : '';
        try {
            return await pb.collection('duas').getFullList<Dua>({
                filter,
                sort: 'title'
            });
        } catch (error) {
            // Fallback to default duas
            return [
                {
                    id: '1',
                    title: 'Morning Dua',
                    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
                    transliteration: 'Asbahna wa asbahal mulku lillah',
                    translation: 'We have entered the morning and the dominion belongs to Allah',
                    category: 'Morning' as const,
                    reference: 'Muslim'
                },
                {
                    id: '2',
                    title: 'Evening Dua',
                    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
                    transliteration: 'Amsayna wa amsal mulku lillah',
                    translation: 'We have entered the evening and the dominion belongs to Allah',
                    category: 'Evening' as const,
                    reference: 'Muslim'
                }
            ];
        }
    },

    // Mosque Finder (using location)
    getMosquesNearby: async (latitude: number, longitude: number, radius: number = 5000) => {
        try {
            // Using Overpass API for OpenStreetMap data
            const query = `
                [out:json];
                (
                  node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${latitude},${longitude});
                  way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${latitude},${longitude});
                );
                out body;
            `;
            const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data.elements.map((mosque: any) => ({
                id: mosque.id,
                name: mosque.tags?.name || 'Unnamed Mosque',
                latitude: mosque.lat || mosque.center?.lat,
                longitude: mosque.lon || mosque.center?.lon,
                address: mosque.tags?.['addr:full'] || mosque.tags?.['addr:street'] || 'Address not available'
            }));
        } catch (error) {
            console.error('Failed to fetch nearby mosques:', error);
            return [];
        }
    },

    // Tafsir (Quran Interpretation)
    getTafsir: async (surahNumber: number, ayahNumber: number) => {
        try {
            const response = await fetch(`https://api.quran.com/api/v4/quran/tafsirs/169?verse_key=${surahNumber}:${ayahNumber}`);
            const data = await response.json();
            return data.tafsirs?.[0] || null;
        } catch (error) {
            console.error('Failed to fetch tafsir:', error);
            return null;
        }
    },

    // Prayer Time Notifications
    getNextPrayerNotification: (prayers: PrayerTime) => {
        const next = religionService.getNextPrayer(prayers);
        if (!next) return null;

        return {
            title: `${next.name} Prayer Time`,
            message: `${next.name} prayer is in ${next.minutesUntil} minutes at ${next.time}`,
            time: next.time,
            minutesUntil: next.minutesUntil
        };
    },

    // Adhkar (Remembrance)
    getMorningAdhkar: () => {
        return [
            {
                arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
                transliteration: "A'udhu billahi minash-shaytanir-rajim",
                translation: 'I seek refuge in Allah from Satan, the accursed',
                count: 1
            },
            {
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                transliteration: 'Bismillahir-Rahmanir-Rahim',
                translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
                count: 1
            },
            {
                arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
                transliteration: 'Subhanallahi wa bihamdihi',
                translation: 'Glory be to Allah and praise Him',
                count: 100
            }
        ];
    },

    getEveningAdhkar: () => {
        return [
            {
                arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
                transliteration: 'Amsayna wa amsal-mulku lillah',
                translation: 'We have entered the evening and the dominion belongs to Allah',
                count: 1
            },
            {
                arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا',
                transliteration: 'Allahumma bika amsayna wa bika asbahna',
                translation: 'O Allah, by You we have reached the evening and by You we have reached the morning',
                count: 1
            }
        ];
    },

    // Soul Prescription (Mood-based)
    getSoulPrescription: (mood: 'Anxious' | 'Sad' | 'Angry' | 'Happy' | 'Confused' | 'Grateful') => {
        const prescriptions = {
            'Anxious': {
                verse: { arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', translation: 'Unquestionably, by the remembrance of Allah hearts are assured.', reference: 'Surah Ar-Rad 13:28' },
                dua: { arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ', translation: 'O Allah, I seek refuge in You from anxiety and sorrow.' }
            },
            'Sad': {
                verse: { arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', translation: 'Allah does not burden a soul beyond that it can bear.', reference: 'Surah Al-Baqarah 2:286' },
                dua: { arabic: 'إِنَّمَا أَشْكُو بَثِّي وَhُزْنِي إِلَى اللَّهِ', translation: 'I only complain of my suffering and my grief to Allah.' }
            },
            'Angry': {
                verse: { arabic: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ', translation: '...and who restrain anger and who pardon the people.', reference: 'Surah Ali Imran 3:134' },
                dua: { arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', translation: 'I seek refuge in Allah from Satan the outcast.' }
            },
            'Happy': {
                verse: { arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', translation: 'If you are grateful, I will surely increase you [in favor].', reference: 'Surah Ibrahim 14:7' },
                dua: { arabic: 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ', translation: 'Praise be to Allah by Whose grace good deeds are completed.' }
            },
            'Confused': {
                verse: { arabic: 'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ', translation: 'But perhaps you hate a thing and it is good for you.', reference: 'Surah Al-Baqarah 2:216' },
                dua: { arabic: 'اللَّهُمَّ خِرْ لِي وَاخْتَرْ لِي', translation: 'O Allah, make a choice for me and select for me.' }
            },
            'Grateful': {
                verse: { arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ', translation: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.', reference: 'Surah Al-Baqarah 2:152' },
                dua: { arabic: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ', translation: 'My Lord, enable me to be grateful for Your favor.' }
            }
        };
        return prescriptions[mood] || prescriptions['Happy'];
    },

    // Inheritance Calculator (Simplified Logic)
    calculateInheritance: (assets: number, relatives: { spouse: 'Husband' | 'Wife' | 'None', sons: number, daughters: number, father: boolean, mother: boolean }) => {
        const shares: { relation: string, share: number, amount: number, note: string }[] = [];
        let remaining = 1; // 100%

        // 1. Spouse
        if (relatives.spouse === 'Husband') {
            const share = (relatives.sons > 0 || relatives.daughters > 0) ? 0.25 : 0.5;
            shares.push({ relation: 'Husband', share, amount: assets * share, note: 'Fixed Share' });
            remaining -= share;
        } else if (relatives.spouse === 'Wife') {
            const share = (relatives.sons > 0 || relatives.daughters > 0) ? 0.125 : 0.25;
            shares.push({ relation: 'Wife', share, amount: assets * share, note: 'Fixed Share' });
            remaining -= share;
        }

        // 2. Parents
        if (relatives.father) {
            const share = (relatives.sons > 0) ? 0.1666 : 0; // Simplified: Father gets 1/6 if there are children
            // Note: Father logic is complex (can be residuary), keeping simple for MVP
            if (share > 0) {
                shares.push({ relation: 'Father', share, amount: assets * share, note: 'Fixed Share (1/6)' });
                remaining -= share;
            }
        }
        if (relatives.mother) {
            const share = (relatives.sons > 0 || relatives.daughters > 0) ? 0.1666 : 0.3333;
            shares.push({ relation: 'Mother', share, amount: assets * share, note: 'Fixed Share' });
            remaining -= share;
        }

        // 3. Children (Residuary)
        if (remaining > 0 && (relatives.sons > 0 || relatives.daughters > 0)) {
            const totalShares = (relatives.sons * 2) + relatives.daughters;
            const unitShare = remaining / totalShares;

            if (relatives.sons > 0) {
                shares.push({
                    relation: 'Sons',
                    share: unitShare * 2 * relatives.sons,
                    amount: assets * (unitShare * 2 * relatives.sons),
                    note: `Residuary (2 shares each for ${relatives.sons} sons)`
                });
            }
            if (relatives.daughters > 0) {
                shares.push({
                    relation: 'Daughters',
                    share: unitShare * relatives.daughters,
                    amount: assets * (unitShare * relatives.daughters),
                    note: `Residuary (1 share each for ${relatives.daughters} daughters)`
                });
            }
        }

        return shares;
    }
};
