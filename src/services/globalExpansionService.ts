import pb from "../lib/pocketbase";
import { isMockEnv } from "../utils/mockData";
import type { RecordModel } from "pocketbase";
import { logError } from "../utils/logger";

// ============================================
// TYPES
// ============================================

export type TranslationMethod = "manual" | "deepl" | "google" | "ai" | "openai";
export type RegulationType = "GDPR" | "PIPL" | "LGPD" | "IT_ACT" | "HIPAA" | "COPPA" | "CCPA";
export type TranslationStatus = "pending" | "verified" | "needs_review" | "deprecated";

export interface Translation extends RecordModel {
  key: string;
  language: string;
  value: string;
  context?: string;
  tenantId?: string;
  isVerified: boolean;
  translationMethod: TranslationMethod;
  status?: TranslationStatus;
  lastModifiedBy?: string;
  variables?: string[];
  pluralForms?: Record<string, string>;
}

export interface Currency extends RecordModel {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  baseCurrency: string;
  isActive: boolean;
  lastUpdated: string;
  decimalPlaces?: number;
  symbolPosition?: "before" | "after";
}

export interface ComplianceDetails {
  action: string;
  resource?: string;
  resourceId?: string;
  previousValue?: string | number | boolean;
  newValue?: string | number | boolean;
  userAgent?: string;
  ipAddress?: string;
  geolocation?: string;
  consentGiven?: boolean;
  retentionPeriod?: number;
  dataCategories?: string[];
}

export interface ComplianceLog extends RecordModel {
  tenantId: string;
  userId?: string;
  action: string;
  regulation: RegulationType;
  details: ComplianceDetails;
  timestamp: string;
  ipAddress?: string;
  severity?: "info" | "warning" | "critical";
}

export interface RegionalSettings extends RecordModel {
  tenantId: string;
  region: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: number;
  currency: string;
  language: string;
  complianceRegulations: string[];
  dataResidencyRegion?: string;
  taxRate?: number;
}

