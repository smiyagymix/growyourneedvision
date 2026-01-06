/**
 * Penetration Test Tracking Service
 * 
 * Track and manage security penetration tests and vulnerability assessments
 */

import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';
import * as Sentry from '@sentry/react';

export interface PenetrationTest extends RecordModel {
    name: string;
    description: string;
    type: 'automated' | 'manual' | 'social_engineering' | 'physical';
    scope: string[];
    tester: string;
    testerCompany?: string;
    scheduledDate: Date;
    completedDate?: Date;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    severity: 'low' | 'medium' | 'high' | 'critical';
    findings: number;
    vulnerabilities: Vulnerability[];
    reportUrl?: string;
    tenantId?: string;
}

export interface Vulnerability extends RecordModel {
    testId: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cvss_score?: number;
    cve_id?: string;
    category: string;
    affectedSystem: string;
    exploitability: 'none' | 'low' | 'medium' | 'high';
    status: 'open' | 'in_progress' | 'resolved' | 'accepted' | 'false_positive';
    discoveredDate: Date;
    resolvedDate?: Date;
    assignedTo?: string;
    remediationSteps: string;
    remediationPriority: 'low' | 'medium' | 'high' | 'critical';
    estimatedEffort?: string;
    actualEffort?: string;
    verificationStatus?: 'not_started' | 'pending' | 'verified' | 'failed';
    notes?: string;
}

export interface TestStatistics {
    totalTests: number;
    completedTests: number;
    scheduledTests: number;
    inProgressTests: number;
    totalVulnerabilities: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    resolvedVulnerabilities: number;
    averageResolutionTime: number;
    vulnerabilitiesByCategory: { category: string; count: number }[];
    testsByType: { type: string; count: number }[];
    vulnerabilityTrend: { month: string; count: number }[];
}

// Mock data
const MOCK_TESTS: PenetrationTest[] = [
    {
        id: '1',
        name: 'Q1 2024 Security Assessment',
        description: 'Comprehensive security testing of web application',
        type: 'automated',
        scope: ['Web Application', 'API', 'Database'],
        tester: 'Security Team',
        testerCompany: 'SecureIT',
        scheduledDate: new Date('2024-01-15'),
        completedDate: new Date('2024-01-20'),
        status: 'completed',
        severity: 'high',
        findings: 15,
        vulnerabilities: [],
        reportUrl: 'https://example.com/report1.pdf',
        created: '2024-01-15',
        updated: '2024-01-20',
        collectionId: 'penetration_tests',
        collectionName: 'penetration_tests'
    }
];

const MOCK_VULNERABILITIES: Vulnerability[] = [
    {
        id: '1',
        testId: '1',
        title: 'SQL Injection in Login Form',
        description: 'SQL injection vulnerability found in authentication endpoint',
        severity: 'critical',
        cvss_score: 9.8,
        cve_id: 'CVE-2024-1234',
        category: 'Injection',
        affectedSystem: 'Authentication API',
        exploitability: 'high',
        status: 'resolved',
        discoveredDate: new Date('2024-01-16'),
        resolvedDate: new Date('2024-01-18'),
        assignedTo: 'dev1',
        remediationSteps: 'Use parameterized queries',
        remediationPriority: 'critical',
        estimatedEffort: '2 days',
        actualEffort: '1.5 days',
        verificationStatus: 'verified',
        created: '2024-01-16',
        updated: '2024-01-18',
        collectionId: 'vulnerabilities',
        collectionName: 'vulnerabilities'
    }
];

class PenetrationTestTrackingService {
    /**
     * Schedule a new penetration test
     */
    async scheduleTest(test: Partial<PenetrationTest>): Promise<PenetrationTest> {
        return await Sentry.startSpan(
            {
                name: 'Schedule Penetration Test',
                op: 'pentest.schedule'
            },
            async () => {
                try {
                    if (isMockEnv()) {
                        return MOCK_TESTS[0];
                    }

                    const newTest = await pb.collection('penetration_tests').create<PenetrationTest>({
                        ...test,
                        status: 'scheduled',
                        findings: 0,
                        vulnerabilities: []
                    });

                    return newTest;
                } catch (error) {
                    console.error('Failed to schedule test:', error);
                    throw error;
                }
            }
        );
    }

