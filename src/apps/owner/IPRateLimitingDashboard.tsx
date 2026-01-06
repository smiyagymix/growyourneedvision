import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Shield, Ban, CheckCircle, AlertTriangle, Plus, X, Search } from 'lucide-react';
import { ipRateLimitingService, IPRateLimit, IPViolation, IPRateLimitStats } from '../../services/ipRateLimitingService';
import { useToast } from '../../hooks/useToast';

const rateLimitUpdateSchema = z.object({
    tenantId: z.string().min(1, 'Tenant ID required'),
    requestsPerHour: z.number().min(1).max(10000, 'Requests per hour must be between 1-10000'),
    requestsPerDay: z.number().min(1).max(100000, 'Requests per day must be between 1-100000')
});

const ipAddressSchema = z.string().regex(
    /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/,
    'Invalid IP address format'
);

export const IPRateLimitingDashboard: React.FC = () => {
    const [rateLimits, setRateLimits] = useState<IPRateLimit[]>([]);
    const [stats, setStats] = useState<IPRateLimitStats | null>(null);
    const [violations, setViolations] = useState<IPViolation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState<IPRateLimit | null>(null);
    const [showAddIP, setShowAddIP] = useState(false);
    const [newIP, setNewIP] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [limitsData, statsData, violationsData] = await Promise.all([
                ipRateLimitingService.getAllRateLimits(),
                ipRateLimitingService.getRateLimitStats(),
                ipRateLimitingService.getRecentViolations(24)
            ]);
            setRateLimits(limitsData);
            setStats(statsData);
            setViolations(violationsData);
        } catch (error) {
            console.error('Error loading IP rate limiting data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWhitelistIP = async () => {
        if (!selectedTenant || !newIP) return;
        
        const success = await ipRateLimitingService.whitelistIP(selectedTenant.tenantId, newIP);
        if (success) {
            setNewIP('');
            setShowAddIP(false);
            await loadData();
        }
    };

    const handleRemoveWhitelistIP = async (tenantId: string, ip: string) => {
        const success = await ipRateLimitingService.removeWhitelistIP(tenantId, ip);
        if (success) await loadData();
    };

    const handleBanIP = async (tenantId: string, ip: string) => {
        const reason = prompt('Enter ban reason:');
        if (!reason) return;
        
        const success = await ipRateLimitingService.banIP(tenantId, ip, reason);
        if (success) await loadData();
    };

    const handleUnbanIP = async (tenantId: string, ip: string) => {
        const success = await ipRateLimitingService.unbanIP(tenantId, ip);
        if (success) await loadData();
    };

    const handleToggleEnabled = async (tenantId: string, enabled: boolean) => {
        const success = await ipRateLimitingService.toggleRateLimit(tenantId, enabled);
        if (success) await loadData();
    };

    const handleUpdateLimits = async (tenantId: string, tenantName: string) => {
        const { showToast } = useToast();
        const reqPerHour = prompt('Requests per hour:', '100');
        const reqPerDay = prompt('Requests per day:', '1000');
        
        if (!reqPerHour || !reqPerDay) return;
        
        const validationResult = rateLimitUpdateSchema.safeParse({
            tenantId,
            requestsPerHour: parseInt(reqPerHour),
            requestsPerDay: parseInt(reqPerDay)
        });
        
        if (!validationResult.success) {
            showToast(validationResult.error.issues[0].message, 'error');
            return;
        }
        
        try {
            await ipRateLimitingService.setTenantRateLimit(
                validationResult.data.tenantId,
                tenantName,
                parseInt(reqPerHour),
                parseInt(reqPerDay)
            );
            await loadData();
        } catch (error) {
            alert('Failed to update rate limits');
        }
    };

    const filteredLimits = rateLimits.filter(limit =>
        limit.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        limit.tenantId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">IP Rate Limiting</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage per-tenant rate limits, IP whitelist/blacklist, and violation tracking
                </p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests (24h)</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.totalRequests.toLocaleString()}
                                </p>
                            </div>
                            <Shield className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Blocked Requests</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {stats.blockedRequests}
                                </p>
                            </div>
                            <Ban className="w-8 h-8 text-red-600" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Violations</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">
                                    {stats.activeViolations}
                                </p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Banned IPs</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.bannedIPs}
                                </p>
                            </div>
                            <Ban className="w-8 h-8 text-gray-600" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Whitelisted IPs</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {stats.whitelistedIPs}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tenants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Tenant Rate Limits */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Tenant Rate Limits
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Tenant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Limits
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Violations
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Whitelist
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Blacklist
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredLimits.map((limit) => (
                                <tr key={limit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {limit.tenantName}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {limit.tenantId}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            {limit.requestsPerHour}/hr
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {limit.requestsPerDay}/day
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-medium ${
                                            limit.currentViolations >= limit.violationThreshold
                                                ? 'text-red-600'
                                                : limit.currentViolations > 0
                                                ? 'text-yellow-600'
                                                : 'text-gray-600'
                                        }`}>
                                            {limit.currentViolations}/{limit.violationThreshold}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {limit.ipWhitelist.length === 0 ? (
                                                <span className="text-xs text-gray-400">None</span>
                                            ) : (
                                                limit.ipWhitelist.slice(0, 2).map(ip => (
                                                    <span key={ip} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                                        {ip}
                                                    </span>
                                                ))
                                            )}
                                            {limit.ipWhitelist.length > 2 && (
                                                <span className="text-xs text-gray-500">
                                                    +{limit.ipWhitelist.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {limit.ipBlacklist.length === 0 ? (
                                                <span className="text-xs text-gray-400">None</span>
                                            ) : (
                                                limit.ipBlacklist.slice(0, 2).map(ip => (
                                                    <span key={ip} className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                                                        {ip}
                                                    </span>
                                                ))
                                            )}
                                            {limit.ipBlacklist.length > 2 && (
                                                <span className="text-xs text-gray-500">
                                                    +{limit.ipBlacklist.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleEnabled(limit.tenantId, !limit.enabled)}
                                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                limit.enabled
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {limit.enabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedTenant(limit)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                                        >
                                            Manage
                                        </button>
                                        <button
                                            onClick={() => handleUpdateLimits(limit.tenantId, limit.tenantName)}
                                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Offenders */}
            {stats && stats.topOffenders.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Top Offenders (Last 24h)
                    </h2>
                    <div className="space-y-2">
                        {stats.topOffenders.map((offender, idx) => (
                            <div key={offender.ip} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                                        #{idx + 1}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {offender.ip}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-red-600 font-medium">
                                        {offender.violations} violations
                                    </span>
                                    <button
                                        onClick={() => {
                                            const tenantId = prompt('Enter tenant ID to ban this IP:');
                                            if (tenantId) handleBanIP(tenantId, offender.ip);
                                        }}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Ban
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Manage IP Modal */}
            {selectedTenant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Manage IPs - {selectedTenant.tenantName}
                            </h3>
                            <button
                                onClick={() => setSelectedTenant(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Whitelist */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    Whitelist ({selectedTenant.ipWhitelist.length})
                                </h4>
                                <button
                                    onClick={() => setShowAddIP(!showAddIP)}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add IP
                                </button>
                            </div>

                            {showAddIP && (
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        placeholder="192.168.1.1"
                                        value={newIP}
                                        onChange={(e) => setNewIP(e.target.value)}
                                        className="flex-1 px-3 py-2 border rounded text-sm"
                                    />
                                    <button
                                        onClick={handleWhitelistIP}
                                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2">
                                {selectedTenant.ipWhitelist.map(ip => (
                                    <div key={ip} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                        <span className="text-sm font-mono">{ip}</span>
                                        <button
                                            onClick={() => handleRemoveWhitelistIP(selectedTenant.tenantId, ip)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                {selectedTenant.ipWhitelist.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No whitelisted IPs</p>
                                )}
                            </div>
                        </div>

                        {/* Blacklist */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Blacklist ({selectedTenant.ipBlacklist.length})
                            </h4>
                            <div className="space-y-2">
                                {selectedTenant.ipBlacklist.map(ip => (
                                    <div key={ip} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                        <span className="text-sm font-mono">{ip}</span>
                                        <button
                                            onClick={() => handleUnbanIP(selectedTenant.tenantId, ip)}
                                            className="text-green-600 hover:text-green-800 text-sm"
                                        >
                                            Unban
                                        </button>
                                    </div>
                                ))}
                                {selectedTenant.ipBlacklist.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No banned IPs</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IPRateLimitingDashboard;
