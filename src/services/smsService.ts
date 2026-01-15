/**
 * SMS Service
 * Enterprise production implementation for multi-provider SMS delivery
 */

import pb from '../lib/pocketbase';
import env from '../config/environment';
import { Logger, LogLevel } from '../utils/logging';

export interface SmsMessage {
  to: string;
  message: string;
  provider?: 'twilio' | 'messagebird' | 'generic';
  metadata?: Record<string, string | number | boolean>;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SmsService {
  private readonly logger = new Logger({ storageName: 'SmsService', minLevel: LogLevel.INFO });

  /**
   * Send SMS via configured provider
   */
  async send(data: SmsMessage): Promise<SmsResult> {
    try {
      this.logger.info('Sending SMS', { to: data.to });

      let result: SmsResult;
      const provider = data.provider || 'generic';

      switch (provider) {
        case 'twilio':
          result = await this.sendViaTwilio(data);
          break;
        case 'messagebird':
          result = await this.sendViaMessageBird(data);
          break;
        default:
          result = await this.sendViaGenericApi(data);
      }

      await this.logSms(data, result);
      return result;
    } catch (error) {
      this.logger.error('SmsService.send failed', { error, to: data.to });
      const result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      await this.logSms(data, result);
      return result;
    }
  }

  private async sendViaTwilio(data: SmsMessage): Promise<SmsResult> {
    const accountSid = env.get('twilioAccountSid');
    const authToken = env.get('twilioAuthToken');
    const from = env.get('twilioFromNumber');

    if (!accountSid || !authToken || !from) {
      throw new Error('Twilio not configured');
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: data.to,
        From: from,
        Body: data.message
      })
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, messageId: result.sid };
    } else {
      const error = await response.json();
      return { success: false, error: error.message || 'Twilio API error' };
    }
  }

  private async sendViaMessageBird(data: SmsMessage): Promise<SmsResult> {
    const apiKey = env.get('messagebirdApiKey');
    
    if (!apiKey) {
      throw new Error('MessageBird not configured');
    }

    const response = await fetch('https://rest.messagebird.com/messages', {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: [data.to],
        body: data.message,
        originator: 'GN-ALERTS'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, messageId: result.id };
    } else {
      const error = await response.json();
      return { success: false, error: error.errors?.[0]?.description || 'MessageBird API error' };
    }
  }

  private async sendViaGenericApi(data: SmsMessage): Promise<SmsResult> {
    const response = await fetch(`${env.get('apiUrl')}/api/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.get('serviceApiKey')}`
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, messageId: result.messageId || `gen-${Date.now()}` };
    } else {
      const error = await response.text();
      return { success: false, error: error || `API error: ${response.status}` };
    }
  }

  private async logSms(data: SmsMessage, result: SmsResult): Promise<void> {
    try {
      await pb.collection('sms_logs').create({
        to_number: data.to,
        message: data.message,
        status: result.success ? 'sent' : 'failed',
        provider_message_id: result.messageId,
        error_message: result.error,
        metadata: data.metadata,
        sent_at: result.success ? new Date().toISOString() : null
      });
    } catch (err) {
      this.logger.error('Error logging SMS', { err });
    }
  }
}

export const smsService = new SmsService();
