/**
 * Web Push Notification Service
 * Enterprise production implementation for browser-based push notifications
 */

import pb from '../lib/pocketbase';
import env from '../config/environment';
import { Logger, LogLevel } from '../utils/logging';
import { Metadata } from '../types/common';

export interface PushMessage {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  data?: Metadata;
}

export interface PushResult {
  success: boolean;
  deliveredCount: number;
  failedCount: number;
  errors?: Array<{ subscriptionId: string; error: string }>;
}

class PushService {
  private readonly logger = new Logger({ storageName: 'PushService', minLevel: LogLevel.INFO });

  /**
   * Send push notification to all active subscriptions of a user
   */
  async sendToUser(message: PushMessage): Promise<PushResult> {
    try {
      this.logger.info('Sending push notification to user', { userId: message.userId });

      // Fetch active push subscriptions for the user
      const subscriptions = await pb.collection('push_subscriptions').getFullList({
        filter: `user = "${message.userId}" && status = "active"`,
        requestKey: null
      });

      if (subscriptions.length === 0) {
        this.logger.warn('No active push subscriptions found for user', { userId: message.userId });
        return { success: true, deliveredCount: 0, failedCount: 0 };
      }

      const results = await Promise.allSettled(
        subscriptions.map(sub => this.deliverToSubscription(sub as unknown as { id: string; subscription_data: any }, message))
      );

      const deliveredCount = results.filter(r => r.status === 'fulfilled' && (r.value as { success: boolean }).success).length;
      const failedCount = results.length - deliveredCount;
      const errors = results
        .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !(r.value as { success: boolean }).success))
        .map((r, i) => ({
          subscriptionId: subscriptions[i].id,
          error: r.status === 'rejected' ? (r.reason as Error).message : (r.value as { error: string }).error
        }));

      return {
        success: deliveredCount > 0,
        deliveredCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      this.logger.error('PushService.sendToUser failed', { error, userId: message.userId });
      return { 
        success: false, 
        deliveredCount: 0, 
        failedCount: 0, 
        errors: [{ subscriptionId: 'system', error: error instanceof Error ? error.message : 'Unknown error' }] 
      };
    }
  }

  private async deliverToSubscription(subscription: { id: string; subscription_data: any }, message: PushMessage): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, this would call a Web-Push library on the server
      // or a backend API endpoint that handles VAPID-signed requests.
      const response = await fetch(`${env.get('apiUrl')}/api/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.get('serviceApiKey')}`
        },
        body: JSON.stringify({
          subscription: subscription.subscription_data,
          message: {
            title: message.title,
            body: message.body,
            icon: message.icon || '/favicon.ico',
            tag: message.tag,
            data: {
              ...message.data,
              url: message.url ? `${env.get('appUrl')}${message.url}` : undefined
            }
          }
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        // Handle subscription expiration/unsubscription
        if (response.status === 410 || response.status === 404) {
          await this.deactivateSubscription(subscription.id);
        }
        return { success: false, error: error || `Push API error: ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  private async deactivateSubscription(subscriptionId: string): Promise<void> {
    try {
      await pb.collection('push_subscriptions').update(subscriptionId, { status: 'inactive' });
      this.logger.info('Deactivated push subscription', { subscriptionId });
    } catch (error) {
      this.logger.error('Failed to deactivate push subscription', { error, subscriptionId });
    }
  }

  /**
   * Subscribe current user to push notifications
   * (Called from frontend)
   */
  async subscribe(subscription: PushSubscription): Promise<void> {
    const user = pb.authStore.model;
    if (!user) throw new Error('User must be authenticated');

    await pb.collection('push_subscriptions').create({
      user: user.id,
      subscription_data: subscription.toJSON(),
      status: 'active',
      device_info: {
        userAgent: navigator.userAgent,
        platform: (navigator as unknown as { platform: string }).platform,
        language: navigator.language
      }
    });
  }
}

export const pushService = new PushService();
