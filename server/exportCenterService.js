import Stripe from 'stripe';
import PocketBase from 'pocketbase';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createWriteStream, promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import auditService from './auditLogService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getStripe } from './stripeClient.js';

const stripe = getStripe();
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

// Ensure exports directory exists
const exportsDir = path.join(__dirname, 'exports');
await fs.mkdir(exportsDir, { recursive: true });

/**
 * Get export history with metadata
 */
export async function getExportHistory() {
    try {
        const files = await fs.readdir(exportsDir);
        const exports = await Promise.all(
            files.map(async (file) => {
                const stats = await fs.stat(path.join(exportsDir, file));
                return {
                    filename: file,
                    type: file.split('.').pop()?.toUpperCase(),
                    size: Math.round(stats.size / 1024), // KB
                    createdAt: stats.birthtime.toISOString(),
                    url: `/api/export-center/download/${file}`
                };
            })
        );

        // Sort by creation date (newest first)
        exports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return exports;
    } catch (error) {
        console.error('Error getting export history:', error);
        return [];
    }
}

/**
 * Export subscriptions to CSV
 */
export async function exportSubscriptionsCSV(userId, userEmail, ipAddress) {
    try {
        const subscriptions = await stripe.subscriptions.list({ limit: 100 });
        
        const csvRows = [
            ['Subscription ID', 'Customer ID', 'Customer Email', 'Status', 'Plan', 'Amount', 'Interval', 'Current Period Start', 'Current Period End', 'Created'].join(',')
        ];

        for (const sub of subscriptions.data) {
            try {
                const customer = await stripe.customers.retrieve(sub.customer);
                const row = [
                    sub.id,
                    sub.customer,
                    customer.email || 'N/A',
                    sub.status,
                    sub.items.data[0]?.price?.nickname || sub.items.data[0]?.price?.id || 'Unknown',
                    ((sub.items.data[0]?.price?.unit_amount || 0) / 100).toFixed(2),
                    sub.items.data[0]?.price?.recurring?.interval || 'N/A',
                    new Date(sub.current_period_start * 1000).toISOString(),
                    new Date(sub.current_period_end * 1000).toISOString(),
                    new Date(sub.created * 1000).toISOString()
                ];
                csvRows.push(row.map(cell => `"${cell}"`).join(','));
            } catch (err) {
                // Skip if customer not found
                continue;
            }
        }

        const filename = `subscriptions_${Date.now()}.csv`;
        const filepath = path.join(exportsDir, filename);
        const csvContent = csvRows.join('\n');
        await fs.writeFile(filepath, csvContent);

        // Audit log the export
        await auditService.logExport({
            userId,
            userEmail,
            exportType: 'subscriptions_csv',
            fileName: filename,
            recordCount: csvRows.length - 1,
            fileSize: Buffer.byteLength(csvContent, 'utf8'),
            ipAddress
        });

        return {
            success: true,
            filename,
            url: `/api/export-center/download/${filename}`,
            recordCount: csvRows.length - 1
        };
    } catch (error) {
        console.error('Error exporting subscriptions to CSV:', error);
        throw error;
    }
}

/**
 * Export revenue data to Excel
 */
