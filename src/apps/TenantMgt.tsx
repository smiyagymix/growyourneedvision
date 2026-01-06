import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Icon, EmptyState } from '../components/shared/ui/CommonUI';
import { DropdownMenu } from '../components/shared/ui/DropdownMenu';
import { tenantService, Tenant } from '../services/tenantService';
import { TenantOnboardingFlow } from './owner/TenantOnboardingFlow';
import { SchoolDetail } from './school/SchoolDetail';
import { PlatformBilling } from './school/PlatformBilling';

// UI Components
import { Heading1, Text, Caption } from '../components/shared/ui/Typography';
import { Button } from '../components/shared/ui/Button';
import { GlassCard } from '../components/shared/ui/GlassCard';
import { SearchInput } from '../components/shared/ui/SearchInput';
import { Select } from '../components/shared/ui/Select';
import { Table, Thead, Tr, Th, Td } from '../components/shared/ui/Table';
import { Badge } from '../components/shared/ui/Badge';
import { Avatar } from '../components/shared/ui/Avatar';
import { IconButton } from '../components/shared/ui/IconButton';
import { Pagination } from '../components/shared/ui/Pagination';
import { useToggle } from '../hooks/useToggle';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import { DatePicker } from '../components/shared/ui/DatePicker';
import { isMockEnv } from '../utils/mockData';

interface TenantMgtProps {
    activeTab: string;
    activeSubNav: string;
}

