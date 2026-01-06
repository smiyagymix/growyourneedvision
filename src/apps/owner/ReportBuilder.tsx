import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import {
  FileText,
  Download,
  Plus,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Save,
  Play,
  Trash2,
  Table,
  BarChart3
} from 'lucide-react';
import env from '../../config/environment';

interface ReportSpec {
  type: 'customers' | 'subscriptions' | 'invoices' | 'transactions';
  columns: string[];
  filters: Record<string, any>;
  dateRange: { start?: string; end?: string };
  groupBy?: string;
  aggregations: Array<{ field: string; function: 'sum' | 'avg' | 'min' | 'max' }>;
  sort: { field: string; order: 'asc' | 'desc' };
  limit: number;
}

interface ReportData {
  type: string;
  columns: string[];
  data: any[];
  summary: Record<string, any>;
  totalRecords: number;
  generatedAt: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  spec: ReportSpec;
}

const REPORT_TYPES = [
  { value: 'customers', label: 'Customers', icon: Users, color: 'blue' },
  { value: 'subscriptions', label: 'Subscriptions', icon: TrendingUp, color: 'green' },
  { value: 'invoices', label: 'Invoices', icon: DollarSign, color: 'purple' },
  { value: 'transactions', label: 'Transactions', icon: BarChart3, color: 'orange' }
];

const COLUMN_OPTIONS: Record<string, string[]> = {
  customers: ['id', 'email', 'name', 'created', 'balance', 'currency', 'delinquent'],
  subscriptions: ['id', 'customer', 'status', 'plan', 'amount', 'currency', 'interval', 'created', 'currentPeriodStart', 'currentPeriodEnd'],
  invoices: ['id', 'customer', 'number', 'status', 'total', 'amountPaid', 'amountDue', 'currency', 'created', 'paid'],
  transactions: ['id', 'customer', 'amount', 'amountRefunded', 'currency', 'status', 'paid', 'refunded', 'created']
};

