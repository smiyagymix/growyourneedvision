/**
 * Analytics & Tracking Utility
 * Track user events, page views, and custom metrics
 * Can be integrated with Google Analytics, Mixpanel, etc.
 */

import { LogContext } from './logger';

export interface AnalyticsEvent {
    name: string;
    category: string;
    properties?: LogContext;
    timestamp: string;
    userId?: string;
    sessionId?: string;
}

class Analytics {
    private sessionId: string;
    private isDevelopment = process.env.NODE_ENV === 'development';
    private enabled = process.env.REACT_APP_ANALYTICS_ENABLED === 'true';

    constructor() {
        this.sessionId = this.generateSessionId();
        this.initializeTracking();
    }

    /**
     * Track a page view
     */
    pageView(path: string, title?: string): void {
        this.track('page_view', 'Navigation', {
            path,
            title: title || document.title,
            referrer: document.referrer
        });
    }

    /**
     * Track a custom event
     */
    track(eventName: string, category: string, properties?: Record<string, any>): void {
        if (!this.shouldTrack()) return;

        const event: AnalyticsEvent = {
            name: eventName,
            category,
            properties,
            timestamp: new Date().toISOString(),
            userId: this.getUserId(),
            sessionId: this.sessionId
        };

        if (this.isDevelopment) {
            console.log('[Analytics]', event);
        }

        // Send to analytics service
        this.sendEvent(event);
    }

    /**
     * Track user login
     */
    trackLogin(userId: string, role: string): void {
        this.track('user_login', 'Auth', {
            userId,
            role,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Track user logout
     */
    trackLogout(): void {
        this.track('user_logout', 'Auth', {
            userId: this.getUserId()
        });
    }

    /**
     * Track button click
     */
    trackClick(buttonName: string, context?: string): void {
        this.track('button_click', 'Interaction', {
            buttonName,
            context
        });
    }

    /**
     * Track form submission
     */
    trackFormSubmit(formName: string, success: boolean): void {
        this.track('form_submit', 'Form', {
            formName,
            success
        });
    }

    /**
     * Track error
     */
    trackError(errorMessage: string, errorType: string, context?: LogContext): void {
        this.track('error', 'Error', {
            message: errorMessage,
            type: errorType,
            context
        });
    }

    /**
     * Track feature usage
     */
    trackFeature(featureName: string, action: string): void {
        this.track('feature_used', 'Feature', {
            feature: featureName,
            action
        });
    }

    /**
     * Track gamification events
     */
    trackAchievement(achievementId: string, achievementName: string): void {
        this.track('achievement_unlocked', 'Gamification', {
            achievementId,
            achievementName
        });
    }

    trackLevelUp(newLevel: number): void {
        this.track('level_up', 'Gamification', {
            newLevel
        });
    }

    trackXPGained(amount: number, source: string): void {
        this.track('xp_gained', 'Gamification', {
            amount,
            source
        });
    }

    /**
     * Set user properties
     */
    setUserProperties(properties: Record<string, any>): void {
        if (!this.shouldTrack()) return;

        if (this.isDevelopment) {
            console.log('[Analytics] User Properties:', properties);
        }

        // Send to analytics service
        this.sendUserProperties(properties);
    }

    /**
     * Identify user
     */
    identify(userId: string, traits?: Record<string, any>): void {
        if (!this.shouldTrack()) return;

        if (this.isDevelopment) {
            console.log('[Analytics] Identify:', userId, traits);
        }

        // Send to analytics service
        this.sendIdentify(userId, traits);
    }

    // Private methods

    private shouldTrack(): boolean {
        return this.enabled;
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getUserId(): string | undefined {
        try {
            const authData = localStorage.getItem('pocketbase_auth');
            if (authData) {
                const parsed = JSON.parse(authData);
                return parsed?.model?.id;
            }
        } catch {
            return undefined;
        }
    }

    private initializeTracking(): void {
        // Initialize Google Analytics if key is present
        if (process.env.REACT_APP_GA_TRACKING_ID) {
            this.initGA();
        }

        // Initialize Mixpanel if key is present
        if (process.env.REACT_APP_MIXPANEL_TOKEN) {
            this.initMixpanel();
        }
    }

    private initGA(): void {
        // Google Analytics initialization
        // window.gtag('config', process.env.REACT_APP_GA_TRACKING_ID);
    }

    private initMixpanel(): void {
        // Mixpanel initialization
        // mixpanel.init(process.env.REACT_APP_MIXPANEL_TOKEN);
    }

    private sendEvent(event: AnalyticsEvent): void {
        // Send to configured analytics services

        // Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', event.name, {
                event_category: event.category,
                ...event.properties
            });
        }

        // Mixpanel
        if (typeof window !== 'undefined' && (window as any).mixpanel) {
            (window as any).mixpanel.track(event.name, {
                category: event.category,
                ...event.properties
            });
        }

        // Custom endpoint
        if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
            fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            }).catch(() => {
                // Silently fail
            });
        }
    }

    private sendUserProperties(properties: Record<string, any>): void {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('set', 'user_properties', properties);
        }

        if (typeof window !== 'undefined' && (window as any).mixpanel) {
            (window as any).mixpanel.people.set(properties);
        }
    }

    private sendIdentify(userId: string, traits?: Record<string, any>): void {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('config', process.env.REACT_APP_GA_TRACKING_ID, {
                user_id: userId
            });
        }

        if (typeof window !== 'undefined' && (window as any).mixpanel) {
            (window as any).mixpanel.identify(userId);
            if (traits) {
                (window as any).mixpanel.people.set(traits);
            }
        }
    }
}

// Export singleton instance
export const analytics = new Analytics();

// Convenience exports
export const trackPageView = (path: string, title?: string) => analytics.pageView(path, title);
export const trackEvent = (name: string, category: string, properties?: Record<string, any>) => analytics.track(name, category, properties);
export const trackLogin = (userId: string, role: string) => analytics.trackLogin(userId, role);
export const trackLogout = () => analytics.trackLogout();
export const identifyUser = (userId: string, traits?: Record<string, any>) => analytics.identify(userId, traits);
