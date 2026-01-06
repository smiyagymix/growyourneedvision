
import { useState, useEffect } from 'react';

interface NetworkState {
  online: boolean;
  since?: Date;
  downlink?: number;
  downlinkMax?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
  type?: string;
}

export const useNetwork = (): NetworkState => {
  const [state, setState] = useState<NetworkState>({
    online: navigator.onLine,
    since: new Date(),
  });

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, online: true, since: new Date() }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, online: false, since: new Date() }));
    };

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    const updateConnectionStatus = () => {
      if (connection) {
        setState(prev => ({
          ...prev,
          downlink: connection.downlink,
          downlinkMax: connection.downlinkMax,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          saveData: connection.saveData,
          type: connection.type,
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (connection) {
      updateConnectionStatus();
      connection.addEventListener('change', updateConnectionStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);

  return state;
};