const TenantMgt: React.FC<TenantMgtProps> = ({ activeTab, activeSubNav }) => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(false);
    const [isWizardOpen, toggleWizard] = useToggle(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
    const [showDebugConsole, setShowDebugConsole] = useState(false);
    const [environmentMode] = useState(isMockEnv() ? 'development' : 'production');

    // Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [sortBy, setSortBy] = useState<'name' | 'created' | 'users' | 'status'>('created');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    const handleCreateComplete = (newTenant: Tenant) => {
        setTenants([newTenant, ...tenants]);
    };

    const handleToggleSelect = (id: string) => {
        setSelectedTenantIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedTenantIds.length === filteredTenants.length) {
            setSelectedTenantIds([]);
        } else {
            setSelectedTenantIds(filteredTenants.map(t => t.id));
        }
    };

    const handleBulkAction = async (action: 'suspend' | 'activate' | 'delete') => {
        const validationResult = bulkTenantActionSchema.safeParse({ 
            tenantIds: selectedTenantIds, 
            action 
        });
        
        if (!validationResult.success) {
            showToast(validationResult.error.issues[0].message, 'error');
            return;
        }

        const confirmMessage = `Are you sure you want to ${action} ${selectedTenantIds.length} tenant(s)?`;
        if (!window.confirm(confirmMessage)) return;

        try {
            if (action === 'delete') {
                // Delete tenants via service
                await Promise.all(validationResult.data.tenantIds.map(id => 
                    pb.collection('tenants').delete(id)
                ));
                setTenants(tenants.filter(t => !selectedTenantIds.includes(t.id)));
                showToast(`Successfully deleted ${validationResult.data.tenantIds.length} tenant(s)`, 'success');
            } else {
                // Update tenant status
                const newStatus = action === 'suspend' ? 'suspended' : 'active';
                await Promise.all(validationResult.data.tenantIds.map(id => 
                    pb.collection('tenants').update(id, { status: newStatus })
                ));
                setTenants(tenants.map(t =>
                    selectedTenantIds.includes(t.id) ? { ...t, status: newStatus as Tenant['status'] } : t
                ));
                showToast(`Successfully ${action}ed ${selectedTenantIds.length} tenant(s)`, 'success');
            }
            setSelectedTenantIds([]);
        } catch (error) {
            console.error(`Bulk ${action} failed:`, error);
            showToast(`Failed to ${action} tenants`, 'error');
        }

        setSelectedTenantIds([]);
        alert(`Successfully ${action}ed ${selectedTenantIds.length} tenant(s)`);
    };

    const handleUpdateStatus = async (id: string, status: Tenant['status']) => {
        if (!window.confirm(`Are you sure you want to change status to ${status}?`)) return;

        const updated = await tenantService.updateTenantStatus(id, status);
        if (updated) {
            setTenants(tenants.map(t => t.id === id ? updated : t));
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;

        const success = await tenantService.deleteTenant(id);
        if (success) {
            setTenants(tenants.filter(t => t.id !== id));
            if (selectedTenantId === id) setSelectedTenantId(null);
        }
    };

    useEffect(() => {
        if (activeTab === 'Platform Billing') return;

        const fetchTenants = async () => {
            setLoading(true);
            try {
                const response = await tenantService.getTenants();
                setTenants(response.items);
            } catch (error) {
                console.error('Failed to fetch tenants:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTenants();
    }, [activeSubNav, activeTab]);

    // Filter & Sort Logic
    const filteredTenants = tenants.filter(tenant => {
        const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All Statuses' || tenant.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesType = typeFilter === 'All Types' || tenant.type.toLowerCase() === typeFilter.toLowerCase();

        let matchesDate = true;
        if (startDate || endDate) {
            const tenantDate = new Date(tenant.created);
            if (startDate) {
                matchesDate = matchesDate && tenantDate >= new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && tenantDate <= end;
            }
        }

        return matchesSearch && matchesStatus && matchesType && matchesDate;
    }).sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'created':
                comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
                break;
            case 'users':
                comparison = a.users_count - b.users_count;
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Statistics
    const stats = {
        total: tenants.length,
        active: tenants.filter(t => t.status === 'active').length,
        trial: tenants.filter(t => t.status === 'trial').length,
        suspended: tenants.filter(t => t.status === 'suspended').length,
        totalUsers: tenants.reduce((sum, t) => sum + t.users_count, 0),
        avgUsers: tenants.length > 0 ? Math.round(tenants.reduce((sum, t) => sum + t.users_count, 0) / tenants.length) : 0,
    };

    console.log(`TenantMgt: Tenants: ${tenants.length}, Filtered: ${filteredTenants.length}`); // Debug log


    // Pagination Logic
    const totalItems = filteredTenants.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedTenants = filteredTenants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    if (selectedTenantId) {
        return <SchoolDetail tenantId={selectedTenantId} onBack={() => setSelectedTenantId(null)} />;
    }

    if (activeTab === 'Platform Billing') {
        return (
            <div className="w-full max-w-7xl mx-auto space-y-2 animate-fadeIn">
                <div className="flex items-end justify-between relative">
                    <div className="z-10">
                        <Heading1 className="bg-[#002366] text-white px-2.5 py-1.5 rounded-lg inline-block shadow-lg text-sm md:text-base">Platform Billing</Heading1>
                        <Text variant="muted" className="mt-1 font-medium text-[8px]">Manage Subscriptions, Invoices, and Gateways</Text>
                    </div>
                </div>
                <PlatformBilling activeSubNav={activeSubNav} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-2 animate-fadeIn">
            {/* Header Section */}
            <div className="flex items-end justify-between relative">
                <div className="z-10 flex items-center gap-2">
                    <div>
                        <Heading1 className="bg-[#002366] text-white px-2.5 py-1.5 rounded-lg inline-block shadow-lg text-sm md:text-base">Tenant Management</Heading1>
                        <Text variant="muted" className="mt-1 font-medium text-[8px]">Manage Schools, Individuals, and Billing Plans</Text>
                    </div>
                    {/* Environment Badge */}
                    {isMockEnv() && (
                        <Badge variant="warning" className="animate-pulse">
                            <Icon name="BeakerIcon" className="w-2.5 h-2.5 mr-0.5" />
                            TEST MODE
                        </Badge>
                    )}
                </div>
                <div className="flex gap-1.5">
                    {/* Debug Console Toggle */}
                    {isMockEnv() && (
                        <IconButton
                            name="CodeBracketIcon"
                            onClick={() => setShowDebugConsole(!showDebugConsole)}
                            title="Toggle Debug Console"
                            className={showDebugConsole ? 'bg-blue-100' : ''}
                        />
                    )}
                    <IconButton
                        name="ArrowPathIcon"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const response = await tenantService.getTenants();
                                setTenants(response.items);
                            } catch (error) {
                                console.error('Failed to refresh tenants:', error);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        title="Refresh Data"
                        className={loading ? 'animate-spin' : ''}
                    />
                    <Button variant="primary" size="sm" leftIcon={<Icon name="PlusCircleIcon" className="w-3 h-3" />} onClick={toggleWizard} className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-lg text-[10px] px-2 py-1">
                        Add New {activeSubNav || 'Tenant'}
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2">
                <GlassCard className="p-2 hover:shadow-lg transition-shadow relative">
                    {isMockEnv() && stats.total > 0 && (
                        <div className="absolute top-0.5 right-0.5" title="Mock Data">
                            <Icon name="BeakerIcon" className="w-2.5 h-2.5 text-yellow-500" />
                        </div>
                    )}
                    <Caption className="text-[7px] text-gray-500">Total Tenants</Caption>
                    <div className="flex items-end justify-between mt-0.5">
                        <span className="text-lg font-bold text-gray-900">{stats.total}</span>
                        <Icon name="BuildingOfficeIcon" className="w-4 h-4 text-blue-500" />
                    </div>
                </GlassCard>
                <GlassCard className="p-2 hover:shadow-lg transition-shadow">
                    <Caption className="text-[7px] text-gray-500">Active</Caption>
                    <div className="flex items-end justify-between mt-0.5">
                        <span className="text-lg font-bold text-green-600">{stats.active}</span>
                        <Icon name="CheckCircleIcon" className="w-4 h-4 text-green-500" />
                    </div>
                </GlassCard>
                <GlassCard className="p-2 hover:shadow-lg transition-shadow">
                    <Caption className="text-[7px] text-gray-500">Trial</Caption>
                    <div className="flex items-end justify-between mt-0.5">
                        <span className="text-lg font-bold text-yellow-600">{stats.trial}</span>
                        <Icon name="ClockIcon" className="w-4 h-4 text-yellow-500" />
                    </div>
                </GlassCard>
                <GlassCard className="p-2 hover:shadow-lg transition-shadow">
                    <Caption className="text-[7px] text-gray-500">Suspended</Caption>
                    <div className="flex items-end justify-between mt-0.5">
                        <span className="text-lg font-bold text-red-600">{stats.suspended}</span>
                        <Icon name="PauseIcon" className="w-4 h-4 text-red-500" />
                    </div>
                </GlassCard>
                <GlassCard className="p-2 hover:shadow-lg transition-shadow">
                    <Caption className="text-[7px] text-gray-500">Total Users</Caption>
                    <div className="flex items-end justify-between mt-0.5">
                        <span className="text-lg font-bold text-purple-600">{stats.totalUsers}</span>
                        <Icon name="UserGroupIcon" className="w-4 h-4 text-purple-500" />
                    </div>
                </GlassCard>
                <GlassCard className="p-2 hover:shadow-lg transition-shadow">
                    <Caption className="text-[7px] text-gray-500">Avg Users</Caption>
                    <div className="flex items-end justify-between mt-0.5">
                        <span className="text-lg font-bold text-indigo-600">{stats.avgUsers}</span>
                        <Icon name="ChartBarIcon" className="w-4 h-4 text-indigo-500" />
                    </div>
                </GlassCard>
            </div>

            {/* Debug Console */}
            {showDebugConsole && isMockEnv() && (
                <GlassCard className="p-3 bg-gray-900 text-green-400 font-mono text-[8px] space-y-1">
                    <div className="flex items-center justify-between border-b border-green-400/30 pb-1 mb-2">
                        <span className="font-bold">🔧 Debug Console - Environment: {environmentMode.toUpperCase()}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDebugConsole(false)}
                            className="text-green-400 hover:text-green-300 text-[8px] px-1 py-0.5"
                        >
                            <Icon name="XMarkIcon" className="w-3 h-3" />
                        </Button>
                    </div>
                    <div>📊 Total Tenants: {tenants.length}</div>
                    <div>🔍 Filtered Results: {filteredTenants.length}</div>
                    <div>📄 Current Page: {currentPage} / {totalPages}</div>
                    <div>✅ Active: {stats.active} | 🔄 Trial: {stats.trial} | ⏸️ Suspended: {stats.suspended}</div>
                    <div>👥 Total Users: {stats.totalUsers} (Avg: {stats.avgUsers} per tenant)</div>
                    <div>🎯 Selected IDs: {selectedTenantIds.length > 0 ? selectedTenantIds.join(', ') : 'None'}</div>
                    <div>🔎 Search Query: "{searchQuery || 'None'}"</div>
                    <div>📋 Filters - Status: {statusFilter}, Type: {typeFilter}, Sort: {sortBy} ({sortOrder})</div>
                    {(startDate || endDate) && (
                        <div>📅 Date Range: {startDate || 'Any'} → {endDate || 'Any'}</div>
                    )}
                    <div className="pt-1 border-t border-green-400/30 mt-2">
                        <span className="text-yellow-400">⚡ API Mode: Mock Data (Development)</span>
                    </div>
                </GlassCard>
            )}

            {/* Main Glass Container */}
            <GlassCard className="min-h-[400px]">

                {/* Toolbar */}
                <div className="p-2 border-b border-white/50 flex flex-col md:flex-row items-center justify-between gap-1.5 bg-gradient-to-r from-white/40 to-transparent">
                    <div className="flex gap-1.5">
                        <div className="w-36">
                            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option>All Statuses</option>
                                <option>Active</option>
                                <option>Trial</option>
                                <option>Suspended</option>
                            </Select>
                        </div>
                        <div className="w-36">
                            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                <option>All Types</option>
                                <option>School</option>
                                <option>Individual</option>
                                <option>Enterprise</option>
                            </Select>
                        </div>
                        <div className="w-36">
                            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                                <option value="created">Created Date</option>
                                <option value="name">Name</option>
                                <option value="users">User Count</option>
                                <option value="status">Status</option>
                            </Select>
                        </div>
                        <IconButton
                            name={sortOrder === 'asc' ? 'ArrowUpIcon' : 'ArrowDownIcon'}
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="w-36">
                            <DatePicker
                                label="Start"
                                value={startDate}
                                onChange={setStartDate}
                                max={endDate || undefined}
                            />
                        </div>
                        <div className="w-36">
                            <DatePicker
                                label="End"
                                value={endDate}
                                onChange={setEndDate}
                                min={startDate || undefined}
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-64">
                        <SearchInput
                            placeholder="Search tenants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('All Statuses');
                            setTypeFilter('All Types');
                            setSortBy('created');
                            setSortOrder('desc');
                            setStartDate('');
                            setEndDate('');
                            setSelectedTenantIds([]);
                        }}
                        className="text-[10px] px-2 py-1"
                    >
                        <Icon name="XMarkIcon" className="w-2.5 h-2.5 mr-0.5" />
                        Reset
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAIModalOpen(true)}
                        className="flex items-center gap-1 text-purple-600 border-purple-200 hover:bg-purple-50 text-[10px] px-2 py-1"
                    >
                        <Icon name="Sparkles" className="w-2.5 h-2.5" />
                        AI Insights
                    </Button>

                    <DropdownMenu
                        trigger={
                            <Button variant="outline" size="sm" className="flex items-center gap-1 text-[10px] px-2 py-1">
                                <Icon name="ArrowDownTrayIcon" className="w-2.5 h-2.5" />
                                Export
                            </Button>
                        }
                        items={[
                            {
                                label: 'Export as CSV',
                                icon: 'DocumentTextIcon',
                                onClick: () => {
                                    const data = filteredTenants.map(t => ({
                                        ID: t.id,
                                        Name: t.name,
                                        Type: t.type,
                                        Status: t.status,
                                        Plan: t.subscription?.plan || 'N/A',
                                        Users: t.users_count,
                                        Created: new Date(t.created).toLocaleDateString(),
                                        Region: t.region
                                    }));
                                    exportToCSV(data, 'tenants_export');
                                }
                            },
                            {
                                label: 'Export as PDF',
                                icon: 'DocumentTextIcon',
                                onClick: () => {
                                    const columns = ['ID', 'Name', 'Type', 'Status', 'Plan', 'Users', 'Created', 'Region'];
                                    const rows = filteredTenants.map(t => [
                                        t.id,
                                        t.name,
                                        t.type,
                                        t.status,
                                        t.subscription?.plan || 'N/A',
                                        t.users_count,
                                        new Date(t.created).toLocaleDateString(),
                                        t.region
                                    ]);
                                    exportToPDF(columns, rows, 'tenants_report', 'Tenant List Report');
                                }
                            }
                        ]}
                    />
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedTenantIds.length > 0 && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium text-gray-900 dark:text-white">
                            {selectedTenantIds.length} tenant(s) selected
                        </span>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')} className="text-[10px] px-2 py-1">
                                <Icon name="CheckCircleIcon" className="w-2.5 h-2.5 mr-0.5" />
                                Activate
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleBulkAction('suspend')} className="text-[10px] px-2 py-1">
                                <Icon name="PauseIcon" className="w-2.5 h-2.5 mr-0.5" />
                                Suspend
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')} className="text-red-600 text-[10px] px-2 py-1">
                                <Icon name="TrashIcon" className="w-2.5 h-2.5 mr-0.5" />
                                Delete
                            </Button>
                        </div>
                    </div>
                )}


                {/* Glass Table */}
                <div className="flex-1 overflow-x-auto relative">
                    {loading && filteredTenants.length === 0 ? (
                        <EmptyState
                            title="No Tenants Found"
                            description="There are currently no tenants matching your criteria."
                            icon="UserGroupIcon"
                            actionLabel="Create Tenant"
                            onAction={toggleWizard}
                            className="h-full"
                        />
                    ) : filteredTenants.length === 0 ? (
                        <EmptyState
                            title="No Tenants Found"
                            description={`There are currently no ${(activeSubNav || 'tenants').toLowerCase()} matching your criteria.`}
                            icon="UserGroupIcon"
                            actionLabel="Create Tenant"
                            onAction={toggleWizard}
                            className="h-full"
                        />
                    ) : (
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedTenantIds.length === filteredTenants.length && filteredTenants.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </Th>
                                    <Th>Tenant Name</Th>
                                    <Th>Type</Th>
                                    <Th>Status</Th>
                                    <Th>Health</Th>
                                    <Th>Plan</Th>
                                    <Th>Users</Th>
                                    <Th className="text-right">Actions</Th>
                                </Tr>
                            </Thead>
                            <tbody>
                                {paginatedTenants.map((tenant) => {
                                    const healthScore = Math.min(100, Math.round(
                                        (tenant.status === 'active' ? 40 : tenant.status === 'trial' ? 30 : 10) +
                                        (tenant.users_count * 2) +
                                        (tenant.subscription?.plan === 'Premium' ? 20 : tenant.subscription?.plan === 'Professional' ? 15 : 10)
                                    ));
                                    const isSelected = selectedTenantIds.includes(tenant.id);
                                    
                                    return (
                                    <Tr key={tenant.id} className={`hover:bg-white/50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                                        <Td onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleToggleSelect(tenant.id)}
                                                className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </Td>
                                        <Td onClick={() => setSelectedTenantId(tenant.id)} className="cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    size="sm"
                                                    initials={tenant.name.substring(0, 2).toUpperCase()}
                                                    status={tenant.status === 'active' ? 'online' : 'busy'}
                                                />
                                                <div>
                                                    <div className="font-bold text-gray-800 text-[10px] group-hover:text-gyn-blue-dark transition-colors">
                                                        {tenant.name}
                                                    </div>
                                                    <Caption className="text-[7px]">ID: #{tenant.id.substring(0, 8)}</Caption>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <span className="text-[9px] font-medium text-gray-600 bg-gray-100/50 px-2 py-0.5 rounded-md border border-gray-200/50">
                                                {tenant.type}
                                            </span>
                                        </Td>
                                        <Td onClick={() => setSelectedTenantId(tenant.id)} className="cursor-pointer">
                                            <Badge variant={tenant.status === 'suspended' ? 'danger' : tenant.status === 'trial' ? 'warning' : 'success'}>
                                                {tenant.status}
                                            </Badge>
                                        </Td>
                                        <Td onClick={() => setSelectedTenantId(tenant.id)} className="cursor-pointer">
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-16">
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all ${
                                                            healthScore >= 80 ? 'bg-green-500' :
                                                            healthScore >= 60 ? 'bg-yellow-500' :
                                                            healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${healthScore}%` }}
                                                    />
                                                </div>
                                                <span className="text-[8px] font-bold text-gray-600">{healthScore}%</span>
                                            </div>
                                        </Td>
                                        <Td onClick={() => setSelectedTenantId(tenant.id)} className="cursor-pointer">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gyn-blue-dark">{tenant.subscription_plan}</span>
                                                <Caption className="text-[7px]">Renews Monthly</Caption>
                                            </div>
                                        </Td>
                                        <Td onClick={() => setSelectedTenantId(tenant.id)} className="cursor-pointer">
                                            <div className="flex -space-x-1">
                                                {[1, 2, 3].map(u => (
                                                    <Avatar key={u} size="sm" initials={`U${u}`} />
                                                ))}
                                                <div className="w-6 h-6 rounded-full bg-gyn-blue-light border border-white flex items-center justify-center text-[7px] font-bold text-gyn-blue-dark">+{tenant.users_count}</div>
                                            </div>
                                        </Td>
                                        <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu
                                                align="right"
                                                trigger={<IconButton name="EllipsisHorizontalIcon" />}
                                                items={[
                                                    {
                                                        label: 'View Details',
                                                        icon: 'Eye',
                                                        onClick: () => setSelectedTenantId(tenant.id)
                                                    },
                                                    {
                                                        label: 'View Billing',
                                                        icon: 'CreditCardIcon',
                                                        onClick: () => {
                                                            setSelectedTenantId(tenant.id);
                                                            // Navigate to billing tab
                                                        }
                                                    },
                                                    {
                                                        label: 'Manage Users',
                                                        icon: 'UserGroupIcon',
                                                        onClick: () => {
                                                            setSelectedTenantId(tenant.id);
                                                            // Navigate to users tab
                                                        }
                                                    },
                                                    {
                                                        label: 'Upgrade Plan',
                                                        icon: 'ArrowUpIcon',
                                                        onClick: () => alert(`Upgrade plan for ${tenant.name}`)
                                                    },
                                                    {
                                                        label: 'Send Message',
                                                        icon: 'EnvelopeIcon',
                                                        onClick: () => alert(`Send message to ${tenant.name}`)
                                                    },
                                                    tenant.status === 'active' ? {
                                                        label: 'Suspend Tenant',
                                                        icon: 'Pause',
                                                        onClick: () => handleUpdateStatus(tenant.id, 'suspended'),
                                                        danger: true
                                                    } : {
                                                        label: 'Activate Tenant',
                                                        icon: 'Play',
                                                        onClick: () => handleUpdateStatus(tenant.id, 'active')
                                                    },
                                                    {
                                                        label: 'Activity Logs',
                                                        icon: 'ClipboardDocumentListIcon',
                                                        onClick: () => alert(`View activity logs for ${tenant.name}`)
                                                    },
                                                    {
                                                        label: 'Export Data',
                                                        icon: 'ArrowDownTrayIcon',
                                                        onClick: () => {
                                                            const data = [{
                                                                ID: tenant.id,
                                                                Name: tenant.name,
                                                                Type: tenant.type,
                                                                Status: tenant.status,
                                                                Users: tenant.users_count
                                                            }];
                                                            exportToCSV(data, `tenant_${tenant.id}`);
                                                        }
                                                    },
                                                    {
                                                        label: 'Delete Tenant',
                                                        icon: 'Trash',
                                                        onClick: () => handleDelete(tenant.id),
                                                        danger: true
                                                    }
                                                ]}
                                            />
                                        </Td>
                                    </Tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </div>

                {/* Pagination */}
                {filteredTenants.length > 0 && (
                    <div className="space-y-1">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                        {isMockEnv() && (
                            <div className="text-center">
                                <Caption className="text-[7px] text-yellow-600 dark:text-yellow-500">
                                    <Icon name="BeakerIcon" className="w-2 h-2 inline mr-0.5" />
                                    Displaying mock data in test environment
                                </Caption>
                            </div>
                        )}
                    </div>
                )}
            </GlassCard>

            {/* Onboarding Wizard */}
            <TenantOnboardingFlow
                isOpen={isWizardOpen}
                onClose={toggleWizard}
                onComplete={(tenant) => {
                    handleCreateComplete(tenant);
                    toggleWizard();
                }}
            />

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={(content) => {
                    console.log("Tenant Insights:", content);
                    setIsAIModalOpen(false);
                    alert("Insights Generated! (Check console)");
                }}
                title="AI Tenant Analysis"
                promptTemplate={`Analyze the current tenant list status.
        
        Environment: ${environmentMode}
        Data Source: ${isMockEnv() ? 'Mock/Test Data' : 'Production Database'}
        Total Tenants: ${tenants.length}
        Active: ${tenants.filter(t => t.status === 'active').length}
        Trial: ${tenants.filter(t => t.status === 'trial').length}
        Suspended: ${tenants.filter(t => t.status === 'suspended').length}
        Total Users: ${stats.totalUsers}
        Average Users per Tenant: ${stats.avgUsers}
        
        Provide:
        - Overall Health Score (0-100)
        - Retention Risk Assessment
        - Growth Opportunities
        - Recommended Actions
        ${isMockEnv() ? '- Note: Analysis based on test data' : ''}`}
                contextData={{ 
                    tenantCount: tenants.length, 
                    environment: environmentMode,
                    isMockData: isMockEnv(),
                    stats: stats 
                }}
            />
        </div>
    );
};

export default TenantMgt;
