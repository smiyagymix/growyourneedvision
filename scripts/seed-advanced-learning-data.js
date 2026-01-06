import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function main() {
    try {
        console.log('🔐 Authenticating...');
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL || 'owner@growyourneed.com';
        const adminPass = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASS || 'Darnag12345678@';
        
        await pb.collection('_superusers').authWithPassword(adminEmail, adminPass);
        console.log('✅ Authenticated successfully\n');

        // Get test users
        console.log('📋 Fetching test users...');
        const users = await pb.collection('users').getFullList();
        const studentUser = users.find(u => u.email === 'student@school.com');
        const teacherUser = users.find(u => u.email === 'teacher@school.com');

        if (!studentUser) {
            console.error('❌ Student user not found. Please run seed-data.js first.');
            process.exit(1);
        }

        console.log(`✅ Found users: ${studentUser ? 'Student' : '(no student)'}, ${teacherUser ? 'Teacher' : '(no teacher)'}\n`);

        // ==========================================
        // 1. Seed Adaptive Learning Profiles
        // ==========================================
        console.log('=== Seeding Adaptive Learning Profiles ===\n');

        const adaptiveProfiles = [
            {
                userId: studentUser.id,
                subject: 'Mathematics',
                difficultyLevel: 7,
                irtAbility: 0.85,
                learningPath: {
                    current: 'Quadratic Equations',
                    next: ['Polynomials', 'Functions', 'Trigonometry'],
                    completed: ['Linear Equations', 'Factoring', 'Fractions']
                },
                recommendedContent: [
                    { title: 'Review: Quadratic Equations', type: 'practice', priority: 'high' },
                    { title: 'Introduction to Polynomials', type: 'lesson', priority: 'medium' }
                ],
                completedTopics: ['linear_equations', 'factoring', 'fractions', 'exponents'],
                strugglingTopics: ['word_problems', 'complex_fractions'],
                lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                performanceHistory: [
                    { date: '2025-12-14', score: 75, topic: 'Factoring' },
                    { date: '2025-12-17', score: 82, topic: 'Quadratic Equations' },
                    { date: '2025-12-20', score: 88, topic: 'Quadratic Equations' }
                ]
            },
            {
                userId: studentUser.id,
                subject: 'English',
                difficultyLevel: 8,
                irtAbility: 1.1,
                learningPath: {
                    current: 'Essay Writing',
                    next: ['Literary Analysis', 'Research Papers', 'Creative Writing'],
                    completed: ['Grammar Basics', 'Paragraph Structure', 'Thesis Statements']
                },
                recommendedContent: [
                    { title: 'Practice: Essay Structure', type: 'practice', priority: 'high' },
                    { title: 'Advanced Grammar Techniques', type: 'lesson', priority: 'low' }
                ],
                completedTopics: ['grammar', 'punctuation', 'paragraphs', 'thesis'],
                strugglingTopics: ['citations', 'counterarguments'],
                lastAssessment: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                nextReview: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                performanceHistory: [
                    { date: '2025-12-15', score: 85, topic: 'Paragraph Structure' },
                    { date: '2025-12-18', score: 90, topic: 'Essay Writing' }
                ]
            },
            {
                userId: studentUser.id,
                subject: 'Science',
                difficultyLevel: 6,
                irtAbility: 0.65,
                learningPath: {
                    current: 'Chemical Reactions',
                    next: ['Acids and Bases', 'Stoichiometry', 'Thermodynamics'],
                    completed: ['Atomic Structure', 'Periodic Table', 'Bonding']
                },
                recommendedContent: [
                    { title: 'Lab: Chemical Reactions', type: 'lab', priority: 'high' },
                    { title: 'Video: Balancing Equations', type: 'video', priority: 'medium' }
                ],
                completedTopics: ['atoms', 'periodic_table', 'ionic_bonding', 'covalent_bonding'],
                strugglingTopics: ['balancing_equations', 'stoichiometry'],
                lastAssessment: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                nextReview: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                performanceHistory: [
                    { date: '2025-12-10', score: 70, topic: 'Bonding' },
                    { date: '2025-12-15', score: 72, topic: 'Chemical Reactions' }
                ]
            }
        ];

        for (const profile of adaptiveProfiles) {
            try {
                await pb.collection('adaptive_learning_profiles').create(profile);
                console.log(`✅ Created adaptive profile: ${profile.subject} (Level ${profile.difficultyLevel}, Ability ${profile.irtAbility})`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Adaptive profile already exists: ${profile.subject}`);
                } else {
                    console.error(`❌ Error creating adaptive profile:`, error.message);
                }
            }
        }

        // ==========================================
        // 2. Seed Learning Analytics
        // ==========================================
        console.log('\n=== Seeding Learning Analytics ===\n');

        const analytics = {
            userId: studentUser.id,
            skillMastery: {
                mathematics: 87,
                english: 92,
                science: 78,
                history: 85,
                programming: 90
            },
            studyTime: 1470, // 24.5 hours in minutes
            studyTimeWeek: 360, // 6 hours
            studyTimeMonth: 1470,
            streakDays: 12,
            bestStreak: 18,
            lastStudyDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            skillGaps: [
                { skill: 'Stoichiometry', gap: 'high', recommendation: 'Practice balancing equations' },
                { skill: 'Essay Citations', gap: 'medium', recommendation: 'Review MLA/APA formats' },
                { skill: 'Word Problems', gap: 'medium', recommendation: 'Focus on reading comprehension' }
            ],
            predictions: {
                dropoutRisk: 0.05,
                gradeProjection: {
                    mathematics: 'A-',
                    english: 'A',
                    science: 'B+',
                    history: 'A-'
                },
                nextMilestone: {
                    skill: 'Chemical Equations',
                    estimatedDays: 7,
                    confidence: 0.82
                }
            },
            performanceTrend: 'improving',
            riskScore: 0.15,
            engagementScore: 92
        };

        try {
            await pb.collection('learning_analytics').create(analytics);
            console.log(`✅ Created learning analytics for student (Engagement: ${analytics.engagementScore}%, Streak: ${analytics.streakDays} days)`);
        } catch (error) {
            if (error.message && error.message.includes('already exists')) {
                console.log(`⚠️  Learning analytics already exists`);
            } else {
                console.error(`❌ Error creating learning analytics:`, error.message);
            }
        }

        // ==========================================
        // 3. Seed Micro Credentials
        // ==========================================
        console.log('\n=== Seeding Micro Credentials ===\n');

        const credentials = [
            {
                credentialId: 'cred-python-basics-001',
                userId: studentUser.id,
                badgeName: 'Python Basics',
                badgeIcon: '🏆',
                description: 'Completed Python Fundamentals course with 95% score',
                issuer: 'Grow Your Need Academy',
                issuerId: teacherUser ? teacherUser.id : null,
                issuedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                expiryDate: null,
                verificationUrl: 'https://verify.growyourneed.com/credentials/cred-python-basics-001',
                blockchainHash: '0x1234567890abcdef1234567890abcdef12345678',
                metadata: {
                    score: 95,
                    duration: '4 weeks',
                    topics: ['variables', 'functions', 'loops', 'data structures']
                },
                skills: ['Python', 'Programming', 'Problem Solving'],
                category: 'course_completion',
                level: 'beginner',
                status: 'active',
                public: true
            },
            {
                credentialId: 'cred-data-analysis-002',
                userId: studentUser.id,
                badgeName: 'Data Analysis',
                badgeIcon: '📊',
                description: 'In progress - 75% complete',
                issuer: 'Grow Your Need Academy',
                issuerId: teacherUser ? teacherUser.id : null,
                issuedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                expiryDate: null,
                verificationUrl: null,
                blockchainHash: null,
                metadata: {
                    progress: 75,
                    duration: '6 weeks',
                    topics: ['pandas', 'numpy', 'matplotlib', 'statistics']
                },
                skills: ['Data Analysis', 'Python', 'Statistics'],
                category: 'course_completion',
                level: 'intermediate',
                status: 'active',
                public: false
            },
            {
                credentialId: 'cred-essay-writing-003',
                userId: studentUser.id,
                badgeName: 'Essay Writing',
                badgeIcon: '✍️',
                description: 'Locked - Complete prerequisites first',
                issuer: 'Grow Your Need Academy',
                issuerId: null,
                issuedDate: new Date().toISOString(),
                expiryDate: null,
                verificationUrl: null,
                blockchainHash: null,
                metadata: {
                    prerequisites: ['Grammar Basics', 'Paragraph Structure'],
                    duration: '3 weeks'
                },
                skills: ['Writing', 'English', 'Communication'],
                category: 'skill_mastery',
                level: 'intermediate',
                status: 'active',
                public: false
            }
        ];

        for (const credential of credentials) {
            try {
                await pb.collection('micro_credentials').create(credential);
                console.log(`✅ Created credential: ${credential.badgeName} (${credential.category}, ${credential.level})`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Credential already exists: ${credential.badgeName}`);
                } else {
                    console.error(`❌ Error creating credential:`, error.message);
                }
            }
        }

        // ==========================================
        // 4. Seed Skill Assessments
        // ==========================================
        console.log('\n=== Seeding Skill Assessments ===\n');

        const assessments = [
            {
                userId: studentUser.id,
                skill: 'Python Programming',
                score: 95,
                maxScore: 100,
                percentage: 95,
                assessmentType: 'quiz',
                takenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                timeTaken: 45,
                recommendations: [
                    'Excellent work on fundamentals',
                    'Consider advancing to Data Structures course'
                ],
                strengths: ['Loops', 'Functions', 'Error Handling'],
                weaknesses: ['Advanced OOP', 'Decorators'],
                nextSteps: [
                    'Complete "Python OOP" module',
                    'Build a small project using classes'
                ]
            },
            {
                userId: studentUser.id,
                skill: 'Essay Writing',
                score: 88,
                maxScore: 100,
                percentage: 88,
                assessmentType: 'assignment',
                takenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                timeTaken: 120,
                recommendations: [
                    'Strong thesis statements',
                    'Work on citation formatting'
                ],
                strengths: ['Organization', 'Thesis', 'Evidence'],
                weaknesses: ['Citations', 'Counterarguments'],
                nextSteps: [
                    'Review MLA citation format',
                    'Practice writing counterarguments'
                ]
            },
            {
                userId: studentUser.id,
                skill: 'Chemical Reactions',
                score: 72,
                maxScore: 100,
                percentage: 72,
                assessmentType: 'exam',
                takenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                timeTaken: 60,
                recommendations: [
                    'Review balancing equations',
                    'Practice stoichiometry problems'
                ],
                strengths: ['Identifying reaction types', 'Basic balancing'],
                weaknesses: ['Complex balancing', 'Stoichiometry calculations'],
                nextSteps: [
                    'Complete "Balancing Equations" practice set',
                    'Watch video tutorials on stoichiometry'
                ]
            }
        ];

        for (const assessment of assessments) {
            try {
                await pb.collection('skill_assessments').create(assessment);
                console.log(`✅ Created assessment: ${assessment.skill} (${assessment.percentage}%, ${assessment.assessmentType})`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Assessment already exists: ${assessment.skill}`);
                } else {
                    console.error(`❌ Error creating assessment:`, error.message);
                }
            }
        }

        // ==========================================
        // 5. Seed Learning Path Recommendations
        // ==========================================
        console.log('\n=== Seeding Learning Path Recommendations ===\n');

        const learningPaths = [
            {
                userId: studentUser.id,
                pathName: 'Data Science Mastery',
                description: 'Complete path from Python basics to advanced data science',
                subjects: ['Python', 'Statistics', 'Machine Learning', 'Data Visualization'],
                estimatedDuration: 180, // days
                difficulty: 'intermediate',
                prerequisites: ['Python Basics'],
                milestones: [
                    { name: 'Python Fundamentals', completed: true, dueDate: null },
                    { name: 'Data Analysis with Pandas', completed: false, dueDate: '2026-01-15' },
                    { name: 'Statistics & Probability', completed: false, dueDate: '2026-02-15' },
                    { name: 'Machine Learning Intro', completed: false, dueDate: '2026-03-15' }
                ],
                progress: 25,
                status: 'in_progress',
                aiGenerated: true,
                matchScore: 92
            },
            {
                userId: studentUser.id,
                pathName: 'Advanced Writing Skills',
                description: 'Master essay writing, research papers, and creative writing',
                subjects: ['English', 'Writing', 'Research', 'Literary Analysis'],
                estimatedDuration: 90,
                difficulty: 'advanced',
                prerequisites: ['Grammar Basics', 'Paragraph Structure'],
                milestones: [
                    { name: 'Essay Structure', completed: true, dueDate: null },
                    { name: 'Research Methods', completed: false, dueDate: '2026-01-10' },
                    { name: 'Literary Analysis', completed: false, dueDate: '2026-02-01' },
                    { name: 'Creative Writing', completed: false, dueDate: '2026-03-01' }
                ],
                progress: 40,
                status: 'in_progress',
                aiGenerated: true,
                matchScore: 88
            },
            {
                userId: studentUser.id,
                pathName: 'Web Development Fundamentals',
                description: 'Build modern websites with HTML, CSS, JavaScript, and React',
                subjects: ['HTML', 'CSS', 'JavaScript', 'React'],
                estimatedDuration: 120,
                difficulty: 'beginner',
                prerequisites: [],
                milestones: [
                    { name: 'HTML Basics', completed: false, dueDate: '2026-01-05' },
                    { name: 'CSS Styling', completed: false, dueDate: '2026-01-20' },
                    { name: 'JavaScript Fundamentals', completed: false, dueDate: '2026-02-10' },
                    { name: 'React Introduction', completed: false, dueDate: '2026-03-05' }
                ],
                progress: 0,
                status: 'suggested',
                aiGenerated: true,
                matchScore: 85
            }
        ];

        for (const path of learningPaths) {
            try {
                await pb.collection('learning_path_recommendations').create(path);
                console.log(`✅ Created learning path: ${path.pathName} (${path.difficulty}, ${path.progress}% complete)`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Learning path already exists: ${path.pathName}`);
                } else {
                    console.error(`❌ Error creating learning path:`, error.message);
                }
            }
        }

        // ==========================================
        // 6. Summary
        // ==========================================
        console.log('\n=== Summary ===\n');
        console.log(`✅ Adaptive Learning Profiles: ${adaptiveProfiles.length} created`);
        console.log(`✅ Learning Analytics: 1 created`);
        console.log(`✅ Micro Credentials: ${credentials.length} created`);
        console.log(`✅ Skill Assessments: ${assessments.length} created`);
        console.log(`✅ Learning Path Recommendations: ${learningPaths.length} created`);
        
        console.log('\n📊 Advanced Learning Stats:');
        console.log(`   Average Difficulty Level: ${(adaptiveProfiles.reduce((sum, p) => sum + p.difficultyLevel, 0) / adaptiveProfiles.length).toFixed(1)}`);
        console.log(`   Student Engagement: ${analytics.engagementScore}%`);
        console.log(`   Active Credentials: ${credentials.filter(c => c.status === 'active').length}`);
        console.log(`   Active Learning Paths: ${learningPaths.filter(p => p.status === 'in_progress').length}`);
        console.log(`   Current Streak: ${analytics.streakDays} days`);
        
        console.log('\n✨ Advanced Learning data seeding complete!');
        console.log('\n🚀 Next steps:');
        console.log('   1. Create advancedLearningService.ts');
        console.log('   2. Wire Student Dashboard to backend API');
        console.log('   3. Integrate ML framework (TensorFlow.js)');
        console.log('   4. Test adaptive difficulty adjustment');
        
    } catch (error) {
        console.error('❌ Data seeding failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