export interface LanguageSettings extends RecordModel {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  isActive: boolean;
  completionPercentage: number;
  lastUpdated: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_TRANSLATIONS: Translation[] = [
  {
    id: "trans1",
    key: "welcome_message",
    language: "en",
    value: "Welcome to Grow Your Need",
    isVerified: true,
    translationMethod: "manual",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "translations",
    collectionName: "translations",
  },
  {
    id: "trans2",
    key: "welcome_message",
    language: "es",
    value: "Bienvenido a Grow Your Need",
    isVerified: true,
    translationMethod: "deepl",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "translations",
    collectionName: "translations",
  },
  {
    id: "trans3",
    key: "dashboard",
    language: "en",
    value: "Dashboard",
    isVerified: true,
    translationMethod: "manual",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "translations",
    collectionName: "translations",
  },
];

const MOCK_CURRENCIES: Currency[] = [
  {
    id: "curr1",
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    exchangeRate: 1.0,
    baseCurrency: "USD",
    isActive: true,
    lastUpdated: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "currencies",
    collectionName: "currencies",
  },
  {
    id: "curr2",
    code: "EUR",
    name: "Euro",
    symbol: "€",
    exchangeRate: 0.92,
    baseCurrency: "USD",
    isActive: true,
    lastUpdated: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "currencies",
    collectionName: "currencies",
  },
  {
    id: "curr3",
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    exchangeRate: 0.79,
    baseCurrency: "USD",
    isActive: true,
    lastUpdated: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "currencies",
    collectionName: "currencies",
  },
];

const MOCK_LANGUAGES: LanguageSettings[] = [
  {
    id: "lang1",
    code: "en",
    name: "English",
    nativeName: "English",
    direction: "ltr",
    isActive: true,
    completionPercentage: 100,
    lastUpdated: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "language_settings",
    collectionName: "language_settings",
  },
  {
    id: "lang2",
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    direction: "ltr",
    isActive: true,
    completionPercentage: 95,
    lastUpdated: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "language_settings",
    collectionName: "language_settings",
  },
  {
    id: "lang3",
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
    isActive: true,
    completionPercentage: 90,
    lastUpdated: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "language_settings",
    collectionName: "language_settings",
  },
];

// ============================================
// CACHING & HELPERS
// ============================================

const translationCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(key: string, language: string): string {
  return `${language}:${key}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

export interface TranslationBatch {
  key: string;
  language: string;
  value: string;
  context?: string;
}

export interface TranslationExport {
  language: string;
  translations: Array<{ key: string; value: string; context?: string }>;
  exportedAt: string;
  version: string;
}

// ============================================
// TRANSLATION SERVICE
// ============================================

export const translationService = {
  async getTranslations(language: string, keys?: string[]): Promise<Translation[]> {
    if (isMockEnv()) {
      return MOCK_TRANSLATIONS.filter((t) => t.language === language && (!keys || keys.includes(t.key)));
    }

    let filter = `language = "${language}"`;
    if (keys && keys.length > 0) {
      const keyFilter = keys.map((k) => `key = "${k}"`).join(" || ");
      filter += ` && (${keyFilter})`;
    }

    return pb.collection("translations").getFullList<Translation>({
      filter,
      requestKey: null,
    });
  },

  async translate(
    key: string, 
    language: string, 
    fallbackLanguage = "en",
    variables?: Record<string, string | number>
  ): Promise<string> {
    // Check cache first
    const cacheKey = getCacheKey(key, language);
    const cached = translationCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return this.interpolate(cached.value, variables);
    }

    if (isMockEnv()) {
      const trans = MOCK_TRANSLATIONS.find((t) => t.key === key && t.language === language);
      if (trans) {
        translationCache.set(cacheKey, { value: trans.value, timestamp: Date.now() });
        return this.interpolate(trans.value, variables);
      }

      const fallback = MOCK_TRANSLATIONS.find((t) => t.key === key && t.language === fallbackLanguage);
      const result = fallback?.value || key;
      translationCache.set(cacheKey, { value: result, timestamp: Date.now() });
      return this.interpolate(result, variables);
    }

    try {
      const translations = await pb.collection("translations").getFullList<Translation>({
        filter: `key = "${key}" && language = "${language}"`,
        requestKey: null,
      });

      if (translations.length > 0) {
        const value = translations[0].value;
        translationCache.set(cacheKey, { value, timestamp: Date.now() });
        return this.interpolate(value, variables);
      }

      // Fallback to default language
      const fallback = await pb.collection("translations").getFullList<Translation>({
        filter: `key = "${key}" && language = "${fallbackLanguage}"`,
        requestKey: null,
      });

      const result = fallback.length > 0 ? fallback[0].value : key;
      translationCache.set(cacheKey, { value: result, timestamp: Date.now() });
      return this.interpolate(result, variables);
    } catch (error) {
      logError(`Translation error for key ${key}`, error as Error, { key, language });
      return key;
    }
  },

  interpolate(template: string, variables?: Record<string, string | number>): string {
    if (!variables) return template;
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key]?.toString() || match;
    });
  },

  clearCache(): void {
    translationCache.clear();
  },

  async batchCreate(translations: TranslationBatch[]): Promise<Translation[]> {
    if (isMockEnv()) {
      return translations.map((t, index) => ({
        id: `trans${Date.now()}_${index}`,
        ...t,
        isVerified: false,
        translationMethod: "manual" as TranslationMethod,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: "translations",
        collectionName: "translations",
      }));
    }

    const results: Translation[] = [];
    for (const trans of translations) {
      try {
        const created = await pb.collection("translations").create<Translation>(
          { ...trans, isVerified: false, translationMethod: "manual" },
          { requestKey: null }
        );
        results.push(created);
      } catch (error) {
        logError(`Failed to create translation for key ${trans.key}`, error as Error);
      }
    }
    return results;
  },

  async exportTranslations(language: string): Promise<TranslationExport> {
    const translations = await this.getTranslations(language);
    return {
      language,
      translations: translations.map(t => ({
        key: t.key,
        value: t.value,
        context: t.context
      })),
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
  },

  async importTranslations(data: TranslationExport): Promise<number> {
    let imported = 0;
    for (const trans of data.translations) {
      try {
        await this.createTranslation({
          key: trans.key,
          language: data.language,
          value: trans.value,
          context: trans.context
        });
        imported++;
      } catch (error) {
        logError(`Failed to import translation ${trans.key}`, error as Error);
      }
    }
    return imported;
  },

  async createTranslation(data: {
    key: string;
    language: string;
    value: string;
    context?: string;
    tenantId?: string;
  }): Promise<Translation> {
    if (isMockEnv()) {
      const newTrans: Translation = {
        id: `trans${Date.now()}`,
        ...data,
        isVerified: false,
        translationMethod: "manual",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: "translations",
        collectionName: "translations",
      };
      return newTrans;
    }

    return pb.collection("translations").create<Translation>(
      { ...data, isVerified: false, translationMethod: "manual" },
      { requestKey: null }
    );
  },
};

// ============================================
// CURRENCY SERVICE
// ============================================

export const currencyService = {
  async getAll(): Promise<Currency[]> {
    if (isMockEnv()) return MOCK_CURRENCIES;

    return pb.collection("currencies").getFullList<Currency>({
      filter: "isActive = true",
      sort: "code",
      requestKey: null,
    });
  },

  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (isMockEnv()) {
      const from = MOCK_CURRENCIES.find((c) => c.code === fromCurrency);
      const to = MOCK_CURRENCIES.find((c) => c.code === toCurrency);

      if (!from || !to) return amount;

      // Convert to base currency (USD) then to target currency
      const inBaseCurrency = amount / from.exchangeRate;
      return inBaseCurrency * to.exchangeRate;
    }

    try {
      const currencies = await pb.collection("currencies").getFullList<Currency>({
        filter: `code = "${fromCurrency}" || code = "${toCurrency}"`,
        requestKey: null,
      });

      const from = currencies.find((c) => c.code === fromCurrency);
      const to = currencies.find((c) => c.code === toCurrency);

      if (!from || !to) return amount;

      const inBaseCurrency = amount / from.exchangeRate;
      return inBaseCurrency * to.exchangeRate;
    } catch (error) {
      console.error("Currency conversion error:", error);
      return amount;
    }
  },

  async updateRates(baseCurrency = "USD"): Promise<void> {
    if (isMockEnv()) return;

    try {
      // Integration with Exchange Rates API (example: exchangerate-api.com)
      const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
      if (!apiKey) {
        logError("Exchange rate API key not configured", new Error("Missing API key"));
        return;
      }

      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
      );
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data = await response.json();
      const rates = data.conversion_rates as Record<string, number>;

      // Update all currencies in the database
      const currencies = await this.getAll();
      const updatePromises = currencies.map(currency => {
        const newRate = rates[currency.code];
        if (newRate) {
          return pb.collection("currencies").update(currency.id, {
            exchangeRate: newRate,
            lastUpdated: new Date().toISOString()
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
    } catch (error) {
      logError("Currency rate update failed", error as Error);
    }
  },

  formatCurrency(amount: number, currency: Currency): string {
    const formatted = amount.toFixed(currency.decimalPlaces || 2);
    return currency.symbolPosition === "after" 
      ? `${formatted} ${currency.symbol}`
      : `${currency.symbol}${formatted}`;
  },

  async getByCode(code: string): Promise<Currency | null> {
    if (isMockEnv()) {
      return MOCK_CURRENCIES.find(c => c.code === code) || null;
    }

    try {
      const currencies = await pb.collection("currencies").getFullList<Currency>({
        filter: `code = "${code}"`,
        requestKey: null
      });
      return currencies[0] || null;
    } catch (error) {
      logError(`Failed to fetch currency ${code}`, error as Error);
      return null;
    }
  },
};

// ============================================
// LANGUAGE SERVICE
// ============================================

export const languageService = {
  async getAll(): Promise<LanguageSettings[]> {
    if (isMockEnv()) return MOCK_LANGUAGES;

    return pb.collection("language_settings").getFullList<LanguageSettings>({
      filter: "isActive = true",
      sort: "name",
      requestKey: null,
    });
  },

  async getByCode(code: string): Promise<LanguageSettings | null> {
    if (isMockEnv()) {
      return MOCK_LANGUAGES.find((l) => l.code === code) || null;
    }

    try {
      const languages = await pb.collection("language_settings").getFullList<LanguageSettings>({
        filter: `code = "${code}"`,
        requestKey: null,
      });
      return languages.length > 0 ? languages[0] : null;
    } catch (error) {
      console.error(`Language fetch error for ${code}:`, error);
      return null;
    }
  },
};

// ============================================
// REGIONAL SETTINGS SERVICE
// ============================================

export const regionalSettingsService = {
  async get(tenantId: string): Promise<RegionalSettings | null> {
    if (isMockEnv()) return null;

    try {
      const settings = await pb.collection("regional_settings").getFullList<RegionalSettings>({
        filter: `tenantId = "${tenantId}"`,
        requestKey: null
      });
      return settings[0] || null;
    } catch (error) {
      logError(`Failed to fetch regional settings for tenant ${tenantId}`, error as Error);
      return null;
    }
  },

  async update(tenantId: string, data: Partial<RegionalSettings>): Promise<RegionalSettings> {
    if (isMockEnv()) {
      return {
        id: `regional_${tenantId}`,
        tenantId,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: "regional_settings",
        collectionName: "regional_settings"
      } as RegionalSettings;
    }

    const existing = await this.get(tenantId);
    if (existing) {
      return pb.collection("regional_settings").update<RegionalSettings>(
        existing.id,
        data,
        { requestKey: null }
      );
    }

    return pb.collection("regional_settings").create<RegionalSettings>(
      { ...data, tenantId },
      { requestKey: null }
    );
  },

  async getTimeZones(): Promise<Array<{ value: string; label: string }>> {
    return Intl.supportedValuesOf("timeZone").map(tz => ({
      value: tz,
      label: tz.replace(/_/g, " ")
    }));
  }
};

// ============================================
// COMPLIANCE SERVICE
// ============================================

export const complianceService = {
  async logAction(data: {
    tenantId: string;
    userId?: string;
    action: string;
    regulation: RegulationType;
    details: ComplianceDetails;
    severity?: "info" | "warning" | "critical";
  }): Promise<ComplianceLog> {
    if (isMockEnv()) {
      const newLog: ComplianceLog = {
        id: `log${Date.now()}`,
        ...data,
        severity: data.severity || "info",
        timestamp: new Date().toISOString(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: "compliance_logs",
        collectionName: "compliance_logs",
      };
      return newLog;
    }

    return pb.collection("compliance_logs").create<ComplianceLog>(
      { 
        ...data, 
        severity: data.severity || "info",
        timestamp: new Date().toISOString() 
      },
      { requestKey: null }
    );
  },

  async getLogs(
    tenantId: string, 
    options?: {
      regulation?: RegulationType;
      userId?: string;
      severity?: "info" | "warning" | "critical";
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<ComplianceLog[]> {
    if (isMockEnv()) return [];

    let filter = `tenantId = "${tenantId}"`;
    if (options?.regulation) filter += ` && regulation = "${options.regulation}"`;
    if (options?.userId) filter += ` && userId = "${options.userId}"`;
    if (options?.severity) filter += ` && severity = "${options.severity}"`;
    if (options?.startDate) filter += ` && timestamp >= "${options.startDate}"`;
    if (options?.endDate) filter += ` && timestamp <= "${options.endDate}"`;

    return pb.collection("compliance_logs").getList<ComplianceLog>(1, options?.limit || 100, {
      filter,
      sort: "-timestamp",
      requestKey: null,
    }).then(result => result.items);
  },

  async generateReport(tenantId: string, regulation: RegulationType, startDate: string, endDate: string): Promise<{
    regulation: RegulationType;
    totalActions: number;
    criticalActions: number;
    affectedUsers: number;
    logs: ComplianceLog[];
    generatedAt: string;
  }> {
    const logs = await this.getLogs(tenantId, { regulation, startDate, endDate });
    const uniqueUsers = new Set(logs.map(l => l.userId).filter(Boolean));
    
    return {
      regulation,
      totalActions: logs.length,
      criticalActions: logs.filter(l => l.severity === "critical").length,
      affectedUsers: uniqueUsers.size,
      logs,
      generatedAt: new Date().toISOString()
    };
  },

  async deleteOldLogs(tenantId: string, retentionDays: number): Promise<number> {
    if (isMockEnv()) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    try {
      const oldLogs = await pb.collection("compliance_logs").getFullList<ComplianceLog>({
        filter: `tenantId = "${tenantId}" && timestamp < "${cutoffDate.toISOString()}"`,
        requestKey: null
      });

      let deleted = 0;
      for (const log of oldLogs) {
        await pb.collection("compliance_logs").delete(log.id);
        deleted++;
      }
      
      return deleted;
    } catch (error) {
      logError("Failed to delete old compliance logs", error as Error);
      return 0;
    }
  }
};
