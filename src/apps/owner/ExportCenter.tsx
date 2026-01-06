import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import {
    Download,
    FileText,
    FileSpreadsheet,
    File,
    Trash2,
    RefreshCw,
    CheckCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    Users,
    Heart,
    Target,
    Database
} from 'lucide-react';
import env from '../../config/environment';
import { useToast } from '../../hooks/useToast';

const exportRequestSchema = z.object({
    templateId: z.string().min(1, 'Template ID required'),
    endpoint: z.string().min(1, 'Endpoint required'),
    months: z.number().min(1).max(36, 'Months must be between 1-36')
});

interface ExportFile {
    filename: string;
    type: string;
    size: number;
    createdAt: string;
    url: string;
}

interface ExportTemplate {
    id: string;
    name: string;
    description: string;
    format: 'CSV' | 'Excel' | 'PDF' | 'JSON';
    icon: any;
    endpoint: string;
    color: string;
    bgColor: string;
}

const ExportCenter: React.FC = () => {
    const [exportHistory, setExportHistory] = useState<ExportFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    const paymentServerUrl = env.get('paymentServerUrl');
    const apiKey = env.get('serviceApiKey');

    const exportTemplates: ExportTemplate[] = [
        {
            id: 'subscriptions-csv',
            name: 'Subscriptions (CSV)',
            description: 'All subscription data with customer details',
            format: 'CSV',
            icon: FileText,
            endpoint: '/api/export-center/subscriptions-csv',
            color: 'text-blue-500',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30'
        },
        {
            id: 'revenue-excel',
            name: 'Revenue Analysis (Excel)',
            description: 'Monthly revenue, MRR, ARR with growth metrics',
            format: 'Excel',
            icon: TrendingUp,
            endpoint: '/api/export-center/revenue-excel',
            color: 'text-green-500',
            bgColor: 'bg-green-100 dark:bg-green-900/30'
        },
        {
            id: 'customer-health-excel',
            name: 'Customer Health (Excel)',
            description: 'Health scores, engagement, and usage metrics',
            format: 'Excel',
            icon: Heart,
            endpoint: '/api/export-center/customer-health-excel',
            color: 'text-red-500',
            bgColor: 'bg-red-100 dark:bg-red-900/30'
        },
        {
            id: 'churn-pdf',
            name: 'Churn Analysis (PDF)',
            description: 'Comprehensive churn report with recommendations',
            format: 'PDF',
            icon: Target,
            endpoint: '/api/export-center/churn-pdf',
            color: 'text-orange-500',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30'
        },
        {
            id: 'trial-json',
            name: 'Trial Conversions (JSON)',
            description: 'Trial data and conversion metrics',
            format: 'JSON',
            icon: File,
            endpoint: '/api/export-center/trial-json',
            color: 'text-purple-500',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30'
        },
        {
            id: 'all-data',
            name: 'Complete Export (Excel)',
            description: 'All subscriptions and customer data',
            format: 'Excel',
            icon: Database,
            endpoint: '/api/export-center/all-data',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
        }
    ];

    const fetchExportHistory = async () => {
        try {
            const response = await fetch(`${paymentServerUrl}/api/export-center/history`, {
                headers: {
                    'x-api-key': typeof apiKey === 'string' ? apiKey : 'demo-key',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch export history');
            const data = await response.json();
            setExportHistory(data);
        } catch (error) {
            console.error('Error fetching export history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchExportHistory();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchExportHistory();
    };

    const handleExport = async (template: ExportTemplate) => {
        const validationResult = exportRequestSchema.safeParse({
            templateId: template.id,
            endpoint: template.endpoint,
            months: 12
        });
        
        if (!validationResult.success) {
            showToast(validationResult.error.issues[0].message, 'error');
            return;
        }
        
        setExporting(template.id);
        try {
            const response = await fetch(`${paymentServerUrl}${validationResult.data.endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': typeof apiKey === 'string' ? apiKey : 'demo-key',
                },
                body: JSON.stringify({ months: validationResult.data.months }),
            });

            if (!response.ok) throw new Error('Export failed');
            
            const result = await response.json();
            showToast('Export completed successfully', 'success');
            
            // Refresh history to show new export
            await fetchExportHistory();
            
            // Show success message
            alert(`Export completed! File: ${result.filename}`);
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Export failed. Please try again.');
        } finally {
            setExporting(null);
        }
    };

    const handleDownload = async (file: ExportFile) => {
        try {
            const response = await fetch(`${paymentServerUrl}${file.url}`, {
                headers: {
                    'x-api-key': typeof apiKey === 'string' ? apiKey : 'demo-key',
                },
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Download failed. Please try again.');
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Delete export file: ${filename}?`)) return;
        
        setDeleteLoading(filename);
        try {
            const response = await fetch(`${paymentServerUrl}/api/export-center/delete/${filename}`, {
                method: 'DELETE',
                headers: {
                    'x-api-key': typeof apiKey === 'string' ? apiKey : 'demo-key',
                },
            });

            if (!response.ok) throw new Error('Delete failed');
            
            await fetchExportHistory();
            alert('Export file deleted successfully');
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Delete failed. Please try again.');
        } finally {
            setDeleteLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'CSV':
                return FileText;
            case 'XLSX':
                return FileSpreadsheet;
            case 'PDF':
                return FileText;
            case 'JSON':
                return File;
            default:
                return File;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-gyn-primary" />
                    <p className="text-gray-600 dark:text-gray-400">Loading export center...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <Download className="w-8 h-8 text-gyn-primary" />
                        Export Center
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                        Export data in multiple formats: CSV, Excel, PDF, and JSON
                    </p>
                </div>
                <button
                    name="refresh-export-history"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-gyn-primary text-white rounded-lg hover:bg-gyn-primary-dark transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Export Templates */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Quick Export Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exportTemplates.map((template, index) => {
                        const Icon = template.icon;
                        return (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${template.bgColor}`}>
                                        <Icon className={`w-6 h-6 ${template.color}`} />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${template.bgColor} ${template.color}`}>
                                        {template.format}
                                    </span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                                    {template.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {template.description}
                                </p>
                                <button
                                    name={`export-${template.id}`}
                                    onClick={() => handleExport(template)}
                                    disabled={exporting === template.id}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gyn-primary text-white rounded-lg hover:bg-gyn-primary-dark transition disabled:opacity-50"
                                >
                                    {exporting === template.id ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Exporting...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            Export Now
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Export History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            Export History
                        </h3>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {exportHistory.length} exports
                        </span>
                    </div>
                </div>

                {exportHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        File
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Size
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {exportHistory.map((file) => {
                                    const FileIcon = getFileIcon(file.type);
                                    return (
                                        <tr key={file.filename} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <FileIcon className="w-5 h-5 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {file.filename}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                    {file.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {file.size} KB
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {formatDate(file.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        name="download-export-file"
                                                        onClick={() => handleDownload(file)}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                        title="Download"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        name="delete-export-file"
                                                        onClick={() => handleDelete(file.filename)}
                                                        disabled={deleteLoading === file.filename}
                                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        {deleteLoading === file.filename ? (
                                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                            No exports yet
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                            Use the templates above to create your first export
                        </p>
                    </div>
                )}
            </motion.div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
                >
                    <CheckCircle className="w-8 h-8 mb-3 opacity-90" />
                    <h4 className="text-lg font-bold mb-2">Automated Exports</h4>
                    <p className="text-sm opacity-90">
                        Schedule recurring exports to run automatically
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
                >
                    <Clock className="w-8 h-8 mb-3 opacity-90" />
                    <h4 className="text-lg font-bold mb-2">Real-Time Data</h4>
                    <p className="text-sm opacity-90">
                        All exports use live data from Stripe
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
                >
                    <AlertCircle className="w-8 h-8 mb-3 opacity-90" />
                    <h4 className="text-lg font-bold mb-2">Secure & Private</h4>
                    <p className="text-sm opacity-90">
                        Files are encrypted and auto-deleted after 7 days
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default ExportCenter;