export async function exportRevenueExcel(months = 12, userId, userEmail, ipAddress) {
    try {
        const workbook = new ExcelJS.Workbook();
        
        // Revenue by Month sheet
        const revenueSheet = workbook.addWorksheet('Revenue by Month');
        revenueSheet.columns = [
            { header: 'Month', key: 'month', width: 20 },
            { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
            { header: 'Subscription Revenue', key: 'subscriptionRevenue', width: 20 },
            { header: 'One-Time Revenue', key: 'oneTimeRevenue', width: 20 },
            { header: 'Transaction Count', key: 'transactionCount', width: 15 },
            { header: 'Growth Rate (%)', key: 'growthRate', width: 15 }
        ];

        // Fetch revenue data
        const now = new Date();
        for (let i = months - 1; i >= 0; i--) {
            const periodEnd = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, 1);
            
            const charges = await stripe.charges.list({
                created: {
                    gte: Math.floor(periodStart.getTime() / 1000),
                    lte: Math.floor(periodEnd.getTime() / 1000)
                },
                limit: 100
            });

            const successfulCharges = charges.data.filter(c => c.paid && !c.refunded);
            const totalRevenue = successfulCharges.reduce((sum, c) => sum + c.amount, 0) / 100;
            const subscriptionRevenue = successfulCharges.filter(c => c.invoice).reduce((sum, c) => sum + c.amount, 0) / 100;
            const oneTimeRevenue = totalRevenue - subscriptionRevenue;

            revenueSheet.addRow({
                month: periodEnd.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
                totalRevenue: totalRevenue.toFixed(2),
                subscriptionRevenue: subscriptionRevenue.toFixed(2),
                oneTimeRevenue: oneTimeRevenue.toFixed(2),
                transactionCount: successfulCharges.length,
                growthRate: 0 // Calculated below
            });
        }

        // Calculate growth rates
        revenueSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 2) { // Skip header and first data row
                const currentRevenue = parseFloat(row.getCell('totalRevenue').value);
                const previousRevenue = parseFloat(revenueSheet.getRow(rowNumber - 1).getCell('totalRevenue').value);
                const growthRate = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(2) : 0;
                row.getCell('growthRate').value = growthRate;
            }
        });

        // Style header row
        revenueSheet.getRow(1).font = { bold: true };
        revenueSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        revenueSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // MRR/ARR sheet
        const mrrSheet = workbook.addWorksheet('MRR & ARR');
        mrrSheet.columns = [
            { header: 'Metric', key: 'metric', width: 20 },
            { header: 'Value', key: 'value', width: 15 }
        ];

        const subscriptions = await stripe.subscriptions.list({ status: 'active', limit: 100 });
        let totalMRR = 0;
        subscriptions.data.forEach(sub => {
            const amount = sub.items.data[0]?.price?.unit_amount || 0;
            const interval = sub.items.data[0]?.price?.recurring?.interval;
            let monthlyAmount = amount / 100;
            if (interval === 'year') monthlyAmount /= 12;
            else if (interval === 'week') monthlyAmount *= 4.33;
            else if (interval === 'day') monthlyAmount *= 30;
            totalMRR += monthlyAmount;
        });

        mrrSheet.addRow({ metric: 'Monthly Recurring Revenue (MRR)', value: `$${totalMRR.toFixed(2)}` });
        mrrSheet.addRow({ metric: 'Annual Recurring Revenue (ARR)', value: `$${(totalMRR * 12).toFixed(2)}` });
        mrrSheet.addRow({ metric: 'Active Subscriptions', value: subscriptions.data.length });
        mrrSheet.addRow({ metric: 'Average Revenue Per Account', value: `$${(totalMRR / subscriptions.data.length).toFixed(2)}` });

        mrrSheet.getRow(1).font = { bold: true };
        mrrSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        mrrSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        const filename = `revenue_analysis_${Date.now()}.xlsx`;
        const filepath = path.join(exportsDir, filename);
        await workbook.xlsx.writeFile(filepath);

        // Get file size for audit log
        const stats = await fs.stat(filepath);

        // Audit log the export
        await auditService.logExport({
            userId,
            userEmail,
            exportType: 'revenue_excel',
            fileName: filename,
            recordCount: revenueSheet.rowCount - 1, // Exclude header
            fileSize: stats.size,
            ipAddress
        });

        return {
            success: true,
            filename,
            url: `/api/export-center/download/${filename}`,
            sheets: ['Revenue by Month', 'MRR & ARR']
        };
    } catch (error) {
        console.error('Error exporting revenue to Excel:', error);
        throw error;
    }
}

/**
 * Export customer health to Excel
 */