const ReportBuilder: React.FC = () => {
  const [reportSpec, setReportSpec] = useState<ReportSpec>({
    type: 'subscriptions',
    columns: ['customer', 'status', 'plan', 'amount'],
    filters: {},
    dateRange: {},
    aggregations: [],
    sort: { field: 'created', order: 'desc' },
    limit: 1000
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const paymentServerUrl = env.get('paymentServerUrl');
  const serviceApiKey = env.get('serviceApiKey');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    if (!serviceApiKey) {
      console.warn('Service API key not configured');
      return;
    }
    try {
      const response = await fetch(`${paymentServerUrl}/api/reports/templates`, {
        headers: { 'x-api-key': serviceApiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const buildReport = async () => {
    try {
      setLoading(true);
      const serviceApiKey = env.get('serviceApiKey');
      const response = await fetch(`${paymentServerUrl}/api/reports/build`, {
        method: 'POST',
        headers: {
          'x-api-key': serviceApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportSpec)
      });
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error building report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    if (!reportData) return;

    try {
      const serviceApiKey = env.get('serviceApiKey');
      const endpoint = format === 'pdf' ? '/api/reports/export/pdf' : '/api/reports/export/excel';
      const response = await fetch(`${paymentServerUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'x-api-key': serviceApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const saveTemplate = async () => {
    try {
      const serviceApiKey = env.get('serviceApiKey');
      const response = await fetch(`${paymentServerUrl}/api/reports/templates`, {
        method: 'POST',
        headers: {
          'x-api-key': serviceApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: templateName,
          spec: reportSpec,
          description: templateDescription
        })
      });
      
      if (response.ok) {
        await fetchTemplates();
        setShowSaveModal(false);
        setTemplateName('');
        setTemplateDescription('');
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const loadTemplate = (template: ReportTemplate) => {
    setReportSpec(template.spec);
  };

  const addColumn = (column: string) => {
    if (!reportSpec.columns.includes(column)) {
      setReportSpec({ ...reportSpec, columns: [...reportSpec.columns, column] });
    }
  };

  const removeColumn = (column: string) => {
    setReportSpec({
      ...reportSpec,
      columns: reportSpec.columns.filter(c => c !== column)
    });
  };

  const addAggregation = () => {
    setReportSpec({
      ...reportSpec,
      aggregations: [...reportSpec.aggregations, { field: '', function: 'sum' }]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-10 h-10 text-blue-500" />
            Custom Report Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create, customize, and export comprehensive business reports
          </p>
        </div>

        {reportData && (
          <div className="flex items-center gap-3">
            <button
              name="export-report-pdf"
              onClick={() => exportReport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              name="export-report-excel"
              onClick={() => exportReport('excel')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Report Type */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Report Type
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    name={`select-report-type-${type.value}`}
                    onClick={() => setReportSpec({
                      ...reportSpec,
                      type: type.value as any,
                      columns: COLUMN_OPTIONS[type.value].slice(0, 4)
                    })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      reportSpec.type === type.value
                        ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 text-${type.color}-500`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columns Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Columns
            </h3>
            <div className="space-y-2 mb-4">
              {reportSpec.columns.map((column) => (
                <div
                  key={column}
                  className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
                >
                  <span className="text-sm text-gray-900 dark:text-white">{column}</span>
                  <button
                    name={`remove-column-${column.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => removeColumn(column)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <select
              name="add-column-dropdown"
              onChange={(e) => {
                if (e.target.value) addColumn(e.target.value);
                e.target.value = '';
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Add column...</option>
              {COLUMN_OPTIONS[reportSpec.type].map((col) => (
                <option key={col} value={col} disabled={reportSpec.columns.includes(col)}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date Range
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Start Date
                </label>
                <input
                  name="report-start-date"
                  type="date"
                  value={reportSpec.dateRange.start || ''}
                  onChange={(e) => setReportSpec({
                    ...reportSpec,
                    dateRange: { ...reportSpec.dateRange, start: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  End Date
                </label>
                <input
                  name="report-end-date"
                  type="date"
                  value={reportSpec.dateRange.end || ''}
                  onChange={(e) => setReportSpec({
                    ...reportSpec,
                    dateRange: { ...reportSpec.dateRange, end: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Templates
            </h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  name={`load-template-${template.id}`}
                  onClick={() => loadTemplate(template)}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
            <button
              name="open-save-template-modal"
              onClick={() => setShowSaveModal(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              Save as Template
            </button>
          </div>

          {/* Actions */}
          <button
            name="build-report"
            onClick={buildReport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Building...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Build Report
              </>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {reportData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Table className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Records</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {reportData.totalRecords}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Columns</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {reportData.columns.length}
                  </div>
                </motion.div>
              </div>

              {/* Summary Stats */}
              {Object.keys(reportData.summary).length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Summary Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(reportData.summary).map(([key, value]) => {
                      if (key === 'totalRecords' || typeof value !== 'object') return null;
                      return (
                        <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
                            {key}
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Sum: </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {(value as any).sum?.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Avg: </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {(value as any).avg?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Data Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Report Data
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {reportData.columns.map((column) => (
                          <th
                            key={column}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {reportData.data.slice(0, 50).map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {reportData.columns.map((column) => (
                            <td
                              key={column}
                              className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap"
                            >
                              {typeof row[column] === 'object'
                                ? JSON.stringify(row[column])
                                : row[column]?.toString() || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {reportData.data.length > 50 && (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
                    Showing first 50 of {reportData.totalRecords} records. Export to see all data.
                  </div>
                )}
              </motion.div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Report Generated
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Configure your report settings and click "Build Report" to generate data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Save Report Template
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name
                </label>
                <input
                  name="template-name"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="My Custom Report"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe what this report shows..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  name="save-template"
                  onClick={saveTemplate}
                  disabled={!templateName}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Template
                </button>
                <button
                  name="cancel-save-template"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReportBuilder;
