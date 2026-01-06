import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://localhost:8090');

// Get admin credentials from env or use defaults
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
    try {
        console.log(`🔐 Authenticating as ${ADMIN_EMAIL}...`);
        await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
        console.log('✅ Authenticated.');

        // Define indices to add
        // Format: "collection_name": ["field1", "field2", "field1,field2"]
        const indicesToAdd = {
            'tenants': ['created', 'status', 'user'],
            'invoices': ['status', 'paid_at', 'created', 'tenant'],
            'system_alerts': ['created', 'severity'],
            'users': ['email', 'created'],
            'audit_logs': ['created', 'user', 'action'],
            'finance_transactions': ['date', 'category', 'type'],
            'wellness_logs': ['date', 'user'],
            'classes': ['start_time', 'teacher'],
            'attendance': ['date', 'student', 'class'],
            'messages': ['created', 'sender', 'recipient'],
            'analytics_pages': ['visitors'],
            'analytics_sources': ['visitors'],
            'finance_expenses': ['amount', 'date']
        };

        for (const [colName, fields] of Object.entries(indicesToAdd)) {
            try {
                const collection = await pb.collections.getOne(colName);
                let updated = false;
                let currentIndices = collection.indexes || [];

                for (const field of fields) {
                    // Construct index name and definition
                    // PocketBase index format: "CREATE INDEX `idx_name` ON `collection` (`field`)"
                    // But in the collection schema 'indexes' array, it's just the CREATE INDEX statement.
                    
                    const indexName = `idx_${colName}_${field.replace(/,/g, '_')}`;
                    const indexDef = `CREATE INDEX \`${indexName}\` ON \`${colName}\` (\`${field.replace(/,/g, '`,`')}\`)`;

                    // Check if index already exists (simple string check)
                    if (!currentIndices.some(idx => idx.includes(indexName))) {
                        console.log(`   ➕ Adding index: ${indexName}`);
                        currentIndices.push(indexDef);
                        updated = true;
                    } else {
                        // console.log(`   Existing index: ${indexName}`);
                    }
                }

                if (updated) {
                    await pb.collections.update(collection.id, {
                        indexes: currentIndices
                    });
                    console.log(`✅ Updated indices for ${colName}`);
                } else {
                    console.log(`   No new indices needed for ${colName}`);
                }

            } catch (e) {
                console.error(`❌ Error updating ${colName}: ${e.message}`);
            }
        }

        console.log('\n✨ Database indexing complete.');

    } catch (err) {
        console.error('❌ Critical Error:', err);
        process.exit(1);
    }
}

main();
