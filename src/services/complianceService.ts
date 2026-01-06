/**
 * Compliance Service
 * 
 * Automated compliance reporting for GDPR, SOC2, HIPAA, and other standards.
 * Generates audit reports, tracks compliance metrics, and monitors violations.
 */

import PocketBase, { RecordModel } from 'pocketbase';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { captureException, measurePerformance, addBreadcrumb } from '../lib/sentry';

// ==================== TYPES ====================

export type ComplianceStandard = 'GDPR' | 'SOC2' | 'HIPAA' | 'CCPA' | 'ISO27001' | 'PCI-DSS';
export type ComplianceStatus = 'compliant' | 'non-compliant' | 'partial' | 'pending-review';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ComplianceReport extends RecordModel {
    standard: ComplianceStandard;
    tenantId?: string;
    reportDate: string;
    period: {
        start: string;
        end: string;
    };
    status: ComplianceStatus;
    score: number; // 0-100
    violations: ComplianceViolation[];
    recommendations: string[];
    metrics: Record<string, any>;
    generatedBy: string;
    fileUrl?: string;
}

export interface ComplianceViolation extends RecordModel {
    standard: ComplianceStandard;
    tenantId?: string;
    violationType: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    detectedAt: string;
    resolvedAt?: string;
    status: 'open' | 'in-progress' | 'resolved' | 'false-positive';
    affectedRecords: number;
    remediationSteps: string[];
}

export interface ComplianceConfig extends RecordModel {
    standard: ComplianceStandard;
    tenantId?: string;
    enabled: boolean;
    frequency: ReportFrequency;
    emailRecipients: string[];
    thresholds: {
        minScore: number;
        criticalViolationsMax: number;
    };
    lastReportDate?: string;
    nextReportDate?: string;
}

export interface ComplianceMetrics {
    standard: ComplianceStandard;
    overallScore: number;
    violations: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
    };
    trends: {
        scoreChange: number;
        violationChange: number;
    };
    categories: Record<string, { score: number; violations: number }>;
}

// ==================== MOCK DATA ====================

const MOCK_REPORTS: ComplianceReport[] = [
    {
        id: '1',
        collectionId: 'compliance_reports',
        collectionName: 'compliance_reports',
        created: '2025-12-01T00:00:00Z',
        updated: '2025-12-01T00:00:00Z',
        standard: 'GDPR',
        reportDate: '2025-12-01',
        period: { start: '2025-11-01', end: '2025-11-30' },
        status: 'compliant',
        score: 92,
        violations: [],
        recommendations: ['Implement automated data deletion', 'Update privacy policy'],
        metrics: { dataRequests: 15, deletions: 3, breaches: 0 },
        generatedBy: 'system'
    }
];

const MOCK_VIOLATIONS: ComplianceViolation[] = [
    {
        id: '1',
        collectionId: 'compliance_violations',
        collectionName: 'compliance_violations',
        created: '2025-12-20T00:00:00Z',
        updated: '2025-12-20T00:00:00Z',
        standard: 'GDPR',
        violationType: 'data_retention',
        severity: 'high',
        description: 'User data retained beyond 90 days after account deletion',
        detectedAt: '2025-12-20T10:00:00Z',
        status: 'open',
        affectedRecords: 12,
        remediationSteps: ['Identify affected records', 'Implement auto-deletion policy']
    }
];

// ==================== SERVICE ====================

class ComplianceService {
    // ==================== REPORT GENERATION ====================

