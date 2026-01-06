// Core Services
export * from './crmService';
export * from './tenantService';
export * from './financeService';
export * from './academicsService';
export { communicationService, type Message as CommunicationMessage, type Notification, type SocialPost } from './communicationService';
export * from './eventService';
export { supportService, type Ticket } from './supportService';
export { marketService } from './marketService';
export * from './professionalService';
export * from './communityService';
export * from './resourceService';
export * from './wellnessService';
export { toolService, type Tool, type MarketplaceApp as ToolMarketplaceApp } from './toolService';
export * from './activityService';
export * from './aiService';
export * from './utilityService';
export * from './settingsService';
export * from './creatorService';
export * from './hobbiesService';
export * from './religionService';
export * from './sportService';
export * from './travelService';
export * from './gamificationService';
export * from './parentService';
export * from './attendanceService';
export * from './paymentService';
export * from './emailService';
export * from './storageQuotaService';
export * from './fileUploadService';
export * from './assignmentService';

// AI Services
export * from './aiCostService';
export * from './aiFineTuningService';
export * from './aiIntelligenceService';
export * from './aiManagementService';
export * from './aiModelRoutingService';
export * from './aiPlaygroundService';
export * from './aiTrainingService';
export * from './aiUsageAnalyticsService';

// CRM Services
export * from './crmAnalyticsService';
export * from './crmAssignmentService';
export * from './crmContactsService';
export { crmDealService, type Deal as CRMDeal } from './crmDealService';
export { crmEmailService, type EmailTemplate as CRMEmailTemplate, type Email as CRMEmail } from './crmEmailService';

// Platform Services
export * from './auditAdminService';
export * from './auditLogger';
export * from './backupService';
export * from './broadcastService';
export * from './emailTemplateService';
export * from './helpService';
export * from './legalDocsService';
export * from './reportSchedulerService';
export * from './systemHealthService';
export * from './webhookService';

// School Services
export * from './billingService';
export * from './courseService';
export * from './enrollmentService';
export * from './gradesService';
export * from './schoolFinanceService';
export * from './schoolService';
export * from './schoolSettingsService';
export * from './studentAcademicsService';
export * from './userService';

// Marketplace & Media
export * from './marketingService';
export * from './marketingExportService';
export { marketplaceService, type MarketplaceApp } from './marketplaceService';
export * from './marketplaceBackendService';
export * from './mediaService';
export * from './multiverseService';

// Utilities
export * from './errorHandler';
export * from './localIntelligence';
export * from './notificationService';
export * from './rateLimiter';
export * from './reportService';
export * from './storageService';
export { ticketService } from './ticketService';
export * from './travelApiService';
