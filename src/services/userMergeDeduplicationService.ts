/**
 * User Merge/Deduplication Service
 * 
 * Detect and merge duplicate user accounts with conflict resolution,
 * data preservation, and audit logging
 */

import pb from '../lib/pocketbase';
import * as Sentry from '@sentry/react';
import { isMockEnv } from '../utils/mockData';

export interface DuplicateUser {
    primaryUser: any;
    duplicates: any[];
    confidence: number; // 0-100
    matchFields: string[];
    reason: string;
}

export interface MergeStrategy {
    field: string;
    resolution: 'keep_primary' | 'keep_duplicate' | 'merge_both' | 'newest' | 'oldest';
}

export interface MergeOptions {
    primaryUserId: string;
    duplicateUserIds: string[];
    strategies: MergeStrategy[];
    deleteAfterMerge: boolean;
    notifyUsers: boolean;
}

export interface MergeResult {
    success: boolean;
    mergedUserId: string;
    mergedFields: string[];
    preservedData: Record<string, any>;
    errors: string[];
}

const MOCK_DUPLICATES: DuplicateUser[] = [
    {
        primaryUser: { id: '1', name: 'John Doe', email: 'john@school.com', created: '2024-01-01' },
        duplicates: [
            { id: '2', name: 'John Doe', email: 'john.doe@school.com', created: '2024-02-01' },
            { id: '3', name: 'J Doe', email: 'john@school.com', created: '2024-03-01' }
        ],
        confidence: 95,
        matchFields: ['email', 'name'],
        reason: 'Exact email match and similar names'
    }
];

class UserMergeDeduplicationService {
    /**
     * Detect potential duplicate users
     */
    async detectDuplicates(tenantId?: string, threshold: number = 80): Promise<DuplicateUser[]> {
        return await Sentry.startSpan(
            { name: 'detectDuplicates', op: 'user.dedupe' },
            async () => {
                try {
                    if (isMockEnv()) {
                        return MOCK_DUPLICATES;
                    }

                    const filter = tenantId ? `tenantId = "${tenantId}"` : undefined;
                    const users = await pb.collection('users').getFullList({
                        filter,
                        requestKey: null
                    });

                    const duplicates: DuplicateUser[] = [];
                    const processed = new Set<string>();

                    for (let i = 0; i < users.length; i++) {
                        const user = users[i];
                        if (processed.has(user.id)) continue;

                        const matches: any[] = [];

                        for (let j = i + 1; j < users.length; j++) {
                            const otherUser = users[j];
                            if (processed.has(otherUser.id)) continue;

                            const similarity = this.calculateSimilarity(user, otherUser);

                            if (similarity.confidence >= threshold) {
                                matches.push(otherUser);
                                processed.add(otherUser.id);
                            }
                        }

                        if (matches.length > 0) {
                            const similarity = this.calculateSimilarity(user, matches[0]);
                            duplicates.push({
                                primaryUser: user,
                                duplicates: matches,
                                confidence: similarity.confidence,
                                matchFields: similarity.matchFields,
                                reason: similarity.reason
                            });
                            processed.add(user.id);
                        }
                    }

                    return duplicates;
                } catch (error) {
                    Sentry.captureException(error);
                    throw error;
                }
            }
        );
    }

    /**
     * Merge duplicate users
     */
    async mergeUsers(options: MergeOptions): Promise<MergeResult> {
        return await Sentry.startSpan(
            { name: 'mergeUsers', op: 'user.merge' },
            async () => {
                try {
                    if (isMockEnv()) {
                        return {
                            success: true,
                            mergedUserId: options.primaryUserId,
                            mergedFields: ['email', 'name', 'courses', 'assignments'],
                            preservedData: { originalIds: options.duplicateUserIds },
                            errors: []
                        };
                    }

                    const primaryUser = await pb.collection('users').getOne(options.primaryUserId, { requestKey: null });
                    const duplicateUsers = await Promise.all(
                        options.duplicateUserIds.map(id =>
                            pb.collection('users').getOne(id, { requestKey: null })
                        )
                    );

                    // Merge data according to strategies
                    const mergedData: any = { ...primaryUser };
                    const mergedFields: string[] = [];
                    const errors: string[] = [];

                    for (const strategy of options.strategies) {
                        try {
                            const value = this.resolveField(
                                primaryUser,
                                duplicateUsers,
                                strategy.field,
                                strategy.resolution
                            );

                            if (value !== undefined) {
                                mergedData[strategy.field] = value;
                                mergedFields.push(strategy.field);
                            }
                        } catch (error: any) {
                            errors.push(`Failed to merge field ${strategy.field}: ${error.message}`);
                        }
                    }

                    // Update primary user
                    await pb.collection('users').update(options.primaryUserId, mergedData);

                    // Transfer related records
                    await this.transferRelatedRecords(options.primaryUserId, options.duplicateUserIds);

                    // Archive duplicate users instead of deleting
                    if (options.deleteAfterMerge) {
                        for (const userId of options.duplicateUserIds) {
                            await pb.collection('users').update(userId, {
                                status: 'merged',
                                mergedInto: options.primaryUserId,
                                mergedAt: new Date().toISOString()
                            });
                        }
                    }

                    // Create merge audit log
                    await this.logMerge(options);

                    // Send notifications if requested
                    if (options.notifyUsers) {
                        await this.notifyMerge(options.primaryUserId, duplicateUsers);
                    }

                    return {
                        success: true,
                        mergedUserId: options.primaryUserId,
                        mergedFields,
                        preservedData: {
                            originalIds: options.duplicateUserIds,
                            duplicateUsers: duplicateUsers.map(u => ({ id: u.id, email: u.email }))
                        },
                        errors
                    };
                } catch (error) {
                    Sentry.captureException(error);
                    throw error;
                }
            }
        );
    }

