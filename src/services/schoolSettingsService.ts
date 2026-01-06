import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import env from '../config/environment';

/**
 * School Settings Interface
 * Stores school-specific configuration in database
 */
export interface SchoolSettings extends RecordModel {
    school_name: string;
    academic_year: string;
    school_logo?: string;
    school_address?: string;
    school_phone?: string;
    school_email?: string;
    school_website?: string;
    principal_name?: string;
    timezone: string;
    locale: string;
    currency: string;

    // Academic Configuration
    grading_scale: 'letter' | 'percentage' | 'points' | '4.0' | '5.0';
    term_system: 'semester' | 'trimester' | 'quarter';
    start_date?: string;
    end_date?: string;

    // Feature Toggles (school-specific)
    enable_parent_portal: boolean;
    enable_online_payments: boolean;
    enable_gradebook: boolean;
    enable_attendance: boolean;
    enable_messaging: boolean;

    // Attendance Settings
    attendance_grace_period_minutes: number;
    mark_absent_after_minutes: number;

    // Grade Settings
    passing_grade: number;
    honor_roll_threshold: number;
}

/**
 * School Settings Service
 * Manages school-specific configuration
 * Replaces all hardcoded school values
 */
class SchoolSettingsService {
    private settings: SchoolSettings | null = null;
    private loading: boolean = false;
    private listeners: ((settings: SchoolSettings) => void)[] = [];

    /**
     * Initialize school settings
     * Should be called on app startup
     */
    async initialize(): Promise<SchoolSettings> {
        if (this.settings) return this.settings;
        if (this.loading) {
            // Wait for existing load to complete
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.settings && !this.loading) {
                        clearInterval(checkInterval);
                        resolve(this.settings);
                    }
                }, 100);
            });
        }

        this.loading = true;
        try {
            // Try to get settings from database
            const result = await pb.collection('school_settings').getFirstListItem<SchoolSettings>('');
            this.settings = result;
            this.notifyListeners();
            return this.settings;
        } catch (error) {
            console.warn('School settings not found in database, creating defaults...', error);
            // Create default settings
            const defaults = this.getDefaultSettings();
            try {
                this.settings = await pb.collection('school_settings').create<SchoolSettings>(defaults);
                this.notifyListeners();
                return this.settings;
            } catch (createError) {
                console.error('Failed to create default school settings:', createError);
                // Return defaults without saving
                this.settings = defaults as SchoolSettings;
                return this.settings;
            }
        } finally {
            this.loading = false;
        }
    }

    /**
     * Get current school settings
     * Returns cached settings or loads from database
     */
    async getSettings(): Promise<SchoolSettings> {
        if (!this.settings) {
            return await this.initialize();
        }
        return this.settings;
    }

    /**
     * Get school name
     */
    async getSchoolName(): Promise<string> {
        const settings = await this.getSettings();
        return settings.school_name || env.get('defaultSchoolName');
    }

    /**
     * Get academic year
     */
    async getAcademicYear(): Promise<string> {
        const settings = await this.getSettings();
        return settings.academic_year || env.get('defaultAcademicYear');
    }

    /**
     * Update school settings
     */
    async updateSettings(updates: Partial<SchoolSettings>): Promise<SchoolSettings> {
        if (!this.settings) {
            await this.initialize();
        }

        if (!this.settings) {
            throw new Error('School settings not initialized');
        }

        try {
            this.settings = await pb.collection('school_settings').update<SchoolSettings>(
                this.settings.id,
                updates
            );
            this.notifyListeners();
            return this.settings;
        } catch (error) {
            console.error('Failed to update school settings:', error);
            throw error;
        }
    }

    /**
     * Subscribe to settings changes
     */
    subscribe(callback: (settings: SchoolSettings) => void): () => void {
        this.listeners.push(callback);
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all listeners of settings change
     */
    private notifyListeners(): void {
        if (this.settings) {
            this.listeners.forEach(callback => callback(this.settings!));
        }
    }

    /**
     * Get default settings
     */
    private getDefaultSettings(): Partial<SchoolSettings> {
        return {
            school_name: env.get('defaultSchoolName'),
            academic_year: env.get('defaultAcademicYear'),
            timezone: 'UTC',
            locale: 'en-US',
            currency: 'USD',
            grading_scale: 'letter',
            term_system: 'semester',
            enable_parent_portal: true,
            enable_online_payments: false,
            enable_gradebook: true,
            enable_attendance: true,
            enable_messaging: true,
            attendance_grace_period_minutes: 15,
            mark_absent_after_minutes: 30,
            passing_grade: 60,
            honor_roll_threshold: 90,
        };
    }

    /**
     * Refresh settings from database
     */
    async refresh(): Promise<SchoolSettings> {
        this.settings = null;
        return await this.initialize();
    }

    /**
     * Check if a feature is enabled
     */
    async isFeatureEnabled(feature: keyof Pick<SchoolSettings,
        'enable_parent_portal' | 'enable_online_payments' | 'enable_gradebook' |
        'enable_attendance' | 'enable_messaging'>): Promise<boolean> {
        const settings = await this.getSettings();
        return settings[feature] || false;
    }
}

// Singleton instance
export const schoolSettingsService = new SchoolSettingsService();

// Initialize on module load (will cache the settings)
schoolSettingsService.initialize().catch(err => {
    console.error('Failed to initialize school settings:', err);
});
