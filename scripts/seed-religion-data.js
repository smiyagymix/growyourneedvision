import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function seedReligionData() {
    try {
        // 1. Authenticate
        try {
            await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
            console.log('✅ Authenticated as admin');
        } catch (e) {
            console.error('❌ Authentication failed:', JSON.stringify(e, null, 2));
            console.error('Original error:', e);
            return;
        }

        // 2. Seed Prayer Times (Fetch from Aladhan API)
        console.log('🌍 Fetching prayer times for Mecca...');
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        try {
            const response = await fetch(`http://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=Mecca&country=Saudi Arabia&method=4`);
            const data = await response.json();
            
            if (data.code === 200 && data.data) {
                console.log(`📅 Found ${data.data.length} days of prayer times`);
                
                for (const day of data.data) {
                    const dateStr = day.date.gregorian.date.split('-').reverse().join('-'); // DD-MM-YYYY to YYYY-MM-DD
                    // API returns DD-MM-YYYY, we need YYYY-MM-DD for PocketBase date
                    // Actually API returns DD-MM-YYYY usually. Let's check format.
                    // Example: "07-12-2025"
                    const [d, m, y] = day.date.gregorian.date.split('-');
                    const isoDate = `${y}-${m}-${d}`;

                    const timings = day.timings;
                    
                    // Check if exists
                    try {
                        const existing = await pb.collection('prayer_times').getFirstListItem(`date="${isoDate}" && location="Mecca"`);
                        if (existing) {
                            // Update
                            await pb.collection('prayer_times').update(existing.id, {
                                fajr: timings.Fajr.split(' ')[0],
                                dhuhr: timings.Dhuhr.split(' ')[0],
                                asr: timings.Asr.split(' ')[0],
                                maghrib: timings.Maghrib.split(' ')[0],
                                isha: timings.Isha.split(' ')[0],
                            });
                            // console.log(`Updated prayer times for ${isoDate}`);
                        }
                    } catch (e) {
                        // Create
                        await pb.collection('prayer_times').create({
                            date: isoDate,
                            fajr: timings.Fajr.split(' ')[0],
                            dhuhr: timings.Dhuhr.split(' ')[0],
                            asr: timings.Asr.split(' ')[0],
                            maghrib: timings.Maghrib.split(' ')[0],
                            isha: timings.Isha.split(' ')[0],
                            location: 'Mecca'
                        });
                        // console.log(`Created prayer times for ${isoDate}`);
                    }
                }
                console.log('✅ Prayer times seeded successfully');
            }
        } catch (e) {
            console.error('❌ Failed to fetch/seed prayer times:', e.message);
        }

        // 3. Seed Quran Verses (Fetch from AlQuran Cloud API)
        console.log('📖 Seeding Quran verses from API...');
        
        // Function to fetch and seed a Surah
        async function seedSurah(surahNumber) {
            try {
                console.log(`Fetching Surah ${surahNumber}...`);
                // Fetch Arabic and English Translation (Asad)
                const response = await fetch(`http://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.asad`);
                const data = await response.json();
                
                if (data.code === 200 && data.data && data.data.length === 2) {
                    const arabicData = data.data[0];
                    const englishData = data.data[1];
                    const surahName = arabicData.englishName;
                    
                    console.log(`Seeding ${surahName} (${arabicData.ayahs.length} verses)...`);

                    for (let i = 0; i < arabicData.ayahs.length; i++) {
                        const arabicAyah = arabicData.ayahs[i];
                        const englishAyah = englishData.ayahs[i];
                        
                        try {
                            const existing = await pb.collection('quran_verses').getFirstListItem(`surah_number=${surahNumber} && verse_number=${arabicAyah.numberInSurah}`);
                        } catch (e) {
                            await pb.collection('quran_verses').create({
                                surah_number: surahNumber,
                                surah_name: surahName,
                                verse_number: arabicAyah.numberInSurah,
                                arabic_text: arabicAyah.text,
                                translation: englishAyah.text
                            });
                        }
                    }
                    console.log(`✅ ${surahName} seeded`);
                }
            } catch (e) {
                console.error(`❌ Failed to seed Surah ${surahNumber}:`, e.message);
            }
        }

        // Seed Al-Fatihah (1), Al-Mulk (67), Al-Ikhlas (112), Al-Falaq (113), An-Nas (114)
        await seedSurah(1);
        await seedSurah(67);
        await seedSurah(112);
        await seedSurah(113);
        await seedSurah(114);
        
        console.log('✅ Quran verses seeded');

        // 3.5 Seed Hadiths (Fetch from GitHub/FawazAhmed API)
        console.log('📜 Seeding Hadiths from API...');
        try {
            // Fetch random 10 hadiths from Bukhari
            // Using a specific endpoint or just fetching a small book
            // Let's fetch "Book 1: Revelation" from Bukhari
            const response = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/1.json');
            const data = await response.json();
            
            if (data && data.hadiths) {
                console.log(`Found ${data.hadiths.length} hadiths in Book 1`);
                
                // Seed first 10
                for (const hadith of data.hadiths.slice(0, 10)) {
                    try {
                        // Check if exists by text (approximate)
                        // Using a simpler check or just create if not exists
                        // Since we don't have unique IDs easily, we'll skip check for now or check by number if available
                        const hadithNum = hadith.hadithnumber;
                        
                        try {
                            await pb.collection('hadiths').getFirstListItem(`hadith_number=${hadithNum} && collection="Bukhari"`);
                        } catch (e) {
                            await pb.collection('hadiths').create({
                                collection: 'Bukhari',
                                book_number: 1,
                                hadith_number: hadithNum,
                                text_en: hadith.text,
                                text_ar: '', // API might not have Arabic in this endpoint easily mixed
                                chapter: 'Revelation'
                            });
                        }
                    } catch (e) {
                        console.error('Error seeding hadith:', e.message);
                    }
                }
                console.log('✅ Hadiths seeded');
            }
        } catch (e) {
            console.error('❌ Failed to seed Hadiths:', e.message);
        }

        // 4. Seed Events
        console.log('📅 Seeding events...');
        const events = [
            { title: 'Jumuah Prayer', description: 'Weekly Friday prayer and sermon', event_type: 'Prayer', time: '12:30', location: 'Main Mosque' },
            { title: 'Ramadan Preparation', description: 'Community gathering to prepare for Ramadan', event_type: 'Community', time: '18:00', location: 'Community Hall' }
        ];

        for (const event of events) {
            const today = new Date().toISOString().split('T')[0];
            try {
                await pb.collection('religious_events').create({
                    ...event,
                    date: today
                });
            } catch (e) {
                console.log('Event creation failed (might exist)');
            }
        }
        console.log('✅ Events seeded');

        // 5. Seed Names of Allah
        console.log('✨ Seeding Names of Allah...');
        const names = [
            { number: 1, arabic: "ٱللَّٰه", transliteration: "Allah", meaning: "The One and Only Deity" },
            { number: 2, arabic: "ٱلرَّحْمَٰن", transliteration: "Ar-Rahman", meaning: "The Most Gracious" },
            { number: 3, arabic: "ٱلرَّحِيم", transliteration: "Ar-Rahim", meaning: "The Most Merciful" },
            { number: 4, arabic: "ٱلْمَلِك", transliteration: "Al-Malik", meaning: "The King and Owner of Dominion" },
            { number: 5, arabic: "ٱلْقُدُّوس", transliteration: "Al-Quddus", meaning: "The Absolutely Pure" },
            { number: 6, arabic: "ٱلسَّلَام", transliteration: "As-Salam", meaning: "The Source of Peace" },
            { number: 7, arabic: "ٱلْمُؤْمِن", transliteration: "Al-Mu'min", meaning: "The One Who gives Emaan and Security" },
            { number: 8, arabic: "ٱلْمُهَيْمِن", transliteration: "Al-Muhaymin", meaning: "The Guardian" },
            { number: 9, arabic: "ٱلْعَزِيز", transliteration: "Al-Aziz", meaning: "The All Mighty" },
            { number: 10, arabic: "ٱلْجَبَّار", transliteration: "Al-Jabbar", meaning: "The Compeller" }
        ];

        for (const name of names) {
            try {
                const existing = await pb.collection('names_of_allah').getFirstListItem(`number=${name.number}`);
            } catch (e) {
                await pb.collection('names_of_allah').create(name);
            }
        }
        console.log('✅ Names of Allah seeded');

        // 6. Seed Duas
        console.log('🤲 Seeding Duas...');
        const duas = [
            { 
                title: 'Morning Dua', 
                arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا ، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ', 
                transliteration: 'Allahumma bika asbahna wa bika amsayna, wa bika nahya wa bika namutu wa ilaykan-nushur',
                translation: 'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the Final Return.',
                category: 'Morning',
                reference: 'Tirmidhi'
            },
            {
                title: 'Travel Dua',
                arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
                transliteration: 'Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun',
                translation: 'Glory to Him who has brought this [vehicle] under our control, though we were unable to control it [ourselves], and indeed, to our Lord we will surely return.',
                category: 'Travel',
                reference: 'Quran 43:13-14'
            },
            {
                title: 'Dua for Knowledge',
                arabic: 'رَّبِّ زِدْنِى عِلْمًا',
                transliteration: 'Rabbi zidni \'ilma',
                translation: 'My Lord, increase me in knowledge.',
                category: 'General',
                reference: 'Quran 20:114'
            }
        ];

        for (const dua of duas) {
            try {
                const existing = await pb.collection('duas').getFirstListItem(`title="${dua.title}"`);
            } catch (e) {
                await pb.collection('duas').create(dua);
            }
        }
        console.log('✅ Duas seeded');

    } catch (error) {
        console.error('❌ Critical error:', error);
    }
}

seedReligionData();
