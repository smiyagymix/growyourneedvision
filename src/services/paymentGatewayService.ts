import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface PaymentGateway {
    id: string;
    name: string;
    type: 'stripe' | 'paypal' | 'bank_transfer' | 'square' | 'other';
    enabled: boolean;
    test_mode: boolean;
    status: 'connected' | 'disconnected' | 'error';
    last_transaction?: string;
    config?: Record<string, unknown>;
    created?: string;
    updated?: string;
}

const MOCK_GATEWAYS: PaymentGateway[] = [
    {
        id: 'gateway-1',
        name: 'Stripe',
        type: 'stripe',
        enabled: true,
        test_mode: false,
        status: 'connected',
        last_transaction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'gateway-2',
        name: 'PayPal',
        type: 'paypal',
        enabled: false,
        test_mode: true,
        status: 'disconnected',
        created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'gateway-3',
        name: 'Bank Transfer',
        type: 'bank_transfer',
        enabled: true,
        test_mode: false,
        status: 'connected',
        last_transaction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        created: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export const paymentGatewayService = {
    // Get all payment gateways
    getGateways: async (): Promise<PaymentGateway[]> => {
        if (isMockEnv()) {
            return MOCK_GATEWAYS;
        }

        try {
            return await pb.collection('payment_gateways').getFullList<PaymentGateway>({
                sort: 'name',
                requestKey: null
            });
        } catch (error) {
            console.error('Failed to fetch payment gateways:', error);
            return MOCK_GATEWAYS;
        }
    },

    // Get single gateway by ID
    getGateway: async (id: string): Promise<PaymentGateway | null> => {
        if (isMockEnv()) {
            return MOCK_GATEWAYS.find(g => g.id === id) || null;
        }

        try {
            return await pb.collection('payment_gateways').getOne<PaymentGateway>(id);
        } catch {
            return null;
        }
    },

    // Get gateway by type
    getGatewayByType: async (type: PaymentGateway['type']): Promise<PaymentGateway | null> => {
        if (isMockEnv()) {
            return MOCK_GATEWAYS.find(g => g.type === type) || null;
        }

        try {
            return await pb.collection('payment_gateways').getFirstListItem<PaymentGateway>(
                `type = "${type}"`
            );
        } catch {
            return null;
        }
    },

    // Create new gateway
    createGateway: async (data: Omit<PaymentGateway, 'id' | 'created' | 'updated'>): Promise<PaymentGateway> => {
        if (isMockEnv()) {
            const newGateway: PaymentGateway = {
                ...data,
                id: `gateway-${Date.now()}`,
                created: new Date().toISOString()
            };
            MOCK_GATEWAYS.push(newGateway);
            return newGateway;
        }

        return await pb.collection('payment_gateways').create<PaymentGateway>(data);
    },

    // Update gateway
    updateGateway: async (id: string, data: Partial<PaymentGateway>): Promise<PaymentGateway | null> => {
        if (isMockEnv()) {
            const gateway = MOCK_GATEWAYS.find(g => g.id === id);
            if (gateway) {
                Object.assign(gateway, data, { updated: new Date().toISOString() });
            }
            return gateway || null;
        }

        return await pb.collection('payment_gateways').update<PaymentGateway>(id, data);
    },

    // Toggle gateway enabled status
    toggleGateway: async (id: string): Promise<PaymentGateway | null> => {
        const gateway = await paymentGatewayService.getGateway(id);
        if (!gateway) return null;

        return paymentGatewayService.updateGateway(id, {
            enabled: !gateway.enabled
        });
    },

    // Test gateway connection
    testGateway: async (id: string): Promise<{ success: boolean; message: string }> => {
        if (isMockEnv()) {
            const gateway = MOCK_GATEWAYS.find(g => g.id === id);
            if (!gateway) {
                return { success: false, message: 'Gateway not found' };
            }
            // Simulate test - 90% success rate in mock
            const success = Math.random() > 0.1;
            if (success) {
                gateway.status = 'connected';
            }
            return {
                success,
                message: success ? 'Connection successful' : 'Connection failed - check credentials'
            };
        }

        try {
            // In production, call the server endpoint to test the gateway
            const response = await fetch(`/api/payment-gateways/${id}/test`, {
                method: 'POST'
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Failed to test gateway connection' };
        }
    },

    // Delete gateway
    deleteGateway: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_GATEWAYS.findIndex(g => g.id === id);
            if (index !== -1) {
                MOCK_GATEWAYS.splice(index, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection('payment_gateways').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    // Get enabled gateways
    getEnabledGateways: async (): Promise<PaymentGateway[]> => {
        if (isMockEnv()) {
            return MOCK_GATEWAYS.filter(g => g.enabled && g.status === 'connected');
        }

        return await pb.collection('payment_gateways').getFullList<PaymentGateway>({
            filter: 'enabled = true && status = "connected"',
            sort: 'name',
            requestKey: null
        });
    },

    // Update last transaction timestamp
    recordTransaction: async (id: string): Promise<void> => {
        await paymentGatewayService.updateGateway(id, {
            last_transaction: new Date().toISOString()
        });
    },

    // Format last transaction time for display
    formatLastTransaction: (timestamp?: string): string => {
        if (!timestamp) return 'Never';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }
};
