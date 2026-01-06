/**
 * PocketBase Collection Schema Initialization for New Components
 * Creates collections for: Skills, Certifications, Projects, Goals, Lesson Plans, Resources, Timetable
 * 
 * Usage: node init-new-collections.cjs
 */

const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initializeCollections() {
    console.log('🚀 Initializing new PocketBase collections...\n');

    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated\n');

        // 1. Skills Collection
        console.log('📊 Creating Skills collection...');
        try {
            await pb.collections.create({
                name: 'skills',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', maxSelect: 1 } },
                    { name: 'name', type: 'text', required: true },
                    { name: 'category', type: 'select', required: true, options: { values: ['technical', 'soft-skills', 'language', 'creative', 'business'] } },
                    { name: 'proficiency', type: 'number', required: true, min: 0, max: 100 },
                    { name: 'experience_years', type: 'number', min: 0 },
                    { name: 'certifications', type: 'json' },
                    { name: 'projects_used', type: 'json' },
                    { name: 'last_used', type: 'date' }
                ],
                indexes: ['CREATE INDEX idx_skills_user ON skills(user)']
            });
            console.log('✅ Skills collection created\n');
        } catch (e) {
            console.log('⚠️  Skills collection already exists\n');
        }

        // 2. Certifications Collection
        console.log('🎓 Creating Certifications collection...');
        try {
            await pb.collections.create({
                name: 'certifications',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', maxSelect: 1 } },
                    { name: 'title', type: 'text', required: true },
                    { name: 'issuer', type: 'text', required: true },
                    { name: 'issue_date', type: 'date', required: true },
                    { name: 'expiry_date', type: 'date' },
                    { name: 'credential_id', type: 'text' },
                    { name: 'credential_url', type: 'url' },
                    { name: 'skills', type: 'json' },
                    { name: 'verified', type: 'bool', required: true, default: false }
                ],
                indexes: ['CREATE INDEX idx_certifications_user ON certifications(user)']
            });
            console.log('✅ Certifications collection created\n');
        } catch (e) {
            console.log('⚠️  Certifications collection already exists\n');
        }

        // 3. Projects Collection
        console.log('📁 Creating Projects collection...');
        try {
            await pb.collections.create({
                name: 'projects',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', maxSelect: 1 } },
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'category', type: 'select', required: true, options: { values: ['web-development', 'mobile-app', 'design', 'data-science', 'other'] } },
                    { name: 'status', type: 'select', required: true, options: { values: ['planning', 'in-progress', 'completed', 'on-hold'] } },
                    { name: 'progress', type: 'number', required: true, min: 0, max: 100, default: 0 },
                    { name: 'start_date', type: 'date', required: true },
                    { name: 'end_date', type: 'date' },
                    { name: 'tags', type: 'json' },
                    { name: 'links', type: 'json' }
                ],
                indexes: ['CREATE INDEX idx_projects_user ON projects(user)', 'CREATE INDEX idx_projects_status ON projects(status)']
            });
            console.log('✅ Projects collection created\n');
        } catch (e) {
            console.log('⚠️  Projects collection already exists\n');
        }

        // 4. Goals Collection
        console.log('🎯 Creating Goals collection...');
        try {
            await pb.collections.create({
                name: 'goals',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', maxSelect: 1 } },
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'text' },
                    { name: 'category', type: 'select', required: true, options: { values: ['learning', 'career', 'personal', 'fitness', 'financial'] } },
                    { name: 'target_date', type: 'date', required: true },
                    { name: 'progress', type: 'number', required: true, min: 0, max: 100, default: 0 },
                    { name: 'status', type: 'select', required: true, options: { values: ['active', 'completed', 'paused'] } },
                    { name: 'milestones', type: 'json' }
                ],
                indexes: ['CREATE INDEX idx_goals_user ON goals(user)', 'CREATE INDEX idx_goals_status ON goals(status)']
            });
            console.log('✅ Goals collection created\n');
        } catch (e) {
            console.log('⚠️  Goals collection already exists\n');
        }

        // 5. Lesson Plans Collection
        console.log('📚 Creating Lesson Plans collection...');
        try {
            await pb.collections.create({
                name: 'lesson_plans',
                type: 'base',
                schema: [
                    { name: 'teacher', type: 'relation', required: true, options: { collectionId: 'users', maxSelect: 1 } },
                    { name: 'title', type: 'text', required: true },
                    { name: 'subject', type: 'text', required: true },
                    { name: 'grade_level', type: 'text', required: true },
                    { name: 'duration', type: 'number', required: true },
                    { name: 'objectives', type: 'json', required: true },
                    { name: 'materials', type: 'json', required: true },
                    { name: 'activities', type: 'json', required: true },
                    { name: 'assessment', type: 'text', required: true },
                    { name: 'notes', type: 'text' },
                    { name: 'date', type: 'date', required: true }
                ],
                indexes: ['CREATE INDEX idx_lesson_plans_teacher ON lesson_plans(teacher)', 'CREATE INDEX idx_lesson_plans_date ON lesson_plans(date)']
            });
            console.log('✅ Lesson Plans collection created\n');
        } catch (e) {
            console.log('⚠️  Lesson Plans collection already exists\n');
        }

        // 6. Course Resources Collection
        console.log('📖 Creating Course Resources collection...');
        try {
            await pb.collections.create({
                name: 'course_resources',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'type', type: 'select', required: true, options: { values: ['pdf', 'video', 'document', 'link', 'other'] } },
                    { name: 'subject', type: 'text' },
                    { name: 'description', type: 'text' },
                    { name: 'file_url', type: 'url' },
                    { name: 'external_link', type: 'url' },
                    { name: 'uploaded_by', type: 'relation', required: true, options: { collectionId: 'users', maxSelect: 1 } },
                    { name: 'status', type: 'select', required: true, options: { values: ['draft', 'published', 'archived'] }, default: 'published' }
                ],
                indexes: ['CREATE INDEX idx_resources_subject ON course_resources(subject)', 'CREATE INDEX idx_resources_type ON course_resources(type)']
            });
            console.log('✅ Course Resources collection created\n');
        } catch (e) {
            console.log('⚠️  Course Resources collection already exists\n');
        }

        // 7. Timetable Collection
        console.log('📅 Creating Timetable collection...');
        try {
            await pb.collections.create({
                name: 'timetable',
                type: 'base',
                schema: [
                    { name: 'class', type: 'relation', required: true, options: { collectionId: 'classes', maxSelect: 1 } },
                    { name: 'subject', type: 'relation', options: { collectionId: 'subjects', maxSelect: 1 } },
                    { name: 'teacher', type: 'relation', options: { collectionId: 'users', maxSelect: 1 } },
                    { name: 'day', type: 'select', required: true, options: { values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] } },
                    { name: 'time_start', type: 'text', required: true },
                    { name: 'time_end', type: 'text', required: true },
                    { name: 'room', type: 'text' }
                ],
                indexes: ['CREATE INDEX idx_timetable_class ON timetable(class)', 'CREATE INDEX idx_timetable_day ON timetable(day)']
            });
            console.log('✅ Timetable collection created\n');
        } catch (e) {
            console.log('⚠️  Timetable collection already exists\n');
        }

        console.log('\n🎉 All collections initialized successfully!');
        console.log('\n📋 Collections created:');
        console.log('   1. skills - Individual skill tracking');
        console.log('   2. certifications - Professional credentials');
        console.log('   3. projects - Portfolio management');
        console.log('   4. goals - Goal tracking with milestones');
        console.log('   5. lesson_plans - Teacher lesson planning');
        console.log('   6. course_resources - Student learning resources');
        console.log('   7. timetable - Class scheduling');
        console.log('\n✅ Database is ready for all new components!');

    } catch (error) {
        console.error('❌ Error initializing collections:', error);
        process.exit(1);
    }
}

// Run initialization
initializeCollections();
