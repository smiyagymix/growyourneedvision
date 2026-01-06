import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { ListResult } from 'pocketbase';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'Whitepaper' | 'Guide' | 'Webinar' | 'Asset' | 'Lesson Plan' | 'Worksheet' | 'Video' | 'Presentation';
  file?: string;
  thumbnail?: string;
  created: string;
  visibility: 'private' | 'public' | 'shared';
  views: number;
  downloads: number;
  owner_id?: string;
  tags?: string[];
  file_size?: number;
  category?: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  resources_count: number;
}

// Mock Data
const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    title: 'Getting Started Guide',
    description: 'Comprehensive guide to getting started with the platform',
    type: 'Guide',
    created: '2024-01-15T00:00:00Z',
    visibility: 'public',
    views: 1250,
    downloads: 456,
    tags: ['onboarding', 'getting-started', 'guide'],
    category: 'Documentation'
  },
  {
    id: 'res-2',
    title: 'Lesson Planning Best Practices',
    description: 'Tips and templates for effective lesson planning',
    type: 'Lesson Plan',
    created: '2024-01-20T00:00:00Z',
    visibility: 'shared',
    views: 890,
    downloads: 234,
    owner_id: 'teacher-1',
    tags: ['teaching', 'lesson-plan', 'best-practices'],
    category: 'Teaching'
  },
  {
    id: 'res-3',
    title: 'Student Assessment Worksheet',
    description: 'Printable worksheet for student self-assessment',
    type: 'Worksheet',
    created: '2024-02-01T00:00:00Z',
    visibility: 'public',
    views: 567,
    downloads: 189,
    tags: ['assessment', 'student', 'worksheet'],
    category: 'Assessment'
  },
  {
    id: 'res-4',
    title: 'Parent Communication Webinar',
    description: 'Recorded webinar on effective parent-teacher communication',
    type: 'Webinar',
    created: '2024-02-05T00:00:00Z',
    visibility: 'shared',
    views: 432,
    downloads: 98,
    tags: ['communication', 'parents', 'webinar'],
    category: 'Communication'
  },
  {
    id: 'res-5',
    title: 'Classroom Management Presentation',
    description: 'Slide deck on classroom management strategies',
    type: 'Presentation',
    created: '2024-02-10T00:00:00Z',
    visibility: 'public',
    views: 789,
    downloads: 312,
    tags: ['classroom', 'management', 'presentation'],
    category: 'Teaching'
  },
  {
    id: 'res-6',
    title: 'My Private Notes',
    description: 'Personal teaching notes and observations',
    type: 'Asset',
    created: '2024-02-12T00:00:00Z',
    visibility: 'private',
    views: 12,
    downloads: 3,
    owner_id: 'user-1',
    category: 'Personal'
  }
];

const MOCK_CATEGORIES: ResourceCategory[] = [
  { id: 'cat-1', name: 'Documentation', description: 'Platform guides and documentation', icon: '📚', resources_count: 15 },
  { id: 'cat-2', name: 'Teaching', description: 'Teaching resources and materials', icon: '👨‍🏫', resources_count: 42 },
  { id: 'cat-3', name: 'Assessment', description: 'Assessment tools and templates', icon: '📝', resources_count: 28 },
  { id: 'cat-4', name: 'Communication', description: 'Communication resources', icon: '💬', resources_count: 12 },
  { id: 'cat-5', name: 'Personal', description: 'Personal private resources', icon: '🔒', resources_count: 8 }
];

