import 'dotenv/config';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function addIndices() {
    console.log("🚀 Starting Database Optimization (Adding Indices)...");

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

    // Define indices to add
    // Format: Collection Name -> Array of field names to index
    const indicesToAdd = {
        tenants: [
            'status',
            'created',
            'updated'
        ],
        users: [
            'email',
            'role',
            'tenantId',
            'created'
        ],
        invoices: [
            'status',
            'paid_at',
            'created',
            'tenant'
        ],
        system_alerts: [
            'severity',
            'created'
        ],
        audit_logs: [
            'created',
            'user',
            'module'
        ]
    };

    for (const [collectionName, fields] of Object.entries(indicesToAdd)) {
        try {
            console.log(`\nProcessing collection: ${collectionName}...`);
            const collection = await pb.collections.getOne(collectionName);

            // Get existing indices
            let currentIndices = collection.indexes || [];
            let updated = false;

            for (const field of fields) {
                // PocketBase index format: "CREATE INDEX `idx_fieldname` ON `collectionName` (`fieldname`)"
                // But in the API 'indexes' array, it's just the raw SQL creation string.
                // We need to check if an index for this field already exists.
                // A simple heuristic is checking if the field name is present in any existing index string.

                const indexName = `idx_${field}_${collectionName}`;
                // Simplified SQL check - this might vary slightly based on DB (SQLite/Postgres) but usually consistent in PB context
                const exists = currentIndices.some(idx => idx.includes(indexName) || idx.includes(`(${field})`) || idx.includes(`\`${field}\``));

                if (!exists) {
                    console.log(`  ➕ Adding index for field: ${field}`);
                    // Construct the index creation SQL
                    // Note: PocketBase allows arbitrary SQL in the 'indexes' array array
                    const indexSql = `CREATE INDEX \`${indexName}\` ON \`${collectionName}\` (\`${field}\`)`;
                    currentIndices.push(indexSql);
                    updated = true;
                } else {
                    console.log(`  ✓ Index for field ${field} already exists`);
                }
            }

            if (updated) {
                await pb.collections.update(collection.id, {
                    indexes: currentIndices
                });
                console.log(`  ✅ Successfully updated indices for ${collectionName}`);
            } else {
                console.log(`  ℹ️ No changes needed for ${collectionName}`);
            }

        } catch (e) {
            if (e.status === 404) {
                console.warn(`  ⚠️ Collection ${collectionName} not found. Skipping.`);
            } else {
                console.error(`  ❌ Error updating ${collectionName}:`, e.message);
            }
        }
    }

    console.log("\n🏁 Database Optimization Complete!");
}

addIndices();
