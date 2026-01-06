import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { RecordModel } from 'pocketbase';

export interface Post extends RecordModel {
  id: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  tags: string[];
  created: string;
  pinned?: boolean;
  category?: string;
  tenantId?: string;
  expand?: {
    author?: { name: string; avatar?: string };
  };
}

export interface CreatePostData {
  title: string;
  content: string;
  author?: string;
  tags?: string[];
  category?: string;
  pinned?: boolean;
  tenantId?: string;
}

export interface Comment extends RecordModel {
  id: string;
  post: string;
  author: string;
  content: string;
  created: string;
  expand?: {
    author?: { name: string; avatar?: string };
  };
}

const mockPosts: Post[] = [
  {
    id: 'mock-post-1',
    collectionId: 'mock',
    collectionName: 'community_posts',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    title: 'Feature Request: Dark Mode',
    content: 'We should prioritize dark mode for better night-time usability.',
    author: 'Owner User',
    likes: 12,
    tags: ['feature', 'ui'],
    category: 'feature-request',
    pinned: true
  },
  {
    id: 'mock-post-2',
    collectionId: 'mock',
    collectionName: 'community_posts',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    title: 'Bug Report: Attendance Sync',
    content: 'Attendance data is occasionally delayed for School B.',
    author: 'School Admin',
    likes: 4,
    tags: ['bug', 'integration'],
    category: 'bug-report'
  },
];

const mockComments: Comment[] = [
  {
    id: 'mock-comment-1',
    collectionId: 'mock',
    collectionName: 'community_comments',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    post: 'mock-post-1',
    author: 'Teacher User',
    content: 'This would be really helpful for late night grading!'
  }
];

