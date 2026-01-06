
import { useState, useEffect } from 'react';

interface GeolocationState {
  loading: boolean;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  timestamp: number | null;
  error: GeolocationPositionError | null;
}

export const useGeolocation = (options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: Date.now(),
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
        setState(s => ({
            ...s,
            loading: false,
            error: {
                code: 0,
                message: 'Geolocation not supported',
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
            } as any
        }));
        return;
    }

    const onEvent = (event: GeolocationPosition) => {
      setState({
        loading: false,
        accuracy: event.coords.accuracy,
        altitude: event.coords.altitude,
        altitudeAccuracy: event.coords.altitudeAccuracy,
        heading: event.coords.heading,
        latitude: event.coords.latitude,
        longitude: event.coords.longitude,
        speed: event.coords.speed,
        timestamp: event.timestamp,
        error: null,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState(s => ({ ...s, loading: false, error }));
    };

    navigator.geolocation.getCurrentPosition(onEvent, onError, options);
    const watchId = navigator.geolocation.watchPosition(onEvent, onError, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [options]);

  return state;
};
