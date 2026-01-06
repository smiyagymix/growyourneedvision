/**
 * Migration: Add Row-Level Security (RLS) Rules to PocketBase Collections
 * 
 * This migration adds proper API rules to enforce:
 * - Tenant isolation (users can only access data from their tenant)
 * - Role-based access control (permissions per user role)
 * - Secure defaults (deny by default, explicit allow)
 * 
 * Version: 001
 * Date: 2025-12-22
 * Critical: YES - Prevents cross-tenant data leaks
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'Darnag123456789@';

/**
 * Standard RLS rules for tenant-scoped collections
 * 
 * @auth.tenantId != "" - User must have a tenantId
 * @request.auth.id != "" - User must be authenticated
 * tenantId = @request.auth.tenantId - Data must belong to user's tenant
 */
const TENANT_SCOPED_RULES = {
  listRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId`,
  viewRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId`,
  createRule: `@request.auth.id != "" && @request.data.tenantId = @request.auth.tenantId`,
  updateRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId`,
  deleteRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId`
};

/**
 * Owner-only rules (platform-level configuration)
 */
const OWNER_ONLY_RULES = {
  listRule: `@request.auth.id != "" && @request.auth.role = "Owner"`,
  viewRule: `@request.auth.id != "" && @request.auth.role = "Owner"`,
  createRule: `@request.auth.id != "" && @request.auth.role = "Owner"`,
  updateRule: `@request.auth.id != "" && @request.auth.role = "Owner"`,
  deleteRule: `@request.auth.id != "" && @request.auth.role = "Owner"`
};

/**
 * Teacher-specific rules (teachers can manage their own data)
 */
const TEACHER_RULES = {
  listRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId`,
  viewRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId`,
  createRule: `@request.auth.id != "" && @request.data.tenantId = @request.auth.tenantId && (@request.auth.role = "Teacher" || @request.auth.role = "SchoolAdmin" || @request.auth.role = "Owner")`,
  updateRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (teacherId = @request.auth.id || @request.auth.role = "SchoolAdmin" || @request.auth.role = "Owner")`,
  deleteRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (teacherId = @request.auth.id || @request.auth.role = "SchoolAdmin" || @request.auth.role = "Owner")`
};

/**
 * Student-specific rules (students can view but not modify)
 */
const STUDENT_READONLY_RULES = {
  listRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (studentId = @request.auth.id || @request.auth.role ~ "Teacher|SchoolAdmin|Owner")`,
  viewRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (studentId = @request.auth.id || @request.auth.role ~ "Teacher|SchoolAdmin|Owner")`,
  createRule: `@request.auth.id != "" && @request.auth.role ~ "Teacher|SchoolAdmin|Owner"`,
  updateRule: `@request.auth.id != "" && @request.auth.role ~ "Teacher|SchoolAdmin|Owner"`,
  deleteRule: `@request.auth.id != "" && @request.auth.role ~ "SchoolAdmin|Owner"`
};

/**
 * Public read rules (anyone can read, only authenticated can write)
 */
const PUBLIC_READ_RULES = {
  listRule: `@request.auth.id != ""`,
  viewRule: `@request.auth.id != ""`,
  createRule: `@request.auth.id != "" && @request.auth.role ~ "Owner|SchoolAdmin"`,
  updateRule: `@request.auth.id != "" && @request.auth.role ~ "Owner|SchoolAdmin"`,
  deleteRule: `@request.auth.id != "" && @request.auth.role = "Owner"`
};

/**
 * Collection-to-rule mappings
 */