    /**
     * Preview merge without executing
     */
    async previewMerge(options: MergeOptions): Promise<{
        primaryUser: any;
        mergedData: any;
        conflicts: { field: string; values: any[] }[];
        affectedRecords: { collection: string; count: number }[];
    }> {
        try {
            if (isMockEnv()) {
                return {
                    primaryUser: { id: '1', name: 'John Doe', email: 'john@school.com' },
                    mergedData: { name: 'John Doe', email: 'john@school.com', courses: ['Course1', 'Course2', 'Course3'] },
                    conflicts: [
                        { field: 'phone', values: ['123-456-7890', '098-765-4321'] }
                    ],
                    affectedRecords: [
                        { collection: 'enrollments', count: 5 },
                        { collection: 'assignments', count: 12 }
                    ]
                };
            }

            const primaryUser = await pb.collection('users').getOne(options.primaryUserId, { requestKey: null });
            const duplicateUsers = await Promise.all(
                options.duplicateUserIds.map(id =>
                    pb.collection('users').getOne(id, { requestKey: null })
                )
            );

            // Build merged data
            const mergedData: any = { ...primaryUser };
            const conflicts: { field: string; values: any[] }[] = [];

            for (const strategy of options.strategies) {
                const values = [primaryUser[strategy.field], ...duplicateUsers.map(u => u[strategy.field])].filter(Boolean);
                const uniqueValues = Array.from(new Set(values));

                if (uniqueValues.length > 1) {
                    conflicts.push({ field: strategy.field, values: uniqueValues });
                }

                mergedData[strategy.field] = this.resolveField(
                    primaryUser,
                    duplicateUsers,
                    strategy.field,
                    strategy.resolution
                );
            }

            // Count affected records
            const affectedRecords = await this.countAffectedRecords(options.duplicateUserIds);

            return {
                primaryUser,
                mergedData,
                conflicts,
                affectedRecords
            };
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Get merge history
     */
    async getMergeHistory(limit: number = 50): Promise<any[]> {
        try {
            if (isMockEnv()) {
                return [
                    {
                        id: '1',
                        primaryUserId: '1',
                        duplicateUserIds: ['2', '3'],
                        mergedAt: new Date().toISOString(),
                        mergedBy: 'admin@school.com'
                    }
                ];
            }

            return await pb.collection('user_merge_logs').getList(1, limit, {
                sort: '-created',
                requestKey: null
            }).then(res => res.items);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Undo merge (restore duplicates)
     */
    async undoMerge(mergeId: string): Promise<void> {
        try {
            if (isMockEnv()) return;

            const mergeLog = await pb.collection('user_merge_logs').getOne(mergeId, { requestKey: null });

            // Restore merged users
            const duplicateIds = JSON.parse(mergeLog.duplicateUserIds);
            for (const userId of duplicateIds) {
                await pb.collection('users').update(userId, {
                    status: 'active',
                    mergedInto: null,
                    mergedAt: null
                });
            }

            // Mark merge as undone
            await pb.collection('user_merge_logs').update(mergeId, {
                status: 'undone',
                undoneAt: new Date().toISOString()
            });
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Calculate similarity between two users
     */
    private calculateSimilarity(user1: any, user2: any): {
        confidence: number;
        matchFields: string[];
        reason: string;
    } {
        let score = 0;
        const matchFields: string[] = [];
        const reasons: string[] = [];

        // Email match (highest weight)
        if (user1.email && user2.email) {
            if (user1.email.toLowerCase() === user2.email.toLowerCase()) {
                score += 50;
                matchFields.push('email');
                reasons.push('exact email match');
            } else if (this.isSimilarEmail(user1.email, user2.email)) {
                score += 30;
                matchFields.push('email');
                reasons.push('similar email');
            }
        }

        // Name match
        if (user1.name && user2.name) {
            const similarity = this.stringSimilarity(user1.name, user2.name);
            if (similarity > 0.8) {
                score += 30;
                matchFields.push('name');
                reasons.push('similar name');
            }
        }

        // Username match
        if (user1.username && user2.username) {
            if (user1.username === user2.username) {
                score += 20;
                matchFields.push('username');
                reasons.push('exact username match');
            }
        }

        return {
            confidence: Math.min(score, 100),
            matchFields,
            reason: reasons.join(', ')
        };
    }

    /**
     * Check if emails are similar (e.g., john@school.com vs john.doe@school.com)
     */
    private isSimilarEmail(email1: string, email2: string): boolean {
        const [user1, domain1] = email1.toLowerCase().split('@');
        const [user2, domain2] = email2.toLowerCase().split('@');

        if (domain1 !== domain2) return false;

        // Remove dots and check
        const clean1 = user1.replace(/\./g, '');
        const clean2 = user2.replace(/\./g, '');

        return clean1 === clean2 || this.stringSimilarity(clean1, clean2) > 0.8;
    }

    /**
     * Calculate string similarity (Levenshtein distance)
     */
    private stringSimilarity(str1: string, str2: string): number {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();

        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;

        if (longer.length === 0) return 1.0;

        return (longer.length - this.editDistance(longer, shorter)) / longer.length;
    }

    /**
     * Calculate edit distance between strings
     */
    private editDistance(s1: string, s2: string): number {
        const costs: number[] = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    /**
     * Resolve field value based on merge strategy
     */
    private resolveField(
        primary: any,
        duplicates: any[],
        field: string,
        resolution: MergeStrategy['resolution']
    ): any {
        switch (resolution) {
            case 'keep_primary':
                return primary[field];

            case 'keep_duplicate':
                return duplicates[0]?.[field] || primary[field];

            case 'merge_both':
                // For arrays, merge; for strings, concatenate
                const values = [primary[field], ...duplicates.map(d => d[field])].filter(Boolean);
                if (Array.isArray(primary[field])) {
                    return Array.from(new Set(values.flat()));
                }
                return values[0]; // For non-arrays, just take first non-empty

            case 'newest':
                const allUsers = [primary, ...duplicates];
                allUsers.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
                return allUsers[0][field];

            case 'oldest':
                const allUsersOldest = [primary, ...duplicates];
                allUsersOldest.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
                return allUsersOldest[0][field];

            default:
                return primary[field];
        }
    }

    /**
     * Transfer related records from duplicates to primary
     */
    private async transferRelatedRecords(primaryUserId: string, duplicateUserIds: string[]): Promise<void> {
        const relatedCollections = [
            'enrollments',
            'assignments',
            'grades',
            'attendance',
            'messages'
        ];

        for (const collection of relatedCollections) {
            try {
                for (const duplicateId of duplicateUserIds) {
                    const records = await pb.collection(collection).getFullList({
                        filter: `userId = "${duplicateId}"`,
                        requestKey: null
                    });

                    for (const record of records) {
                        await pb.collection(collection).update(record.id, {
                            userId: primaryUserId
                        });
                    }
                }
            } catch (error) {
                console.error(`Error transferring records from ${collection}:`, error);
            }
        }
    }

    /**
     * Count affected records for preview
     */
    private async countAffectedRecords(duplicateUserIds: string[]): Promise<{ collection: string; count: number }[]> {
        const relatedCollections = [
            'enrollments',
            'assignments',
            'grades',
            'attendance',
            'messages'
        ];

        const counts: { collection: string; count: number }[] = [];

        for (const collection of relatedCollections) {
            try {
                let totalCount = 0;
                for (const userId of duplicateUserIds) {
                    const result = await pb.collection(collection).getList(1, 1, {
                        filter: `userId = "${userId}"`,
                        requestKey: null
                    });
                    totalCount += result.totalItems;
                }
                if (totalCount > 0) {
                    counts.push({ collection, count: totalCount });
                }
            } catch (error) {
                console.error(`Error counting records in ${collection}:`, error);
            }
        }

        return counts;
    }

    /**
     * Log merge operation
     */
    private async logMerge(options: MergeOptions): Promise<void> {
        try {
            await pb.collection('user_merge_logs').create({
                primaryUserId: options.primaryUserId,
                duplicateUserIds: JSON.stringify(options.duplicateUserIds),
                strategies: JSON.stringify(options.strategies),
                status: 'completed',
                mergedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error logging merge:', error);
        }
    }

    /**
     * Notify users about merge
     */
    private async notifyMerge(primaryUserId: string, duplicateUsers: any[]): Promise<void> {
        // Implementation would integrate with notification service
        console.log(`Notifying user ${primaryUserId} about merge of ${duplicateUsers.length} accounts`);
    }
}

export const userMergeDeduplicationService = new UserMergeDeduplicationService();
