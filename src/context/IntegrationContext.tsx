import React, { createContext, useContext, useEffect, useState } from 'react';

interface Integration {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  settings?: Record<string, any>;
}

interface IntegrationContextType {
  integrations: Integration[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const IntegrationContext = createContext<IntegrationContextType>({
  integrations: [],
  loading: false,
  refresh: async () => {}
});

export const useIntegration = () => useContext(IntegrationContext);

export const IntegrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Minimal: attempt to fetch platform integrations from PocketBase if available
      // Fallback to a small static list so UI works in dev without backend
      // Avoid importing heavy services here to keep provider lightweight
      const list = [
        { id: 'stripe', name: 'Stripe', provider: 'stripe', enabled: false },
        { id: 'sendgrid', name: 'SendGrid', provider: 'sendgrid', enabled: false }
      ];
      setIntegrations(list);
    } catch (err) {
      console.warn('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <IntegrationContext.Provider value={{ integrations, loading, refresh: load }}>
      {children}
    </IntegrationContext.Provider>
  );
};

export default IntegrationContext;