    /**
     * Update test status
     */
    async updateTestStatus(
        testId: string,
        status: PenetrationTest['status'],
        completedDate?: Date
    ): Promise<PenetrationTest> {
        try {
            if (isMockEnv()) {
                return { ...MOCK_TESTS[0], status };
            }

            const updates: any = { status };
            if (completedDate) {
                updates.completedDate = completedDate;
            }

            return await pb.collection('penetration_tests').update(testId, updates);
        } catch (error) {
            console.error('Failed to update test status:', error);
            throw error;
        }
    }

    /**
     * Get all tests
     */
    async getTests(
        filters?: {
            status?: string;
            type?: string;
            tenantId?: string;
        },
        page: number = 1,
        perPage: number = 20
    ): Promise<{ items: PenetrationTest[]; totalPages: number }> {
        try {
            if (isMockEnv()) {
                return { items: MOCK_TESTS, totalPages: 1 };
            }

            const filterParts: string[] = [];
            if (filters?.status) {
                filterParts.push(`status = "${filters.status}"`);
            }
            if (filters?.type) {
                filterParts.push(`type = "${filters.type}"`);
            }
            if (filters?.tenantId) {
                filterParts.push(`tenantId = "${filters.tenantId}"`);
            }

            const filterQuery = filterParts.length > 0 ? filterParts.join(' && ') : '';

            const result = await pb.collection('penetration_tests').getList<PenetrationTest>(
                page,
                perPage,
                {
                    filter: filterQuery,
                    sort: '-scheduledDate',
                    requestKey: null
                }
            );

            return result;
        } catch (error) {
            console.error('Failed to get tests:', error);
            throw error;
        }
    }

    /**
     * Add vulnerability to test
     */
    async addVulnerability(vulnerability: Partial<Vulnerability>): Promise<Vulnerability> {
        return await Sentry.startSpan(
            {
                name: 'Add Vulnerability',
                op: 'vulnerability.create'
            },
            async () => {
                try {
                    if (isMockEnv()) {
                        return MOCK_VULNERABILITIES[0];
                    }

                    const newVuln = await pb.collection('vulnerabilities').create<Vulnerability>({
                        ...vulnerability,
                        status: 'open',
                        discoveredDate: new Date()
                    });

                    // Update test findings count
                    const test = await pb.collection('penetration_tests').getOne(vulnerability.testId!);
                    await pb.collection('penetration_tests').update(vulnerability.testId!, {
                        findings: (test.findings || 0) + 1
                    });

                    // Log critical vulnerabilities to Sentry
                    if (vulnerability.severity === 'critical' || vulnerability.severity === 'high') {
                        Sentry.captureMessage(`${vulnerability.severity.toUpperCase()} vulnerability found: ${vulnerability.title}`, {
                            level: 'warning',
                            extra: {
                                testId: vulnerability.testId,
                                severity: vulnerability.severity,
                                category: vulnerability.category
                            }
                        });
                    }

                    return newVuln;
                } catch (error) {
                    console.error('Failed to add vulnerability:', error);
                    throw error;
                }
            }
        );
    }

    /**
     * Update vulnerability status
     */
    async updateVulnerability(
        vulnId: string,
        updates: Partial<Vulnerability>
    ): Promise<Vulnerability> {
        try {
            if (isMockEnv()) {
                return { ...MOCK_VULNERABILITIES[0], ...updates };
            }

            if (updates.status === 'resolved' && !updates.resolvedDate) {
                updates.resolvedDate = new Date();
            }

            return await pb.collection('vulnerabilities').update(vulnId, updates);
        } catch (error) {
            console.error('Failed to update vulnerability:', error);
            throw error;
        }
    }

