import React, { useState, useEffect, useCallback } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { SubscriptionPlans } from '../owner/SubscriptionPlans';
import { AppError } from '../../types/common';
import {
  Invoice,
  PaymentGateway,
  BillingStats,
  validateInvoice,
  validatePaymentGateway,
  isBillingError,
  isInvoice,
  isPaymentGateway
} from '../../validation/billingSchemas';
import { cn } from '../../lib/utils';

interface PlatformBillingProps {
  activeSubNav?: string;
}

interface BillingState {
  invoices: Invoice[];
  gateways: PaymentGateway[];
  stats: BillingStats | null;
  loading: boolean;
  error: AppError | null;
}

const initialState: BillingState = {
  invoices: [],
  gateways: [],
  stats: null,
  loading: false,
  error: null
};

/**
 * PlatformBilling Component
 * Manages billing operations including invoices, payment gateways, and subscription plans
 * Implements full type safety with Zod validation and error handling
 */
export const PlatformBilling: React.FC<PlatformBillingProps> = ({ activeSubNav = 'Plans' }) => {
  const [state, setState] = useState<BillingState>(initialState);

  // Load data when tab changes
  useEffect(() => {
    if (activeSubNav === 'Invoices') {
      loadInvoices();
    } else if (activeSubNav === 'Gateways') {
      loadGateways();
    }
  }, [activeSubNav]);

  /**
   * Load invoices from billing service with validation
   */
  const loadInvoices = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { billingService } = await import('../../services/billingService');
      const result = await billingService.getInvoices(1, 50);
      
      // Validate all invoices before use
      const validatedInvoices = result.items.filter((item): item is Invoice => {
        const validation = validateInvoice(item);
        if (!validation.success) {
          console.warn('Invalid invoice skipped:', item, validation.error);
          return false;
        }
        return true;
      });

      // Calculate stats from real data
      const stats: BillingStats = {
        total_revenue: validatedInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0),
        pending_amount: validatedInvoices
          .filter(inv => inv.status === 'pending')
          .reduce((sum, inv) => sum + inv.amount, 0),
        overdue_count: validatedInvoices.filter(inv => inv.status === 'overdue').length,
        invoice_count: result.total,
        paid_invoices: validatedInvoices.filter(inv => inv.status === 'paid').length,
        pending_invoices: validatedInvoices.filter(inv => inv.status === 'pending').length,
        overdue_invoices: validatedInvoices.filter(inv => inv.status === 'overdue').length
      };

      setState(prev => ({
        ...prev,
        invoices: validatedInvoices,
        stats,
        loading: false
      }));
    } catch (error) {
      const appError: AppError = error instanceof Error
        ? { message: error.message, code: 'INVOICE_LOAD_FAILED', status: 500, timestamp: new Date() }
        : { message: 'Unknown error loading invoices', code: 'UNKNOWN_ERROR', status: 500, timestamp: new Date() };
      
      setState(prev => ({ ...prev, error: appError, loading: false }));
      console.error('Failed to load invoices:', appError);
    }
  }, []);

  /**
   * Load payment gateways from billing service with validation
   */
  const loadGateways = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { billingService } = await import('../../services/billingService');
      const gateways = await billingService.getPaymentGateways();
      
      // Validate all gateways before use
      const validatedGateways = gateways.filter((item): item is PaymentGateway => {
        const validation = validatePaymentGateway(item);
        if (!validation.success) {
          console.warn('Invalid gateway skipped:', item, validation.error);
          return false;
        }
        return true;
      });

      setState(prev => ({
        ...prev,
        gateways: validatedGateways,
        loading: false
      }));
    } catch (error) {
      const appError: AppError = error instanceof Error
        ? { message: error.message, code: 'GATEWAY_LOAD_FAILED', status: 500, timestamp: new Date() }
        : { message: 'Unknown error loading gateways', code: 'UNKNOWN_ERROR', status: 500, timestamp: new Date() };
      
      setState(prev => ({ ...prev, error: appError, loading: false }));
      console.error('Failed to load gateways:', appError);
    }
  }, []);

  /**
   * Toggle gateway enabled/disabled status
   */
  const handleToggleGateway = useCallback(async (gatewayId: string, currentEnabled: boolean): Promise<void> => {
    try {
      const { billingService } = await import('../../services/billingService');
      await billingService.toggleGateway(gatewayId, !currentEnabled);
      
      // Reload gateways to reflect change
      await loadGateways();
    } catch (error) {
      const appError: AppError = error instanceof Error
        ? { message: error.message, code: 'GATEWAY_UPDATE_FAILED', status: 500, timestamp: new Date() }
        : { message: 'Failed to toggle gateway', code: 'UNKNOWN_ERROR', status: 500, timestamp: new Date() };
      
      setState(prev => ({ ...prev, error: appError }));
    }
  }, [loadGateways]);

  /**
   * Render subscription plans view (delegates to SubscriptionPlans component)
   */
  const renderPlansView = (): JSX.Element => {
    return <SubscriptionPlans />;
  };

  /**
   * Render invoices list with stats
   */
  const renderInvoicesView = (): JSX.Element => {
    if (state.loading) {
      return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading invoices...</div>;
    }

    if (state.error) {
      return (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 dark:text-red-100">Error Loading Invoices</h3>
          <p className="text-red-700 dark:text-red-200 text-sm mt-1">{state.error.message}</p>
          <button 
            onClick={loadInvoices}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ${(state.stats?.total_revenue ?? 0).toFixed(2)}
                </p>
              </div>
              <Icon name="CurrencyDollarIcon" className="w-10 h-10 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ${(state.stats?.pending_amount ?? 0).toFixed(2)}
                </p>
              </div>
              <Icon name="ClockIcon" className="w-10 h-10 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {state.stats?.overdue_count ?? 0}
                </p>
              </div>
              <Icon name="ExclamationTriangleIcon" className="w-10 h-10 text-red-500" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {state.stats?.invoice_count ?? 0}
                </p>
              </div>
              <Icon name="DocumentTextIcon" className="w-10 h-10 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
                {state.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  state.invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">#{invoice.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{invoice.tenant_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{invoice.tenant_id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{invoice.plan_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{invoice.period}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">${invoice.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'pending' ? 'warning' :
                          'danger'
                        }>
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{invoice.due_date}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm"><Icon name="EyeIcon" className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  /**
   * Render payment gateways configuration view
   */
  const renderGatewaysView = (): JSX.Element => {
    if (state.loading) {
      return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading payment gateways...</div>;
    }

    if (state.error) {
      return (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 dark:text-red-100">Error Loading Gateways</h3>
          <p className="text-red-700 dark:text-red-200 text-sm mt-1">{state.error.message}</p>
          <button 
            onClick={loadGateways}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Gateways</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure payment processing integrations</p>
          </div>
          <Button variant="primary"><Icon name="PlusIcon" className="w-4 h-4 mr-2" />Add Gateway</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.gateways.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
              No payment gateways configured
            </div>
          ) : (
            state.gateways.map((gateway) => (
              <Card key={gateway.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      gateway.type === 'stripe' ? 'bg-indigo-100' :
                      gateway.type === 'paypal' ? 'bg-blue-100' :
                      'bg-green-100'
                    )}>
                      <Icon name="CreditCardIcon" className={cn(
                        'w-6 h-6',
                        gateway.type === 'stripe' ? 'text-indigo-600' :
                        gateway.type === 'paypal' ? 'text-blue-600' :
                        'text-green-600'
                      )} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{gateway.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{gateway.type}</p>
                    </div>
                  </div>
                  <Badge variant={gateway.status === 'connected' ? 'success' : 'secondary'}>
                    {gateway.status}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Enabled</span>
                    <Badge variant={gateway.enabled ? 'success' : 'secondary'}>
                      {gateway.enabled ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Mode</span>
                    <Badge variant={gateway.test_mode ? 'warning' : 'secondary'}>
                      {gateway.test_mode ? 'Test' : 'Live'}
                    </Badge>
                  </div>
                  {gateway.last_transaction && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">Last: {gateway.last_transaction}</div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleToggleGateway(gateway.id, gateway.enabled)}
                  >
                    {gateway.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">Configure</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  // Render current view based on active tab
  const tabs = ['Plans', 'Invoices', 'Gateways'] as const;
  type TabType = typeof tabs[number];
  
  let content: JSX.Element = renderPlansView();
  if (activeSubNav === 'Invoices') content = renderInvoicesView();
  if (activeSubNav === 'Gateways') content = renderGatewaysView();

  return (
    <WidgetErrorBoundary>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Platform Billing</h1>
          <Badge variant="info">Billing Hub</Badge>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {tabs.map((tab: TabType) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold transition-colors border whitespace-nowrap',
                activeSubNav === tab
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
              aria-current={activeSubNav === tab ? 'page' : 'false'}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {content}
      </div>
    </WidgetErrorBoundary>
  );
};

export default PlatformBilling;