export async function exportCustomerHealthExcel(userId, userEmail, ipAddress) {
    try {
        const workbook = new ExcelJS.Workbook();
        
        // Customer Health sheet
        const healthSheet = workbook.addWorksheet('Customer Health');
        healthSheet.columns = [
            { header: 'Customer ID', key: 'customerId', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Health Score', key: 'healthScore', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Engagement', key: 'engagement', width: 15 },
            { header: 'Usage', key: 'usage', width: 15 },
            { header: 'Payment', key: 'payment', width: 15 },
            { header: 'Longevity', key: 'longevity', width: 15 },
            { header: 'Active Subscriptions', key: 'activeSubscriptions', width: 20 },
            { header: 'Days Since Created', key: 'daysSinceCreated', width: 20 }
        ];

        const customers = await stripe.customers.list({ limit: 50 });

        for (const customer of customers.data) {
            try {
                const subscriptions = await stripe.subscriptions.list({ customer: customer.id, limit: 10 });
                const charges = await stripe.charges.list({ customer: customer.id, limit: 20 });
                const invoices = await stripe.invoices.list({ customer: customer.id, limit: 10 });

                const daysSinceCreated = (Date.now() - customer.created * 1000) / (1000 * 60 * 60 * 24);
                const activeSubscriptions = subscriptions.data.filter(s => s.status === 'active').length;
                const recentCharges = charges.data.filter(c => c.created > (Date.now() / 1000) - (90 * 24 * 60 * 60)).length;
                const failedCharges = charges.data.filter(c => !c.paid).length;
                const paidInvoices = invoices.data.filter(i => i.status === 'paid').length;
                const totalInvoices = invoices.data.length || 1;
                const paymentReliability = paidInvoices / totalInvoices;

                // Calculate scores
                const engagementScore = Math.min(40, (activeSubscriptions * 15) + Math.min(10, daysSinceCreated / 10));
                const usageScore = Math.min(30, recentCharges * 3);
                const paymentScore = Math.max(0, 20 - (failedCharges * 5)) * paymentReliability;
                const longevityScore = Math.min(10, Math.floor(daysSinceCreated / 30));
                const totalScore = Math.round(engagementScore + usageScore + paymentScore + longevityScore);
                const healthStatus = totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : 'Poor';

                healthSheet.addRow({
                    customerId: customer.id,
                    email: customer.email || 'N/A',
                    healthScore: totalScore,
                    status: healthStatus,
                    engagement: Math.round(engagementScore),
                    usage: Math.round(usageScore),
                    payment: Math.round(paymentScore),
                    longevity: Math.round(longevityScore),
                    activeSubscriptions,
                    daysSinceCreated: Math.round(daysSinceCreated)
                });
            } catch (err) {
                continue;
            }
        }

        // Style header row
        healthSheet.getRow(1).font = { bold: true };
        healthSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
        };
        healthSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Color-code health scores
        healthSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const score = row.getCell('healthScore').value;
                if (score >= 80) {
                    row.getCell('healthScore').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
                } else if (score >= 60) {
                    row.getCell('healthScore').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
                } else if (score >= 40) {
                    row.getCell('healthScore').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } };
                } else {
                    row.getCell('healthScore').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
                }
            }
        });

        const filename = `customer_health_${Date.now()}.xlsx`;
        const filepath = path.join(exportsDir, filename);
        await workbook.xlsx.writeFile(filepath);

        // Get file size for audit log
        const stats = await fs.stat(filepath);

        // Audit log the export
        await auditService.logExport({
            userId,
            userEmail,
            exportType: 'customer_health_excel',
            fileName: filename,
            recordCount: healthSheet.rowCount - 1,
            fileSize: stats.size,
            ipAddress
        });

        return {
            success: true,
            filename,
            url: `/api/export-center/download/${filename}`,
            customerCount: healthSheet.rowCount - 1
        };
    } catch (error) {
        console.error('Error exporting customer health to Excel:', error);
        throw error;
    }
}

/**
 * Export churn analysis to PDF
 */
