import env from '../config/environment';

/**
 * Owner Frontend Services
 * Centralized service wrappers for all Owner API calls
 * Provides type-safe interfaces with proper error handling
 */

const serverUrl = env.get('serverUrl');
const serviceApiKey = env.get('serviceApiKey');

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Base API call wrapper with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  try {
    if (!serviceApiKey) {
      console.warn('Service API key not configured');
      return { success: false, error: 'API key not configured' };
    }

    const response = await fetch(`${serverUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': serviceApiKey,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Owner Analytics Service
 * Provides analytics and reporting capabilities
 */
export const ownerAnalyticsService = {
  async getKPIs() {
    return apiCall('/api/owner/analytics/kpis');
  },

  async getChurnRisk(minScore: number = 0) {
    return apiCall(`/api/owner/analytics/churn-risk?minScore=${minScore}`);
  },

  async getForecast(months: number = 12) {
    return apiCall(`/api/owner/analytics/forecast?months=${months}`);
  },

  async getUsageTrends(period: string = '30d') {
    return apiCall(`/api/owner/analytics/usage-trends?period=${period}`);
  },

  async getCostAnalysis() {
    return apiCall('/api/owner/analytics/cost-analysis');
  },

  async getAnomalies(timeRange: string = '7d') {
    return apiCall(`/api/owner/analytics/anomalies?timeRange=${timeRange}`);
  }
};

/**
 * Owner Tenant Service
 * Manages multi-tenant operations
 */
export const ownerTenantService = {
  async bulkSuspend(tenantIds: string[]) {
    return apiCall('/api/owner/tenants/bulk-suspend', {
      method: 'POST',
      body: JSON.stringify({ tenantIds })
    });
  },

  async bulkResume(tenantIds: string[]) {
    return apiCall('/api/owner/tenants/bulk-resume', {
      method: 'POST',
      body: JSON.stringify({ tenantIds })
    });
  },

  async cloneTenant(sourceId: string, newName: string, subdomain: string) {
    return apiCall('/api/owner/tenants/clone', {
      method: 'POST',
      body: JSON.stringify({ sourceId, newName, subdomain })
    });
  },

  async migrateTenantData(fromId: string, toId: string) {
    return apiCall('/api/owner/tenants/migrate', {
      method: 'POST',
      body: JSON.stringify({ fromId, toId })
    });
  },

  async getTenantHealth(tenantId: string) {
    return apiCall(`/api/owner/tenants/health/${tenantId}`);
  },

  async assignCustomDomain(tenantId: string, domain: string) {
    return apiCall('/api/owner/tenants/custom-domain', {
      method: 'POST',
      body: JSON.stringify({ tenantId, domain })
    });
  }
};

/**
 * Owner Compliance Service
 * GDPR, SOC2, and compliance management
 */
export const ownerComplianceService = {
  async exportUserData(userId: string) {
    const response = await apiCall<{ downloadUrl: string }>(
      `/api/owner/compliance/export-user/${userId}`
    );

    // Auto-download if successful
    if (response.success && response.data?.downloadUrl) {
      const link = document.createElement('a');
      link.href = response.data.downloadUrl;
      link.download = `user-data-${userId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return response;
  },

  async deleteUserData(userId: string) {
    return apiCall(`/api/owner/compliance/delete-user/${userId}`, {
      method: 'DELETE'
    });
  },

  async generateComplianceReport(standard: string) {
    return apiCall('/api/owner/compliance/report', {
      method: 'POST',
      body: JSON.stringify({ standard })
    });
  },

  async getRetentionStatus() {
    return apiCall('/api/owner/compliance/retention-status');
  }
};

/**
 * Owner Monitoring Service
 * Real-time system monitoring and alerts
 */
export const ownerMonitoringService = {
  async getSystemAlerts() {
    return apiCall('/api/owner/monitoring/alerts');
  },

  async acknowledgeAlert(alertId: string, userId: string) {
    return apiCall('/api/owner/monitoring/alerts/acknowledge', {
      method: 'POST',
      body: JSON.stringify({ alertId, userId })
    });
  },

  async getServiceHealth() {
    return apiCall('/api/owner/monitoring/health');
  },

  async getMetrics(timeRange: string = '1h') {
    return apiCall(`/api/owner/monitoring/metrics?timeRange=${timeRange}`);
  }
};

/**
 * Owner A/B Testing Service
 * Feature flag and A/B test management
 */
export const ownerABTestingService = {
  async getTests() {
    return apiCall('/api/owner/abtesting/tests');
  },

  async createTest(name: string, variants: any[]) {
    return apiCall('/api/owner/abtesting/tests', {
      method: 'POST',
      body: JSON.stringify({ name, variants })
    });
  },

  async getTestResults(testId: string) {
    return apiCall(`/api/owner/abtesting/tests/${testId}/results`);
  },

  async concludeTest(testId: string, winnerVariant: string) {
    return apiCall(`/api/owner/abtesting/tests/${testId}/conclude`, {
      method: 'POST',
      body: JSON.stringify({ winnerVariant })
    });
  }
};

/**
 * Owner Automation Service
 * Trial automation, scheduled tasks, workflows
 */
export const ownerAutomationService = {
  async getTrialConversions() {
    return apiCall('/api/owner/automation/trial-conversions');
  },

  async configureTrialReminders(config: any) {
    return apiCall('/api/owner/automation/trial-reminders', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  async getScheduledReports() {
    return apiCall('/api/owner/automation/scheduled-reports');
  },

  async scheduleReport(config: any) {
    return apiCall('/api/owner/automation/scheduled-reports', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }
};

// Export all services as a single object for convenience
export const ownerServices = {
  analytics: ownerAnalyticsService,
  tenants: ownerTenantService,
  compliance: ownerComplianceService,
  monitoring: ownerMonitoringService,
  abTesting: ownerABTestingService,
  automation: ownerAutomationService
};
