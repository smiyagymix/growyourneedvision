/**
 * Marketing Export Service
 * 
 * Provides export functionality for all marketing data
 * Supports CSV, Excel, and PDF formats
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
    Campaign, 
    ABTest, 
    Audience, 
    CustomerProfile, 
    Journey, 
    SocialPost,
    LeadScore,
    Experiment 
} from './marketingService';

interface ExportOptions {
    filename?: string;
    title?: string;
    includeTimestamp?: boolean;
}

class MarketingExportService {
    private formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    private getFilename(base: string, extension: string, options?: ExportOptions): string {
        let filename = options?.filename || base;
        if (options?.includeTimestamp !== false) {
            filename += `_${new Date().toISOString().split('T')[0]}`;
        }
        return `${filename}.${extension}`;
    }

    private downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // =========================
    // CSV Export
    // =========================

    private arrayToCSV(data: string[][]): string {
        return data.map(row => 
            row.map(cell => {
                if (cell === null || cell === undefined) return '';
                const escaped = String(cell).replace(/"/g, '""');
                return /[,"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
            }).join(',')
        ).join('\n');
    }

    // =========================
    // Campaign Exports
    // =========================

    exportCampaignsToCSV(campaigns: Campaign[], options?: ExportOptions): void {
        const headers = ['Name', 'Status', 'Type', 'Budget', 'Spent', 'Impressions', 'Clicks', 'Conversions', 'Performance Score', 'Start Date', 'End Date'];
        const rows = campaigns.map(c => [
            c.name,
            c.status,
            c.type,
            `$${c.budget.toLocaleString()}`,
            `$${c.spent.toLocaleString()}`,
            c.impressions.toLocaleString(),
            c.clicks.toLocaleString(),
            c.conversions.toLocaleString(),
            `${c.performance_score}%`,
            c.start_date ? this.formatDate(new Date(c.start_date)) : 'N/A',
            c.end_date ? this.formatDate(new Date(c.end_date)) : 'N/A',
        ]);

        const csv = this.arrayToCSV([headers, ...rows]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, this.getFilename('campaigns', 'csv', options));
    }

    exportCampaignsToExcel(campaigns: Campaign[], options?: ExportOptions): void {
        const data = campaigns.map(c => ({
            'Name': c.name,
            'Status': c.status,
            'Type': c.type,
            'Budget': c.budget,
            'Spent': c.spent,
            'Impressions': c.impressions,
            'Clicks': c.clicks,
            'Conversions': c.conversions,
            'CTR (%)': ((c.clicks / c.impressions) * 100).toFixed(2),
            'CVR (%)': ((c.conversions / c.clicks) * 100).toFixed(2),
            'Performance Score': c.performance_score,
            'Start Date': c.start_date ? new Date(c.start_date) : null,
            'End Date': c.end_date ? new Date(c.end_date) : null,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Campaigns');
        XLSX.writeFile(wb, this.getFilename('campaigns', 'xlsx', options));
    }

    exportCampaignsToPDF(campaigns: Campaign[], options?: ExportOptions): void {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(20);
        doc.text(options?.title || 'Campaign Performance Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

        autoTable(doc, {
            startY: 35,
            head: [['Name', 'Status', 'Type', 'Budget', 'Spent', 'CTR', 'CVR', 'Score']],
            body: campaigns.map(c => [
                c.name,
                c.status,
                c.type,
                `$${c.budget.toLocaleString()}`,
                `$${c.spent.toLocaleString()}`,
                `${((c.clicks / c.impressions) * 100).toFixed(1)}%`,
                `${((c.conversions / c.clicks) * 100).toFixed(1)}%`,
                `${c.performance_score}%`,
            ]),
            theme: 'striped',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [79, 70, 229] },
        });

        doc.save(this.getFilename('campaigns', 'pdf', options));
    }

    // =========================
    // A/B Test Exports
    // =========================

    exportABTestsToCSV(tests: ABTest[], options?: ExportOptions): void {
        const headers = ['Name', 'Status', 'Type', 'Goal', 'Traffic Split', 'Confidence', 'Winner', 'Start Date'];
        const rows = tests.map(t => [
            t.name,
            t.status,
            t.type,
            t.goal,
            `${t.traffic_split}%`,
            t.confidence_level ? `${t.confidence_level}%` : 'N/A',
            t.winner_id ? t.variants.find(v => v.id === t.winner_id)?.name || 'Unknown' : 'TBD',
            t.start_date ? this.formatDate(new Date(t.start_date)) : 'Not started',
        ]);

        const csv = this.arrayToCSV([headers, ...rows]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, this.getFilename('ab_tests', 'csv', options));
    }

    exportABTestsToExcel(tests: ABTest[], options?: ExportOptions): void {
        // Main sheet with test info
        const testData = tests.map(t => ({
            'Test Name': t.name,
            'Status': t.status,
            'Type': t.type,
            'Goal': t.goal,
            'Traffic Split (%)': t.traffic_split,
            'Confidence (%)': t.confidence_level || 0,
            'Winner': t.winner_id ? t.variants.find(v => v.id === t.winner_id)?.name || 'Unknown' : 'TBD',
            'Start Date': t.start_date ? new Date(t.start_date) : null,
            'End Date': t.end_date ? new Date(t.end_date) : null,
        }));

        // Variants sheet
        const variantsData: Record<string, unknown>[] = [];
        tests.forEach(t => {
            t.variants.forEach(v => {
                variantsData.push({
                    'Test Name': t.name,
                    'Variant': v.name,
                    'Is Control': v.is_control ? 'Yes' : 'No',
                    'Visitors': v.visitors,
                    'Conversions': v.conversions,
                    'Conversion Rate (%)': v.conversion_rate.toFixed(2),
                    'Description': v.description,
                });
            });
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(testData), 'Tests');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(variantsData), 'Variants');
        XLSX.writeFile(wb, this.getFilename('ab_tests', 'xlsx', options));
    }

    exportABTestsToPDF(tests: ABTest[], options?: ExportOptions): void {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text(options?.title || 'A/B Testing Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

        autoTable(doc, {
            startY: 35,
            head: [['Test Name', 'Status', 'Type', 'Confidence', 'Winner']],
            body: tests.map(t => [
                t.name,
                t.status,
                t.type,
                t.confidence_level ? `${t.confidence_level}%` : 'N/A',
                t.winner_id ? t.variants.find(v => v.id === t.winner_id)?.name || 'TBD' : 'TBD',
            ]),
            theme: 'striped',
            headStyles: { fillColor: [139, 92, 246] },
        });

        doc.save(this.getFilename('ab_tests', 'pdf', options));
    }

    // =========================
    // Audience Exports
    // =========================

    exportAudiencesToCSV(audiences: Audience[], options?: ExportOptions): void {
        const headers = ['Name', 'Description', 'Type', 'Size', 'Status', 'Source', 'Last Synced'];
        const rows = audiences.map(a => [
            a.name,
            a.description || '',
            a.type,
            a.size?.toLocaleString() || '0',
            a.status,
            a.source || 'N/A',
            a.last_synced ? this.formatDate(new Date(a.last_synced)) : 'Never',
        ]);

        const csv = this.arrayToCSV([headers, ...rows]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, this.getFilename('audiences', 'csv', options));
    }

    exportAudiencesToExcel(audiences: Audience[], options?: ExportOptions): void {
        const data = audiences.map(a => ({
            'Name': a.name,
            'Description': a.description || '',
            'Type': a.type,
            'Size': a.size || 0,
            'Status': a.status,
            'Source': a.source || 'N/A',
            'Criteria': JSON.stringify(a.criteria || {}),
            'Last Synced': a.last_synced ? new Date(a.last_synced) : null,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Audiences');
        XLSX.writeFile(wb, this.getFilename('audiences', 'xlsx', options));
    }

    // =========================
    // Customer Profile Exports
    // =========================

    exportCustomerProfilesToCSV(profiles: CustomerProfile[], options?: ExportOptions): void {
        const headers = ['Name', 'Email', 'Company', 'LTV', 'Engagement Score', 'Segments', 'Source', 'Last Activity'];
        const rows = profiles.map(p => [
            p.name,
            p.email,
            p.company || '',
            `$${p.ltv.toLocaleString()}`,
            p.engagement_score.toString(),
            (p.segments || []).join('; '),
            p.source || 'Unknown',
            p.last_activity ? this.formatDate(new Date(p.last_activity)) : 'N/A',
        ]);

        const csv = this.arrayToCSV([headers, ...rows]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, this.getFilename('customer_profiles', 'csv', options));
    }

    exportCustomerProfilesToExcel(profiles: CustomerProfile[], options?: ExportOptions): void {
        const data = profiles.map(p => ({
            'Name': p.name,
            'Email': p.email,
            'Phone': p.phone || '',
            'Company': p.company || '',
            'LTV ($)': p.ltv,
            'Engagement Score': p.engagement_score,
            'Segments': (p.segments || []).join(', '),
            'Tags': (p.tags || []).join(', '),
            'Source': p.source || 'Unknown',
            'Events Count': p.events_count || 0,
            'Last Activity': p.last_activity ? new Date(p.last_activity) : null,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Customer Profiles');
        XLSX.writeFile(wb, this.getFilename('customer_profiles', 'xlsx', options));
    }

    // =========================
    // Lead Scores Export
    // =========================

    exportLeadScoresToCSV(scores: LeadScore[], options?: ExportOptions): void {
        const headers = ['Name', 'Email', 'Score', 'Grade', 'Trend', 'Last Updated'];
        const rows = scores.map(s => [
            s.profile_name,
            s.profile_email,
            s.score.toString(),
            s.grade,
            s.trend,
            s.last_updated ? this.formatDate(new Date(s.last_updated)) : 'N/A',
        ]);

        const csv = this.arrayToCSV([headers, ...rows]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, this.getFilename('lead_scores', 'csv', options));
    }

    exportLeadScoresToExcel(scores: LeadScore[], options?: ExportOptions): void {
        const data = scores.map(s => ({
            'Profile ID': s.profile_id,
            'Name': s.profile_name,
            'Email': s.profile_email,
            'Score': s.score,
            'Grade': s.grade,
            'Trend': s.trend,
            'Last Updated': s.last_updated ? new Date(s.last_updated) : null,
        }));

        // Add factors breakdown sheet
        const factorsData: Record<string, unknown>[] = [];
        scores.forEach(s => {
            (s.factors || []).forEach((f: { name: string; weight: number; value: number; contribution: number }) => {
                factorsData.push({
                    'Profile': s.profile_name,
                    'Factor': f.name,
                    'Weight': f.weight,
                    'Value': f.value,
                    'Contribution': f.contribution,
                });
            });
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Lead Scores');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(factorsData), 'Score Factors');
        XLSX.writeFile(wb, this.getFilename('lead_scores', 'xlsx', options));
    }

    // =========================
    // Journey Exports
    // =========================

    exportJourneysToCSV(journeys: Journey[], options?: ExportOptions): void {
        const headers = ['Name', 'Description', 'Status', 'Enrolled', 'Completed', 'Conversion Rate', 'Start Date'];
        const rows = journeys.map(j => [
            j.name,
            j.description || '',
            j.status,
            (j.enrolled_count || 0).toString(),
            (j.completed_count || 0).toString(),
            j.conversion_rate ? `${j.conversion_rate}%` : 'N/A',
            j.start_date ? this.formatDate(new Date(j.start_date)) : 'Not started',
        ]);

        const csv = this.arrayToCSV([headers, ...rows]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, this.getFilename('journeys', 'csv', options));
    }

    exportJourneysToExcel(journeys: Journey[], options?: ExportOptions): void {
        const data = journeys.map(j => ({
            'Name': j.name,
            'Description': j.description || '',
            'Status': j.status,
            'Trigger Type': j.trigger?.type || 'N/A',
            'Steps Count': j.steps?.length || 0,
            'Enrolled': j.enrolled_count || 0,
            'Completed': j.completed_count || 0,
            'Conversion Rate (%)': j.conversion_rate || 0,
            'Start Date': j.start_date ? new Date(j.start_date) : null,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Journeys');
        XLSX.writeFile(wb, this.getFilename('journeys', 'xlsx', options));
    }

    // =========================
    // Social Posts Export
    // =========================

    exportSocialPostsToCSV(posts: SocialPost[], options?: ExportOptions): void {
        const headers = ['Content', 'Platforms', 'Status', 'Scheduled Date', 'Published Date', 'Likes', 'Comments', 'Shares'];
        const rows = posts.map(p => [
            p.content.substring(0, 100) + (p.content.length > 100 ? '...' : ''),
            p.platforms.join(', '),
            p.status,
            p.scheduled_date ? this.formatDate(new Date(p.scheduled_date)) : 'N/A',
            p.published_date ? this.formatDate(new Date(p.published_date)) : 'N/A',
            p.engagement?.likes?.toString() || '0',
            p.engagement?.comments?.toString() || '0',
            p.engagement?.shares?.toString() || '0',
        ]);

        const csv = this.arrayToCSV([headers, ...rows]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, this.getFilename('social_posts', 'csv', options));
    }

    exportSocialPostsToExcel(posts: SocialPost[], options?: ExportOptions): void {
        const data = posts.map(p => ({
            'Content': p.content,
            'Platforms': p.platforms.join(', '),
            'Status': p.status,
            'Scheduled Date': p.scheduled_date ? new Date(p.scheduled_date) : null,
            'Published Date': p.published_date ? new Date(p.published_date) : null,
            'Likes': p.engagement?.likes || 0,
            'Comments': p.engagement?.comments || 0,
            'Shares': p.engagement?.shares || 0,
            'Total Engagement': (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0),
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Social Posts');
        XLSX.writeFile(wb, this.getFilename('social_posts', 'xlsx', options));
    }

    // =========================
    // Experiments Export
    // =========================

    exportExperimentsToCSV(experiments: Experiment[], options?: ExportOptions): void {
        const headers = ['Name', 'Hypothesis', 'Status', 'Type', 'Sample Size', 'Progress', 'Start Date'];
        const rows = experiments.map(e => [
            e.name,
            e.hypothesis,
            e.status,
            e.type,
            e.sample_size.toLocaleString(),
            `${Math.round((e.current_sample / e.sample_size) * 100)}%`,
            e.start_date ? this.formatDate(new Date(e.start_date)) : 'Not started',
        ]);

        const csv = this.arrayToCSV([headers, ...rows]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, this.getFilename('experiments', 'csv', options));
    }

    exportExperimentsToExcel(experiments: Experiment[], options?: ExportOptions): void {
        const data = experiments.map(e => ({
            'Name': e.name,
            'Hypothesis': e.hypothesis,
            'Status': e.status,
            'Type': e.type,
            'Variants Count': e.variants?.length || 0,
            'Metrics Count': e.metrics?.length || 0,
            'Sample Size': e.sample_size,
            'Current Sample': e.current_sample,
            'Progress (%)': Math.round((e.current_sample / e.sample_size) * 100),
            'Start Date': e.start_date ? new Date(e.start_date) : null,
            'End Date': e.end_date ? new Date(e.end_date) : null,
        }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Experiments');
        XLSX.writeFile(wb, this.getFilename('experiments', 'xlsx', options));
    }

    exportExperimentsToPDF(experiments: Experiment[], options?: ExportOptions): void {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text(options?.title || 'Experimentation Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

        autoTable(doc, {
            startY: 35,
            head: [['Name', 'Status', 'Type', 'Progress', 'Sample Size']],
            body: experiments.map(e => [
                e.name,
                e.status,
                e.type,
                `${Math.round((e.current_sample / e.sample_size) * 100)}%`,
                e.sample_size.toLocaleString(),
            ]),
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
        });

        doc.save(this.getFilename('experiments', 'pdf', options));
    }

    // =========================
    // Full Marketing Report
    // =========================

    exportFullMarketingReport(data: {
        campaigns?: Campaign[];
        abTests?: ABTest[];
        audiences?: Audience[];
        journeys?: Journey[];
        experiments?: Experiment[];
    }, options?: ExportOptions): void {
        const wb = XLSX.utils.book_new();

        if (data.campaigns?.length) {
            const campaignData = data.campaigns.map(c => ({
                'Name': c.name,
                'Status': c.status,
                'Type': c.type,
                'Budget': c.budget,
                'Spent': c.spent,
                'Impressions': c.impressions,
                'Clicks': c.clicks,
                'Conversions': c.conversions,
                'Performance': c.performance_score,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(campaignData), 'Campaigns');
        }

        if (data.abTests?.length) {
            const testData = data.abTests.map(t => ({
                'Name': t.name,
                'Status': t.status,
                'Type': t.type,
                'Confidence': t.confidence_level || 0,
                'Traffic Split': t.traffic_split,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(testData), 'A-B Tests');
        }

        if (data.audiences?.length) {
            const audienceData = data.audiences.map(a => ({
                'Name': a.name,
                'Type': a.type,
                'Size': a.size || 0,
                'Status': a.status,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(audienceData), 'Audiences');
        }

        if (data.journeys?.length) {
            const journeyData = data.journeys.map(j => ({
                'Name': j.name,
                'Status': j.status,
                'Enrolled': j.enrolled_count || 0,
                'Completed': j.completed_count || 0,
                'Conversion': j.conversion_rate || 0,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(journeyData), 'Journeys');
        }

        if (data.experiments?.length) {
            const expData = data.experiments.map(e => ({
                'Name': e.name,
                'Status': e.status,
                'Type': e.type,
                'Progress': Math.round((e.current_sample / e.sample_size) * 100),
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expData), 'Experiments');
        }

        XLSX.writeFile(wb, this.getFilename('marketing_report', 'xlsx', options));
    }

    /**
     * Export automation rules to CSV
     */
    exportAutomationRulesToCSV(rules: any[]) {
        const csvData = rules.map(rule => ({
            'Name': rule.name,
            'Status': rule.status,
            'Trigger': rule.trigger,
            'Triggered': rule.performance?.triggered || 0,
            'Completed': rule.performance?.completed || 0,
            'Conversion Rate': rule.performance?.conversion_rate || 0
        }));

        const ws = XLSX.utils.json_to_sheet(csvData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `automation_rules_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    /**
     * Export automation rules to PDF
     */
    exportAutomationRulesToPDF(rules: any[]) {
        const doc = new jsPDF();
        doc.text('Automation Rules Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

        const tableData = rules.map(rule => [
            rule.name,
            rule.status,
            rule.trigger,
            String(rule.performance?.triggered || 0),
            String(rule.performance?.completed || 0),
            `${(rule.performance?.conversion_rate || 0).toFixed(1)}%`
        ]);

        autoTable(doc, {
            startY: 30,
            head: [['Name', 'Status', 'Trigger', 'Triggered', 'Completed', 'Conv. Rate']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 8 }
        });

        doc.save(`automation_rules_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    exportROIToExcel(roiData: any[]): void {
        const ws = XLSX.utils.json_to_sheet(roiData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ROI Data');
        XLSX.writeFile(wb, `roi_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    exportAutomationAnalyticsToCSV(data: any): void {
        const rows = [
            ['Metric', 'Value'],
            ['Total Rules', data.totalRules],
            ['Active Rules', data.activeRules],
            ['Avg Triggers', data.avgTriggers],
            ['Avg Success Rate', data.avgSuccessRate + '%']
        ];
        const csv = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `automation_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    }

    exportAutomationAnalyticsToPDF(data: any): void {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Automation Analytics Report', 14, 20);
        
        autoTable(doc, {
            startY: 30,
            head: [['Metric', 'Value']],
            body: [
                ['Total Rules', data.totalRules],
                ['Active Rules', data.activeRules],
                ['Avg Triggers', data.avgTriggers],
                ['Avg Success Rate', data.avgSuccessRate + '%']
            ],
            styles: { fontSize: 8 }
        });

        doc.save(`automation_analytics_${new Date().toISOString().split('T')[0]}.pdf`);
    }
}

export const marketingExportService = new MarketingExportService();
export default marketingExportService;
