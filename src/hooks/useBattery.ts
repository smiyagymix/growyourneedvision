
import { useState, useEffect } from 'react';

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  addEventListener(type: 'levelchange' | 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange', listener: () => void): void;
  removeEventListener(type: 'levelchange' | 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange', listener: () => void): void;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}

export interface BatteryState {
  supported: boolean;
  loading: boolean;
  level: number | null;
  charging: boolean | null;
  chargingTime: number | null;
  dischargingTime: number | null;
}

export const useBattery = (): BatteryState => {
  const [state, setState] = useState<BatteryState>({
    supported: true,
    loading: true,
    level: null,
    charging: null,
    chargingTime: null,
    dischargingTime: null,
  });

  useEffect(() => {
    if (!navigator.getBattery) {
      setState(s => ({ ...s, supported: false, loading: false }));
      return;
    }

    let battery: BatteryManager | null = null;

    const handleChange = () => {
      if (!battery) return;
      setState({
        supported: true,
        loading: false,
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      });
    };

    navigator.getBattery().then((bat: BatteryManager) => {
      battery = bat;
      handleChange();

      battery.addEventListener('levelchange', handleChange);
      battery.addEventListener('chargingchange', handleChange);
      battery.addEventListener('chargingtimechange', handleChange);
      battery.addEventListener('dischargingtimechange', handleChange);
    });

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', handleChange);
        battery.removeEventListener('chargingchange', handleChange);
        battery.removeEventListener('chargingtimechange', handleChange);
        battery.removeEventListener('dischargingtimechange', handleChange);
      }
    };
  }, []);

  return state;
};
