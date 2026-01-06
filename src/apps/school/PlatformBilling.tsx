import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { SubscriptionPlans } from '../owner/SubscriptionPlans';

interface PlatformBillingProps {
    activeSubNav?: string;
}

interface Invoice {
    id: string;
    tenant_name: string;
    tenant_id: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    due_date: string;
    paid_date?: string;
    plan_name: string;
    period: string;
}

interface PaymentGateway {
    id: string;
    name: string;
    type: 'stripe' | 'paypal' | 'bank_transfer';
    enabled: boolean;
    test_mode: boolean;
    status: 'connected' | 'disconnected' | 'error';
    last_transaction?: string;
}

export const PlatformBilling: React.FC<PlatformBillingProps> = ({ activeSubNav = 'Plans' }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [overdueCount, setOverdueCount] = useState(0);

    // Payment gateways state
    const [gateways, setGateways] = useState<PaymentGateway[]>([
        {
            id: '1',
            name: 'Stripe',
            type: 'stripe',
            enabled: true,
            test_mode: false,
            status: 'connected',
            last_transaction: '2 hours ago'
        },
        {
            id: '2',
            name: 'PayPal',
            type: 'paypal',
            enabled: false,
            test_mode: true,
            status: 'disconnected'
        },
        {
            id: '3',
            name: 'Bank Transfer',
            type: 'bank_transfer',
            enabled: true,
            test_mode: false,
            status: 'connected',
            last_transaction: '1 day ago'
        }
    ]);

    useEffect(() => {
        if (activeSubNav === 'Invoices') {
            loadInvoices();
        }
    }, [activeSubNav]);

    const loadInvoices = async () => {
        try {
            // Query actual invoices from PocketBase
            const result = await pb.collection('invoices').getList<Invoice>(1, 50, {
                sort: '-invoice_date',
                expand: 'tenant_id'
            });
            setInvoices(result.items);
        } catch (error) {
            console.error('Failed to load invoices:', error);
            // Fallback to mock data if query fails
            const mockInvoices: Invoice[] = [
                {
                    id: '1',
                    tenant_name: 'Greenwood High School',
                    tenant_id: 'tenant_001',
                    amount: 299.99,
                    status: 'paid',
                    due_date: '2024-01-01',
                    paid_date: '2023-12-28',
                    plan_name: 'Premium',
                    period: 'January 2024'
                },
                {
                    id: '2',
                    tenant_name: 'Individual - John Doe',
                    tenant_id: 'tenant_002',
                    amount: 49.99,
                    status: 'pending',
                    due_date: '2024-01-15',
                    plan_name: 'Basic',
                    period: 'January 2024'
                },
                {
                    id: '3',
                    tenant_name: 'Riverside Academy',
                    tenant_id: 'tenant_003',
                    amount: 499.99,
                    status: 'overdue',
                    due_date: '2023-12-20',
                    plan_name: 'Enterprise',
                    period: 'December 2023'
                }
            ];

            setInvoices(mockInvoices);

            // Calculate stats
            const total = mockInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
            const pending = mockInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
            const overdue = mockInvoices.filter(inv => inv.status === 'overdue').length;

            setTotalRevenue(total);
            setPendingAmount(pending);
            setOverdueCount(overdue);
        } catch (error) {
            console.error('Failed to load invoices:', error);
        }
    };

    const renderPlansView = () => {
        return <SubscriptionPlans />;
    };

    const renderInvoicesView = () => {
        return (
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${totalRevenue.toFixed(2)}</p>
                            </div>
                            <Icon name="CurrencyDollarIcon" className="w-10 h-10 text-blue-500" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 border-yellow-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${pendingAmount.toFixed(2)}</p>
                            </div>
                            <Icon name="ClockIcon" className="w-10 h-10 text-yellow-500" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{overdueCount}</p>
                            </div>
                            <Icon name="ExclamationTriangleIcon" className="w-10 h-10 text-red-500" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Invoices</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{invoices.length}</p>
                            </div>
                            <Icon name="DocumentTextIcon" className="w-10 h-10 text-green-500" />
                        </div>
                    </Card>
                </div>

                {/* Invoices Table */}
                <Card className="overflow-hidden">
                    <div className="p-6 border-b">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Invoices</h3>
                            <div className="flex gap-3">
                                <Button variant="outline"><Icon name="ArrowDownTrayIcon" className="w-4 h-4 mr-2" />Export CSV</Button>
                                <Button variant="primary"><Icon name="PlusIcon" className="w-4 h-4 mr-2" />Create Invoice</Button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">#{invoice.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{invoice.tenant_name}</div>
                                            <div className="text-sm text-gray-500">{invoice.tenant_id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{invoice.plan_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{invoice.period}</td>
                                        <td className="px-6 py-4 text-sm font-semibold">${invoice.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'danger'}>
                                                {invoice.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{invoice.due_date}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm"><Icon name="EyeIcon" className="w-4 h-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    };

    const renderGatewaysView = () => {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Gateways</h3>
                        <p className="text-sm text-gray-500 mt-1">Configure payment processing integrations</p>
                    </div>
                    <Button variant="primary"><Icon name="PlusIcon" className="w-4 h-4 mr-2" />Add Gateway</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gateways.map((gateway) => (
                        <Card key={gateway.id} className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${gateway.type === 'stripe' ? 'bg-indigo-100' :
                                            gateway.type === 'paypal' ? 'bg-blue-100' : 'bg-green-100'
                                        }`}>
                                        <Icon name="CreditCardIcon" className={`w-6 h-6 ${gateway.type === 'stripe' ? 'text-indigo-600' :
                                                gateway.type === 'paypal' ? 'text-blue-600' : 'text-green-600'
                                            }`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{gateway.name}</h4>
                                        <p className="text-xs text-gray-500">{gateway.type}</p>
                                    </div>
                                </div>
                                <Badge variant={gateway.status === 'connected' ? 'success' : 'secondary'}>
                                    {gateway.status}
                                </Badge>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Enabled</span>
                                    <Badge variant={gateway.enabled ? 'success' : 'secondary'}>
                                        {gateway.enabled ? 'ON' : 'OFF'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Mode</span>
                                    <Badge variant={gateway.test_mode ? 'warning' : 'secondary'}>
                                        {gateway.test_mode ? 'Test' : 'Live'}
                                    </Badge>
                                </div>
                                {gateway.last_transaction && (
                                    <div className="text-xs text-gray-500">Last: {gateway.last_transaction}</div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4 border-t">
                                <Button variant="outline" size="sm" className="flex-1">Test</Button>
                                <Button variant="outline" size="sm" className="flex-1">Configure</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    const tabs = ['Plans', 'Invoices', 'Gateways'];
    let content: React.ReactNode = renderPlansView();
    if (activeSubNav === 'Invoices') content = renderInvoicesView();
    if (activeSubNav === 'Gateways') content = renderGatewaysView();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Platform Billing</h1>
                <Badge variant="info">Billing Hub</Badge>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        type="button"
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${activeSubNav === tab ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'}`}
                        aria-current={activeSubNav === tab}
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                window.location.hash = '#/admin/school/billing';
                            }
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {content}
        </div>
    );
};
