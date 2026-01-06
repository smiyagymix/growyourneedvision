import React, { useState, useEffect } from 'react';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { tenantService, Tenant } from '../../services/tenantService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BulkTenantOperations } from '../../components/owner/BulkTenantOperations';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';

export const TenantDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, suspended: 0 });
    const [mrr, setMRR] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');
    const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
    const [showBulkOperations, setShowBulkOperations] = useState(false);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setLoading(true);
        try {
            let filterQuery = '';
            if (filter === 'active') filterQuery = 'status = "active"';
            else if (filter === 'trial') filterQuery = 'status = "trial"';
            else if (filter === 'suspended') filterQuery = 'status = "suspended"';

            const [tenantsData, statsData, mrrValue] = await Promise.all([
                tenantService.getTenants(filterQuery),
                tenantService.getTenantStats(),
                tenantService.calculateMRR()
            ]);

            setTenants(tenantsData.items as Tenant[]);
            setStats(statsData);
            setMRR(mrrValue);
        } catch (error) {
            console.error('Failed to load tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'trial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'enterprise': return 'bg-purple-100 text-purple-800';
            case 'pro': return 'bg-blue-100 text-blue-800';
            case 'basic': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const toggleTenantSelection = (tenantId: string) => {
        setSelectedTenants(prev =>
            prev.includes(tenantId)
                ? prev.filter(id => id !== tenantId)
                : [...prev, tenantId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedTenants.length === tenants.length) {
            setSelectedTenants([]);
        } else {
            setSelectedTenants(tenants.map(t => t.id));
        }
    };

    const handleBulkOperationComplete = () => {
        setShowBulkOperations(false);
        setSelectedTenants([]);
        loadData();
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Tenants</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all schools and organizations</p>
                    {selectedTenants.length > 0 && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            {selectedTenants.length} tenant{selectedTenants.length !== 1 ? 's' : ''} selected
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    {selectedTenants.length > 0 && (
                        <Button 
                            name="bulk-actions"
                            variant="outline" 
                            onClick={() => setShowBulkOperations(true)}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                            <Icon name="Cog6ToothIcon" className="w-5 h-5 mr-2" />
                            Bulk Actions ({selectedTenants.length})
                        </Button>
                    )}
                    <Button name="add-tenant" variant="primary" onClick={() => navigate('/owner/tenants/new')}>
                        <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                        Add Tenant
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Tenants</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Icon name="BuildingOfficeIcon" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.active}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <Icon name="CheckCircleIcon" className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Trial</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.trial}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Icon name="ClockIcon" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">MRR</p>
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                                ${mrr.toLocaleString()}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            <Icon name="CurrencyDollarIcon" className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters and Selection */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    {(['all', 'active', 'trial', 'suspended'] as const).map(filterOption => (
                        <button
                            name={`filter-${filterOption}`}
                            key={filterOption}
                            onClick={() => setFilter(filterOption)}
                            className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${filter === filterOption
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {filterOption}
                        </button>
                    ))}
                </div>
                {tenants.length > 0 && (
                    <button
                        name="toggle-select-all"
                        onClick={toggleSelectAll}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {selectedTenants.length === tenants.length ? 'Deselect All' : 'Select All'}
                    </button>
                )}
            </div>

            {/* Tenants List */}
            {loading ? (
                <div className="text-center py-12">
                    <Icon name="ArrowPathIcon" className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                    <p className="text-gray-500 mt-2">Loading tenants...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tenants.map(tenant => (
                        <motion.div
                            key={tenant.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Checkbox */}
                                        <input
                                            name="tenant-checkbox"
                                            type="checkbox"
                                            checked={selectedTenants.includes(tenant.id)}
                                            onChange={() => toggleTenantSelection(tenant.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        
                                        {/* Logo */}
                                        <div 
                                            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl cursor-pointer"
                                            onClick={() => navigate(`/owner/tenants/${tenant.id}`)}
                                        >
                                            {tenant.logo ? (
                                                <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                tenant.name.charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 cursor-pointer" onClick={() => navigate(`/owner/tenants/${tenant.id}`)}>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tenant.name}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{tenant.subdomain}.growyourneed.com</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(tenant.status)}`}>
                                                    {tenant.status}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded font-semibold ${getPlanColor(tenant.plan)}`}>
                                                    {tenant.plan}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex gap-8 text-center">
                                            <div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.max_students}</p>
                                                <p className="text-xs text-gray-500">Max Students</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.max_teachers}</p>
                                                <p className="text-xs text-gray-500">Max Teachers</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.max_storage_gb}GB</p>
                                                <p className="text-xs text-gray-500">Storage</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button name="view-tenant" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/owner/tenants/${tenant.id}`); }}>
                                                View
                                            </Button>
                                            <Button name="tenant-options" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                                                <Icon name="EllipsisVerticalIcon" className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}

                    {tenants.length === 0 && (
                        <Card className="p-12 text-center">
                            <Icon name="BuildingOfficeIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Tenants Found</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {filter === 'all' ? 'Get started by adding your first tenant' : `No ${filter} tenants`}
                            </p>
                            {filter === 'all' && (
                                <Button name="add-first-tenant" variant="primary" onClick={() => navigate('/owner/tenants/new')}>
                                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                                    Add First Tenant
                                </Button>
                            )}
                        </Card>
                    )}
                </div>
            )}

            {/* Bulk Operations Modal */}
            {showBulkOperations && selectedTenants.length > 0 && (
                <BulkTenantOperations
                    selectedTenants={tenants
                        .filter(t => selectedTenants.includes(t.id))
                        .map(t => ({ id: t.id, name: t.name, status: t.status }))}
                    onOperationComplete={handleBulkOperationComplete}
                    onClose={() => setShowBulkOperations(false)}
                />
            )}
        </div>
    );
};