export const communityService = {
  /**
   * Get paginated posts
   */
  async getPosts(page = 1, perPage = 50, filter?: { category?: string; tag?: string; tenantId?: string }) {
    if (isMockEnv()) {
      let filtered = [...mockPosts];
      if (filter?.category) {
        filtered = filtered.filter(p => p.category === filter.category);
      }
      if (filter?.tag) {
        filtered = filtered.filter(p => p.tags.includes(filter.tag!));
      }
      return {
        items: filtered,
        totalItems: filtered.length,
        totalPages: 1,
        page: 1,
        perPage: filtered.length,
      };
    }

    try {
      const filterParts: string[] = [];
      if (filter?.category) filterParts.push(`category = "${filter.category}"`);
      if (filter?.tag) filterParts.push(`tags ~ "${filter.tag}"`);
      if (filter?.tenantId) filterParts.push(`tenantId = "${filter.tenantId}"`);

      const records = await pb.collection('community_posts').getList<Post>(page, perPage, {
        filter: filterParts.join(' && ') || undefined,
        sort: '-pinned,-created',
        expand: 'author',
      });
      return records;
    } catch (error) {
      console.error('Failed to fetch community posts:', error);
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        perPage: 50,
      };
    }
  },

  /**
   * Get a single post by ID
   */
  async getPost(postId: string): Promise<Post | null> {
    if (isMockEnv()) {
      return mockPosts.find(p => p.id === postId) || null;
    }

    try {
      return await pb.collection('community_posts').getOne<Post>(postId, {
        expand: 'author',
        requestKey: null
      });
    } catch (error) {
      console.error('Failed to fetch post:', error);
      return null;
    }
  },

  /**
   * Create a new post
   */
  async createPost(data: CreatePostData): Promise<Post | null> {
    if (isMockEnv()) {
      const newPost: Post = {
        id: `mock-post-${Date.now()}`,
        collectionId: 'mock',
        collectionName: 'community_posts',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        title: data.title || 'Untitled',
        content: data.content || '',
        author: data.author || 'Owner User',
        likes: 0,
        tags: data.tags || [],
        category: data.category,
        pinned: data.pinned || false,
        tenantId: data.tenantId
      };
      mockPosts.unshift(newPost);
      return newPost;
    }

    try {
      const user = pb.authStore.model;
      return await pb.collection('community_posts').create<Post>({
        ...data,
        author: data.author || user?.id,
        likes: 0
      });
    } catch (error) {
      console.error('Failed to create post:', error);
      return null;
    }
  },

  /**
   * Update an existing post
   */
  async updatePost(postId: string, data: Partial<CreatePostData>): Promise<Post | null> {
    if (isMockEnv()) {
      const idx = mockPosts.findIndex(p => p.id === postId);
      if (idx >= 0) {
        mockPosts[idx] = {
          ...mockPosts[idx],
          ...data,
          updated: new Date().toISOString()
        };
        return mockPosts[idx];
      }
      return null;
    }

    try {
      return await pb.collection('community_posts').update<Post>(postId, data);
    } catch (error) {
      console.error('Failed to update post:', error);
      return null;
    }
  },

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<boolean> {
    if (isMockEnv()) {
      const idx = mockPosts.findIndex(p => p.id === postId);
      if (idx >= 0) {
        mockPosts.splice(idx, 1);
        return true;
      }
      return false;
    }

    try {
      await pb.collection('community_posts').delete(postId);
      return true;
    } catch (error) {
      console.error('Failed to delete post:', error);
      return false;
    }
  },

  /**
   * Like a post
   */
  async likePost(id: string): Promise<Post | null> {
    if (isMockEnv()) {
      const post = mockPosts.find(p => p.id === id);
      if (!post) return null;
      post.likes += 1;
      return post;
    }

    try {
      const post = await pb.collection('community_posts').getOne<Post>(id);
      return await pb.collection('community_posts').update<Post>(id, { likes: post.likes + 1 });
    } catch (error) {
      console.error('Failed to like post:', error);
      return null;
    }
  },

  /**
   * Unlike a post
   */
  async unlikePost(id: string): Promise<Post | null> {
    if (isMockEnv()) {
      const post = mockPosts.find(p => p.id === id);
      if (!post) return null;
      post.likes = Math.max(0, post.likes - 1);
      return post;
    }

    try {
      const post = await pb.collection('community_posts').getOne<Post>(id);
      return await pb.collection('community_posts').update<Post>(id, { 
        likes: Math.max(0, post.likes - 1) 
      });
    } catch (error) {
      console.error('Failed to unlike post:', error);
      return null;
    }
  },

  /**
   * Pin/unpin a post (admin only)
   */
  async togglePinPost(postId: string, pinned: boolean): Promise<Post | null> {
    return this.updatePost(postId, { pinned });
  },

  /**
   * Get comments for a post
   */
  async getComments(postId: string): Promise<Comment[]> {
    if (isMockEnv()) {
      return mockComments.filter(c => c.post === postId);
    }

    try {
      return await pb.collection('community_comments').getFullList<Comment>({
        filter: `post = "${postId}"`,
        expand: 'author',
        sort: '-created',
        requestKey: null
      });
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  },

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, content: string): Promise<Comment | null> {
    if (isMockEnv()) {
      const newComment: Comment = {
        id: `mock-comment-${Date.now()}`,
        collectionId: 'mock',
        collectionName: 'community_comments',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        post: postId,
        author: 'Current User',
        content
      };
      mockComments.unshift(newComment);
      return newComment;
    }

    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('User not authenticated');

      return await pb.collection('community_comments').create<Comment>({
        post: postId,
        author: user.id,
        content
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      return null;
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<boolean> {
    if (isMockEnv()) {
      const idx = mockComments.findIndex(c => c.id === commentId);
      if (idx >= 0) {
        mockComments.splice(idx, 1);
        return true;
      }
      return false;
    }

    try {
      await pb.collection('community_comments').delete(commentId);
      return true;
    } catch (error) {
      console.error('Failed to delete comment:', error);
      return false;
    }
  },

  /**
   * Search posts
   */
  async searchPosts(query: string): Promise<Post[]> {
    if (isMockEnv()) {
      const lowQuery = query.toLowerCase();
      return mockPosts.filter(p => 
        p.title.toLowerCase().includes(lowQuery) || 
        p.content.toLowerCase().includes(lowQuery)
      );
    }

    try {
      const result = await pb.collection('community_posts').getList<Post>(1, 50, {
        filter: `title ~ "${query}" || content ~ "${query}"`,
        expand: 'author',
        sort: '-created'
      });
      return result.items;
    } catch (error) {
      console.error('Failed to search posts:', error);
      return [];
    }
  }
};
