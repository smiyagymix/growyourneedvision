import pb from '../../lib/pocketbase';
import CryptoJS from 'crypto-js';
import { TokenPayload } from '../../types/services';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface RefreshResponse {
  success: boolean;
  tokens?: TokenPair;
  error?: string;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'gyn_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'gyn_refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'gyn_token_expiry';
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

  /**
   * Store tokens securely with encryption
   */
  static storeTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    try {
      const expiresAt = Date.now() + (expiresIn * 1000);
      
      // Encrypt sensitive data before storing
      const encryptedAccess = CryptoJS.AES.encrypt(accessToken, process.env.VITE_ENCRYPTION_KEY || 'default-key').toString();
      const encryptedRefresh = CryptoJS.AES.encrypt(refreshToken, process.env.VITE_ENCRYPTION_KEY || 'default-key').toString();
      
      localStorage.setItem(this.ACCESS_TOKEN_KEY, encryptedAccess);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedRefresh);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiresAt.toString());
      
      console.log('✅ Tokens stored securely');
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
      throw new Error('Failed to store tokens securely');
    }
  }

  /**
   * Retrieve and decrypt tokens
   */
  static getTokens(): TokenPair | null {
    try {
      const encryptedAccess = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const encryptedRefresh = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

      if (!encryptedAccess || !encryptedRefresh || !expiryStr) {
        return null;
      }

      // Decrypt tokens
      const accessToken = CryptoJS.AES.decrypt(encryptedAccess, process.env.VITE_ENCRYPTION_KEY || 'default-key').toString(CryptoJS.enc.Utf8);
      const refreshToken = CryptoJS.AES.decrypt(encryptedRefresh, process.env.VITE_ENCRYPTION_KEY || 'default-key').toString(CryptoJS.enc.Utf8);
      const expiresAt = parseInt(expiryStr);

      return {
        accessToken,
        refreshToken,
        expiresAt
      };
    } catch (error) {
      console.error('❌ Error retrieving tokens:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Check if token needs refresh
   */
  static shouldRefreshToken(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return true;

    const now = Date.now();
    const timeUntilExpiry = tokens.expiresAt - now;
    
    return timeUntilExpiry <= this.REFRESH_THRESHOLD;
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(): Promise<RefreshResponse> {
    try {
      const tokens = this.getTokens();
      if (!tokens || !tokens.refreshToken) {
        return { success: false, error: 'No refresh token available' };
      }

      console.log('🔄 Refreshing access token...');

      // Call PocketBase to refresh token
      const refreshedData = await pb.collection('_users').authRefresh(tokens.refreshToken);
      
      if (refreshedData.token && refreshedData.record) {
        // Calculate new expiry time
        const expiresIn = 3600; // 1 hour default
        const newTokens: TokenPair = {
          accessToken: refreshedData.token,
          refreshToken: tokens.refreshToken, // Keep same refresh token
          expiresAt: Date.now() + (expiresIn * 1000)
        };

        // Store new tokens
        this.storeTokens(newTokens.accessToken, newTokens.refreshToken, expiresIn);

        console.log('✅ Access token refreshed successfully');
        return { success: true, tokens: newTokens };
      } else {
        throw new Error('Invalid refresh response from PocketBase');
      }
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      
      // Clear invalid tokens
      this.clearTokens();
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      };
    }
  }

  /**
   * Auto-refresh token if needed
   */
  static async autoRefreshIfNeeded(): Promise<RefreshResponse> {
    if (!this.shouldRefreshToken()) {
      const tokens = this.getTokens();
      return { success: true, tokens: tokens! };
    }

    return await this.refreshAccessToken();
  }

  /**
   * Clear all stored tokens
   */
  static clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      console.log('🗑️ Tokens cleared from storage');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;

    // Check if token is still valid
    return Date.now() < tokens.expiresAt;
  }

  /**
   * Get current access token
   */
  static getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.accessToken || null;
  }

  /**
   * Setup automatic token refresh
   */
  static setupAutoRefresh(): void {
    // Check token validity every minute
    setInterval(async () => {
      if (this.shouldRefreshToken()) {
        console.log('🔄 Auto-refreshing expired token...');
        await this.refreshAccessToken();
      }
    }, 60000); // Check every minute

    // Setup visibility change listener to refresh when tab becomes active
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden && this.shouldRefreshToken()) {
        console.log('🔄 Refreshing token on tab activation...');
        await this.refreshAccessToken();
      }
    });
  }

  /**
   * Validate token format and structure
   */
  static validateTokenFormat(token: string): boolean {
    try {
      // Basic JWT format validation (header.payload.signature)
      const parts = token.split('.');
      return parts.length === 3 && parts.every(part => part.length > 0);
    } catch {
      return false;
    }
  }

  /**
   * Get token payload (decoded without verification for UI purposes)
   */
  static getTokenPayload(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = atob(paddedPayload);
      
      const parsed = JSON.parse(decoded);
      
      // Validate required JWT fields
      if (typeof parsed === 'object' && parsed !== null && typeof parsed.sub === 'string' && typeof parsed.exp === 'number') {
        return parsed as TokenPayload;
      }
      return null;
    } catch (error) {
      console.error('❌ Error decoding token payload:', error);
      return null;
    }
  }

  /**
   * Get user information from current token
   */
  static getCurrentUser(): TokenPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    const payload = this.getTokenPayload(token);
    return payload || null;
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) return true;
    
    const payload = this.getTokenPayload(tokenToCheck);
    if (!payload || !payload.exp) return true;
    
    return Date.now() >= payload.exp * 1000;
  }

  /**
   * Get remaining time until token expiry (in seconds)
   */
  static getTokenTimeRemaining(): number {
    const token = this.getAccessToken();
    if (!token) return 0;
    
    const payload = this.getTokenPayload(token);
    if (!payload || !payload.exp) return 0;
    
    return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
  }
}
