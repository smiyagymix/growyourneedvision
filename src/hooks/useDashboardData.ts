import { useOwnerDashboard } from './useOwnerDashboard';

export interface KPI {
    label: string;
    value: string;
    sub: string;
    icon: string;
    color: string;
    bg: string;
}

export interface Alert {
    id: string;
    type: 'Critical' | 'Warning' | 'Info';
    msg: string;
    time: string;
    bg: string;
    border: string;
    text: string;
    icon: string;
}

export const useDashboardData = () => {
    const { data, loading, error } = useOwnerDashboard();

    let kpis: KPI[] = [];
    let alerts: Alert[] = [];

    if (data) {
        kpis = [
            { 
                label: 'MRR', 
                value: data.kpis.mrr.value.toString(), 
                sub: `${data.kpis.mrr.change > 0 ? '+' : ''}${data.kpis.mrr.change}% ${data.kpis.mrr.changeLabel}`, 
                icon: 'ChartBarIcon', 
                color: 'text-gyn-orange', 
                bg: 'from-orange-50 to-orange-100/50' 
            },
            { 
                label: 'Active Tenants', 
                value: data.kpis.activeTenants.value.toString(), 
                sub: `${data.kpis.activeTenants.change} ${data.kpis.activeTenants.changeLabel}`, 
                icon: 'UserGroup', 
                color: 'text-blue-500', 
                bg: 'from-blue-50 to-blue-100/50' 
            },
            { 
                label: 'LTV', 
                value: data.kpis.ltv.value.toString(), 
                sub: `${data.kpis.ltv.change}% ${data.kpis.ltv.changeLabel}`, 
                icon: 'Money', 
                color: 'text-purple-500', 
                bg: 'from-purple-50 to-purple-100/50' 
            },
            { 
                label: 'Churn Rate', 
                value: data.kpis.churn.value.toString(), 
                sub: `${data.kpis.churn.change}% ${data.kpis.churn.changeLabel}`, 
                icon: 'TrendingDown', 
                color: 'text-red-500', 
                bg: 'from-red-50 to-red-100/50' 
            },
        ];

        alerts = data.alerts.map(a => ({
            id: a.id,
            type: a.severity === 'critical' ? 'Critical' : a.severity === 'warning' ? 'Warning' : 'Info',
            msg: a.message,
            time: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            bg: a.severity === 'critical' ? 'bg-red-50/80' : a.severity === 'warning' ? 'bg-yellow-50/80' : 'bg-blue-50/80',
            border: a.severity === 'critical' ? 'border-red-100' : a.severity === 'warning' ? 'border-yellow-100' : 'border-blue-100',
            text: a.severity === 'critical' ? 'text-red-700' : a.severity === 'warning' ? 'text-yellow-700' : 'text-blue-700',
            icon: a.severity === 'critical' ? 'ExclamationCircle' : a.severity === 'warning' ? 'ExclamationTriangle' : 'CheckCircle',
        }));
    }

    return { kpis, alerts, loading, error };
};
