import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICES_DIR = path.join(__dirname, '../src/services');
const MIGRATIONS_DIR = path.join(__dirname, '../pocketbase/pb_migrations');

// 1. Scan migrations for created collections
const collections = new Set();

// Add default system collections
collections.add('users');
collections.add('users_auth');

// Add commonly used PocketBase collections that might not be in migrations if created via UI (but ideally should be)
// We will list missing ones.

try {
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR);
    migrationFiles.forEach(file => {
        const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

        // Strategy: Look for "name": "collection_name" pattern which is standard in PB migrations
        // We use a global regex to find ALL occurrences in the file.
        // This is a heuristic that assumes "name": "xyz" at the root of a Collection object 
        // is distinctive enough. To avoid matching field names too often, we can rely on the fact
        // that collection names in this project seem to be snake_case and distinct.
        // A more strict regex for new Collection({...}) is hard without a parser.

        // However, we can try to match the context of `new Collection` slightly better,
        // or just scan for all "name": "..." and add them. 
        // Since we are checking for EXISTENCE of specific service-requested collections,
        // false positives (finding a name that isn't a collection) only matters if that name
        // happens to MATCH a missing service collection. 
        // The risk of a field named "travel_bookings" inside another collection is low.

        // Strategy: Look for "name": "collection_name" OR name: "collection_name"
        // This handles cases where I define collections in an array like [{ name: "foo" }]

        const regex = /(?:["']?name["']?)\s*:\s*["']([^"']+)["']/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            collections.add(match[1]);
        }

        // Also check for the DAO finding pattern
        const daoMatch = content.match(/findCollectionByNameOrId\("([^"]+)"\)/);
        if (daoMatch) {
            collections.add(daoMatch[1]);
        }
    });

    // Explicitly check if our key collections are found
    console.log("Debug Check:");
    console.log("Has tenant_health_history?", collections.has("tenant_health_history"));
    console.log("Has utils_dev?", collections.has("utils_dev"));
    console.log("Has student_grades?", collections.has("student_grades"));
    console.log("Has lesson_plans?", collections.has("lesson_plans"));
    console.log("Has user_preferences?", collections.has("user_preferences"));
    console.log("Has platform_config?", collections.has("platform_config"));
    console.log("Has services?", collections.has("services"));
    console.log("Has campaigns?", collections.has("campaigns"));
    console.log("Has marketplace_apps?", collections.has("marketplace_apps"));
    console.log("Has media_items?", collections.has("media_items"));

    console.log(`Found ${collections.size} collections in migrations.`);

    // 2. Scan services for pb.collection('xyz') usage
    const issues = [];
    if (fs.existsSync(SERVICES_DIR)) {
        const serviceFiles = fs.readdirSync(SERVICES_DIR);

        serviceFiles.forEach(file => {
            if (!file.endsWith('.ts') && !file.endsWith('.js')) return;

            const content = fs.readFileSync(path.join(SERVICES_DIR, file), 'utf8');

            // Regex for pb.collection('name') or pb.collection("name")
            // matching valid collection names (alphanumeric, underscore)
            const regex = /pb\.collection\(['"]([a-zA-Z0-9_]+)['"]\)/g;
            let match;

            while ((match = regex.exec(content)) !== null) {
                const collectionName = match[1];
                if (!collections.has(collectionName)) {
                    issues.push({
                        file: file,
                        collection: collectionName
                    });
                }
            }
        });
    }

    // 3. Report
    if (issues.length > 0) {
        console.log('\n❌ MISSING COLLECTIONS FOUND:');
        console.log('The following collections are used in code but NOT found in migrations:');

        const grouped = {};
        issues.forEach(issue => {
            if (!grouped[issue.collection]) grouped[issue.collection] = [];
            if (!grouped[issue.collection].includes(issue.file)) {
                grouped[issue.collection].push(issue.file);
            }
        });

        Object.keys(grouped).forEach(col => {
            console.log(`\nCollection: "${col}"`);
            console.log(`  Used in: ${grouped[col].join(', ')}`);
        });
        process.exit(1);
    } else {
        console.log('\n✅ All collection references match existing migrations.');
        process.exit(0);
    }

} catch (err) {
    console.error("Error during audit:", err);
    process.exit(1);
}
