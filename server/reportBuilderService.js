/**
 * Custom Report Builder Service
 * Flexible report generation with customizable columns, filters, and aggregations
 */

import Stripe from 'stripe';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class ReportBuilderService {
    /**
     * Build custom report based on user-defined specifications
     */
    async buildReport(spec) {
        try {
            const {
                type, // 'customers', 'subscriptions', 'invoices', 'transactions'
                columns = [], // Array of column names to include
                filters = {}, // Filter criteria
                dateRange = {}, // { start, end }
                groupBy = null, // Group by field
                aggregations = [], // Sum, avg, count fields
                sort = { field: 'created', order: 'desc' },
                limit = 1000
            } = spec;

            console.log(`📊 Building ${type} report...`);

            // Fetch data based on type
            let rawData = [];
            switch (type) {
                case 'customers':
                    rawData = await this.fetchCustomers(filters, dateRange, limit);
                    break;
                case 'subscriptions':
                    rawData = await this.fetchSubscriptions(filters, dateRange, limit);
                    break;
                case 'invoices':
                    rawData = await this.fetchInvoices(filters, dateRange, limit);
                    break;
                case 'transactions':
                    rawData = await this.fetchTransactions(filters, dateRange, limit);
                    break;
                default:
                    throw new Error(`Unknown report type: ${type}`);
            }

            // Apply custom filters
            let filteredData = this.applyFilters(rawData, filters);

            // Select columns
            let selectedData = this.selectColumns(filteredData, columns, type);

            // Apply grouping and aggregations
            if (groupBy) {
                selectedData = this.groupAndAggregate(selectedData, groupBy, aggregations);
            }

            // Sort data
            selectedData = this.sortData(selectedData, sort);

            // Calculate summary statistics
            const summary = this.calculateSummary(selectedData, aggregations);

            return {
                type,
                columns: columns.length > 0 ? columns : Object.keys(selectedData[0] || {}),
                data: selectedData,
                summary,
                totalRecords: selectedData.length,
                generatedAt: new Date().toISOString(),
                spec
            };
        } catch (error) {
            console.error('❌ Error building report:', error);
            throw error;
        }
    }

    /**
     * Fetch customers with filters
     */
    async fetchCustomers(filters, dateRange, limit) {
        const params = { limit };

        if (dateRange.start || dateRange.end) {
            params.created = {};
            if (dateRange.start) params.created.gte = Math.floor(new Date(dateRange.start).getTime() / 1000);
            if (dateRange.end) params.created.lte = Math.floor(new Date(dateRange.end).getTime() / 1000);
        }

        const customers = await stripe.customers.list(params);
        
        return customers.data.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name || 'N/A',
            created: new Date(c.created * 1000).toISOString(),
            balance: c.balance / 100,
            currency: c.currency,
            delinquent: c.delinquent,
            description: c.description || '',
            metadata: c.metadata
        }));
    }

    /**
     * Fetch subscriptions with filters
     */
    async fetchSubscriptions(filters, dateRange, limit) {
        const params = { limit };

        if (filters.status) {
            params.status = filters.status;
        }

        if (dateRange.start || dateRange.end) {
            params.created = {};
            if (dateRange.start) params.created.gte = Math.floor(new Date(dateRange.start).getTime() / 1000);
            if (dateRange.end) params.created.lte = Math.floor(new Date(dateRange.end).getTime() / 1000);
        }

        const subscriptions = await stripe.subscriptions.list(params);
        
        return subscriptions.data.map(s => ({
            id: s.id,
            customer: s.customer,
            status: s.status,
            plan: s.items.data[0]?.price?.nickname || s.items.data[0]?.price?.id,
            amount: s.items.data[0]?.price?.unit_amount / 100,
            currency: s.currency,
            interval: s.items.data[0]?.price?.recurring?.interval,
            created: new Date(s.created * 1000).toISOString(),
            currentPeriodStart: new Date(s.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(s.current_period_end * 1000).toISOString(),
            canceledAt: s.canceled_at ? new Date(s.canceled_at * 1000).toISOString() : null,
            trialEnd: s.trial_end ? new Date(s.trial_end * 1000).toISOString() : null
        }));
    }

    /**
     * Fetch invoices with filters
     */
    async fetchInvoices(filters, dateRange, limit) {
        const params = { limit };

        if (filters.status) {
            params.status = filters.status;
        }

        if (dateRange.start || dateRange.end) {
            params.created = {};
            if (dateRange.start) params.created.gte = Math.floor(new Date(dateRange.start).getTime() / 1000);
            if (dateRange.end) params.created.lte = Math.floor(new Date(dateRange.end).getTime() / 1000);
        }

        const invoices = await stripe.invoices.list(params);
        
        return invoices.data.map(i => ({
            id: i.id,
            customer: i.customer,
            number: i.number,
            status: i.status,
            total: i.total / 100,
            amountPaid: i.amount_paid / 100,
            amountDue: i.amount_due / 100,
            currency: i.currency,
            created: new Date(i.created * 1000).toISOString(),
            dueDate: i.due_date ? new Date(i.due_date * 1000).toISOString() : null,
            paid: i.paid,
            attempted: i.attempted,
            hostedInvoiceUrl: i.hosted_invoice_url
        }));
    }

    /**
     * Fetch transactions (charges) with filters
     */
    async fetchTransactions(filters, dateRange, limit) {
        const params = { limit };

        if (dateRange.start || dateRange.end) {
            params.created = {};
            if (dateRange.start) params.created.gte = Math.floor(new Date(dateRange.start).getTime() / 1000);
            if (dateRange.end) params.created.lte = Math.floor(new Date(dateRange.end).getTime() / 1000);
        }

        const charges = await stripe.charges.list(params);
        
        return charges.data.map(c => ({
            id: c.id,
            customer: c.customer,
            amount: c.amount / 100,
            amountRefunded: c.amount_refunded / 100,
            currency: c.currency,
            status: c.status,
            paid: c.paid,
            refunded: c.refunded,
            disputed: c.disputed,
            created: new Date(c.created * 1000).toISOString(),
            description: c.description || '',
            receiptUrl: c.receipt_url,
            paymentMethod: c.payment_method_details?.type
        }));
    }

    /**
     * Apply custom filters to data
     */
    applyFilters(data, filters) {
        if (!filters || Object.keys(filters).length === 0) return data;

        return data.filter(record => {
            for (const [key, value] of Object.entries(filters)) {
                if (key === 'search') {
                    // Global search across all string fields
                    const searchTerm = value.toLowerCase();
                    const matchesSearch = Object.values(record).some(val => 
                        String(val).toLowerCase().includes(searchTerm)
                    );
                    if (!matchesSearch) return false;
                } else if (Array.isArray(value)) {
                    // IN filter - value must be in array
                    if (!value.includes(record[key])) return false;
                } else if (typeof value === 'object' && value.min !== undefined || value.max !== undefined) {
                    // Range filter
                    const recordValue = Number(record[key]);
                    if (value.min !== undefined && recordValue < value.min) return false;
                    if (value.max !== undefined && recordValue > value.max) return false;
                } else {
                    // Exact match filter
                    if (record[key] !== value) return false;
                }
            }
            return true;
        });
    }

    /**
     * Select specific columns from data
     */
    selectColumns(data, columns, type) {
        if (!columns || columns.length === 0) return data;

        return data.map(record => {
            const selected = {};
            columns.forEach(col => {
                if (record.hasOwnProperty(col)) {
                    selected[col] = record[col];
                }
            });
            return selected;
        });
    }

    /**
     * Group data and calculate aggregations
     */
    groupAndAggregate(data, groupBy, aggregations) {
        const groups = {};

        data.forEach(record => {
            const groupKey = record[groupBy];
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    [groupBy]: groupKey,
                    count: 0,
                    records: []
                };
            }
            groups[groupKey].count++;
            groups[groupKey].records.push(record);
        });

        // Calculate aggregations
        const result = Object.values(groups).map(group => {
            const aggregated = {
                [groupBy]: group[groupBy],
                count: group.count
            };

            aggregations.forEach(agg => {
                const { field, function: func } = agg;
                const values = group.records.map(r => Number(r[field]) || 0);

                switch (func) {
                    case 'sum':
                        aggregated[`${field}_sum`] = values.reduce((a, b) => a + b, 0);
                        break;
                    case 'avg':
                        aggregated[`${field}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
                        break;
                    case 'min':
                        aggregated[`${field}_min`] = Math.min(...values);
                        break;
                    case 'max':
                        aggregated[`${field}_max`] = Math.max(...values);
                        break;
                }
            });

            return aggregated;
        });

        return result;
    }

    /**
     * Sort data
     */
    sortData(data, sort) {
        const { field, order = 'asc' } = sort;

        return data.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];

            if (aVal === bVal) return 0;

            const comparison = aVal > bVal ? 1 : -1;
            return order === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Calculate summary statistics
     */
    calculateSummary(data, aggregations) {
        if (data.length === 0) return {};

        const summary = {
            totalRecords: data.length
        };

        // Calculate numeric field summaries
        const numericFields = Object.keys(data[0] || {}).filter(key => 
            typeof data[0][key] === 'number'
        );

        numericFields.forEach(field => {
            const values = data.map(r => r[field]);
            summary[field] = {
                sum: values.reduce((a, b) => a + b, 0),
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values)
            };
        });

        return summary;
    }

    /**
     * Export report to PDF
     */
    async exportToPDF(reportData, filename) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 40 });
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // Title
                doc.fontSize(20).text(`${reportData.type.toUpperCase()} Report`, { align: 'center' });
                doc.moveDown();
                doc.fontSize(10).text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, { align: 'center' });
                doc.fontSize(10).text(`Total Records: ${reportData.totalRecords}`, { align: 'center' });
                doc.moveDown(2);

                // Summary section
                if (reportData.summary && Object.keys(reportData.summary).length > 1) {
                    doc.fontSize(14).text('Summary', { underline: true });
                    doc.moveDown();
                    
                    Object.entries(reportData.summary).forEach(([key, value]) => {
                        if (key !== 'totalRecords' && typeof value === 'object') {
                            doc.fontSize(10).text(`${key}:`);
                            doc.fontSize(9).text(`  Sum: ${value.sum.toFixed(2)}`, { indent: 20 });
                            doc.fontSize(9).text(`  Avg: ${value.avg.toFixed(2)}`, { indent: 20 });
                            doc.moveDown(0.5);
                        }
                    });
                    doc.moveDown();
                }

                // Data table (show first 50 records)
                doc.fontSize(14).text('Data', { underline: true });
                doc.moveDown();

                const displayData = reportData.data.slice(0, 50);
                displayData.forEach((record, idx) => {
                    if (idx > 0) doc.moveDown(0.5);
                    doc.fontSize(9).text(`Record ${idx + 1}:`, { bold: true });
                    Object.entries(record).forEach(([key, value]) => {
                        doc.fontSize(8).text(`  ${key}: ${value}`, { indent: 20 });
                    });
                });

                if (reportData.data.length > 50) {
                    doc.moveDown();
                    doc.fontSize(9).text(`... and ${reportData.data.length - 50} more records`, { align: 'center', italics: true });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Export report to Excel
     */
    async exportToExcel(reportData, filename) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');

            // Add headers
            const columns = reportData.columns.map(col => ({
                header: col,
                key: col,
                width: 15
            }));
            worksheet.columns = columns;

            // Add data
            reportData.data.forEach(record => {
                worksheet.addRow(record);
            });

            // Style headers
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Add summary sheet if available
            if (reportData.summary && Object.keys(reportData.summary).length > 1) {
                const summarySheet = workbook.addWorksheet('Summary');
                summarySheet.columns = [
                    { header: 'Metric', key: 'metric', width: 20 },
                    { header: 'Value', key: 'value', width: 15 }
                ];

                Object.entries(reportData.summary).forEach(([key, value]) => {
                    if (typeof value === 'object') {
                        summarySheet.addRow({ metric: `${key} (Sum)`, value: value.sum });
                        summarySheet.addRow({ metric: `${key} (Avg)`, value: value.avg });
                        summarySheet.addRow({ metric: `${key} (Min)`, value: value.min });
                        summarySheet.addRow({ metric: `${key} (Max)`, value: value.max });
                    } else {
                        summarySheet.addRow({ metric: key, value });
                    }
                });
            }

            return await workbook.xlsx.writeBuffer();
        } catch (error) {
            console.error('❌ Error exporting to Excel:', error);
            throw error;
        }
    }

    /**
     * Save report template for reuse
     */
    async saveTemplate(name, spec, description = '') {
        // In production, save to database
        return {
            id: `template_${Date.now()}`,
            name,
            spec,
            description,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Get saved report templates
     */
    async getTemplates() {
        // In production, fetch from database
        return [
            {
                id: 'monthly-revenue',
                name: 'Monthly Revenue Report',
                description: 'Revenue breakdown by month',
                spec: {
                    type: 'invoices',
                    columns: ['customer', 'total', 'created', 'status'],
                    filters: { status: 'paid' },
                    groupBy: 'created',
                    aggregations: [{ field: 'total', function: 'sum' }]
                }
            },
            {
                id: 'active-subscriptions',
                name: 'Active Subscriptions',
                description: 'All active subscription details',
                spec: {
                    type: 'subscriptions',
                    columns: ['customer', 'plan', 'amount', 'status', 'created'],
                    filters: { status: 'active' }
                }
            },
            {
                id: 'customer-lifetime-value',
                name: 'Customer Lifetime Value',
                description: 'Total revenue by customer',
                spec: {
                    type: 'invoices',
                    columns: ['customer', 'amountPaid'],
                    filters: { paid: true },
                    groupBy: 'customer',
                    aggregations: [{ field: 'amountPaid', function: 'sum' }]
                }
            }
        ];
    }
}

export const reportBuilderService = new ReportBuilderService();
export default reportBuilderService;
