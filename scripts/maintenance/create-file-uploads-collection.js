// Database Migration: Add file_uploads collection with course materials support
// Run this script: pnpm db:setup-files

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function migrate() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL,
            process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD
        );

        console.log('✅ Authenticated as admin');

        // Check if collection already exists
        let collection;
        try {
            collection = await pb.collections.getOne('file_uploads');
            console.log('✅ file_uploads collection already exists');
            console.log('ℹ️  Skipping creation/update - collection is ready');

            // Exit successfully since collection exists
            console.log('\n✅ Migration completed - collection verified');
            process.exit(0);
        } catch (err) {
            console.log('📦 Creating file_uploads collection...');
            collection = null;
        }

        const collectionData = {
            name: 'file_uploads',
            type: 'base',
            schema: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'file',
                    type: 'file',
                    required: true,
                    options: {
                        maxSelect: 1,
                        maxSize: 52428800, // 50MB
                        mimeTypes: [
                            'application/pdf',
                            'application/msword',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'application/vnd.ms-excel',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            'application/vnd.ms-powerpoint',
                            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                            'image/jpeg',
                            'image/png',
                            'image/gif',
                            'video/mp4',
                            'text/plain',
                        ],
                    },
                },
                {
                    name: 'size',
                    type: 'number',
                    required: true,
                },
                {
                    name: 'type',
                    type: 'select',
                    required: true,
                    options: {
                        maxSelect: 1,
                        values: [
                            'course_material',
                            'assignment',
                            'profile_picture',
                            'document',
                            'image',
                            'video',
                        ],
                    },
                },
                {
                    name: 'course_id',
                    type: 'relation',
                    required: false,
                    options: {
                        collectionId: '', // Will be set to courses collection ID
                        cascadeDelete: false,
                        minSelect: null,
                        maxSelect: 1,
                        displayFields: ['title'],
                    },
                },
                {
                    name: 'uploaded_by',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: '', // Will be set to users collection ID
                        cascadeDelete: false,
                        minSelect: null,
                        maxSelect: 1,
                        displayFields: ['name', 'email'],
                    },
                },
                {
                    name: 'tenant_id',
                    type: 'relation',
                    required: false,
                    options: {
                        collectionId: '', // Will be set to tenants collection ID
                        cascadeDelete: false,
                        minSelect: null,
                        maxSelect: 1,
                        displayFields: ['name'],
                    },
                },
                {
                    name: 'description',
                    type: 'text',
                    required: false,
                },
            ],
            listRule: '@request.auth.id != null',
            viewRule: '@request.auth.id != null',
            createRule: '@request.auth.id != null && (@request.auth.role = "Admin" || @request.auth.role = "Teacher" || @request.auth.role = "Owner")',
            updateRule: 'uploaded_by = @request.auth.id || @request.auth.role = "Admin" || @request.auth.role = "Owner"',
            deleteRule: 'uploaded_by = @request.auth.id || @request.auth.role = "Admin" || @request.auth.role = "Owner"',
        };

        // Get collection IDs for relations
        try {
            const coursesCollection = await pb.collections.getOne('classes');
            const usersCollection = await pb.collections.getOne('users');
            const tenantsCollection = await pb.collections.getOne('tenants');

            // Update relation fields with actual collection IDs
            collectionData.schema[4].options.collectionId = coursesCollection.id;
            collectionData.schema[5].options.collectionId = usersCollection.id;
            collectionData.schema[6].options.collectionId = tenantsCollection.id;
        } catch (err) {
            console.warn('⚠️  Warning: Could not get related collection IDs:', err.message);
        }

        if (collection) {
            // Collection already exists, skip update to avoid rule validation issues
            console.log('✅ file_uploads collection already exists with correct structure');
            console.log('ℹ️  Skipping update - proceeding to seed data');
        } else {
            // Create new collection
            await pb.collections.create(collectionData);
            console.log('✅ file_uploads collection created successfully');
        }

        console.log('\n📋 Collection Rules:');
        console.log('  List: Any authenticated user can list files');
        console.log('  View: Any authenticated user can view files');
        console.log('  Create: Admin, Teacher, or Owner can upload files');
        console.log('  Update: File uploader, Admin, or Owner can update');
        console.log('  Delete: File uploader, Admin, or Owner can delete');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate()
    .then(() => {
        console.log('\n✅ Migration completed successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    });