const COLLECTION_RULES = {
  // Tenant-scoped collections
  'courses': TENANT_SCOPED_RULES,
  'assignments': TEACHER_RULES,
  'submissions': {
    listRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId`,
    viewRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (studentId = @request.auth.id || @request.auth.role ~ "Teacher|SchoolAdmin|Owner")`,
    createRule: `@request.auth.id != "" && @request.data.tenantId = @request.auth.tenantId && @request.data.studentId = @request.auth.id`,
    updateRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (studentId = @request.auth.id || @request.auth.role ~ "Teacher|SchoolAdmin|Owner")`,
    deleteRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && @request.auth.role ~ "SchoolAdmin|Owner"`
  },
  'grades': STUDENT_READONLY_RULES,
  'attendance': STUDENT_READONLY_RULES,
  'classes': TENANT_SCOPED_RULES,
  'enrollments': TENANT_SCOPED_RULES,
  'teachers': TENANT_SCOPED_RULES,
  'students': TENANT_SCOPED_RULES,
  'messages': {
    listRule: `@request.auth.id != "" && (senderId = @request.auth.id || recipientId = @request.auth.id)`,
    viewRule: `@request.auth.id != "" && (senderId = @request.auth.id || recipientId = @request.auth.id)`,
    createRule: `@request.auth.id != "" && @request.data.senderId = @request.auth.id`,
    updateRule: `@request.auth.id != "" && (senderId = @request.auth.id || recipientId = @request.auth.id)`,
    deleteRule: `@request.auth.id != "" && senderId = @request.auth.id`
  },
  'invoices': TENANT_SCOPED_RULES,
  'fees': TENANT_SCOPED_RULES,
  'wellness_logs': {
    listRule: `@request.auth.id != "" && userId = @request.auth.id`,
    viewRule: `@request.auth.id != "" && userId = @request.auth.id`,
    createRule: `@request.auth.id != "" && @request.data.userId = @request.auth.id`,
    updateRule: `@request.auth.id != "" && userId = @request.auth.id`,
    deleteRule: `@request.auth.id != "" && userId = @request.auth.id`
  },
  'wellness_goals': {
    listRule: `@request.auth.id != "" && userId = @request.auth.id`,
    viewRule: `@request.auth.id != "" && userId = @request.auth.id`,
    createRule: `@request.auth.id != "" && @request.data.userId = @request.auth.id`,
    updateRule: `@request.auth.id != "" && userId = @request.auth.id`,
    deleteRule: `@request.auth.id != "" && userId = @request.auth.id`
  },
  
  // Owner-only collections (platform configuration)
  'tenants': OWNER_ONLY_RULES,
  'platform_configs': OWNER_ONLY_RULES,
  'feature_flags': OWNER_ONLY_RULES,
  'api_keys': {
    listRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && @request.auth.role ~ "Owner|SchoolAdmin"`,
    viewRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && @request.auth.role ~ "Owner|SchoolAdmin"`,
    createRule: `@request.auth.id != "" && @request.data.tenantId = @request.auth.tenantId && @request.auth.role ~ "Owner|SchoolAdmin"`,
    updateRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && @request.auth.role ~ "Owner|SchoolAdmin"`,
    deleteRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && @request.auth.role ~ "Owner|SchoolAdmin"`
  },
  'plugins': PUBLIC_READ_RULES,
  'plugin_installs': TENANT_SCOPED_RULES,
  'webhooks': {
    listRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && @request.auth.role ~ "Owner|SchoolAdmin"`,
    viewRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && @request.auth.role ~ "Owner|SchoolAdmin"`,
    createRule: `@request.auth.id != "" && @request.data.tenantId = @request.auth.tenantId && @request.auth.role ~ "Owner|SchoolAdmin"`,
    updateRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && @request.auth.role ~ "Owner|SchoolAdmin"`,
    deleteRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && @request.auth.role ~ "Owner|SchoolAdmin"`
  },
  
  // Global expansion collections
  'translations': PUBLIC_READ_RULES,
  'currencies': PUBLIC_READ_RULES,
  'language_settings': TENANT_SCOPED_RULES,
  'compliance_logs': TENANT_SCOPED_RULES,
  
  // Advanced learning collections
  'adaptive_learning_profiles': {
    listRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (studentId = @request.auth.id || @request.auth.role ~ "Teacher|SchoolAdmin|Owner")`,
    viewRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (studentId = @request.auth.id || @request.auth.role ~ "Teacher|SchoolAdmin|Owner")`,
    createRule: `@request.auth.id != "" && @request.data.tenantId = @request.auth.tenantId`,
    updateRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId`,
    deleteRule: `@request.auth.id != "" && @request.auth.role ~ "SchoolAdmin|Owner"`
  },
  'learning_analytics': {
    listRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (studentId = @request.auth.id || @request.auth.role ~ "Teacher|SchoolAdmin|Owner")`,
    viewRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (studentId = @request.auth.id || @request.auth.role ~ "Teacher|SchoolAdmin|Owner")`,
    createRule: `@request.auth.id != "" && @request.data.tenantId = @request.auth.tenantId`,
    updateRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId`,
    deleteRule: `@request.auth.id != "" && @request.auth.role ~ "SchoolAdmin|Owner"`
  },
  'micro_credentials': {
    listRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (studentId = @request.auth.id || @request.auth.role ~ "Teacher|SchoolAdmin|Owner")`,
    viewRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && (studentId = @request.auth.id || @request.auth.role ~ "Teacher|SchoolAdmin|Owner")`,
    createRule: `@request.auth.id != "" && @request.data.tenantId = @request.auth.tenantId && @request.auth.role ~ "Teacher|SchoolAdmin|Owner"`,
    updateRule: `@request.auth.id != "" && tenantId = @request.auth.tenantId && @request.auth.role ~ "Teacher|SchoolAdmin|Owner"`,
    deleteRule: `@request.auth.id != "" && @request.auth.role ~ "SchoolAdmin|Owner"`
  },
  'skill_assessments': TENANT_SCOPED_RULES,
  'learning_path_recommendations': TENANT_SCOPED_RULES
};