    /**
     * Get vulnerabilities for a test
     */
    async getVulnerabilities(
        testId: string,
        filters?: {
            severity?: string;
            status?: string;
            category?: string;
        }
    ): Promise<Vulnerability[]> {
        try {
            if (isMockEnv()) {
                return MOCK_VULNERABILITIES;
            }

            const filterParts: string[] = [`testId = "${testId}"`];
            
            if (filters?.severity) {
                filterParts.push(`severity = "${filters.severity}"`);
            }
            if (filters?.status) {
                filterParts.push(`status = "${filters.status}"`);
            }
            if (filters?.category) {
                filterParts.push(`category = "${filters.category}"`);
            }

            const filterQuery = filterParts.join(' && ');

            return await pb.collection('vulnerabilities').getFullList<Vulnerability>({
                filter: filterQuery,
                sort: '-severity,-cvss_score',
                requestKey: null
            });
        } catch (error) {
            console.error('Failed to get vulnerabilities:', error);
            throw error;
        }
    }

    /**
     * Get all open vulnerabilities across all tests
     */
    async getAllOpenVulnerabilities(tenantId?: string): Promise<Vulnerability[]> {
        try {
            if (isMockEnv()) {
                return MOCK_VULNERABILITIES.filter(v => v.status === 'open');
            }

            let filter = 'status = "open" || status = "in_progress"';
            if (tenantId) {
                // Get tests for tenant first
                const tests = await pb.collection('penetration_tests').getFullList({
                    filter: `tenantId = "${tenantId}"`,
                    fields: 'id',
                    requestKey: null
                });
                
                const testIds = tests.map(t => `testId = "${t.id}"`).join(' || ');
                if (testIds) {
                    filter += ` && (${testIds})`;
                }
            }

            return await pb.collection('vulnerabilities').getFullList<Vulnerability>({
                filter,
                sort: '-severity,-cvss_score',
                requestKey: null
            });
        } catch (error) {
            console.error('Failed to get open vulnerabilities:', error);
            throw error;
        }
    }