export const resourceService = {
  async getResources(type?: string, visibility: string = 'private'): Promise<ListResult<Resource>> {
    if (isMockEnv()) {
      let filtered = MOCK_RESOURCES.filter(r => r.visibility === visibility);
      if (type) {
        filtered = filtered.filter(r => r.type === type);
      }
      return {
        page: 1,
        perPage: 50,
        totalItems: filtered.length,
        totalPages: 1,
        items: filtered
      };
    }

    try {
      let filter = `visibility = "${visibility}"`;
      if (type) {
        filter += ` && type = "${type}"`;
      }
      return await pb.collection('resources').getList<Resource>(1, 50, {
        sort: '-created',
        filter,
      });
    } catch (error) {
      console.error('Error fetching resources:', error);
      return { page: 1, perPage: 50, totalItems: 0, totalPages: 0, items: [] };
    }
  },

  async getResourceById(id: string): Promise<Resource | null> {
    if (isMockEnv()) {
      return MOCK_RESOURCES.find(r => r.id === id) || null;
    }

    try {
      return await pb.collection('resources').getOne<Resource>(id);
    } catch (error) {
      console.error('Error fetching resource:', error);
      return null;
    }
  },

  async searchResources(query: string): Promise<Resource[]> {
    if (isMockEnv()) {
      const lowerQuery = query.toLowerCase();
      return MOCK_RESOURCES.filter(r =>
        r.title.toLowerCase().includes(lowerQuery) ||
        r.description.toLowerCase().includes(lowerQuery) ||
        r.tags?.some(t => t.toLowerCase().includes(lowerQuery))
      );
    }

    try {
      return await pb.collection('resources').getFullList<Resource>({
        filter: `title ~ "${query}" || description ~ "${query}"`,
        sort: '-views'
      });
    } catch (error) {
      console.error('Error searching resources:', error);
      return [];
    }
  },

  async getSharedResources(): Promise<ListResult<Resource>> {
    if (isMockEnv()) {
      const filtered = MOCK_RESOURCES.filter(r => r.visibility === 'public' || r.visibility === 'shared');
      return {
        page: 1,
        perPage: 50,
        totalItems: filtered.length,
        totalPages: 1,
        items: filtered
      };
    }

    try {
      return await pb.collection('resources').getList<Resource>(1, 50, {
        sort: '-created',
        filter: 'visibility = "public" || visibility = "shared"',
      });
    } catch (error) {
      console.error('Error fetching shared resources:', error);
      return { page: 1, perPage: 50, totalItems: 0, totalPages: 0, items: [] };
    }
  },

  async getPopularResources(limit: number = 10): Promise<Resource[]> {
    if (isMockEnv()) {
      return [...MOCK_RESOURCES]
        .filter(r => r.visibility !== 'private')
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, limit);
    }

    try {
      const result = await pb.collection('resources').getList<Resource>(1, limit, {
        filter: 'visibility != "private"',
        sort: '-downloads'
      });
      return result.items;
    } catch (error) {
      console.error('Error fetching popular resources:', error);
      return [];
    }
  },

  async getResourcesByOwner(ownerId: string): Promise<Resource[]> {
    if (isMockEnv()) {
      return MOCK_RESOURCES.filter(r => r.owner_id === ownerId);
    }

    try {
      return await pb.collection('resources').getFullList<Resource>({
        filter: `owner_id = "${ownerId}"`,
        sort: '-created'
      });
    } catch (error) {
      console.error('Error fetching owner resources:', error);
      return [];
    }
  },

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    if (isMockEnv()) {
      return MOCK_RESOURCES.filter(r => r.category === category);
    }

    try {
      return await pb.collection('resources').getFullList<Resource>({
        filter: `category = "${category}"`,
        sort: '-created'
      });
    } catch (error) {
      console.error('Error fetching resources by category:', error);
      return [];
    }
  },

  async createResource(data: Partial<Resource> | FormData): Promise<Resource | null> {
    if (isMockEnv()) {
      const formData = data as Partial<Resource>;
      const newResource: Resource = {
        id: `res-${Date.now()}`,
        title: formData.title || 'New Resource',
        description: formData.description || '',
        type: formData.type || 'Asset',
        created: new Date().toISOString(),
        visibility: formData.visibility || 'private',
        views: 0,
        downloads: 0,
        owner_id: formData.owner_id,
        tags: formData.tags,
        category: formData.category
      };
      MOCK_RESOURCES.push(newResource);
      return newResource;
    }

    try {
      return await pb.collection('resources').create<Resource>(data);
    } catch (error) {
      console.error('Error creating resource:', error);
      return null;
    }
  },

  async updateResource(id: string, data: Partial<Resource>): Promise<Resource | null> {
    if (isMockEnv()) {
      const resource = MOCK_RESOURCES.find(r => r.id === id);
      if (resource) {
        Object.assign(resource, data);
      }
      return resource || null;
    }

    try {
      return await pb.collection('resources').update<Resource>(id, data);
    } catch (error) {
      console.error('Error updating resource:', error);
      return null;
    }
  },

  async deleteResource(id: string): Promise<boolean> {
    if (isMockEnv()) {
      const index = MOCK_RESOURCES.findIndex(r => r.id === id);
      if (index !== -1) {
        MOCK_RESOURCES.splice(index, 1);
      }
      return true;
    }

    try {
      await pb.collection('resources').delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting resource:', error);
      return false;
    }
  },

  async incrementViews(id: string): Promise<Resource | null> {
    if (isMockEnv()) {
      const resource = MOCK_RESOURCES.find(r => r.id === id);
      if (resource) {
        resource.views++;
      }
      return resource || null;
    }

    try {
      const record = await pb.collection('resources').getOne<Resource>(id);
      return await pb.collection('resources').update(id, {
        views: (record.views || 0) + 1
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
      return null;
    }
  },

  async incrementDownloads(id: string): Promise<Resource | null> {
    if (isMockEnv()) {
      const resource = MOCK_RESOURCES.find(r => r.id === id);
      if (resource) {
        resource.downloads++;
      }
      return resource || null;
    }

    try {
      const record = await pb.collection('resources').getOne<Resource>(id);
      return await pb.collection('resources').update(id, {
        downloads: (record.downloads || 0) + 1
      });
    } catch (error) {
      console.error('Error incrementing downloads:', error);
      return null;
    }
  },

  // Categories
  async getCategories(): Promise<ResourceCategory[]> {
    if (isMockEnv()) {
      return [...MOCK_CATEGORIES];
    }

    try {
      return await pb.collection('resource_categories').getFullList<ResourceCategory>({
        sort: 'name'
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      return MOCK_CATEGORIES; // Fallback to mock
    }
  },

  // Statistics
  async getResourceStats() {
    if (isMockEnv()) {
      return {
        total_resources: MOCK_RESOURCES.length,
        public_resources: MOCK_RESOURCES.filter(r => r.visibility === 'public').length,
        shared_resources: MOCK_RESOURCES.filter(r => r.visibility === 'shared').length,
        private_resources: MOCK_RESOURCES.filter(r => r.visibility === 'private').length,
        total_views: MOCK_RESOURCES.reduce((sum, r) => sum + r.views, 0),
        total_downloads: MOCK_RESOURCES.reduce((sum, r) => sum + r.downloads, 0),
        most_downloaded: [...MOCK_RESOURCES].sort((a, b) => b.downloads - a.downloads)[0]?.title || 'None',
        most_viewed: [...MOCK_RESOURCES].sort((a, b) => b.views - a.views)[0]?.title || 'None'
      };
    }

    try {
      const resources = await pb.collection('resources').getFullList<Resource>();

      return {
        total_resources: resources.length,
        public_resources: resources.filter(r => r.visibility === 'public').length,
        shared_resources: resources.filter(r => r.visibility === 'shared').length,
        private_resources: resources.filter(r => r.visibility === 'private').length,
        total_views: resources.reduce((sum, r) => sum + r.views, 0),
        total_downloads: resources.reduce((sum, r) => sum + r.downloads, 0),
        most_downloaded: [...resources].sort((a, b) => b.downloads - a.downloads)[0]?.title || 'None',
        most_viewed: [...resources].sort((a, b) => b.views - a.views)[0]?.title || 'None'
      };
    } catch (error) {
      console.error('Error fetching resource stats:', error);
      return {
        total_resources: 0,
        public_resources: 0,
        shared_resources: 0,
        private_resources: 0,
        total_views: 0,
        total_downloads: 0,
        most_downloaded: 'None',
        most_viewed: 'None'
      };
    }
  },

  // Resource types list
  getResourceTypes(): Resource['type'][] {
    return ['Whitepaper', 'Guide', 'Webinar', 'Asset', 'Lesson Plan', 'Worksheet', 'Video', 'Presentation'];
  }
};