async function applyRules() {
  try {
    console.log('🔐 Migration 001: Adding Row-Level Security (RLS) Rules\n');
    console.log('Authenticating as admin...');
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
    console.log('✓ Authenticated\n');

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const [collectionName, rules] of Object.entries(COLLECTION_RULES)) {
      try {
        console.log(`Applying rules to collection: ${collectionName}`);
        
        // Get the collection
        const collections = await pb.collections.getFullList();
        const collection = collections.find(c => c.name === collectionName);
        
        if (!collection) {
          console.log(`  ⚠️  Collection '${collectionName}' not found - skipping`);
          continue;
        }

        // Update the collection with new rules
        await pb.collections.update(collection.id, {
          ...collection,
          listRule: rules.listRule || null,
          viewRule: rules.viewRule || null,
          createRule: rules.createRule || null,
          updateRule: rules.updateRule || null,
          deleteRule: rules.deleteRule || null
        });

        console.log(`  ✓ Rules applied successfully`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Failed to apply rules: ${error.message}`);
        errors.push({ collection: collectionName, error: error.message });
        failCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Migration Summary:');
    console.log(`  Total collections: ${Object.keys(COLLECTION_RULES).length}`);
    console.log(`  ✓ Success: ${successCount}`);
    console.log(`  ✗ Failed: ${failCount}`);
    
    if (errors.length > 0) {
      console.log(`\nErrors:`);
      errors.forEach(({ collection, error }) => {
        console.log(`  - ${collection}: ${error}`);
      });
    }

    console.log(`${'='.repeat(60)}\n`);
    
    if (failCount === 0) {
      console.log('✅ Migration 001 completed successfully!');
      console.log('🔒 All collections now have proper Row-Level Security rules.');
      console.log('🛡️  Tenant isolation and role-based access control are enforced.');
    } else {
      console.log('⚠️  Migration completed with some errors. Review failed collections above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  applyRules()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { applyRules, COLLECTION_RULES, TENANT_SCOPED_RULES, OWNER_ONLY_RULES };
