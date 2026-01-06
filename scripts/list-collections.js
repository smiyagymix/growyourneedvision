import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function listCollections() {
    try {
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');
        console.log('✅ Authenticated\n');
        
        const collections = await pb.collections.getFullList({ sort: 'name' });
        
        console.log(`📊 Total Collections: ${collections.length}\n`);
        console.log('Collections:');
        console.log('============');
        
        collections.forEach((col, idx) => {
            console.log(`${idx + 1}. ${col.name} (${col.type})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listCollections();
