import pb from "../lib/pocketbase";
import { isMockEnv } from "../utils/mockData";
import type { RecordModel } from "pocketbase";

// ============================================
// TYPES
// ============================================

export interface APIKey extends RecordModel {
  userId: string;
  keyName: string;
  keyType: "public" | "secret";
  keyHash: string;
  keyPrefix: string;
  rateLimit: number;
  usageCount: number;
  lastUsed?: string;
  expiresAt?: string;
  scopes: string[];
  isActive: boolean;
}

export interface Plugin extends RecordModel {
  name: string;
  description: string;
  version: string;
  author: string;
  authorEmail: string;
  category: string;
  price: number;
  currency: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  icon: string;
  bannerImage?: string;
  screenshots?: string[];
  documentation?: string;
  sourceCode?: string;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  requirements: string[];
  permissions: string[];
  revenueShare: number;
  totalRevenue: number;
}

export interface PluginInstall extends RecordModel {
  userId: string;
  pluginId: string;
  version: string;
  isActive: boolean;
  configuration?: Record<string, any>;
  installedAt: string;
  lastUpdated?: string;
}

export interface Webhook extends RecordModel {
  userId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
  headers?: Record<string, string>;
}

export interface APIUsageLog extends RecordModel {
  userId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_API_KEYS: APIKey[] = [
  {
    id: "key1",
    userId: "user1",
    keyName: "Production API Key",
    keyType: "secret",
    keyHash: "sk_test_xxx",
    keyPrefix: "sk_test",
    rateLimit: 10000,
    usageCount: 4521,
    lastUsed: new Date().toISOString(),
    scopes: ["read:users", "write:assignments"],
    isActive: true,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "api_keys",
    collectionName: "api_keys",
  },
  {
    id: "key2",
    userId: "user1",
    keyName: "Development Key",
    keyType: "public",
    keyHash: "pk_test_yyy",
    keyPrefix: "pk_test",
    rateLimit: 1000,
    usageCount: 234,
    scopes: ["read:courses"],
    isActive: true,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "api_keys",
    collectionName: "api_keys",
  },
];

const MOCK_PLUGINS: Plugin[] = [
  {
    id: "plugin1",
    name: "Google Calendar Sync",
    description: "Sync assignments and events with Google Calendar",
    version: "2.1.0",
    author: "Grow Your Need Team",
    authorEmail: "plugins@growyourneed.com",
    category: "Integration",
    price: 9.99,
    currency: "USD",
    downloads: 1547,
    rating: 4.8,
    reviewCount: 234,
    icon: "📅",
    isActive: true,
    isFeatured: true,
    tags: ["calendar", "google", "sync"],
    requirements: ["OAuth 2.0"],
    permissions: ["calendar.read", "calendar.write"],
    revenueShare: 70,
    totalRevenue: 3094,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "plugins",
    collectionName: "plugins",
  },
  {
    id: "plugin2",
    name: "AI Grade Assistant",
    description: "AI-powered grading assistant for essays and assignments",
    version: "1.5.2",
    author: "EduTech Solutions",
    authorEmail: "hello@edutech.com",
    category: "AI",
    price: 14.99,
    currency: "USD",
    downloads: 892,
    rating: 4.9,
    reviewCount: 156,
    icon: "🤖",
    isActive: true,
    isFeatured: true,
    tags: ["ai", "grading", "automation"],
    requirements: ["OpenAI API Key"],
    permissions: ["assignments.read", "grades.write"],
    revenueShare: 70,
    totalRevenue: 2676,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "plugins",
    collectionName: "plugins",
  },
];

const MOCK_PLUGIN_INSTALLS: PluginInstall[] = [
  {
    id: "install1",
    userId: "user1",
    pluginId: "plugin1",
    version: "2.1.0",
    isActive: true,
    configuration: { syncInterval: 300 },
    installedAt: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "plugin_installs",
    collectionName: "plugin_installs",
  },
];

const MOCK_WEBHOOKS: Webhook[] = [
  {
    id: "webhook1",
    userId: "user1",
    url: "https://api.example.com/webhooks/assignments",
    events: ["assignment.created", "assignment.updated", "assignment.submitted"],
    secret: "whsec_xxx",
    isActive: true,
    successCount: 245,
    failureCount: 3,
    lastTriggered: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "webhooks",
    collectionName: "webhooks",
  },
];

// ============================================
// API KEY SERVICE
// ============================================

export const apiKeyService = {
  async getAll(userId: string): Promise<APIKey[]> {
    if (isMockEnv()) return MOCK_API_KEYS.filter((k) => k.userId === userId);

    return pb.collection("api_keys").getFullList<APIKey>({
      filter: `userId = "${userId}"`,
      sort: "-created",
      requestKey: null,
    });
  },

  async create(data: {
    userId: string;
    keyName: string;
    keyType: "public" | "secret";
    rateLimit: number;
    scopes: string[];
  }): Promise<APIKey> {
    if (isMockEnv()) {
      const newKey: APIKey = {
        id: `key${Date.now()}`,
        ...data,
        keyHash: `${data.keyType === "secret" ? "sk" : "pk"}_test_xxx`,
        keyPrefix: data.keyType === "secret" ? "sk_test" : "pk_test",
        usageCount: 0,
        isActive: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: "api_keys",
        collectionName: "api_keys",
      };
      return newKey;
    }

    return pb.collection("api_keys").create<APIKey>(data, {
      requestKey: null,
    });
  },

  async delete(keyId: string): Promise<boolean> {
    if (isMockEnv()) return true;

    await pb.collection("api_keys").delete(keyId, { requestKey: null });
    return true;
  },

  async toggleActive(keyId: string, isActive: boolean): Promise<APIKey> {
    if (isMockEnv()) {
      return MOCK_API_KEYS.find((k) => k.id === keyId)!;
    }

    return pb.collection("api_keys").update<APIKey>(keyId, { isActive }, {
      requestKey: null,
    });
  },
};

// ============================================
// PLUGIN SERVICE
// ============================================

export const pluginService = {
  async getAll(filters?: {
    category?: string;
    search?: string;
    featured?: boolean;
  }): Promise<Plugin[]> {
    if (isMockEnv()) {
      let plugins = [...MOCK_PLUGINS];
      if (filters?.category) plugins = plugins.filter((p) => p.category === filters.category);
      if (filters?.featured) plugins = plugins.filter((p) => p.isFeatured);
      if (filters?.search) {
        plugins = plugins.filter(
          (p) =>
            p.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
            p.description.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }
      return plugins;
    }

    let filter = 'isActive = true';
    if (filters?.category) filter += ` && category = "${filters.category}"`;
    if (filters?.featured) filter += ' && isFeatured = true';

    return pb.collection("plugins").getFullList<Plugin>({
      filter,
      sort: "-downloads",
      requestKey: null,
    });
  },

  async getById(pluginId: string): Promise<Plugin> {
    if (isMockEnv()) {
      return MOCK_PLUGINS.find((p) => p.id === pluginId)!;
    }

    return pb.collection("plugins").getOne<Plugin>(pluginId, {
      requestKey: null,
    });
  },

  async incrementDownloads(pluginId: string): Promise<void> {
    if (isMockEnv()) return;

    const plugin = await pb.collection("plugins").getOne<Plugin>(pluginId);
    await pb.collection("plugins").update(pluginId, {
      downloads: plugin.downloads + 1,
    }, { requestKey: null });
  },
};

// ============================================
// PLUGIN INSTALL SERVICE
// ============================================

export const pluginInstallService = {
  async getInstalled(userId: string): Promise<PluginInstall[]> {
    if (isMockEnv()) return MOCK_PLUGIN_INSTALLS.filter((i) => i.userId === userId);

    return pb.collection("plugin_installs").getFullList<PluginInstall>({
      filter: `userId = "${userId}"`,
      expand: "pluginId",
      sort: "-created",
      requestKey: null,
    });
  },

  async install(data: {
    userId: string;
    pluginId: string;
    version: string;
  }): Promise<PluginInstall> {
    if (isMockEnv()) {
      const newInstall: PluginInstall = {
        id: `install${Date.now()}`,
        ...data,
        isActive: true,
        installedAt: new Date().toISOString(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: "plugin_installs",
        collectionName: "plugin_installs",
      };
      return newInstall;
    }

    // Increment download count
    await pluginService.incrementDownloads(data.pluginId);

    return pb.collection("plugin_installs").create<PluginInstall>(
      { ...data, installedAt: new Date().toISOString(), isActive: true },
      { requestKey: null }
    );
  },

  async uninstall(installId: string): Promise<boolean> {
    if (isMockEnv()) return true;

    await pb.collection("plugin_installs").delete(installId, { requestKey: null });
    return true;
  },

  async updateConfig(installId: string, configuration: Record<string, any>): Promise<PluginInstall> {
    if (isMockEnv()) {
      return MOCK_PLUGIN_INSTALLS.find((i) => i.id === installId)!;
    }

    return pb.collection("plugin_installs").update<PluginInstall>(
      installId,
      { configuration },
      { requestKey: null }
    );
  },
};

// ============================================
// WEBHOOK SERVICE
// ============================================

export const webhookService = {
  async getAll(userId: string): Promise<Webhook[]> {
    if (isMockEnv()) return MOCK_WEBHOOKS.filter((w) => w.userId === userId);

    return pb.collection("webhooks").getFullList<Webhook>({
      filter: `userId = "${userId}"`,
      sort: "-created",
      requestKey: null,
    });
  },

  async create(data: {
    userId: string;
    url: string;
    events: string[];
    secret?: string;
  }): Promise<Webhook> {
    if (isMockEnv()) {
      const newWebhook: Webhook = {
        id: `webhook${Date.now()}`,
        ...data,
        secret: data.secret || `whsec_${Date.now()}`,
        isActive: true,
        successCount: 0,
        failureCount: 0,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: "webhooks",
        collectionName: "webhooks",
      };
      return newWebhook;
    }

    return pb.collection("webhooks").create<Webhook>(
      { ...data, successCount: 0, failureCount: 0, isActive: true },
      { requestKey: null }
    );
  },

  async delete(webhookId: string): Promise<boolean> {
    if (isMockEnv()) return true;

    await pb.collection("webhooks").delete(webhookId, { requestKey: null });
    return true;
  },

  async toggleActive(webhookId: string, isActive: boolean): Promise<Webhook> {
    if (isMockEnv()) {
      return MOCK_WEBHOOKS.find((w) => w.id === webhookId)!;
    }

    return pb.collection("webhooks").update<Webhook>(webhookId, { isActive }, {
      requestKey: null,
    });
  },
};

// ============================================
// USAGE SERVICE
// ============================================

export const usageService = {
  async getUsage(userId: string, limit = 100): Promise<APIUsageLog[]> {
    if (isMockEnv()) return [];

    return pb.collection("api_usage_logs").getFullList<APIUsageLog>({
      filter: `userId = "${userId}"`,
      sort: "-timestamp",
      perPage: limit,
      requestKey: null,
    });
  },

  async logUsage(data: {
    userId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
  }): Promise<void> {
    if (isMockEnv()) return;

    await pb.collection("api_usage_logs").create(
      { ...data, timestamp: new Date().toISOString() },
      { requestKey: null }
    );
  },
};
