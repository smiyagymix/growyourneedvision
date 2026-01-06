import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function createCollection(name, schema, extraOptions = {}) {
    try {
        console.log(`Creating collection: ${name}...`);
        await pb.collections.create({
            name,
            type: 'base',
            schema,
            ...extraOptions
        });
        console.log(`✅ Collection ${name} created successfully`);
    } catch (error) {
        if (error.message && error.message.includes('already exists')) {
            console.log(`⚠️ Collection ${name} already exists, skipping...`);
        } else {
            console.error(`❌ Error creating collection ${name}:`, error);
        }
    }
}

async function main() {
    try {
        console.log('Authenticating...');
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL || 'owner@growyourneed.com';
        const adminPass = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASS || 'Darnag12345678@';
        
        await pb.collection('_superusers').authWithPassword(adminEmail, adminPass);
        console.log('✅ Authenticated successfully');

        console.log('\n=== Creating Advanced Learning AI Collections ===\n');

        // Adaptive Learning Profiles Collection
        await createCollection('adaptive_learning_profiles', [
            {
                name: 'userId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true
                }
            },
            {
                name: 'subject',
                type: 'text',
                required: true
            },
            {
                name: 'difficultyLevel',
                type: 'number',
                required: true
            },
            {
                name: 'irtAbility',
                type: 'number',
                required: true
            },
            {
                name: 'learningPath',
                type: 'json',
                required: true
            },
            {
                name: 'recommendedContent',
                type: 'json',
                required: false
            },
            {
                name: 'completedTopics',
                type: 'json',
                required: false
            },
            {
                name: 'strugglingTopics',
                type: 'json',
                required: false
            },
            {
                name: 'lastAssessment',
                type: 'date',
                required: false
            },
            {
                name: 'nextReview',
                type: 'date',
                required: false
            },
            {
                name: 'performanceHistory',
                type: 'json',
                required: false
            }
        ]);

        // Learning Analytics Collection
        await createCollection('learning_analytics', [
            {
                name: 'userId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true
                }
            },
            {
                name: 'skillMastery',
                type: 'json',
                required: true
            },
            {
                name: 'studyTime',
                type: 'number',
                required: true
            },
            {
                name: 'studyTimeWeek',
                type: 'number',
                required: true
            },
            {
                name: 'studyTimeMonth',
                type: 'number',
                required: true
            },
            {
                name: 'streakDays',
                type: 'number',
                required: true
            },
            {
                name: 'bestStreak',
                type: 'number',
                required: true
            },
            {
                name: 'lastStudyDate',
                type: 'date',
                required: false
            },
            {
                name: 'skillGaps',
                type: 'json',
                required: false
            },
            {
                name: 'predictions',
                type: 'json',
                required: false
            },
            {
                name: 'performanceTrend',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['improving', 'stable', 'declining']
                }
            },
            {
                name: 'riskScore',
                type: 'number',
                required: false
            },
            {
                name: 'engagementScore',
                type: 'number',
                required: true
            }
        ]);

        // Micro Credentials Collection
        await createCollection('micro_credentials', [
            {
                name: 'credentialId',
                type: 'text',
                required: true
            },
            {
                name: 'userId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true
                }
            },
            {
                name: 'badgeName',
                type: 'text',
                required: true
            },
            {
                name: 'badgeIcon',
                type: 'text',
                required: false
            },
            {
                name: 'description',
                type: 'text',
                required: true
            },
            {
                name: 'issuer',
                type: 'text',
                required: true
            },
            {
                name: 'issuerId',
                type: 'relation',
                required: false,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false
                }
            },
            {
                name: 'issuedDate',
                type: 'date',
                required: true
            },
            {
                name: 'expiryDate',
                type: 'date',
                required: false
            },
            {
                name: 'verificationUrl',
                type: 'url',
                required: false
            },
            {
                name: 'blockchainHash',
                type: 'text',
                required: false
            },
            {
                name: 'metadata',
                type: 'json',
                required: false
            },
            {
                name: 'skills',
                type: 'json',
                required: false
            },
            {
                name: 'category',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['course_completion', 'skill_mastery', 'project', 'assessment', 'participation']
                }
            },
            {
                name: 'level',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['beginner', 'intermediate', 'advanced', 'expert']
                }
            },
            {
                name: 'status',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['active', 'expired', 'revoked']
                }
            },
            {
                name: 'public',
                type: 'bool',
                required: true
            }
        ]);

        // Skill Assessments Collection
        await createCollection('skill_assessments', [
            {
                name: 'userId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true
                }
            },
            {
                name: 'skill',
                type: 'text',
                required: true
            },
            {
                name: 'score',
                type: 'number',
                required: true
            },
            {
                name: 'maxScore',
                type: 'number',
                required: true
            },
            {
                name: 'percentage',
                type: 'number',
                required: true
            },
            {
                name: 'assessmentType',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['quiz', 'project', 'assignment', 'exam', 'practical']
                }
            },
            {
                name: 'takenAt',
                type: 'date',
                required: true
            },
            {
                name: 'timeTaken',
                type: 'number',
                required: false
            },
            {
                name: 'recommendations',
                type: 'json',
                required: false
            },
            {
                name: 'strengths',
                type: 'json',
                required: false
            },
            {
                name: 'weaknesses',
                type: 'json',
                required: false
            },
            {
                name: 'nextSteps',
                type: 'json',
                required: false
            }
        ]);

        // Learning Path Recommendations Collection
        await createCollection('learning_path_recommendations', [
            {
                name: 'userId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true
                }
            },
            {
                name: 'pathName',
                type: 'text',
                required: true
            },
            {
                name: 'description',
                type: 'text',
                required: true
            },
            {
                name: 'subjects',
                type: 'json',
                required: true
            },
            {
                name: 'estimatedDuration',
                type: 'number',
                required: true
            },
            {
                name: 'difficulty',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['beginner', 'intermediate', 'advanced']
                }
            },
            {
                name: 'prerequisites',
                type: 'json',
                required: false
            },
            {
                name: 'milestones',
                type: 'json',
                required: true
            },
            {
                name: 'progress',
                type: 'number',
                required: true
            },
            {
                name: 'status',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['suggested', 'in_progress', 'completed', 'abandoned']
                }
            },
            {
                name: 'aiGenerated',
                type: 'bool',
                required: true
            },
            {
                name: 'matchScore',
                type: 'number',
                required: false
            }
        ]);

        console.log('\n✅ Advanced Learning AI schema initialization complete!');
        console.log('\n📊 Created Collections:');
        console.log('  - adaptive_learning_profiles');
        console.log('  - learning_analytics');
        console.log('  - micro_credentials');
        console.log('  - skill_assessments');
        console.log('  - learning_path_recommendations');
        console.log('\n✨ Next steps:');
        console.log('  1. Run: node scripts/seed-advanced-learning-data.js');
        console.log('  2. Create Advanced Learning service: src/services/advancedLearningService.ts');
        console.log('  3. Integrate ML framework (TensorFlow.js or PyTorch)');
        console.log('  4. Implement IRT algorithm for adaptive learning');
        console.log('  5. Set up ClickHouse for learning analytics');
    } catch (error) {
        console.error('❌ Schema initialization failed:', error);
        process.exit(1);
    }
}

main();
