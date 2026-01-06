/**
 * PocketBase Complete Data Seeding Script
 * Seeds all collections with realistic sample data
 * 
 * Usage: node seed-all-data.cjs
 */

const PocketBase = require('pocketbase').default;

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Sample data
const SAMPLE_DATA = {
    users: [
        // Core Users (from .env.local)
        { name: 'School Admin', email: 'admin@school.com', role: 'Admin', password: '12345678', passwordConfirm: '12345678' },
        { name: 'Parent User', email: 'parent@school.com', role: 'Parent', password: '123456788', passwordConfirm: '123456788' },
        { name: 'Student User', email: 'student@school.com', role: 'Student', password: '12345678', passwordConfirm: '12345678' },
        { name: 'Teacher User', email: 'teacher@school.com', role: 'Teacher', password: '123456789', passwordConfirm: '123456789' },
        { name: 'Individual User', email: 'individual@individual.com', role: 'Individual', password: '12345678', passwordConfirm: '12345678' },
        
        // Additional Sample Users
        { name: 'John Teacher', email: 'john.teacher@school.com', role: 'Teacher', password: 'Teacher123!@#', passwordConfirm: 'Teacher123!@#' },
        { name: 'Sarah Teacher', email: 'sarah.teacher@school.com', role: 'Teacher', password: 'Teacher123!@#', passwordConfirm: 'Teacher123!@#' },
        { name: 'Alice Student', email: 'alice.student@school.com', role: 'Student', password: 'Student123!@#', passwordConfirm: 'Student123!@#' },
        { name: 'Bob Student', email: 'bob.student@school.com', role: 'Student', password: 'Student123!@#', passwordConfirm: 'Student123!@#' },
        { name: 'Charlie Student', email: 'charlie.student@school.com', role: 'Student', password: 'Student123!@#', passwordConfirm: 'Student123!@#' },
        { name: 'David Parent', email: 'david.parent@school.com', role: 'Parent', password: 'Parent123!@#', passwordConfirm: 'Parent123!@#' },
    ],

    classes: [
        { name: 'Grade 10 A', grade_level: 10, academic_year: '2024-2025', capacity: 30 },
        { name: 'Grade 11 B', grade_level: 11, academic_year: '2024-2025', capacity: 28 },
        { name: 'Grade 12 Science', grade_level: 12, academic_year: '2024-2025', capacity: 25 },
    ],

    subjects: [
        { name: 'Mathematics', code: 'MATH101', description: 'Advanced Mathematics', credits: 4 },
        { name: 'Physics', code: 'PHY101', description: 'Introduction to Physics', credits: 4 },
        { name: 'Chemistry', code: 'CHEM101', description: 'General Chemistry', credits: 4 },
        { name: 'English Literature', code: 'ENG101', description: 'English Literature & Composition', credits: 3 },
        { name: 'Computer Science', code: 'CS101', description: 'Programming Fundamentals', credits: 4 },
    ],

    // Gamification
    gamification_achievements: [
        { name: 'First Steps', description: 'Complete your first lesson', icon: '👣', category: 'Learning', xp_reward: 50, requirement_type: 'count', requirement_value: 1, rarity: 'Common' },
        { name: 'Quick Learner', description: 'Complete 10 lessons', icon: '⚡', category: 'Learning', xp_reward: 150, requirement_type: 'count', requirement_value: 10, rarity: 'Rare' },
        { name: 'Social Butterfly', description: 'Make 10 friends', icon: '🦋', category: 'Social', xp_reward: 200, requirement_type: 'count', requirement_value: 10, rarity: 'Rare' },
        { name: 'Quiz Master', description: 'Score 100% on 5 quizzes', icon: '🎯', category: 'Learning', xp_reward: 500, requirement_type: 'streak', requirement_value: 5, rarity: 'Epic' },
        { name: 'Legend', description: 'Reach Level 50', icon: '👑', category: 'Milestone', xp_reward: 5000, requirement_type: 'count', requirement_value: 50, rarity: 'Legendary' },
    ],

    gamification_rewards: [
        { name: 'Golden Border', description: 'Unlock a shiny golden border for your avatar', cost_xp: 1000, category: 'Avatar', icon: '🟡', available: true },
        { name: 'Dark Mode Pro', description: 'Premium dark theme with custom colors', cost_xp: 2500, category: 'Theme', icon: '🌙', available: true },
        { name: 'XP Booster', description: '2x XP for 24 hours', cost_xp: 500, category: 'Power-Up', icon: '⚡', available: true },
        { name: 'Early Adopter Badge', description: 'Special badge for early platform users', cost_xp: 100, category: 'Badge', icon: '🌟', available: true },
    ],

    // Sport  
    sport_teams: [
        { name: 'Thunder FC', sport: 'Football', league: 'Premier League', wins: 15, losses: 3, draws: 2, points: 47, members: [] },
        { name: 'Sky Hawks', sport: 'Basketball', league: 'NBA', wins: 42, losses: 18, draws: 0, points: 84, members: [] },
        { name: 'Lightning Strikers', sport: 'Volleyball', wins: 20, losses: 5, draws: 1, points: 61, members: [] },
    ],

    sport_venues: [
        { name: 'Central Sports Arena', address: '123 Main Street, City', capacity: 50000, sport_types: ['Football', 'Rugby', 'Athletics'], facilities: ['Parking', 'Food Courts', 'VIP Boxes'], booking_available: true },
        { name: 'Downtown Basketball Court', address: '456 Downtown Ave', capacity: 15000, sport_types: ['Basketball', 'Volleyball'], facilities: ['Parking', 'Locker Rooms'], booking_available: true },
    ],

    // Travel
    travel_destinations: [
        { name: 'Tokyo', country: 'Japan', region: 'Asia', description: 'Experience the perfect blend of traditional culture and futuristic technology', featured: true, average_cost_per_day: 150, popular_activities: ['Temples', 'Sushi', 'Shopping', 'Anime'], best_season: 'Spring (Cherry Blossoms)' },
        { name: 'Paris', country: 'France', region: 'Europe', description: 'The City of Light offers world-class museums, iconic landmarks, and cuisine', featured: true, average_cost_per_day: 200, popular_activities: ['Museums', 'Cafes', 'Architecture', 'Art'], best_season: 'Spring & Fall' },
        { name: 'Dubai', country: 'UAE', region: 'Asia', description: 'Modern metropolis with stunning architecture and luxury shopping', featured: true, average_cost_per_day: 250, popular_activities: ['Skyscrapers', 'Desert Safari', 'Shopping', 'Beaches'], best_season: 'Winter' },
    ],

    // Help Center
    help_faqs: [
        { category: 'Account', question: 'How do I reset my password?', answer: 'Click "Forgot Password" on the login page, enter your email, and follow the link sent to your email.', views: 1250, helpful_count: 890, order: 1 },
        { category: 'Billing', question: 'How do I update my payment information?', answer: 'Navigate to Settings → Billing → Payment Methods. Click "Add Payment Method" or "Edit".', views: 750, helpful_count: 450, order: 1 },
        { category: 'Technical', question: 'Why am I getting a Connection Error?', answer: 'Try refreshing the page, clearing browser cache, or checking your internet connection.', views: 3200, helpful_count: 1890, order: 1 },
        { category: 'Features', question: 'How do I create a new class?', answer: 'Go to School Management → Classes → Click "Add New Class" button.', views: 500, helpful_count: 320, order: 1 },
    ],

    knowledge_articles: [
        { title: 'Getting Started with GROW YOUR NEED', content: '# Welcome!\n\n## Quick Start Guide\n\n### 1. Set Up Your Profile\nComplete your profile...\n\n### 2. Explore Features\nNavigate through...', category: 'Getting Started', tags: ['beginner', 'tutorial', 'onboarding'], views: 5400, helpful_count: 3200, published: true },
        { title: 'How to Use the Gamification System', content: '# Gamification Guide\n\nEarn XP, unlock achievements, and level up!', category: 'Getting Started', tags: ['gamification', 'xp', 'achievements'], views: 2100, helpful_count: 1500, published: true },
    ],

    // Events
    religious_events: [
        { title: 'Friday Prayer', description: 'Weekly congregational prayer', event_type: 'Prayer', date: '2025-12-12', time: '13:00', location: 'Main Mosque' },
        { title: 'Ramadan Preparation', description: 'Community iftar planning', event_type: 'Community', date: '2025-12-20', time: '19:00', location: 'Community Hall' },
    ],

    // Quran verses (sample)
    quran_verses: [
        { surah_number: 1, surah_name: 'Al-Fatihah', verse_number: 1, arabic_text: 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ', translation: 'In the name of Allah, the Most Gracious, the Most Merciful.', transliteration: 'Bismillah ir-Rahman ir-Rahim' },
        { surah_number: 112, surah_name: 'Al-Ikhlas', verse_number: 1, arabic_text: 'قُلۡ هُوَ ٱللَّهُ أَحَدٌ', translation: 'Say: He is Allah, the One and Only.', transliteration: 'Qul huwa Allahu ahad' },
    ],
};

async function seedData() {
    console.log('🌱 Starting PocketBase Data Seeding...\n');

    try {
        // Optional: Authenticate as superuser (helps with permissions)
        // Comment out if you want to run without authentication
        try {
            console.log('🔐 Attempting to authenticate as superuser...');
            await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
            console.log('✅ Superuser authenticated\n');
        } catch (authError) {
            console.log('⚠️  Authentication skipped (will proceed without it)\n');
        }

        const createdUsers = {};

        // 1. Seed Users
        console.log('👥 Seeding Users...');
        for (const userData of SAMPLE_DATA.users) {
            try {
                const user = await pb.collection('users').create(userData);
                createdUsers[userData.email] = user.id;
                console.log(`  ✓ Created user: ${userData.name}`);
            } catch (e) {
                if (e.status === 400) {
                    console.log(`  ⚠ User already exists: ${userData.name}`);
                    // Fetch existing user
                    try {
                        const existingUser = await pb.collection('users').getFirstListItem(`email="${userData.email}"`);
                        createdUsers[userData.email] = existingUser.id;
                    } catch (fetchErr) {
                        console.error(`  ✗ Could not fetch existing user ${userData.name}:`, fetchErr.message);
                    }
                } else {
                    console.error(`  ✗ Error creating ${userData.name}:`, e.message);
                }
            }
        }
        console.log('');

        // Get user IDs for relationships
        const adminId = createdUsers['admin@school.com'];
        const teacher1Id = createdUsers['john.teacher@school.com'];
        const teacher2Id = createdUsers['sarah.teacher@school.com'];
        const student1Id = createdUsers['alice.student@school.com'];
        const student2Id = createdUsers['bob.student@school.com'];
        const student3Id = createdUsers['charlie.student@school.com'];

        // 2. Seed Classes
        console.log('🏫 Seeding Classes...');
        const createdClasses = {};
        for (const classData of SAMPLE_DATA.classes) {
            try {
                const classRecord = await pb.collection('classes').create({
                    ...classData,
                    teacher: teacher1Id
                });
                createdClasses[classData.name] = classRecord.id;
                console.log(`  ✓ Created class: ${classData.name}`);
            } catch (e) {
                console.error(`  ✗ Error creating ${classData.name}:`, e.message);
            }
        }
        console.log('');

        // 3. Seed Subjects
        console.log('📚 Seeding Subjects...');
        for (const subjectData of SAMPLE_DATA.subjects) {
            try {
                await pb.collection('subjects').create({
                    ...subjectData,
                    teacher: teacher1Id,
                    class: Object.values(createdClasses)[0]
                });
                console.log(`  ✓ Created subject: ${subjectData.name}`);
            } catch (e) {
                console.error(`  ✗ Error creating ${subjectData.name}:`, e.message);
            }
        }
        console.log('');

        // 4. Seed Gamification Progress for students
        console.log('🎮 Seeding Gamification Progress...');
        const studentIds = [student1Id, student2Id, student3Id];
        for (let i = 0; i < studentIds.length; i++) {
            if (!studentIds[i]) {
                console.log(`  ⚠ Skipping progress for student ${i + 1} (User ID not found)`);
                continue;
            }
            try {
                // Check if progress already exists
                const existing = await pb.collection('user_progress').getList(1, 1, { filter: `user = "${studentIds[i]}"` });
                if (existing.items.length === 0) {
                    await pb.collection('user_progress').create({
                        user: studentIds[i],
                        level: i + 1,
                        current_xp: (i + 1) * 100,
                        streak_days: (i * 5) + 1, // Ensure non-zero
                        last_active: new Date().toISOString()
                    });
                    console.log(`  ✓ Created progress for student ${i + 1}`);
                } else {
                    console.log(`  ⚠ Progress already exists for student ${i + 1}`);
                }
            } catch (e) {
                console.error(`  ✗ Error creating progress for student ${i + 1}:`, e.message);
                if (e.data) console.error(JSON.stringify(e.data, null, 2));
            }
        }
        console.log('');

        // 5. Seed Achievements
        console.log('🏆 Seeding Achievements...');
        const createdAchievements = [];
        // Fetch existing achievements first to avoid duplicates/errors and populate createdAchievements
        try {
             const existing = await pb.collection('gamification_achievements').getFullList();
             existing.forEach(a => createdAchievements.push(a.id));
        } catch(e) {}

        for (const achievement of SAMPLE_DATA.gamification_achievements) {
            try {
                // Check if exists by name
                const existing = await pb.collection('gamification_achievements').getList(1, 1, { filter: `name = "${achievement.name}"` });
                if (existing.items.length === 0) {
                    const record = await pb.collection('gamification_achievements').create(achievement);
                    createdAchievements.push(record.id);
                    console.log(`  ✓ Created achievement: ${achievement.name}`);
                } else {
                    console.log(`  ⚠ Achievement already exists: ${achievement.name}`);
                    if (!createdAchievements.includes(existing.items[0].id)) {
                        createdAchievements.push(existing.items[0].id);
                    }
                }
            } catch (e) {
                console.error(`  ✗ Error creating achievement ${achievement.name}:`, e.message);
                if (e.data) console.error(JSON.stringify(e.data, null, 2));
            }
        }
        console.log('');

        // 6. Unlock some achievements for students
        console.log('🔓 Unlocking Achievements for Students...');
        if (createdAchievements.length > 0) {
            for (const studentId of studentIds) {
                for (let i = 0; i < Math.min(2, createdAchievements.length); i++) {
                    try {
                        // Check if already unlocked
                        const existing = await pb.collection('user_achievements').getList(1, 1, {
                            filter: `user = "${studentId}" && achievement = "${createdAchievements[i]}"`
                        });
                        
                        if (existing.items.length === 0) {
                            await pb.collection('user_achievements').create({
                                user: studentId,
                                achievement: createdAchievements[i],
                                progress: 100,
                                completed: true,
                                unlocked_at: new Date().toISOString()
                            });
                            console.log(`  ✓ Unlocked achievement for student`);
                        } else {
                             console.log(`  ⚠ Achievement already unlocked for student`);
                        }
                    } catch (e) {
                        console.error(`  ✗ Error unlocking achievement:`, e.message);
                        if (e.data) console.error(JSON.stringify(e.data, null, 2));
                    }
                }
            }
        } else {
            console.log('  ⚠ No achievements available to unlock');
        }
        console.log('');

        // 7. Seed Rewards
        console.log('🎁 Seeding Rewards...');
        for (const reward of SAMPLE_DATA.gamification_rewards) {
            try {
                await pb.collection('gamification_rewards').create(reward);
                console.log(`  ✓ Created reward: ${reward.name}`);
            } catch (e) {
                console.error(`  ✗ Error:`, e.message);
            }
        }
        console.log('');

        // 8. Seed Sport Teams
        console.log('⚽ Seeding Sport Teams...');
        for (const team of SAMPLE_DATA.sport_teams) {
            try {
                await pb.collection('sport_teams').create({
                    ...team,
                    members: [student1Id, student2Id]
                });
                console.log(`  ✓ Created team: ${team.name}`);
            } catch (e) {
                console.error(`  ✗ Error:`, e.message);
            }
        }
        console.log('');

        // 9. Seed Sport Venues
        console.log('🏟️ Seeding Sport Venues...');
        for (const venue of SAMPLE_DATA.sport_venues) {
            try {
                await pb.collection('sport_venues').create(venue);
                console.log(`  ✓ Created venue: ${venue.name}`);
            } catch (e) {
                console.error(`  ✗ Error:`, e.message);
            }
        }
        console.log('');

        // 10. Seed Travel Destinations
        console.log('✈️ Seeding Travel Destinations...');
        for (const destination of SAMPLE_DATA.travel_destinations) {
            try {
                await pb.collection('travel_destinations').create(destination);
                console.log(`  ✓ Created destination: ${destination.name}`);
            } catch (e) {
                console.error(`  ✗ Error:`, e.message);
            }
        }
        console.log('');

        // 11. Seed Help FAQs
        console.log('❓ Seeding FAQs...');
        for (const faq of SAMPLE_DATA.help_faqs) {
            try {
                await pb.collection('help_faqs').create(faq);
                console.log(`  ✓ Created FAQ: ${faq.question.substring(0, 40)}...`);
            } catch (e) {
                console.error(`  ✗ Error:`, e.message);
            }
        }
        console.log('');

        // 12. Seed Knowledge Articles
        console.log('📖 Seeding Knowledge Articles...');
        for (const article of SAMPLE_DATA.knowledge_articles) {
            try {
                await pb.collection('knowledge_articles').create({
                    ...article,
                    author: adminId
                });
                console.log(`  ✓ Created article: ${article.title}`);
            } catch (e) {
                console.error(`  ✗ Error:`, e.message);
            }
        }
        console.log('');

        // 13. Seed Religious Events
        console.log('🕌 Seeding Religious Events...');
        for (const event of SAMPLE_DATA.religious_events) {
            try {
                await pb.collection('religious_events').create(event);
                console.log(`  ✓ Created event: ${event.title}`);
            } catch (e) {
                console.error(`  ✗ Error:`, e.message);
            }
        }
        console.log('');

        // 14. Seed Quran Verses
        console.log('📿 Seeding Quran Verses...');
        for (const verse of SAMPLE_DATA.quran_verses) {
            try {
                await pb.collection('quran_verses').create(verse);
                console.log(`  ✓ Created verse: ${verse.surah_name} (${verse.verse_number})`);
            } catch (e) {
                console.error(`  ✗ Error:`, e.message);
            }
        }
        console.log('');

        console.log('✅ Data seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`  • ${SAMPLE_DATA.users.length} Users`);
        console.log(`  • ${SAMPLE_DATA.classes.length} Classes`);
        console.log(`  • ${SAMPLE_DATA.subjects.length} Subjects`);
        console.log(`  • ${SAMPLE_DATA.gamification_achievements.length} Achievements`);
        console.log(`  • ${SAMPLE_DATA.gamification_rewards.length} Rewards`);
        console.log(`  • ${SAMPLE_DATA.sport_teams.length} Sport Teams`);
        console.log(`  • ${SAMPLE_DATA.sport_venues.length} Sport Venues`);
        console.log(`  • ${SAMPLE_DATA.travel_destinations.length} Travel Destinations`);
        console.log(`  • ${SAMPLE_DATA.help_faqs.length} FAQs`);
        console.log(`  • ${SAMPLE_DATA.knowledge_articles.length} Knowledge Articles`);
        console.log(`  • ${SAMPLE_DATA.religious_events.length} Religious Events`);
        console.log(`  • ${SAMPLE_DATA.quran_verses.length} Quran Verses`);
        console.log('\n🎉 Your platform is now populated with data!');
        console.log('\n📝 Login Credentials:');
        console.log('  Admin: admin@school.com / Admin123!@#');
        console.log('  Teacher: john.teacher@school.com / Teacher123!@#');
        console.log('  Student: alice.student@school.com / Student123!@#');

    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the seeding
seedData().then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
}).catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
