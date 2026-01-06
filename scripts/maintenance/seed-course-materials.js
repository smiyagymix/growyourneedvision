// Seed Script: Create realistic course materials data
// Run this script: pnpm db:seed-materials

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Sample course materials data
const courseMaterials = [
    // Computer Science Course Materials
    {
        name: 'Introduction_to_Programming_Syllabus.pdf',
        description: 'Complete syllabus for the programming course',
        type: 'course_material',
        size: 245760, // 240 KB
        courseFilter: 'code = "CS101"',
    },
    {
        name: 'Week_1_Lecture_Notes_Variables.pdf',
        description: 'Lecture notes covering variables and data types',
        type: 'course_material',
        size: 512000, // 500 KB
        courseFilter: 'code = "CS101"',
    },
    {
        name: 'Week_2_Lecture_Notes_Control_Flow.pdf',
        description: 'Lecture notes on if statements and loops',
        type: 'course_material',
        size: 487424, // 476 KB
        courseFilter: 'code = "CS101"',
    },
    {
        name: 'Programming_Reference_Guide.pdf',
        description: 'Quick reference guide for programming concepts',
        type: 'course_material',
        size: 1048576, // 1 MB
        courseFilter: 'code = "CS101"',
    },
    {
        name: 'Sample_Code_Examples.zip',
        description: 'Code examples from lectures',
        type: 'course_material',
        size: 2097152, // 2 MB
        courseFilter: 'code = "CS101"',
    },

    // Mathematics Course Materials
    {
        name: 'Calculus_Course_Syllabus.pdf',
        description: 'Calculus I course overview and requirements',
        type: 'course_material',
        size: 327680, // 320 KB
        courseFilter: 'code = "MATH201"',
    },
    {
        name: 'Chapter_1_Limits_and_Continuity.pdf',
        description: 'Textbook chapter on limits',
        type: 'course_material',
        size: 3145728, // 3 MB
        courseFilter: 'code = "MATH201"',
    },
    {
        name: 'Practice_Problems_Set_1.pdf',
        description: 'Practice problems for derivatives',
        type: 'course_material',
        size: 614400, // 600 KB
        courseFilter: 'code = "MATH201"',
    },
    {
        name: 'Formula_Sheet.pdf',
        description: 'Important formulas and theorems',
        type: 'course_material',
        size: 204800, // 200 KB
        courseFilter: 'code = "MATH201"',
    },

    // English Literature Course Materials
    {
        name: 'Course_Reading_List.pdf',
        description: 'Required and recommended reading',
        type: 'course_material',
        size: 153600, // 150 KB
        courseFilter: 'code = "ENG101"',
    },
    {
        name: 'Literary_Analysis_Guide.pdf',
        description: 'How to write literary analysis essays',
        type: 'course_material',
        size: 409600, // 400 KB
        courseFilter: 'code = "ENG101"',
    },
    {
        name: 'Shakespeare_Overview.pptx',
        description: 'Introduction to Shakespeare presentation',
        type: 'course_material',
        size: 5242880, // 5 MB
        courseFilter: 'code = "ENG101"',
    },

    // Physics Course Materials
    {
        name: 'Physics_Lab_Manual.pdf',
        description: 'Complete lab procedures and safety guidelines',
        type: 'course_material',
        size: 4194304, // 4 MB
        courseFilter: 'code = "PHYS101"',
    },
    {
        name: 'Mechanics_Chapter_Notes.pdf',
        description: 'Detailed notes on mechanics',
        type: 'course_material',
        size: 1572864, // 1.5 MB
        courseFilter: 'code = "PHYS101"',
    },
    {
        name: 'Problem_Solving_Strategies.pdf',
        description: 'Tips for solving physics problems',
        type: 'course_material',
        size: 307200, // 300 KB
        courseFilter: 'code = "PHYS101"',
    },
];

async function seedCourseMaterials() {
    try {
        // Authenticate as admin
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL,
            process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD
        );

        console.log('✅ Authenticated as admin');

        // Get a teacher user to be the uploader
        let uploader;
        try {
            const teachers = await pb.collection('users').getFullList({
                filter: 'role = "Teacher"',
            });
            if (teachers.length > 0) {
                uploader = teachers[0];
                console.log(`📤 Using teacher ${uploader.name} as uploader`);
            } else {
                const admins = await pb.collection('users').getFullList({
                    filter: 'role = "Admin"',
                });
                if (admins.length > 0) {
                    uploader = admins[0];
                    console.log(`📤 Using admin ${uploader.name} as uploader`);
                }
            }
        } catch (err) {
            console.error('❌ Could not find teacher or admin user');
            process.exit(1);
        }

        console.log('\n📦 Creating course materials...\n');

        let created = 0;
        let skipped = 0;

        // Fetch all available courses
        const allCourses = await pb.collection('classes').getFullList();

        if (allCourses.length === 0) {
            console.log('❌ No courses found in database. Cannot seed materials.');
            process.exit(0);
        }

        console.log(`ℹ️  Found ${allCourses.length} courses. Distributing materials...`);

        for (let i = 0; i < courseMaterials.length; i++) {
            const material = courseMaterials[i];
            try {
                // Distribute materials across available courses (Round Robin)
                const course = allCourses[i % allCourses.length];

                // Check if material already exists
                const existing = await pb.collection('file_uploads').getFullList({
                    filter: `name = "${material.name}" && course_id = "${course.id}"`,
                });

                if (existing.length > 0) {
                    console.log(`⏭️  Skipping ${material.name} - already exists in ${course.title}`);
                    skipped++;
                    continue;
                }

                // Create dummy file blob (in production, you'd upload actual files)
                const dummyContent = `This is a placeholder for ${material.name}\n\nIn production, this would be the actual file content.`;
                const blob = new Blob([dummyContent], { type: 'application/pdf' });

                // Create FormData for file upload
                const formData = new FormData();
                formData.append('name', material.name);
                formData.append('description', material.description || '');
                formData.append('type', material.type);
                formData.append('size', material.size.toString());
                formData.append('course_id', course.id);
                formData.append('uploaded_by', uploader.id);
                formData.append('file', blob, material.name);

                // Create the record
                await pb.collection('file_uploads').create(formData);

                console.log(`✅ Created: ${material.name} for ${course.title}`);
                created++;

            } catch (err) {
                console.error(`❌ Failed to create ${material.name}:`, err.message);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`  ✅ Created: ${created} materials`);
        console.log(`  ⏭️  Skipped: ${skipped} materials`);
        console.log(`  📁 Total: ${courseMaterials.length} materials processed`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedCourseMaterials()
    .then(() => {
        console.log('\n✅ Seeding completed successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    });
