import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initMarketplaceSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Products Collection
        try {
            await pb.collections.create({
                name: 'products',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'editor', required: false },
                    { name: 'price', type: 'number', required: true },
                    { name: 'currency', type: 'text', required: true, options: { pattern: '^[A-Z]{3}$' } }, // e.g., USD
                    { name: 'stock', type: 'number', required: true },
                    { name: 'category', type: 'text', required: true },
                    { name: 'images', type: 'file', required: false, options: { maxSelect: 5, maxSize: 5242880 } },
                    { name: 'sku', type: 'text', required: false },
                    { name: 'is_active', type: 'bool', required: false },
                    { name: 'tags', type: 'json', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created products collection');
        } catch (e) {
            console.log('products collection might already exist');
        }

        // 2. Customers Collection (CRM)
        try {
            await pb.collections.create({
                name: 'customers',
                type: 'base',
                schema: [
                    { name: 'first_name', type: 'text', required: true },
                    { name: 'last_name', type: 'text', required: true },
                    { name: 'email', type: 'email', required: true },
                    { name: 'phone', type: 'text', required: false },
                    { name: 'address', type: 'json', required: false }, // { street, city, zip, country }
                    { name: 'total_spent', type: 'number', required: false },
                    { name: 'notes', type: 'editor', required: false },
                    { name: 'status', type: 'select', options: { values: ['Active', 'Inactive', 'VIP', 'Blocked'] } }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created customers collection');
        } catch (e) {
            console.log('customers collection might already exist');
        }

        // 3. Orders Collection
        try {
            await pb.collections.create({
                name: 'orders',
                type: 'base',
                schema: [
                    { name: 'customer_id', type: 'relation', required: true, options: { collectionId: 'customers' } },
                    { name: 'items', type: 'json', required: true }, // Array of { product_id, quantity, price_at_purchase }
                    { name: 'total_amount', type: 'number', required: true },
                    { name: 'status', type: 'select', required: true, options: { values: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'] } },
                    { name: 'payment_status', type: 'select', required: true, options: { values: ['Pending', 'Paid', 'Failed', 'Refunded'] } },
                    { name: 'shipping_address', type: 'json', required: true },
                    { name: 'tracking_number', type: 'text', required: false }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created orders collection');
        } catch (e) {
            console.log('orders collection might already exist');
        }

        // 4. Marketplace Apps (for the App Store)
        try {
            await pb.collections.create({
                name: 'marketplace_apps',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'description', type: 'editor', required: true },
                    { name: 'category', type: 'text', required: true },
                    { name: 'price', type: 'text', required: true }, // e.g. "Free", "$9.99"
                    { name: 'provider', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'icon', type: 'text', required: false }, // Icon name or URL
                    { name: 'rating', type: 'number', required: false },
                    { name: 'installs', type: 'number', required: false },
                    { name: 'verified', type: 'bool', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created marketplace_apps collection');
        } catch (e) {
            console.log('marketplace_apps collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init marketplace schema:', error);
    }
}

initMarketplaceSchema();
