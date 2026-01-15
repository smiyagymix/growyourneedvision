import { RecordModel } from 'pocketbase';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface SubscriptionRecord extends RecordModel {
  user: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
  startedAt?: string;
  endedAt?: string;
  metadata?: Record<string, string>;
}

export const subscriptionService = {
  async createSubscription(userId: string, planId: string): Promise<SubscriptionRecord> {
    if (isMockEnv()) {
      return {
        id: `sub-${Date.now()}`,
        collectionId: 'mock',
        collectionName: 'subscriptions',
        user: userId,
        planId,
        status: 'active',
        startedAt: new Date().toISOString(),
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      } as SubscriptionRecord;
    }

    const result = await pb.collection('subscriptions').create<SubscriptionRecord>({
      user: userId,
      planId,
      status: 'active'
    });
    return result as unknown as SubscriptionRecord;
  },

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (isMockEnv()) return true;
    await pb.collection('subscriptions').update(subscriptionId, { status: 'canceled' });
    return true;
  },

  async getSubscriptionById(subscriptionId: string): Promise<SubscriptionRecord | null> {
    if (isMockEnv()) {
      return null;
    }
    const rec = await pb.collection('subscriptions').getOne<SubscriptionRecord>(subscriptionId);
    return rec as unknown as SubscriptionRecord;
  },

  async listSubscriptionsForUser(userId: string): Promise<SubscriptionRecord[]> {
    if (isMockEnv()) return [];
    const list = await pb.collection('subscriptions').getFullList<SubscriptionRecord>({ filter: `user = "${userId}"` });
    return list as unknown as SubscriptionRecord[];
  }
};

export default subscriptionService;
