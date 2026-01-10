import React, { createContext, useContext, useEffect, useState } from 'react';

interface WhiteLabelSettings {
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface WhiteLabelContextType {
  settings: WhiteLabelSettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultSettings: WhiteLabelSettings = {
  brandName: 'GrowYourNeed',
  logoUrl: '/logo.png',
  primaryColor: '#1f6feb'
};

const WhiteLabelContext = createContext<WhiteLabelContextType>({
  settings: defaultSettings,
  loading: false,
  refresh: async () => {}
});

export const useWhiteLabel = () => useContext(WhiteLabelContext);

export const WhiteLabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WhiteLabelSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // In production, load white-label config from tenant settings
      setSettings(defaultSettings);
    } catch (err) {
      console.warn('Failed to load white-label settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <WhiteLabelContext.Provider value={{ settings, loading, refresh: load }}>
      {children}
    </WhiteLabelContext.Provider>
  );
};

export default WhiteLabelContext;
