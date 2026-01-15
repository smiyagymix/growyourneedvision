// Central barrel for service exports (deduplicated)
// NOTE: Keep this file stable — exports are listed once to avoid duplicate re-export errors.

// ============================================================================
// CORE SERVICES
// ============================================================================
export * from './userService';
export * from './tenantService';
export * from './auth/tokenService';
export * from './auth/twoFactorService';
export * from './twoFactorAuthService';
export * from './billingService';
export * from './paymentService';
export * from './paymentGatewayService';
export * from './paymentDunningService';
export * from './subscriptionService';
export * from './trialConversionService';
export * from './trialAutomationService';

// ============================================================================
// ACADEMIC & SCHOOL SERVICES
// ============================================================================
export * from './schoolService';
export * from './schoolSettingsService';
export * from './schoolFinanceService';
export * from './academicsService';
export * from './courseService';
export * from './courseMaterialsService';
export * from './enrollmentService';
export * from './attendanceService';
export * from './gradeService';
export * from './studentService';
export * from './studentAcademicsService';
export * from './teacherService';
export * from './parentService';
export * from './assignmentService';
export * from './lessonPlanService';

// ============================================================================
// AI & INTELLIGENCE SERVICES
// ============================================================================
export * from './aiService';
export * from './aiCostService';
export * from './aiFineTuningService';
export * from './aiIntelligenceService';
export * from './aiManagementService';
export * from './aiModelRoutingService';
export * from './aiPlaygroundService';
export * from './aiTrainingService';
export * from './aiUsageAnalyticsService';
export * from './analyticsService';
export * from './anomalyDetectionService';
export * from './apiKeyManagementService';
export * from './apiRateLimitService';
export * from './assetService';
export * from './auditAdminService';
export * from './auditLogger';
export * from './automatedOnboardingService';
export * from './backupService';
export * from './broadcastService';
export * from './bulkUserOperationsService';
export * from './businessService';
export * from './churnPredictionService';
export * from './communicationService';
export * from './communityService';
export * from './comparativeAnalyticsService';
export * from './complianceService';
export * from './creatorService';
export * from './crmAnalyticsService';
export * from './crmAssignmentService';
export * from './crmContactsService';
export * from './crmDealService';
export * from './crmEmailService';
export * from './marketingService';
export * from './marketingExportService';

// ============================================================================
// COMMUNICATION & NOTIFICATION
// ============================================================================
export * from './notificationService';
export * from './emailService';
export * from './emailSendingService';
export * from './emailTemplateService';
export * from './smsService';
export * from './pushService';
export * from './webhookService';
export * from './webhookConfigurationService';

// ============================================================================
// SPECIALIZED APP SERVICES
// ============================================================================
export * from './activityService';
export * from './eventService';
export * from './hobbiesService';
export * from './religionService';
export * from './sportService';
export * from './travelService';
export * from './travelApiService';
export * from './wellnessService';
export * from './professionalService';
export * from './individualService';
export * from './integrationConfigService';
export * from './gamificationService';

// ============================================================================
// MARKETPLACE & MEDIA
// ============================================================================
export * from './marketplaceService';
export * from './marketplaceBackendService';
export * from './marketService';
export * from './mediaService';
export * from './multiverseService';
export * from './toolService';

// ============================================================================
// PLATFORM & ADMIN SERVICES
// ============================================================================
export * from './securitySettingsService';
export * from './securityAuditLogService';
export * from './gdprService';
export * from './legalDocsService';
export * from './helpService';
export * from './featureFlagService';
export * from './featureUsageAnalyticsService';
export * from './developerPlatformService';
export * from './localIntelligence';
export * from './systemHealthService';
export * from './incidentResponseService';

// ============================================================================
// ANALYTICS & MONITORING
// ============================================================================
export * from './monitoringService';
export * from './systemPerformanceService';
export * from './tenantHealthMonitoringService';
export * from './tenantUsageReportsService';

// ============================================================================
// UTILITIES & INFRASTRUCTURE
// ============================================================================
export * from './errorHandler';
export * from './rateLimiter';
export * from './rateLimitService';
export * from './ipRateLimitingService';
export * from './storageService';
export * from './storageQuotaService';
export * from './fileUploadService';
export * from './resourceService';
export * from './utilityService';
export * from './reportService';
export * from './reportSchedulerService';
export * from './exportCenterService';
export * from './ticketService';
export * from './supportService';
export * from './supportTicketService';
export * from './abTestingService';
export * from './advancedSearchService';
export * from './advancedLearningService';
export * from './userManagementService';
export * from './userMergeDeduplicationService';
export * from './tenantCloningService';
export * from './tenantValidationService';
export * from './tenantImportExportService';
export * from './tenantNotificationService';
export * from './globalExpansionService';
export * from './customBillingRulesService';
export * from './dashboardBuilderService';
export * from './ownerFrontendServices';
export * from './ownerTenantService';
export * from './penetrationTestTrackingService';
export * from './prorationService';
export * from './settingsService';
