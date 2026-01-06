import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateUsersSchema() {
    console.log('🚀 Updating Users Schema...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    try {
        const collection = await pb.collections.getOne('users');
        
        // Handle both v0.23+ (fields) and older (schema) structures
        const fields = collection.fields || collection.schema || [];
        const hasSalary = fields.find(f => f.name === 'salary');
        
        if (!hasSalary) {
            console.log('Adding salary field to users collection...');
            fields.push({
                name: 'salary',
                type: 'number',
                required: false,
                options: {}
            });
            
            // Update the collection object
            if (collection.fields) {
                collection.fields = fields;
            } else {
                collection.schema = fields;
            }
            
            await pb.collections.update('users', collection);
            console.log('✅ Users schema updated with salary field.');
        } else {
            console.log('ℹ️  Salary field already exists.');
        }

    } catch (error) {
        console.error('❌ Failed to update users schema:', error);
    }
}

updateUsersSchema();
