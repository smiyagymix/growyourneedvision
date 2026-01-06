import React, { useEffect, useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { ownerService, AuditLog } from '../../services/ownerService';
import { Card, Icon, Button, Text as GynText } from '../../components/shared/ui/CommonUI';
import { TableSkeleton } from '../../components/shared/ui/DashboardSkeletons';

export const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

    useEffect(() => {
        loadLogs();
    }, [page, severityFilter]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            let filter = '';
            if (severityFilter !== 'all') {
                filter = `severity = "${severityFilter}"`;
            }
            const data = await ownerService.getAuditLogs(page, 20, filter);
            setLogs(data.items);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Failed to load logs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        window.print();
    };

    const formatDetails = (details: any) => {
        if (!details) return '-';
        if (typeof details === 'string') return details;
        try {
            return JSON.stringify(details, null, 2);
        } catch {
            return String(details);
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200';
            case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200';
        }
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.module?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    nav, button, .pagination-controls, .filter-bar { display: none !important; }
                    .audit-card { border: none !important; box-shadow: none !important; }
                    body { background: white !important; font-size: 10pt; }
                    table { width: 100% !important; border-collapse: collapse; }
                    th, td { border: 1px solid #eee !important; padding: 8px !important; }
                    .print-header { display: block !important; margin-bottom: 20px; text-align: center; }
                }
                .print-header { display: none; }
            `}} />

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">System Audit Logs</h2>
                    <GynText variant="muted">Comprehensive record of all administrative and system actions.</GynText>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExportPDF}>
                        <Icon name="DocumentArrowDownIcon" className="w-5 h-5 mr-2" />
                        Export to PDF
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="p-4 flex gap-4 items-center filter-bar bg-gray-50/50 dark:bg-gray-800/30 border-none">
                <div className="flex-1 relative">
                    <Icon name="MagnifyingGlassIcon" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search logs by action, user, or module..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                    />
                </div>
                <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as any)}
                    className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold"
                >
                    <option value="all">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
            </Card>

            <div className="print-header">
                <h1 style={{ fontSize: '24pt', fontWeight: 'bold' }}>System Audit Report</h1>
                <p>Generated on {new Date().toLocaleString()}</p>
                <hr style={{ margin: '20px 0' }} />
            </div>

            <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Module</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">IP Address</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8">
                                        <TableSkeleton rows={10} />
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No logs found matching your filters
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log: AuditLog) => (
                                    <tr key={log.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${log.severity === 'critical' ? 'bg-red-50/30' :
                                        log.severity === 'high' ? 'bg-orange-50/30' : ''
                                        }`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(log.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            <div className="text-[10px] opacity-60">
                                                {new Date(log.created).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2 items-center">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800`}>
                                                    {log.action}
                                                </span>
                                                {log.severity && (
                                                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${getSeverityBadge(log.severity)}`}>
                                                        {log.severity}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px]">
                                                    {(log.expand?.user?.name || log.user || 'S').charAt(0)}
                                                </div>
                                                {log.expand?.user?.name || log.user || 'System'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.module}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                                            {log.ip_address}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 max-w-xs">
                                            <code className="bg-gray-50 dark:bg-gray-800 p-1 rounded block truncate" title={formatDetails(log.details)}>
                                                {formatDetails(log.details)}
                                            </code>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                name="prev-page"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <Icon name="ChevronLeftIcon" className="w-4 h-4" />
                            </Button>
                            <Button
                                name="next-page"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <Icon name="ChevronRightIcon" className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
