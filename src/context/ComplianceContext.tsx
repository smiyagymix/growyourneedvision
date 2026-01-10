import React, { createContext, useContext, useEffect, useState } from 'react';

interface ComplianceSettings {
  dataRetentionDays: number;
  enableGDPRExport: boolean;
}

interface ComplianceContextType {
  settings: ComplianceSettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultSettings: ComplianceSettings = {
  dataRetentionDays: 365,
  enableGDPRExport: false,
};

const ComplianceContext = createContext<ComplianceContextType>({
  settings: defaultSettings,
  loading: false,
  refresh: async () => {}
});

export const useCompliance = () => useContext(ComplianceContext);

export const ComplianceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ComplianceSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // In production, load from PocketBase or platform settings collection
      // Keep lightweight for dev so app loads without backend
      // Placeholder: keep defaults
      setSettings(defaultSettings);
    } catch (err) {
      console.warn('Failed to load compliance settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <ComplianceContext.Provider value={{ settings, loading, refresh: load }}>
      {children}
    </ComplianceContext.Provider>
  );
};

export default ComplianceContext;
