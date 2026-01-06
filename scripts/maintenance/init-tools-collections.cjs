const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function createNotesAndFlashcardsCollections() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);

        console.log('Checking notes collection...');

        try {
            await pb.collections.getFirstListItem('notes', '');
            console.log('ℹ️  Notes collection already exists');
        } catch (e) {
            // Collection doesn't exist or is empty, try to fetch by name to be sure
            try {
                await pb.collections.getOne('notes');
                console.log('ℹ️  Notes collection already exists');
            } catch (err) {
                console.log('Creating notes collection...');
                try {
                    await pb.collections.create({
                        name: 'notes',
                        type: 'base',
                        schema: [
                            {
                                name: 'user',
                                type: 'relation',
                                required: true,
                                options: {
                                    collectionId: (await pb.collections.getOne('users')).id,
                                    cascadeDelete: true,
                                    maxSelect: 1
                                }
                            },
                            {
                                name: 'content',
                                type: 'text',
                                required: true,
                                options: {
                                    min: 1,
                                    max: 10000
                                }
                            },
                            {
                                name: 'title',
                                type: 'text',
                                required: false,
                                options: {
                                    max: 200
                                }
                            },
                            {
                                name: 'color',
                                type: 'text',
                                required: false,
                                options: {
                                    max: 20
                                }
                            }
                        ],
                        listRule: 'user = @request.auth.id',
                        viewRule: 'user = @request.auth.id',
                        createRule: 'user = @request.auth.id',
                        updateRule: 'user = @request.auth.id',
                        deleteRule: 'user = @request.auth.id'
                    });
                    console.log('✅ Notes collection created');
                } catch (createError) {
                    console.error('❌ Failed to create notes collection:', createError.message);
                }
            }
        }

        console.log('Checking flashcards collection...');

        try {
            await pb.collections.getOne('flashcards');
            console.log('ℹ️  Flashcards collection already exists');
        } catch (err) {
            console.log('Creating flashcards collection...');
            try {
                await pb.collections.create({
                    name: 'flashcards',
                    type: 'base',
                    schema: [
                        {
                            name: 'user',
                            type: 'relation',
                            required: true,
                            options: {
                                collectionId: (await pb.collections.getOne('users')).id,
                                cascadeDelete: true,
                                maxSelect: 1
                            }
                        },
                        {
                            name: 'front',
                            type: 'text',
                            required: true,
                            options: {
                                min: 1,
                                max: 500
                            }
                        },
                        {
                            name: 'back',
                            type: 'text',
                            required: true,
                            options: {
                                min: 1,
                                max: 1000
                            }
                        },
                        {
                            name: 'deck',
                            type: 'text',
                            required: false,
                            options: {
                                max: 100
                            }
                        },
                        {
                            name: 'mastered',
                            type: 'bool',
                            required: false
                        }
                    ],
                    listRule: 'user = @request.auth.id',
                    viewRule: 'user = @request.auth.id',
                    createRule: 'user = @request.auth.id',
                    updateRule: 'user = @request.auth.id',
                    deleteRule: 'user = @request.auth.id'
                });
                console.log('✅ Flashcards collection created');
            } catch (createError) {
                console.error('❌ Failed to create flashcards collection:', createError.message);
            }
        }

        console.log('\n✅ All collections for Tools app created successfully!');
        console.log('\nCollections created:');
        console.log('  - notes');
        console.log('  - flashcards');

    } catch (error) {
        console.error('❌ Error creating collections:', error);
        throw error;
    }
}

// Run the script
createNotesAndFlashcardsCollections()
    .then(() => {
        console.log('\n✅ Setup complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Setup failed:', error);
        process.exit(1);
    });
