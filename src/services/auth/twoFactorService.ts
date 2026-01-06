import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export interface TOTPSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface Verify2FARequest {
  token: string;
  userId: string;
}

export interface Verify2FAResponse {
  success: boolean;
  error?: string;
  user?: any;
}

export class TwoFactorService {
  private static readonly TOTP_SECRET_KEY = 'gyn_totp_secret';
  private static readonly BACKUP_CODES_KEY = 'gyn_backup_codes';
  private static readonly TOTP_ENABLED_KEY = 'gyn_totp_enabled';

  /**
   * Generate a new TOTP secret
   */
  static generateTOTPSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  /**
   * Generate QR code for TOTP setup
   */
  static async generateQRCode(secret: string, userEmail: string, issuer: string = 'Grow Your Need'): Promise<string> {
    try {
      const otpAuthUrl = authenticator.keyuri(userEmail, secret, issuer, 'Grow Your Need');
      
      return new Promise((resolve, reject) => {
        QRCode.toDataURL(otpAuthUrl, (err, url) => {
          if (err) {
            reject(new Error('Failed to generate QR code'));
          } else {
            resolve(url);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Setup 2FA for a user
   */
  static async setup2FA(userEmail: string): Promise<TOTPSetup> {
    try {
      const secret = this.generateTOTPSecret();
      const backupCodes = this.generateBackupCodes();
      const qrCode = await this.generateQRCode(secret, userEmail);
      
      // Generate manual entry key (for users who can't scan QR)
      const manualEntryKey = secret.replace(/(.{4})/g, '$1 ').trim();

      console.log('✅ 2FA setup generated successfully');
      
      return {
        secret,
        qrCode,
        backupCodes,
        manualEntryKey
      };
    } catch (error) {
      console.error('❌ Error setting up 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP token
   */
  static verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('❌ Error verifying TOTP token:', error);
      return false;
    }
  }

  /**
   * Generate current TOTP token
   */
  static generateCurrentToken(secret: string): string {
    try {
      return authenticator.generate(secret);
    } catch (error) {
      console.error('❌ Error generating TOTP token:', error);
      throw new Error('Failed to generate TOTP token');
    }
  }

  /**
   * Store 2FA setup locally (temporary during setup)
   */
  static storeTempSetup(secret: string, backupCodes: string[]): void {
    try {
      localStorage.setItem(this.TOTP_SECRET_KEY, secret);
      localStorage.setItem(this.BACKUP_CODES_KEY, JSON.stringify(backupCodes));
      console.log('✅ Temporary 2FA setup stored');
    } catch (error) {
      console.error('❌ Error storing temporary 2FA setup:', error);
    }
  }

  /**
   * Get temporary 2FA setup
   */
  static getTempSetup(): { secret: string | null; backupCodes: string[] } {
    try {
      const secret = localStorage.getItem(this.TOTP_SECRET_KEY);
      const backupCodesStr = localStorage.getItem(this.BACKUP_CODES_KEY);
      const backupCodes = backupCodesStr ? JSON.parse(backupCodesStr) : [];
      
      return { secret, backupCodes };
    } catch (error) {
      console.error('❌ Error retrieving temporary 2FA setup:', error);
      return { secret: null, backupCodes: [] };
    }
  }

  /**
   * Clear temporary 2FA setup
   */
  static clearTempSetup(): void {
    try {
      localStorage.removeItem(this.TOTP_SECRET_KEY);
      localStorage.removeItem(this.BACKUP_CODES_KEY);
      console.log('🗑️ Temporary 2FA setup cleared');
    } catch (error) {
      console.error('❌ Error clearing temporary 2FA setup:', error);
    }
  }

  /**
   * Enable 2FA for user (after successful setup)
   */
  static async enable2FA(userId: string, secret: string, backupCodes: string[]): Promise<boolean> {
    try {
      // This would typically call your backend to enable 2FA for the user
      // For now, we'll store it locally as a placeholder
      const setupData = {
        userId,
        secret,
        backupCodes,
        enabled: true,
        enabledAt: new Date().toISOString()
      };

      localStorage.setItem(`${this.TOTP_ENABLED_KEY}_${userId}`, JSON.stringify(setupData));
      
      console.log('✅ 2FA enabled for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error enabling 2FA:', error);
      return false;
    }
  }

  /**
   * Check if 2FA is enabled for user
   */
  static is2FAEnabled(userId: string): boolean {
    try {
      const setupDataStr = localStorage.getItem(`${this.TOTP_ENABLED_KEY}_${userId}`);
      if (!setupDataStr) return false;
      
      const setupData = JSON.parse(setupDataStr);
      return setupData.enabled === true;
    } catch (error) {
      console.error('❌ Error checking 2FA status:', error);
      return false;
    }
  }

  /**
   * Get 2FA setup data for user
   */
  static get2FASetupData(userId: string): any | null {
    try {
      const setupDataStr = localStorage.getItem(`${this.TOTP_ENABLED_KEY}_${userId}`);
      if (!setupDataStr) return null;
      
      return JSON.parse(setupDataStr);
    } catch (error) {
      console.error('❌ Error retrieving 2FA setup data:', error);
      return null;
    }
  }

  /**
   * Disable 2FA for user
   */
  static async disable2FA(userId: string): Promise<boolean> {
    try {
      // This would typically call your backend to disable 2FA
      localStorage.removeItem(`${this.TOTP_ENABLED_KEY}_${userId}`);
      
      console.log('✅ 2FA disabled for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error disabling 2FA:', error
