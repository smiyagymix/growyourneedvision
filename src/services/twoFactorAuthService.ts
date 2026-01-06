/**
 * Two-Factor Authentication (2FA) Service
 * Implements TOTP-based 2FA for enhanced security
 */

import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

interface TwoFactorSetup {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}

interface TwoFactorVerification {
    success: boolean;
    error?: string;
}

class TwoFactorAuthService {
    private readonly appName = 'Grow Your Need';
    private readonly issuer = 'GrowYourNeed';

    /**
     * Generate 2FA setup for user
     * @param userId - User ID
     * @param userEmail - User email for TOTP label
     * @returns Setup data including secret and QR code
     */
    async setupTwoFactor(userId: string, userEmail: string): Promise<TwoFactorSetup> {
        if (isMockEnv()) {
            return {
                secret: 'MOCK_SECRET_KEY_FOR_TESTING',
                qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                backupCodes: ['BACKUP1', 'BACKUP2', 'BACKUP3', 'BACKUP4', 'BACKUP5']
            };
        }

        try {
            // Generate secret
            const secret = new OTPAuth.Secret({ size: 32 });

            // Create TOTP instance
            const totp = new OTPAuth.TOTP({
                issuer: this.issuer,
                label: userEmail,
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: secret
            });

            // Generate QR code
            const otpauthUrl = totp.toString();
            const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

            // Generate backup codes
            const backupCodes = this.generateBackupCodes(5);

            // Store secret and backup codes in user record
            await pb.collection('users').update(userId, {
                twofa_secret: secret.base32,
                twofa_backup_codes: backupCodes,
                twofa_enabled: false  // Not enabled until verified
            });

            return {
                secret: secret.base32,
                qrCodeUrl,
                backupCodes
            };
        } catch (error) {
            console.error('Error setting up 2FA:', error);
            throw new Error('Failed to setup two-factor authentication');
        }
    }

    /**
     * Verify TOTP code and enable 2FA
     * @param userId - User ID
     * @param code - 6-digit TOTP code
     * @returns Verification result
     */
    async verifyAndEnable(userId: string, code: string): Promise<TwoFactorVerification> {
        if (isMockEnv()) {
            return { success: code === '123456' };
        }

        try {
            // Get user's secret
            const user = await pb.collection('users').getOne(userId);

            if (!user.twofa_secret) {
                return { success: false, error: '2FA not setup for this user' };
            }

            // Verify code
            const totp = new OTPAuth.TOTP({
                issuer: this.issuer,
                label: user.email,
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: OTPAuth.Secret.fromBase32(user.twofa_secret)
            });

            const delta = totp.validate({ token: code, window: 1 });

            if (delta !== null) {
                // Code is valid, enable 2FA
                await pb.collection('users').update(userId, {
                    twofa_enabled: true
                });

                return { success: true };
            } else {
                return { success: false, error: 'Invalid verification code' };
            }
        } catch (error) {
            console.error('Error verifying 2FA code:', error);
            return { success: false, error: 'Verification failed' };
        }
    }

    /**
     * Verify 2FA code during login
     * @param userId - User ID
     * @param code - 6-digit TOTP code or backup code
     * @returns Verification result
     */
    async verifyCode(userId: string, code: string): Promise<TwoFactorVerification> {
        if (isMockEnv()) {
            return { success: true };
        }

        try {
            const user = await pb.collection('users').getOne(userId);

            if (!user.twofa_enabled) {
                return { success: true }; // 2FA not enabled
            }

            // Check if it's a backup code
            if (user.twofa_backup_codes && user.twofa_backup_codes.includes(code)) {
                // Remove used backup code
                const updatedCodes = user.twofa_backup_codes.filter((c: string) => c !== code);
                await pb.collection('users').update(userId, {
                    twofa_backup_codes: updatedCodes
                });

                return { success: true };
            }

            // Verify TOTP code
            const totp = new OTPAuth.TOTP({
                issuer: this.issuer,
                label: user.email,
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: OTPAuth.Secret.fromBase32(user.twofa_secret)
            });

            const delta = totp.validate({ token: code, window: 1 });

            if (delta !== null) {
                return { success: true };
            } else {
                return { success: false, error: 'Invalid authentication code' };
            }
        } catch (error) {
            console.error('Error verifying 2FA code:', error);
            return { success: false, error: 'Verification failed' };
        }
    }

    /**
     * Disable 2FA for user
     * @param userId - User ID
     * @param code - Verification code to confirm disable
     */
    async disable(userId: string, code: string): Promise<TwoFactorVerification> {
        if (isMockEnv()) {
            return { success: true };
        }

        try {
            // Verify code before disabling
            const verification = await this.verifyCode(userId, code);

            if (!verification.success) {
                return { success: false, error: 'Invalid code. Cannot disable 2FA.' };
            }

            // Disable 2FA
            await pb.collection('users').update(userId, {
                twofa_enabled: false,
                twofa_secret: null,
                twofa_backup_codes: null
            });

            return { success: true };
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            return { success: false, error: 'Failed to disable 2FA' };
        }
    }

    /**
     * Regenerate backup codes
     * @param userId - User ID
     * @param code - Verification code to confirm regeneration
     */
    async regenerateBackupCodes(userId: string, code: string): Promise<{ success: boolean; codes?: string[]; error?: string }> {
        if (isMockEnv()) {
            return { success: true, codes: ['NEW1', 'NEW2', 'NEW3', 'NEW4', 'NEW5'] };
        }

        try {
            // Verify code before regenerating
            const verification = await this.verifyCode(userId, code);

            if (!verification.success) {
                return { success: false, error: 'Invalid code. Cannot regenerate backup codes.' };
            }

            // Generate new backup codes
            const backupCodes = this.generateBackupCodes(5);

            await pb.collection('users').update(userId, {
                twofa_backup_codes: backupCodes
            });

            return { success: true, codes: backupCodes };
        } catch (error) {
            console.error('Error regenerating backup codes:', error);
            return { success: false, error: 'Failed to regenerate backup codes' };
        }
    }

    /**
     * Check if user has 2FA enabled
     * @param userId - User ID
     */
    async isEnabled(userId: string): Promise<boolean> {
        if (isMockEnv()) {
            return false;
        }

        try {
            const user = await pb.collection('users').getOne(userId);
            return user.twofa_enabled || false;
        } catch (error) {
            console.error('Error checking 2FA status:', error);
            return false;
        }
    }

    /**
     * Generate random backup codes
     * @param count - Number of codes to generate
     */
    private generateBackupCodes(count: number): string[] {
        const codes: string[] = [];
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        for (let i = 0; i < count; i++) {
            let code = '';
            for (let j = 0; j < 8; j++) {
                code += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            codes.push(code);
        }

        return codes;
    }

    /**
     * Validate 2FA code format
     * @param code - Code to validate
     */
    validateCodeFormat(code: string): boolean {
        // Should be 6 digits for TOTP or 8 alphanumeric for backup code
        return /^\d{6}$/.test(code) || /^[A-Z0-9]{8}$/.test(code);
    }
}

export const twoFactorAuthService = new TwoFactorAuthService();
