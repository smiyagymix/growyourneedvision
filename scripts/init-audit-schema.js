import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase('http://127.0.0.1:8090');

async function initAuditSchema() {
  try {
    // Admin login
    await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');
    console.log('✅ Authenticated as admin');

    // Check if audit_logs collection exists
    let auditLogsCollection;
    try {
      auditLogsCollection = await pb.collections.getOne('audit_logs');
      console.log('ℹ️  audit_logs collection already exists');
    } catch (e) {
      // Create audit_logs collection
      console.log('Creating audit_logs collection...');
      auditLogsCollection = await pb.collections.create({
        name: 'audit_logs',
        type: 'base',
        schema: [
          {
            name: 'userId',
            type: 'text',
            required: true,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'userEmail',
            type: 'text',
            required: true,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'action',
            type: 'text',
            required: true,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'resource',
            type: 'text',
            required: true,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'resourceId',
            type: 'text',
            required: false,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'details',
            type: 'json',
            required: false,
            options: {}
          },
          {
            name: 'ipAddress',
            type: 'text',
            required: false,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'userAgent',
            type: 'text',
            required: false,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: ['success', 'failure', 'pending']
            }
          },
          {
            name: 'errorMessage',
            type: 'text',
            required: false,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'timestamp',
            type: 'date',
            required: true,
            options: {
              min: '',
              max: ''
            }
          }
        ],
        indexes: [
          'CREATE INDEX idx_audit_userId ON audit_logs (userId)',
          'CREATE INDEX idx_audit_action ON audit_logs (action)',
          'CREATE INDEX idx_audit_resource ON audit_logs (resource)',
          'CREATE INDEX idx_audit_timestamp ON audit_logs (timestamp)'
        ],
        listRule: '@request.auth.id != "" && (@request.auth.role = "Owner" || @request.auth.id = userId)',
        viewRule: '@request.auth.id != "" && (@request.auth.role = "Owner" || @request.auth.id = userId)',
        createRule: '@request.auth.id != ""',
        updateRule: null, // Audit logs are immutable
        deleteRule: '@request.auth.role = "Owner"'
      });
      console.log('✅ audit_logs collection created');
    }

    console.log('✅ Audit logging schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing audit schema:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

initAuditSchema();
