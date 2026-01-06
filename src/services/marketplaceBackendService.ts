import pb from '../lib/pocketbase';

export interface Product {
    id: string;
    title: string;
    description?: string;
    price: number;
    currency: string;
    stock: number;
    category: string;
    images?: string[];
    sku?: string;
    is_active: boolean;
    tags?: string[];
    created: string;
    updated: string;
}

export interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    total_spent: number;
    notes?: string;
    status: 'Active' | 'Inactive' | 'VIP' | 'Blocked';
    created: string;
    updated: string;
}

export interface OrderItem {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    customer_id: string;
    expand?: {
        customer_id: Customer;
    };
    items: OrderItem[];
    total_amount: number;
    status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
    payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
    shipping_address: any;
    tracking_number?: string;
    created: string;
    updated: string;
}

export const marketplaceBackendService = {
    // Products
    getProducts: async (filter: string = '') => {
        return await pb.collection('products').getFullList<Product>({
            filter,
            sort: '-created'
        });
    },

    getProduct: async (id: string) => {
        return await pb.collection('products').getOne<Product>(id);
    },

    createProduct: async (data: Partial<Product>) => {
        return await pb.collection('products').create<Product>(data);
    },

    updateProduct: async (id: string, data: Partial<Product>) => {
        return await pb.collection('products').update<Product>(id, data);
    },

    deleteProduct: async (id: string) => {
        return await pb.collection('products').delete(id);
    },

    // Customers
    getCustomers: async (filter: string = '') => {
        return await pb.collection('customers').getFullList<Customer>({
            filter,
            sort: '-created'
        });
    },

    createCustomer: async (data: Partial<Customer>) => {
        return await pb.collection('customers').create<Customer>(data);
    },

    updateCustomer: async (id: string, data: Partial<Customer>) => {
        return await pb.collection('customers').update<Customer>(id, data);
    },

    deleteCustomer: async (id: string) => {
        return await pb.collection('customers').delete(id);
    },

    // Orders
    getOrders: async (filter: string = '') => {
        return await pb.collection('orders').getFullList<Order>({
            filter,
            sort: '-created',
            expand: 'customer_id'
        });
    },

    createOrder: async (data: Partial<Order>) => {
        return await pb.collection('orders').create<Order>(data);
    },

    updateOrder: async (id: string, data: Partial<Order>) => {
        return await pb.collection('orders').update<Order>(id, data);
    },

    // Analytics
    getStats: async () => {
        // This would ideally be an aggregation query, but for now we'll fetch and calculate
        const orders = await pb.collection('orders').getFullList<Order>({
            filter: 'payment_status = "Paid"'
        });
        
        const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            totalRevenue,
            totalOrders,
            averageOrderValue
        };
    }
};