    async generateComplianceReport(
        standard: ComplianceStandard,
        tenantId?: string,
        period?: { start: Date; end: Date }
    ): Promise<ComplianceReport> {
        if (isMockEnv()) return MOCK_REPORTS[0];

        return measurePerformance('generateComplianceReport', async () => {
            try {
                addBreadcrumb('Generating compliance report', 'action', {
                    standard,
                    tenantId
                });

                const reportPeriod = period || {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    end: new Date()
                };

                // Gather compliance data
                const violations = await this.getViolations(standard, tenantId, reportPeriod);
                const metrics = await this.calculateMetrics(standard, tenantId, reportPeriod);
                const score = this.calculateComplianceScore(violations, metrics);
                const status = this.determineStatus(score, violations);
                const recommendations = this.generateRecommendations(standard, violations, metrics);

                // Create report
                const report = await pb.collection('compliance_reports').create<ComplianceReport>({
                    standard,
                    tenantId,
                    reportDate: new Date().toISOString().split('T')[0],
                    period: {
                        start: reportPeriod.start.toISOString().split('T')[0],
                        end: reportPeriod.end.toISOString().split('T')[0]
                    },
                    status,
                    score,
                    violations: violations.map(v => v.id),
                    recommendations,
                    metrics,
                    generatedBy: 'system'
                }) as unknown as ComplianceReport;

                // Generate PDF
                const pdfBlob = await this.generatePDF(report, violations);
                const formData = new FormData();
                formData.append('file', pdfBlob, `${standard}-report-${report.reportDate}.pdf`);
                const updatedReport = await pb.collection('compliance_reports').update(report.id, formData);

                addBreadcrumb('Compliance report generated', 'action', {
                    reportId: report.id,
                    standard,
                    score,
                    violations: violations.length
                });

                return updatedReport as unknown as ComplianceReport;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'compliance',
                    operation: 'generateComplianceReport',
                    standard,
                    tenantId
                });
                throw error;
            }
        }, { feature: 'compliance', standard, tenantId });
    }

    async getViolations(
        standard: ComplianceStandard,
        tenantId?: string,
        period?: { start: Date; end: Date }
    ): Promise<ComplianceViolation[]> {
        if (isMockEnv()) return MOCK_VIOLATIONS;

        let filter = `standard = "${standard}" && status != "resolved"`;
        if (tenantId) filter += ` && tenantId = "${tenantId}"`;
        if (period) {
            filter += ` && detectedAt >= "${period.start.toISOString()}" && detectedAt <= "${period.end.toISOString()}"`;
        }

        return await pb.collection('compliance_violations').getFullList<ComplianceViolation>({
            filter,
            sort: '-severity,-detectedAt',
            requestKey: null
        });
    }

    async calculateMetrics(
        standard: ComplianceStandard,
        tenantId?: string,
        period?: { start: Date; end: Date }
    ): Promise<Record<string, any>> {
        const metrics: Record<string, any> = {};

        switch (standard) {
            case 'GDPR':
                metrics.dataRequests = await this.countGDPRRequests(tenantId, period);
                metrics.deletions = await this.countDataDeletions(tenantId, period);
                metrics.breaches = await this.countSecurityBreaches(tenantId, period);
                metrics.consentRate = await this.calculateConsentRate(tenantId);
                metrics.dataRetentionCompliance = await this.checkDataRetention(tenantId);
                break;

            case 'SOC2':
                metrics.accessReviews = await this.countAccessReviews(tenantId, period);
                metrics.incidentResponses = await this.countIncidentResponses(tenantId, period);
                metrics.backupSuccess = await this.calculateBackupSuccessRate(tenantId, period);
                metrics.uptimePercentage = await this.calculateUptime(tenantId, period);
                metrics.encryptionCompliance = await this.checkEncryptionStatus(tenantId);
                break;

            case 'HIPAA':
                metrics.phiAccessLogs = await this.countPHIAccess(tenantId, period);
                metrics.encryptionStatus = await this.checkPHIEncryption(tenantId);
                metrics.auditTrailCompleteness = await this.checkAuditTrails(tenantId, period);
                metrics.riskAssessments = await this.countRiskAssessments(tenantId, period);
                break;

            case 'CCPA':
                metrics.doNotSellRequests = await this.countDoNotSellRequests(tenantId, period);
                metrics.dataDisclosures = await this.countDataDisclosures(tenantId, period);
                metrics.privacyPolicyUpdates = await this.countPrivacyPolicyUpdates(tenantId, period);
                break;

            default:
                metrics.general = await this.getGeneralMetrics(tenantId, period);
        }

        return metrics;
    }

    private calculateComplianceScore(
        violations: ComplianceViolation[],
        metrics: Record<string, any>
    ): number {
        let score = 100;

        // Deduct points based on violations
        violations.forEach(v => {
            switch (v.severity) {
                case 'critical': score -= 15; break;
                case 'high': score -= 10; break;
                case 'medium': score -= 5; break;
                case 'low': score -= 2; break;
            }
        });

        // Adjust based on metrics (example logic)
        if (metrics.breaches > 0) score -= 20;
        if (metrics.consentRate < 90) score -= 10;
        if (metrics.uptimePercentage < 99) score -= 5;

        return Math.max(0, Math.min(100, score));
    }

    private determineStatus(score: number, violations: ComplianceViolation[]): ComplianceStatus {
        const criticalViolations = violations.filter(v => v.severity === 'critical').length;

        if (criticalViolations > 0 || score < 60) return 'non-compliant';
        if (score >= 90 && violations.length === 0) return 'compliant';
        if (score >= 70) return 'partial';
        return 'pending-review';
    }

    private generateRecommendations(
        standard: ComplianceStandard,
        violations: ComplianceViolation[],
        metrics: Record<string, any>
    ): string[] {
        const recommendations: string[] = [];

        // General recommendations
        if (violations.length > 0) {
            recommendations.push(`Address ${violations.length} open violation(s) immediately`);
        }

        // Standard-specific recommendations
        switch (standard) {
            case 'GDPR':
                if (metrics.consentRate < 95) {
                    recommendations.push('Improve consent collection mechanisms');
                }
                if (metrics.dataRetentionCompliance < 90) {
                    recommendations.push('Implement automated data retention policies');
                }
                break;

            case 'SOC2':
                if (metrics.uptimePercentage < 99.9) {
                    recommendations.push('Enhance system availability monitoring');
                }
                if (metrics.backupSuccess < 100) {
                    recommendations.push('Review and improve backup procedures');
                }
                break;

            case 'HIPAA':
                if (metrics.encryptionStatus < 100) {
                    recommendations.push('Ensure all PHI is encrypted at rest and in transit');
                }
                if (metrics.auditTrailCompleteness < 100) {
                    recommendations.push('Complete audit trail implementation');
                }
                break;
        }

        return recommendations;
    }

    private async generatePDF(report: ComplianceReport, violations: ComplianceViolation[]): Promise<Blob> {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(24);
        doc.text(`${report.standard} Compliance Report`, 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Report Date: ${report.reportDate}`, 14, 30);
        doc.text(`Period: ${report.period.start} to ${report.period.end}`, 14, 35);
        doc.text(`Status: ${report.status.toUpperCase()}`, 14, 40);
        doc.text(`Compliance Score: ${report.score}/100`, 14, 45);

        // Executive Summary
        doc.setFontSize(16);
        doc.text('Executive Summary', 14, 55);
        doc.setFontSize(10);
        doc.text(`Overall compliance status: ${report.status}`, 14, 65);
        doc.text(`Total violations detected: ${violations.length}`, 14, 70);

        // Violations Table
        if (violations.length > 0) {
            doc.setFontSize(14);
            doc.text('Violations', 14, 85);

            autoTable(doc, {
                head: [['Severity', 'Type', 'Description', 'Status']],
                body: violations.map(v => [
                    v.severity,
                    v.violationType,
                    v.description.substring(0, 50) + '...',
                    v.status
                ]),
                startY: 90,
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38] }
            });
        }

        // Recommendations
        const finalY = (doc as any).lastAutoTable?.finalY || 100;
        doc.setFontSize(14);
        doc.text('Recommendations', 14, finalY + 15);
        doc.setFontSize(10);
        report.recommendations.forEach((rec, i) => {
            doc.text(`${i + 1}. ${rec}`, 14, finalY + 25 + (i * 7));
        });

        return doc.output('blob');
    }

    // ==================== METRIC CALCULATORS ====================

    private async countGDPRRequests(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        let filter = 'status != "cancelled"';
        if (tenantId) filter += ` && tenantId = "${tenantId}"`;
        if (period) {
            filter += ` && created >= "${period.start.toISOString()}" && created <= "${period.end.toISOString()}"`;
        }
        const requests = await pb.collection('gdpr_export_requests').getFullList({ filter, requestKey: null });
        return requests.length;
    }

    private async countDataDeletions(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        let filter = 'status = "completed"';
        if (tenantId) filter += ` && tenantId = "${tenantId}"`;
        if (period) {
            filter += ` && completedAt >= "${period.start.toISOString()}" && completedAt <= "${period.end.toISOString()}"`;
        }
        const deletions = await pb.collection('gdpr_deletion_requests').getFullList({ filter, requestKey: null });
        return deletions.length;
    }

    private async countSecurityBreaches(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        let filter = 'severity = "critical"';
        if (tenantId) filter += ` && tenantId = "${tenantId}"`;
        if (period) {
            filter += ` && created >= "${period.start.toISOString()}" && created <= "${period.end.toISOString()}"`;
        }
        const breaches = await pb.collection('system_alerts').getFullList({ filter, requestKey: null });
        return breaches.length;
    }

    private async calculateConsentRate(tenantId?: string): Promise<number> {
        // Mock implementation - would check user consent records
        return 95.5;
    }

    private async checkDataRetention(tenantId?: string): Promise<number> {
        // Mock implementation - would check data retention policies
        return 88.0;
    }

    private async countAccessReviews(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        // Mock implementation
        return 12;
    }

    private async countIncidentResponses(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        // Mock implementation
        return 3;
    }

    private async calculateBackupSuccessRate(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        // Mock implementation
        return 99.8;
    }

    private async calculateUptime(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        // Mock implementation
        return 99.95;
    }

    private async checkEncryptionStatus(tenantId?: string): Promise<number> {
        // Mock implementation
        return 100;
    }

    private async countPHIAccess(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        // Mock implementation
        return 1247;
    }

    private async checkPHIEncryption(tenantId?: string): Promise<number> {
        // Mock implementation
        return 100;
    }

    private async checkAuditTrails(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        // Mock implementation
        return 98.5;
    }

    private async countRiskAssessments(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        // Mock implementation
        return 4;
    }

    private async countDoNotSellRequests(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        // Mock implementation
        return 8;
    }

    private async countDataDisclosures(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        // Mock implementation
        return 15;
    }

    private async countPrivacyPolicyUpdates(tenantId?: string, period?: { start: Date; end: Date }): Promise<number> {
        // Mock implementation
        return 2;
    }

    private async getGeneralMetrics(tenantId?: string, period?: { start: Date; end: Date }): Promise<any> {
        return { placeholder: true };
    }

    // ==================== VIOLATION MANAGEMENT ====================

    async createViolation(violation: Omit<ComplianceViolation, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<ComplianceViolation> {
        if (isMockEnv()) {
            return { ...MOCK_VIOLATIONS[0], ...violation };
        }

        return await pb.collection('compliance_violations').create<ComplianceViolation>(violation);
    }

    async resolveViolation(id: string, resolution: string): Promise<ComplianceViolation> {
        if (isMockEnv()) {
            return { ...MOCK_VIOLATIONS[0], id, status: 'resolved' };
        }

        return await pb.collection('compliance_violations').update<ComplianceViolation>(id, {
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            resolution
        });
    }

    // ==================== UTILITIES ====================

    async getComplianceMetrics(standard: ComplianceStandard, tenantId?: string): Promise<ComplianceMetrics> {
        if (isMockEnv()) {
            return {
                standard,
                overallScore: 92,
                violations: { critical: 0, high: 2, medium: 5, low: 8, total: 15 },
                trends: { scoreChange: +3, violationChange: -2 },
                categories: {
                    'data-protection': { score: 95, violations: 2 },
                    'access-control': { score: 88, violations: 5 },
                    'audit-logging': { score: 92, violations: 3 }
                }
            };
        }

        const violations = await this.getViolations(standard, tenantId);
        const reports = await pb.collection('compliance_reports').getFullList<ComplianceReport>({
            filter: `standard = "${standard}"${tenantId ? ` && tenantId = "${tenantId}"` : ''}`,
            sort: '-reportDate',
            requestKey: null
        });

        const latestReport = reports[0];
        const previousReport = reports[1];

        return {
            standard,
            overallScore: latestReport?.score || 0,
            violations: {
                critical: violations.filter(v => v.severity === 'critical').length,
                high: violations.filter(v => v.severity === 'high').length,
                medium: violations.filter(v => v.severity === 'medium').length,
                low: violations.filter(v => v.severity === 'low').length,
                total: violations.length
            },
            trends: {
                scoreChange: latestReport && previousReport ? latestReport.score - previousReport.score : 0,
                violationChange: previousReport ? violations.length - (previousReport.violations?.length || 0) : 0
            },
            categories: {}
        };
    }

    async getReports(standard?: ComplianceStandard, tenantId?: string, limit?: number): Promise<ComplianceReport[]> {
        if (isMockEnv()) return MOCK_REPORTS;

        let filter = '';
        if (standard) filter = `standard = "${standard}"`;
        if (tenantId) filter = filter ? `${filter} && tenantId = "${tenantId}"` : `tenantId = "${tenantId}"`;

        return await pb.collection('compliance_reports').getFullList<ComplianceReport>({
            filter,
            sort: '-reportDate',
            requestKey: null
        });
    }
}

export const complianceService = new ComplianceService();