export async function exportChurnAnalysisPDF() {
    try {
        const filename = `churn_analysis_${Date.now()}.pdf`;
        const filepath = path.join(exportsDir, filename);

        const doc = new PDFDocument({ margin: 50 });
        const stream = createWriteStream(filepath);
        doc.pipe(stream);

        // Title
        doc.fontSize(24).font('Helvetica-Bold').text('Churn Analysis Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Fetch churn data
        const subscriptions = await stripe.subscriptions.list({ limit: 100 });
        const canceledSubs = subscriptions.data.filter(s => s.status === 'canceled');
        const activeCount = subscriptions.data.filter(s => s.status === 'active').length;
        const churnRate = (canceledSubs.length / subscriptions.data.length * 100).toFixed(2);

        // Summary section
        doc.fontSize(16).font('Helvetica-Bold').text('Executive Summary');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total Subscriptions: ${subscriptions.data.length}`);
        doc.text(`Active Subscriptions: ${activeCount}`);
        doc.text(`Canceled Subscriptions: ${canceledSubs.length}`);
        doc.text(`Overall Churn Rate: ${churnRate}%`);
        doc.moveDown(2);

        // Recent cancellations
        doc.fontSize(16).font('Helvetica-Bold').text('Recent Cancellations (Last 30 Days)');
        doc.moveDown(0.5);

        const thirtyDaysAgo = Date.now() / 1000 - (30 * 24 * 60 * 60);
        const recentCancellations = canceledSubs.filter(s => s.canceled_at && s.canceled_at >= thirtyDaysAgo);

        doc.fontSize(12).font('Helvetica');
        if (recentCancellations.length > 0) {
            recentCancellations.slice(0, 10).forEach((sub, index) => {
                doc.text(`${index + 1}. Customer: ${sub.customer}`, { indent: 20 });
                doc.text(`   Plan: ${sub.items.data[0]?.price?.nickname || 'Unknown'}`, { indent: 20 });
                doc.text(`   Canceled: ${new Date(sub.canceled_at * 1000).toLocaleDateString()}`, { indent: 20 });
                if (sub.cancellation_details?.comment) {
                    doc.text(`   Reason: ${sub.cancellation_details.comment}`, { indent: 20 });
                }
                doc.moveDown(0.5);
            });
        } else {
            doc.text('No recent cancellations', { indent: 20 });
        }

        doc.moveDown(2);

        // Recommendations
        doc.fontSize(16).font('Helvetica-Bold').text('Recommendations');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        
        if (parseFloat(churnRate) > 10) {
            doc.text('• High churn rate detected - implement retention campaigns', { indent: 20 });
            doc.text('• Analyze cancellation reasons for common patterns', { indent: 20 });
            doc.text('• Offer win-back promotions to recently churned customers', { indent: 20 });
        } else if (parseFloat(churnRate) > 5) {
            doc.text('• Moderate churn rate - monitor at-risk customers', { indent: 20 });
            doc.text('• Improve customer onboarding and education', { indent: 20 });
            doc.text('• Enhance customer success touchpoints', { indent: 20 });
        } else {
            doc.text('• Excellent churn rate - maintain current practices', { indent: 20 });
            doc.text('• Document successful retention strategies', { indent: 20 });
            doc.text('• Continue monitoring customer health metrics', { indent: 20 });
        }

        doc.end();

        await new Promise((resolve) => stream.on('finish', resolve));

        return {
            success: true,
            filename,
            url: `/api/export-center/download/${filename}`,
            churnRate: parseFloat(churnRate)
        };
    } catch (error) {
        console.error('Error exporting churn analysis to PDF:', error);
        throw error;
    }
}

/**
 * Export trial conversions to JSON
 */
export async function exportTrialConversionsJSON() {
    try {
        const subscriptions = await stripe.subscriptions.list({ limit: 100 });
        const trialData = [];

        for (const sub of subscriptions.data) {
            if (sub.trial_end || sub.trial_start) {
                try {
                    const customer = await stripe.customers.retrieve(sub.customer);
                    const hadTrial = sub.trial_end !== null;
                    const converted = sub.status === 'active' && (!sub.trial_end || Date.now() / 1000 > sub.trial_end);

                    trialData.push({
                        subscriptionId: sub.id,
                        customerId: sub.customer,
                        customerEmail: customer.email || 'N/A',
                        planName: sub.items.data[0]?.price?.nickname || 'Unknown',
                        trialStarted: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
                        trialEnded: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
                        hadTrial,
                        converted,
                        currentStatus: sub.status,
                        amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
                        createdAt: new Date(sub.created * 1000).toISOString()
                    });
                } catch (err) {
                    continue;
                }
            }
        }

        const converted = trialData.filter(t => t.converted).length;
        const total = trialData.length;
        const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(2) : 0;

        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                totalTrials: total,
                convertedTrials: converted,
                conversionRate: `${conversionRate}%`
            },
            trials: trialData
        };

        const filename = `trial_conversions_${Date.now()}.json`;
        const filepath = path.join(exportsDir, filename);
        await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));

        return {
            success: true,
            filename,
            url: `/api/export-center/download/${filename}`,
            trialCount: total,
            conversionRate: parseFloat(conversionRate)
        };
    } catch (error) {
        console.error('Error exporting trial conversions to JSON:', error);
        throw error;
    }
}

/**
 * Export all data (comprehensive export)
 */
export async function exportAllData() {
    try {
        const workbook = new ExcelJS.Workbook();

        // Subscriptions sheet
        const subsSheet = workbook.addWorksheet('Subscriptions');
        subsSheet.columns = [
            { header: 'ID', key: 'id', width: 30 },
            { header: 'Customer Email', key: 'email', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Plan', key: 'plan', width: 20 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Created', key: 'created', width: 20 }
        ];

        const subscriptions = await stripe.subscriptions.list({ limit: 100 });
        for (const sub of subscriptions.data) {
            try {
                const customer = await stripe.customers.retrieve(sub.customer);
                subsSheet.addRow({
                    id: sub.id,
                    email: customer.email || 'N/A',
                    status: sub.status,
                    plan: sub.items.data[0]?.price?.nickname || 'Unknown',
                    amount: ((sub.items.data[0]?.price?.unit_amount || 0) / 100).toFixed(2),
                    created: new Date(sub.created * 1000).toISOString()
                });
            } catch (err) {
                continue;
            }
        }

        // Customers sheet
        const customersSheet = workbook.addWorksheet('Customers');
        customersSheet.columns = [
            { header: 'ID', key: 'id', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Created', key: 'created', width: 20 }
        ];

        const customers = await stripe.customers.list({ limit: 100 });
        customers.data.forEach(customer => {
            customersSheet.addRow({
                id: customer.id,
                email: customer.email || 'N/A',
                name: customer.name || 'N/A',
                created: new Date(customer.created * 1000).toISOString()
            });
        });

        // Style headers
        [subsSheet, customersSheet].forEach(sheet => {
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF6366F1' }
            };
            sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        });

        const filename = `complete_export_${Date.now()}.xlsx`;
        const filepath = path.join(exportsDir, filename);
        await workbook.xlsx.writeFile(filepath);

        return {
            success: true,
            filename,
            url: `/api/export-center/download/${filename}`,
            sheets: ['Subscriptions', 'Customers']
        };
    } catch (error) {
        console.error('Error exporting all data:', error);
        throw error;
    }
}

/**
 * Delete export file
 */
export async function deleteExport(filename) {
    try {
        const filepath = path.join(exportsDir, filename);
        await fs.unlink(filepath);
        return { success: true, deleted: filename };
    } catch (error) {
        console.error('Error deleting export:', error);
        throw error;
    }
}

export default {
    getExportHistory,
    exportSubscriptionsCSV,
    exportRevenueExcel,
    exportCustomerHealthExcel,
    exportChurnAnalysisPDF,
    exportTrialConversionsJSON,
    exportAllData,
    deleteExport
};