    /**
     * Get statistics
     */
    async getStatistics(tenantId?: string): Promise<TestStatistics> {
        return await Sentry.startSpan(
            {
                name: 'Get Test Statistics',
                op: 'pentest.stats'
            },
            async () => {
                try {
                    if (isMockEnv()) {
                return {
                    totalTests: 12,
                    completedTests: 8,
                    scheduledTests: 3,
                    inProgressTests: 1,
                    totalVulnerabilities: 45,
                    criticalVulnerabilities: 3,
                    highVulnerabilities: 8,
                    resolvedVulnerabilities: 35,
                    averageResolutionTime: 5.2,
                    vulnerabilitiesByCategory: [
                        { category: 'Injection', count: 12 },
                        { category: 'Authentication', count: 8 },
                        { category: 'XSS', count: 7 }
                    ],
                    testsByType: [
                        { type: 'automated', count: 7 },
                        { type: 'manual', count: 5 }
                    ],
                    vulnerabilityTrend: [
                        { month: '2024-01', count: 15 },
                        { month: '2024-02', count: 12 },
                        { month: '2024-03', count: 18 }
                    ]
                };
            }

            // Get all tests
            let testFilter = '';
            if (tenantId) {
                testFilter = `tenantId = "${tenantId}"`;
            }

            const allTests = await pb.collection('penetration_tests').getFullList<PenetrationTest>({
                filter: testFilter,
                requestKey: null
            });

            const totalTests = allTests.length;
            const completedTests = allTests.filter(t => t.status === 'completed').length;
            const scheduledTests = allTests.filter(t => t.status === 'scheduled').length;
            const inProgressTests = allTests.filter(t => t.status === 'in_progress').length;

            // Get all vulnerabilities
            const testIds = allTests.map(t => t.id);
            let vulnFilter = testIds.length > 0
                ? testIds.map(id => `testId = "${id}"`).join(' || ')
                : 'testId = ""'; // Will return empty result

            const allVulns = await pb.collection('vulnerabilities').getFullList<Vulnerability>({
                filter: vulnFilter,
                requestKey: null
            });

            const totalVulnerabilities = allVulns.length;
            const criticalVulnerabilities = allVulns.filter(v => v.severity === 'critical').length;
            const highVulnerabilities = allVulns.filter(v => v.severity === 'high').length;
            const resolvedVulnerabilities = allVulns.filter(v => v.status === 'resolved').length;

            // Calculate average resolution time
            const resolvedVulns = allVulns.filter(v => v.status === 'resolved' && v.resolvedDate);
            const totalResolutionTime = resolvedVulns.reduce((sum, v) => {
                const discovered = new Date(v.discoveredDate).getTime();
                const resolved = new Date(v.resolvedDate!).getTime();
                return sum + (resolved - discovered) / (1000 * 60 * 60 * 24); // days
            }, 0);
            const averageResolutionTime = resolvedVulns.length > 0
                ? totalResolutionTime / resolvedVulns.length
                : 0;

            // Vulnerabilities by category
            const categoryCounts = new Map<string, number>();
            allVulns.forEach(v => {
                categoryCounts.set(v.category, (categoryCounts.get(v.category) || 0) + 1);
            });
            const vulnerabilitiesByCategory = Array.from(categoryCounts.entries())
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count);

            // Tests by type
            const typeCounts = new Map<string, number>();
            allTests.forEach(t => {
                typeCounts.set(t.type, (typeCounts.get(t.type) || 0) + 1);
            });
            const testsByType = Array.from(typeCounts.entries())
                .map(([type, count]) => ({ type, count }));

            // Vulnerability trend (last 6 months)
            const monthCounts = new Map<string, number>();
            allVulns.forEach(v => {
                const month = new Date(v.discoveredDate).toISOString().substring(0, 7);
                monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
            });
            const vulnerabilityTrend = Array.from(monthCounts.entries())
                .map(([month, count]) => ({ month, count }))
                .sort((a, b) => a.month.localeCompare(b.month))
                .slice(-6);

                    return {
                        totalTests,
                        completedTests,
                        scheduledTests,
                        inProgressTests,
                        totalVulnerabilities,
                        criticalVulnerabilities,
                        highVulnerabilities,
                        resolvedVulnerabilities,
                        averageResolutionTime,
                        vulnerabilitiesByCategory,
                        testsByType,
                        vulnerabilityTrend
                    };
                } catch (error) {
                    console.error('Failed to get statistics:', error);
                    throw error;
                }
            }
        );
    }

    /**
     * Generate test report
     */
    async generateReport(testId: string): Promise<{
        test: PenetrationTest;
        vulnerabilities: Vulnerability[];
        summary: {
            totalFindings: number;
            bySeverity: Record<string, number>;
            byStatus: Record<string, number>;
            avgCVSS: number;
        };
    }> {
        try {
            if (isMockEnv()) {
                return {
                    test: MOCK_TESTS[0],
                    vulnerabilities: MOCK_VULNERABILITIES,
                    summary: {
                        totalFindings: 15,
                        bySeverity: { critical: 2, high: 5, medium: 6, low: 2 },
                        byStatus: { open: 3, in_progress: 4, resolved: 8 },
                        avgCVSS: 6.7
                    }
                };
            }

            const test = await pb.collection('penetration_tests').getOne<PenetrationTest>(testId);
            const vulnerabilities = await this.getVulnerabilities(testId);

            const bySeverity: Record<string, number> = {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            };
            const byStatus: Record<string, number> = {
                open: 0,
                in_progress: 0,
                resolved: 0,
                accepted: 0,
                false_positive: 0
            };
            let totalCVSS = 0;
            let cvssCount = 0;

            vulnerabilities.forEach(v => {
                bySeverity[v.severity]++;
                byStatus[v.status]++;
                if (v.cvss_score) {
                    totalCVSS += v.cvss_score;
                    cvssCount++;
                }
            });

            return {
                test,
                vulnerabilities,
                summary: {
                    totalFindings: vulnerabilities.length,
                    bySeverity,
                    byStatus,
                    avgCVSS: cvssCount > 0 ? totalCVSS / cvssCount : 0
                }
            };
        } catch (error) {
            console.error('Failed to generate report:', error);
            throw error;
        }
    }
}

export const penetrationTestTrackingService = new PenetrationTestTrackingService();
