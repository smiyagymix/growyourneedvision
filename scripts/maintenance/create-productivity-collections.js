import 'dotenv/config';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function createCollections() {
    console.log("🚀 Initializing Productivity Collections...");

    // Authenticate as Admin
    try {
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL,
            process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD
        );
        console.log("✅ Authenticated as Admin");
    } catch (e) {
        console.error("❌ Auth failed. Please check your admin credentials in .env");
        return;
    }

    const collections = [
        {
            name: 'tasks',
            type: 'base',
            schema: [
                { name: 'content', type: 'text', required: true },
                { name: 'completed', type: 'bool' },
                { name: 'due_date', type: 'date' },
                { name: 'user', type: 'relation', collectionId: 'users', required: true, cascadeDelete: false }
            ]
        },
        {
            name: 'events',
            type: 'base',
            schema: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'text' },
                { name: 'start', type: 'date', required: true },
                { name: 'end', type: 'date', required: true },
                { name: 'user', type: 'relation', collectionId: 'users', required: true, cascadeDelete: false }
            ]
        }
    ];

    for (const def of collections) {
        try {
            await pb.collections.create(def);
            console.log(`✅ Created collection: ${def.name}`);
        } catch (e) {
            // Check if error is "collection already exists" (status 400 usually, or unique constraint)
            // But usually create throws if name taken. 
            // We can try to fetch it first effectively, or just catch the error.
            // If it exists, we might want to check fields, but for now assuming existence is enough.
            console.log(`ℹ️ Collection ${def.name} might already exist or failed: ${e.message}`);
            // If it exists, let's try to update it? No, keeping it simple.
        }
    }

    // Add indices for performance
    try {
        const tasks = await pb.collections.getOne('tasks');
        await pb.collections.update(tasks.id, {
            indexes: [
                `CREATE INDEX idx_tasks_user ON tasks (user)`,
                `CREATE INDEX idx_tasks_created ON tasks (created)`
            ]
        });
        console.log("✅ Added indices to tasks");
    } catch (e) { console.log("ℹ️ Could not update tasks indices"); }

    try {
        const events = await pb.collections.getOne('events');
        await pb.collections.update(events.id, {
            indexes: [
                `CREATE INDEX idx_events_user ON events (user)`,
                `CREATE INDEX idx_events_start ON events (start)`
            ]
        });
        console.log("✅ Added indices to events");
    } catch (e) { console.log("ℹ️ Could not update events indices"); }

    console.log("🏁 Productivity Schema Setup Complete!");
}

createCollections();
