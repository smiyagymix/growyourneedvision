import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePlatformSettings } from '../hooks/usePlatformSettings';

interface BrandingContextType {
    primaryColor: string;
    secondaryColor: string;
    portalName: string;
    logoUrl: string;
    fontFamily: string;
    faviconUrl: string;
    loading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { settings, loading } = usePlatformSettings('Branding');
    const [branding, setBranding] = useState({
        primaryColor: '#3041c7',
        secondaryColor: '#f5a623',
        portalName: 'Grow Your Need',
        logoUrl: '',
        fontFamily: 'Inter',
        faviconUrl: '/favicon.ico',
    });

    useEffect(() => {
        if (!loading && settings.length > 0) {
            const config = settings.reduce((acc: any, s) => {
                acc[s.key] = s.value;
                return acc;
            }, {});

            const newBranding = {
                primaryColor: config.primary_color || '#3041c7',
                secondaryColor: config.secondary_color || '#f5a623',
                portalName: config.portal_name || 'Grow Your Need',
                logoUrl: config.logo_url || '',
                fontFamily: config.font_family || 'Inter',
                faviconUrl: config.favicon_url || '/favicon.ico',
            };

            setBranding(newBranding);

            // Apply to CSS variables
            const root = document.documentElement;
            // Base variables
            root.style.setProperty('--gyn-blue-medium', newBranding.primaryColor);
            root.style.setProperty('--gyn-orange', newBranding.secondaryColor);

            // Tailwind 4 theme variables (matching @theme in index.css)
            root.style.setProperty('--color-gyn-blueMedium', newBranding.primaryColor);
            root.style.setProperty('--color-gyn-orange', newBranding.secondaryColor);

            // Set Global Font
            root.style.setProperty('--font-family-primary', newBranding.fontFamily === 'Inter' ? '"Inter", sans-serif' : `"${newBranding.fontFamily}", sans-serif`);
            root.style.fontFamily = `var(--font-family-primary)`;

            // Inject Google Font if not Inter/Default
            if (newBranding.fontFamily !== 'Inter') {
                const fontId = 'gyn-custom-font';
                let link = document.getElementById(fontId) as HTMLLinkElement;
                if (!link) {
                    link = document.createElement('link');
                    link.id = fontId;
                    link.rel = 'stylesheet';
                    document.head.appendChild(link);
                }
                link.href = `https://fonts.googleapis.com/css2?family=${newBranding.fontFamily.replace(/\s+/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
            }

            // Update Favicon
            if (newBranding.faviconUrl) {
                let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = newBranding.faviconUrl;
            }

            // Update document title if portal name changed
            if (newBranding.portalName) {
                document.title = newBranding.portalName;
            }
        }
    }, [settings, loading]);

    return (
        <BrandingContext.Provider value={{ ...branding, loading }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
